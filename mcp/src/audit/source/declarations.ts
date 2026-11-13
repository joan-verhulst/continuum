import type { Fact, Subject } from '../../types';
import { canonicalProperty, readWeight, type Syntax, toCss } from './aliases';
import { codeColour } from './literals';
import { attributesOf, type Consumed, closing } from './scan';
import { subjectOf, subjectOfSelector } from './subject';

/*
 * Every property: value pair written in a style context, in any syntax: stylesheets with braces
 * (CSS, SCSS, Less, QSS) or indentation (Sass), object blocks (QML's `Rectangle { radius: 8 }`),
 * <style> blocks and style="…" in any markup, CSS in template literals (styled-components,
 * emotion, an Angular component's styles), style objects in code (style={{…}}, StyleSheet.create,
 * sx, plain objects with CSS keys) and the named arguments and modifiers of UI code (fontSize =
 * 15.sp, .cornerRadius(8), .frame(height: 36)). What is a style context is read off the text, not
 * the file's name. Nothing is judged here: each pair becomes a fact in CSS.
 */

type Raw = {
    name: string;
    value: string;
    offset: number;
    /** The resolved selector or head of the block the pair sits in. */
    selector: string;
    hasChildren: boolean;
};

type Context = {
    path: string;
    line: (offset: number) => number;
    consumed: Consumed;
    facts: Fact[];
};

/* ---------- Brace and indent blocks ---------- */

const declarationStart = /^[ \t]*(?:[-\w.$@]+|"[^"\n]+"|'[^'\n]+')[ \t]*:(?!:)/;
const qmlProperty =
    /^[ \t]*(?:(?:readonly|default|required)\s+)*property\s+[\w<>.]+\s+(\w+)\s*:\s*(.*)$/;

/** Splits a run of text between braces into pairs: by ';', and by line where a line starts one. */
const pairsIn = (chunk: string, base: number, selector: string, hasChildren: boolean): Raw[] => {
    const out: Raw[] = [];
    let current: Raw | null = null;
    let offset = 0;
    for (const line of chunk.split('\n')) {
        const property = qmlProperty.exec(line);
        if (property) {
            current = {
                name: `$${property[1] ?? ''}`,
                value: property[2] ?? '',
                offset: base + offset + (line.length - line.trimStart().length),
                selector,
                hasChildren,
            };
            out.push(current);
        } else if (declarationStart.test(line) && !/,\s*$/.test(line)) {
            const colon = line.indexOf(':');
            current = {
                name: line.slice(0, colon).trim(),
                value: line.slice(colon + 1),
                offset: base + offset + (line.length - line.trimStart().length),
                selector,
                hasChildren,
            };
            out.push(current);
        } else if (current && line.trim()) current.value += `\n${line}`;
        offset += line.length + 1;
    }
    for (const raw of out) raw.value = raw.value.trim().replace(/;$/, '').trim();
    return out.filter(raw => raw.value);
};

/** A nested head resolved against its parent: '&:hover' under '.btn' is '.btn:hover'. */
const resolveHead = (parent: string, head: string) => {
    const clean = head.replace(/\s+/g, ' ').trim();
    if (!clean || clean.startsWith('@')) return parent;
    // QML's `background: Rectangle {…}` is the parent's own fill.
    const slot = /^(\w+)\s*:\s*([A-Z][\w.]*)$/.exec(clean);
    if (slot) return slot[1] === 'background' ? parent : `${parent} ${slot[2]}`.trim();
    if (!parent) return clean;
    if (clean.includes('&')) return clean.replace(/&/g, parent);
    return `${parent} ${clean}`;
};

/**
 * The pairs in brace-block text, nested heads joined. Each block's children are known, so a QML
 * Rectangle that holds items reads as a container.
 */
export const blockPairs = (text: string, base = 0, outer = ''): Raw[] => {
    const out: Raw[] = [];
    const stack: Array<{ selector: string; hasChildren: boolean }> = [
        { selector: outer, hasChildren: false },
    ];
    let start = 0;
    let quote: string | null = null;
    let paren = 0;
    const top = () => stack[stack.length - 1] ?? { selector: outer, hasChildren: false };
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quote) {
            if (char === '\\') i++;
            else if (char === quote || char === '\n') quote = null;
            continue;
        }
        if (char === '"' || char === "'") quote = char;
        else if (char === '(') paren++;
        else if (char === ')') paren = Math.max(0, paren - 1);
        else if (paren > 0) continue;
        else if (char === '{') {
            if (text[i - 1] === '#' || text[i - 1] === '$') continue;
            const pending = text.slice(start, i);
            // The head is the last line before the brace; lines above it that start a pair are pairs.
            const lines = pending.split('\n');
            const headLines: string[] = [];
            while (lines.length) {
                const last = lines[lines.length - 1] ?? '';
                if (headLines.length && declarationStart.test(last) && !/,\s*$/.test(last)) break;
                headLines.unshift(lines.pop() ?? '');
                if (!/,\s*$/.test(lines[lines.length - 1] ?? '')) break;
            }
            const rest = lines.join('\n');
            out.push(...pairsIn(rest, base + start, top().selector, top().hasChildren));
            top().hasChildren = true;
            const head = headLines.join(' ');
            const body = text.slice(i, closing(text, i));
            // An object block that names itself (QML's id, Qt's objectName) is named by it, as
            // a selector's #id: Rectangle { id: exportButton } is a button.
            const own = body.slice(1).split('{')[0] ?? '';
            const id = /(?:^|[\s;])(?:id|objectName)\s*:\s*["']?([A-Za-z_]\w*)/.exec(own)?.[1];
            const resolved = resolveHead(top().selector, head);
            stack.push({
                selector: id && resolved !== top().selector ? `${resolved}#${id}` : resolved,
                hasChildren: /(^|[\s;{])[A-Z][\w.]*\s*\{/.test(body.slice(1)),
            });
            start = i + 1;
        } else if (char === '}') {
            out.push(
                ...pairsIn(text.slice(start, i), base + start, top().selector, top().hasChildren),
            );
            if (stack.length > 1) stack.pop();
            start = i + 1;
        } else if (char === ';') {
            out.push(
                ...pairsIn(text.slice(start, i), base + start, top().selector, top().hasChildren),
            );
            start = i + 1;
        }
    }
    out.push(...pairsIn(text.slice(start), base + start, top().selector, top().hasChildren));
    return out;
};

/** Sass's indented syntax: no braces, a pair per line, the selector by indentation. */
export const indentedPairs = (text: string, base = 0): Raw[] => {
    const out: Raw[] = [];
    const selectors: Array<{ indent: number; selector: string }> = [];
    let offset = 0;
    for (const line of text.split('\n')) {
        const indent = line.length - line.trimStart().length;
        const trimmed = line.trim();
        if (trimmed) {
            while ((selectors.at(-1)?.indent ?? -1) >= indent) selectors.pop();
            const pair = /^([$@]?[\w-]+)\s*:\s*(.+)$/.exec(trimmed);
            if (pair && !/^[&.#:]/.test(trimmed)) {
                out.push({
                    name: pair[1] ?? '',
                    value: pair[2] ?? '',
                    selector: selectors.at(-1)?.selector ?? '',
                    offset: base + offset + indent,
                    hasChildren: false,
                });
            } else {
                selectors.push({
                    indent,
                    selector: resolveHead(selectors.at(-1)?.selector ?? '', trimmed),
                });
            }
        }
        offset += line.length + 1;
    }
    return out;
};

/* ---------- What syntax a text is ---------- */

/** The text outside every brace: a stylesheet's selectors, a program's statements. */
const topLevel = (text: string) => {
    let depth = 0;
    let out = '';
    for (const char of text) {
        if (char === '{') depth++;
        else if (char === '}') depth = Math.max(0, depth - 1);
        else if (depth === 0) out += char;
    }
    return out;
};

/**
 * Whether the whole text is style blocks (a stylesheet, a QSS file, a QML document), and in which
 * syntax: read off the text. A program has statements at its top level; a stylesheet only heads.
 */
export const sheetSyntax = (text: string): { syntax: Syntax; indented: boolean } | null => {
    const heads = topLevel(text)
        .split('\n')
        .filter(
            line =>
                !/^\s*(import\b|@|\$[\w-]+\s*:|--[\w-]+\s*:|pragma\b|#)/.test(line) &&
                !/^\s*$/.test(line),
        )
        .join('\n');
    // A call or a definition at the top level is a program; a selector's :not(…) is not one.
    if (/(^|[^:\w-])[A-Za-z_]\w*\s*\(/.test(heads)) return null;
    const outside = heads.replace(/\[[^\]]*\]|\([^)]*\)/g, '');
    const program =
        /=|;|=>|<[A-Za-z!]|(^|[^.#\w-])(return|function|const|let|var|val|export|void|int|static|struct|class|namespace|fun|func|def|public|private|package|using|enum|interface|type|module|extension|protocol|impl)\s+[A-Za-z_{(]/;
    if (text.includes('{')) {
        if (!outside.trim() || program.test(outside)) return null;
        const qml = /^\s*import\s+Qt/m.test(text) || /^\s*id\s*:\s*\w+\s*$/m.test(text);
        const qss = !qml && /(^|[\s,>}])Q[A-Z]\w+/.test(outside);
        return { syntax: qml ? 'qml' : qss ? 'qss' : 'css', indented: false };
    }
    // Sass: no braces, pairs indented under selector lines.
    const indentedPair = /^[ \t]+[\w-]+\s*:\s*\S/m.test(text);
    const selectorLine = /^[.#&a-z][\w\-.#:&\s>,*[\]="']*$/m.test(text);
    if (indentedPair && selectorLine && !program.test(outside.replace(/:[^\n]*/g, '')))
        return { syntax: 'css', indented: true };
    return null;
};

/* ---------- Variables ---------- */

type Variables = Map<string, { value: string; offset: number; used: boolean }>;

const defineVariables = (raws: Raw[]): Variables => {
    const variables: Variables = new Map();
    for (const raw of raws) {
        const name = raw.name.trim();
        if (
            /^(\$|@|--)[\w-]+$/.test(name) &&
            !/^@(media|include|import|use|extend|if|else|each|for|return|mixin|function|supports)$/.test(
                name,
            )
        ) {
            variables.set(name, {
                value: raw.value.replace(/\s*!default$/, ''),
                offset: raw.offset,
                used: false,
            });
        }
    }
    return variables;
};

/** A value with the file's own variables put in: $muted, @muted, var(--muted), a QML property. */
const resolve = (value: string, variables: Variables, depth = 0): string => {
    if (depth > 4 || !variables.size) return value;
    let out = value.replace(/var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)/g, (whole, name: string) => {
        const variable = variables.get(name);
        if (!variable) return whole;
        variable.used = true;
        return resolve(variable.value, variables, depth + 1);
    });
    out = out.replace(/[$@][\w-]+/g, name => {
        const variable = variables.get(name);
        if (!variable) return name;
        variable.used = true;
        return resolve(variable.value, variables, depth + 1);
    });
    // QML: a property used by name, alone or on an id (root.accent).
    const bare = /^(?:\w+\.)?(\w+)$/.exec(out.trim());
    const qml = bare && variables.get(`$${bare[1]}`);
    if (qml) {
        qml.used = true;
        return resolve(qml.value, variables, depth + 1);
    }
    return out;
};

/* ---------- Facts ---------- */

const push = (
    context: Context,
    raw: { name: string; value: string; offset: number },
    syntax: Syntax,
    subject: Subject,
    written?: string,
    /** Written in code that is not CSS or a JS style object (a call, a modifier): no syntax to echo. */
    code = false,
) => {
    const pairs = toCss(raw.name, raw.value, syntax, {
        text: subject.kind === 'text',
        codeColour,
    });
    for (const pair of pairs) {
        const own: Subject =
            pair.property === 'color' ? { ...subject, text: true } : { ...subject };
        context.facts.push({
            at: `${context.path}:${context.line(raw.offset)}`,
            property: pair.property,
            value: pair.value,
            subject: own,
            written: {
                form: 'declaration',
                text: (written ?? `${raw.name}: ${raw.value}`).replace(/\s+/g, ' ').slice(0, 160),
                ...(code ? {} : { syntax }),
            },
        });
    }
    return pairs.length;
};

/** Facts from the pairs of a block text, with its variables put in and its subjects read. */
const sheetFacts = (context: Context, raws: Raw[], syntax: Syntax, outer?: Subject) => {
    const variables = defineVariables(raws);
    const subjects = new Map<string, Subject>();
    for (const raw of raws) {
        if (variables.has(raw.name.trim())) continue;
        const key = `${raw.selector}\u0000${raw.hasChildren}`;
        let subject = subjects.get(key);
        if (!subject) {
            subject = raw.selector
                ? subjectOfSelector(raw.selector, raw.hasChildren)
                : (outer ?? { kind: 'unknown' });
            if (outer && subject.kind === 'unknown')
                subject = { ...outer, name: subject.name ?? outer.name };
            subjects.set(key, subject);
        }
        const value = resolve(raw.value, variables);
        const written = value === raw.value ? undefined : `${raw.name}: ${raw.value}`;
        push(context, { ...raw, value }, syntax, subject, written);
    }
    // A variable no rule in this file uses still holds a colour someone will use: read it alone,
    // guessed, named by its variable.
    for (const [name, variable] of variables) {
        if (variable.used || name.startsWith('--')) continue;
        const colour = codeColour(resolve(variable.value, variables));
        if (!colour) continue;
        context.facts.push({
            at: `${context.path}:${context.line(variable.offset)}`,
            property: /bg|background|surface|fill/i.test(name)
                ? 'background-color'
                : /border|line|divider|stroke|hairline/i.test(name)
                  ? 'border-top-color'
                  : 'color',
            value: colour,
            subject: { kind: 'unknown', name },
            written: { form: 'declaration', text: `${name}: ${variable.value}`, syntax },
            guessed: true,
        });
    }
};

/* ---------- Style objects and arguments in code ---------- */

const paddingSides: Record<string, string> = {
    horizontal: 'paddingHorizontal',
    vertical: 'paddingVertical',
    start: 'paddingLeft',
    end: 'paddingRight',
    top: 'paddingTop',
    bottom: 'paddingBottom',
    all: 'padding',
};

/**
 * The capitalised call or block an offset sits in: Button( … here … ), Button(…) { … here … }.
 * A modifier or a shape belongs to it.
 */
const enclosingCall = (text: string, offset: number) => {
    let depth = 0;
    for (let i = offset - 1; i >= 0 && offset - i < 2000; i--) {
        const char = text[i];
        if (char === ')' || char === '}' || char === ']') depth++;
        else if (char === '(' || char === '{' || char === '[') {
            if (depth > 0) {
                depth--;
                continue;
            }
            const before = text.slice(Math.max(0, i - 120), i);
            const name =
                char === '('
                    ? /([A-Z]\w*)\s*$/.exec(before)?.[1]
                    : /([A-Z]\w*)\s*(\([^()]*\))?\s*$/.exec(before)?.[1];
            if (name) return name;
        }
    }
    return undefined;
};

/** The top-level entries of an object or argument list: 'key: value' or 'key = value'. */
const entries = (body: string, base: number) => {
    const out: Array<{ key: string; value: string; offset: number; text: string }> = [];
    let depth = 0;
    let quote: string | null = null;
    let start = 0;
    const flush = (end: number) => {
        const part = body.slice(start, end);
        const match = /^\s*(['"]?)([A-Za-z_$][\w$.-]*)\1\s*[:=]\s*([\s\S]+?)\s*$/.exec(part);
        if (match && !/^\s*\.\.\./.test(part)) {
            out.push({
                key: match[2] ?? '',
                text: part.trim(),
                value: match[3] ?? '',
                offset: base + start + (part.length - part.trimStart().length),
            });
        }
        start = end + 1;
    };
    for (let i = 0; i < body.length; i++) {
        const char = body[i];
        if (quote) {
            if (char === '\\') i++;
            else if (char === quote) quote = null;
            continue;
        }
        if (char === '"' || char === "'" || char === '`') quote = char;
        else if ('([{'.includes(char ?? '')) depth++;
        else if (')]}'.includes(char ?? '')) depth--;
        else if (depth === 0 && (char === ',' || char === '\n' || char === ';')) flush(i);
    }
    flush(body.length);
    return out;
};

/** A value written as a literal: a string, a number with its unit, a colour, a weight. */
const literalValue = (key: string, value: string) => {
    const text = value.trim();
    if (/^(['"`])[^'"`$]*\1$/.test(text)) return true;
    if (/^-?\d*\.?\d+(\.?(dp|sp|pt|px|f))?$/.test(text)) return true;
    if (codeColour(text)) return true;
    return canonicalProperty(key) === 'font-weight' && readWeight(text) !== null;
};

/** Keys that only say a box's size; alone they are a chart's or a canvas's options, not style. */
const sizeOnly =
    /^(width|height|min-width|max-width|min-height|max-height|position|z-index|opacity)$/;

/**
 * Objects and argument lists in code whose keys are style: style={{…}}, StyleSheet.create's
 * entries, sx, a plain object of CSS keys, TextStyle(fontSize: 15), Text(fontSize = 15.sp).
 */
const readCode = (context: Context, text: string) => {
    for (let open = 0; open < text.length; open++) {
        const char = text[open];
        if ((char !== '{' && char !== '(') || context.consumed.has(open)) continue;
        const before = text.slice(Math.max(0, open - 160), open);
        const call = char === '(' ? /([A-Za-z_][\w.]*)\s*$/.exec(before)?.[1] : undefined;
        // An object sits where an expression goes; a block follows ')', '=>' or a keyword.
        if (char === '{' && (!/(^|[(=:,[{?"']|\breturn)\s*$/.test(before) || /=>\s*$/.test(before)))
            continue;
        if (char === '(' && !call) continue;
        const end = closing(text, open);
        const body = text.slice(open + 1, end);
        if (!/[:=]/.test(body)) continue;
        // A font call names its size and weight plainly: .system(size: 15, weight: .semibold).
        // A padding call names its sides: .padding(horizontal = 13.dp).
        const font = call && /(^|\.)(system|font|custom|Font|TextStyle)$/.test(call);
        const padding = call && /(^|\.)padding$/.test(call);
        const list = entries(body, open + 1)
            .map(entry => {
                if (font && /^(size|weight)$/.test(entry.key))
                    return { ...entry, key: entry.key === 'size' ? 'fontSize' : 'fontWeight' };
                const side = padding ? paddingSides[entry.key] : undefined;
                return side ? { ...entry, key: side } : entry;
            })
            .filter(entry => literalValue(entry.key, entry.value));
        const style = list.filter(entry => canonicalProperty(entry.key));
        if (!style.length) continue;
        const owner =
            /<([A-Za-z][\w.]*)\b((?:[^<>]|=>)*?)\b(style|sx|css|styles|ngStyle)\]?\s*=\s*["'{]?\s*$/.exec(
                before,
            ) ?? null;
        const styleContext =
            !!owner || /\b(style|styles|sx|css|theme|StyleSheet\.create)\b[^\n]*$/.test(before);
        const telling = style.filter(entry => !sizeOnly.test(canonicalProperty(entry.key) ?? ''));
        // A call's named arguments are style when one names a type, a colour or a corner (or it
        // is a frame); an object's when two keys are CSS's, or one in a style attribute.
        const enough =
            char === '('
                ? telling.length >= 1 || /(^|\.)(frame|size|SizedBox|Size)$/.test(call ?? '')
                : styleContext
                  ? style.length >= 1
                  : style.length >= 2 && telling.length >= 1;
        if (!enough) continue;
        const key = /(['"]?)([\w$]+)\1\s*:\s*$/.exec(before)?.[2];
        const variable = /(?:const|let|var|val)\s+([\w$]+)\s*(?::[^=]+)?=\s*$/.exec(before)?.[1];
        const attributes = owner ? attributesOf(owner[2] ?? '') : {};
        // A modifier's subject is the call it is passed to: Button(modifier = Modifier.height(…)).
        const named = call && /^[A-Z]/.test(call) ? call : enclosingCall(text, open);
        const subject = subjectOf({
            tag: owner?.[1] ?? named,
            names: [key, variable, attributes.className, attributes.class, call].filter(
                (name): name is string => !!name,
            ),
            classes: attributes.className ?? attributes.class,
        });
        for (const entry of style) {
            const read = push(
                context,
                { name: entry.key, value: entry.value, offset: entry.offset },
                'js',
                subject,
                entry.text,
                char === '(',
            );
            if (read)
                context.consumed.add(
                    entry.offset,
                    entry.offset + entry.key.length + entry.value.length + 4,
                );
        }
    }
};

/**
 * Assignments of one style value in code: button.layer.cornerRadius = 8, style.FrameRounding =
 * 4.0f, label.textColor = UIColor(…). The property is the last name, or its last word.
 */
const readAssignments = (context: Context, text: string) => {
    const pattern = /([A-Za-z_][\w.[\]]*?)\.?([A-Za-z_]\w*)\s*=\s*([^=;\n][^;\n]*?)\s*;?\s*$/gm;
    for (const match of text.matchAll(pattern)) {
        const offset = (match.index ?? 0) + (match[0].length - match[0].trimStart().length);
        if (context.consumed.has(offset)) continue;
        const name = match[2] ?? '';
        const value = (match[3] ?? '').trim();
        if (!literalValue(name, value)) continue;
        const last =
            name
                .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
                .split(' ')
                .at(-1) ?? '';
        const key = canonicalProperty(name) ? name : canonicalProperty(last) ? last : null;
        if (!key || sizeOnly.test(canonicalProperty(key) ?? '')) continue;
        const owner = `${match[1] ?? ''} ${name.slice(0, name.length - last.length)}`.trim();
        const subject = subjectOf({ names: owner ? [owner] : [] });
        push(context, { name: key, value, offset }, 'js', subject, match[0].trim(), true);
        context.consumed.add(offset, offset + match[0].length);
    }
};

/**
 * Modifiers with one value, in UI code: .height(36.dp), .cornerRadius(8), .padding(13),
 * RoundedCornerShape(8.dp), BorderRadius.circular(8), EdgeInsets.all(13), .fontWeight(.semibold).
 */
const modifiers: Record<string, string> = {
    height: 'height',
    width: 'width',
    padding: 'padding',
    cornerRadius: 'border-radius',
    RoundedCornerShape: 'border-radius',
    circular: 'border-radius',
    all: 'padding',
    fontWeight: 'font-weight',
    fontSize: 'font-size',
    size: 'font-size',
    background: 'background-color',
    backgroundColor: 'background-color',
    foregroundColor: 'color',
    foregroundStyle: 'color',
    tint: 'color',
};

const readModifiers = (context: Context, text: string) => {
    const pattern =
        /(\.|\b)(height|width|padding|cornerRadius|RoundedCornerShape|circular|all|fontWeight|background|backgroundColor|foregroundColor|foregroundStyle|tint)\s*\(\s*([^(),]+(?:\([^()]*\))?)\s*\)/g;
    for (const match of text.matchAll(pattern)) {
        const offset = match.index ?? 0;
        if (context.consumed.has(offset)) continue;
        const name = match[2] ?? '';
        const value = (match[3] ?? '').trim();
        const method = match[1] === '.';
        if (name === 'all' && !/EdgeInsets\.$|Insets\.$/.test(text.slice(offset - 12, offset + 1)))
            continue;
        if (name === 'circular' && !/Radius\.$/.test(text.slice(offset - 14, offset + 1))) continue;
        if (!method && name !== 'RoundedCornerShape') continue;
        const property = modifiers[name] ?? name;
        const colour = /color|background|tint|foreground/i.test(property);
        if (
            colour
                ? !codeColour(value)
                : !(
                      /^\d*\.?\d+(\.?(dp|sp|pt|f))?$/.test(value) ||
                      (property === 'font-weight' && readWeight(value))
                  )
        )
            continue;
        // In code a bare number is a point, the platform's pixel; JS's .height(36) is not UI code.
        if (/^\d+$/.test(value) && !/\.(dp|sp)|\bModifier\b|\bsome View\b|\bvar body\b/.test(text))
            continue;
        const owner = enclosingCall(text, offset);
        const subject = subjectOf({ tag: owner, names: owner ? [owner] : [] });
        push(
            context,
            { name: property, value, offset },
            'js',
            subject,
            match[0].replace(/^\./, ''),
            true,
        );
        context.consumed.add(offset, offset + match[0].length);
    }
};

/* ---------- Embedded style text ---------- */

/** The CSS inside template literals: styled.button`…`, css`…`, an Angular component's styles. */
const templateStyles = (text: string) => {
    const out: Array<{ body: string; offset: number; subject?: Subject }> = [];
    const pattern =
        /(?:\bstyles\s*:\s*\[?\s*|\b(?:css|createGlobalStyle|injectGlobal|keyframes)\s*|\bstyled(?:\.(\w+)|\(\s*([\w.]+)\s*\))(?:\.attrs\([^)]*\))?\s*)`/g;
    for (const match of text.matchAll(pattern)) {
        const start = (match.index ?? 0) + match[0].length;
        let end = start;
        while (end < text.length && text[end] !== '`') {
            if (text[end] === '$' && text[end + 1] === '{') end = closing(text, end + 1);
            end++;
        }
        const body = text
            .slice(start, end)
            .replace(/\$\{[^`]*?\}/g, part => ' '.repeat(part.length));
        const tag = match[1] ?? match[2];
        const before = text.slice(Math.max(0, (match.index ?? 0) - 80), match.index);
        const variable = /(?:const|let|var)\s+(\w+)\s*=\s*$/.exec(before)?.[1];
        const subject =
            tag || variable
                ? subjectOf({ tag, names: [variable ?? '', tag ?? ''].filter(Boolean) })
                : undefined;
        out.push({ body, offset: start, subject });
    }
    return out;
};

/** The pairs in the text, as facts. Ranges read are marked consumed for the readers after. */
export const readDeclarations = (
    path: string,
    text: string,
    consumed: Consumed,
    line: (offset: number) => number,
): Fact[] => {
    const context: Context = { path, line, consumed, facts: [] };
    const sheet = sheetSyntax(text);
    if (sheet) {
        const raws = sheet.indented ? indentedPairs(text) : blockPairs(text);
        sheetFacts(context, raws, sheet.syntax);
        consumed.add(0, text.length);
        return context.facts;
    }
    // <style> blocks in any markup.
    for (const match of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
        const body = match[1] ?? '';
        const offset = (match.index ?? 0) + match[0].indexOf(body);
        const indented = !body.includes('{') && /lang=["']sass/.test(match[0]);
        sheetFacts(
            context,
            indented ? indentedPairs(body, offset) : blockPairs(body, offset),
            'css',
        );
        consumed.add(offset, offset + body.length);
    }
    for (const template of templateStyles(text)) {
        if (consumed.has(template.offset)) continue;
        sheetFacts(context, blockPairs(template.body, template.offset), 'css', template.subject);
        consumed.add(template.offset, template.offset + template.body.length);
    }
    // style="…" on any element.
    for (const match of text.matchAll(
        /<([A-Za-z][\w.:-]*)\b([^<>]*?)\sstyle\s*=\s*(["'])([^"']*)\3/g,
    )) {
        const body = match[4] ?? '';
        const offset = (match.index ?? 0) + match[0].lastIndexOf(body);
        if (consumed.has(offset)) continue;
        const attributes = attributesOf(match[2] ?? '');
        const classes = attributes.class ?? attributes.className ?? '';
        const subject = subjectOf({
            tag: match[1],
            names: [classes, attributes.id ?? ''].filter(Boolean),
            role: attributes.role,
            classes,
        });
        sheetFacts(context, blockPairs(body, offset), 'css', subject);
        consumed.add(offset, offset + body.length);
    }
    readCode(context, text);
    readModifiers(context, text);
    readAssignments(context, text);
    return context.facts;
};
