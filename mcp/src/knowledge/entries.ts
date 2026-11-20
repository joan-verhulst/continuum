/*
 * Reading a showcase entry (playground/src/showcase/entries): its knobs are the part's variants
 * as the playground offers them, and its in-use piece is the part in a real screen. Parsed from
 * the source text, since the entries are React and never run here.
 */

export type Knob = {
    id: string;
    label: string;
    options: string[];
    default?: string;
    isSwitch: boolean;
};

/** The kit's shared option lists, which entries pass by name. */
const kitLists: Record<string, string[]> = {
    tones: ['neutral', 'success', 'warning', 'error', 'primary'],
    sizes: ['sm · 34px', 'md · 38px'],
};

/** The text from an opening bracket to its match, strings and comments skipped. */
const balanced = (text: string, start: number) => {
    const open = text[start];
    const close = open === '[' ? ']' : open === '{' ? '}' : ')';
    let depth = 0;
    for (let index = start; index < text.length; index++) {
        const char = text[index];
        if (char === "'" || char === '"' || char === '`') {
            const end = text.indexOf(char, index + 1);
            if (end < 0) break;
            index = end;
        } else if (char === '/' && text[index + 1] === '/') {
            const end = text.indexOf('\n', index);
            index = end < 0 ? text.length : end;
        } else if (char === open) depth++;
        else if (char === close && --depth === 0) return text.slice(start, index + 1);
    }
    return text.slice(start);
};

/** The top-level { … } objects inside an array literal's text. */
const objects = (array: string) => {
    const out: string[] = [];
    for (let index = 1; index < array.length - 1; index++) {
        if (array[index] !== '{') continue;
        const object = balanced(array, index);
        out.push(object);
        index += object.length - 1;
    }
    return out;
};

const quoted = /['"]([^'"]*)['"]/g;

const optionsOf = (object: string) => {
    const at = object.search(/\boptions:/);
    if (at < 0) return [];
    const rest = object.slice(at + 'options:'.length).trim();
    if (rest.startsWith('opts('))
        return [...balanced(rest, 4).matchAll(quoted)].map(match => match[1] ?? '');
    const expression = rest.startsWith('[') ? balanced(rest, 0) : (rest.split(/,\s*\n/)[0] ?? '');
    const pairs = [
        ...expression.matchAll(/\bo\(\s*['"]([^'"]*)['"](?:\s*,\s*['"]([^'"]*)['"])?/g),
    ].map(match => {
        const value = match[1] ?? '';
        const label = match[2];
        // A label that says more than the value (a height, a count) is worth its tokens.
        if (!label || label.toLowerCase() === value.toLowerCase()) return value;
        return label.toLowerCase().startsWith(value.toLowerCase())
            ? `${value}${label.slice(value.length)}`
            : `${value} (${label})`;
    });
    if (pairs.length > 0) return pairs;
    for (const [name, list] of Object.entries(kitLists))
        if (new RegExp(`\\b${name}\\b`).test(expression)) return list;
    return [expression.replace(/\s+/g, ' ').slice(0, 80)];
};

export const knobsOf = (entry: string): Knob[] => {
    const at = entry.search(/:\s*Knob\[\]\s*=\s*\[/);
    if (at < 0) return [];
    const array = balanced(entry, entry.indexOf('[', entry.indexOf('=', at)));
    return objects(array).map(object => {
        const field = (key: string) =>
            new RegExp(`\\b${key}:\\s*['"]([^'"]*)['"]`).exec(object)?.[1];
        const isSwitch = /\bswitch:\s*true/.test(object);
        const fallback = /\bdefault:\s*([^,\n}]+)/.exec(object)?.[1]?.trim();
        return {
            id: field('id') ?? '?',
            label: field('label') ?? '',
            options: isSwitch ? [] : optionsOf(object),
            default: field('default') ?? fallback,
            isSwitch,
        };
    });
};

/** The knobs as compact lines: "- variant: primary | secondary · default primary". */
export const renderKnobs = (knobs: Knob[]) =>
    knobs
        .map(knob => {
            const label =
                knob.label && knob.label.toLowerCase() !== knob.id.toLowerCase()
                    ? ` (${knob.label})`
                    : '';
            const choices = knob.isSwitch ? 'on | off' : knob.options.join(' | ');
            const fallback =
                knob.default === undefined
                    ? ''
                    : knob.isSwitch
                      ? ` · default ${knob.default === 'true' ? 'on' : 'off'}`
                      : ` · default ${knob.default}`;
            return `- ${knob.id}${label}: ${choices}${fallback}`;
        })
        .join('\n');

export type InUse = { title?: string; note?: string; code?: string; excerpt?: boolean };

const indentOf = (line: string) => line.length - line.trimStart().length;

/** Where the JSX element opening at line `at` closes, by prettier's indentation. */
const closeOf = (lines: string[], at: number) => {
    const first = lines[at]?.trimEnd() ?? '';
    if (first.endsWith('/>') || /<\/[\w.]+>$/.test(first)) return at;
    const depth = indentOf(lines[at] ?? '');
    for (let index = at + 1; index < lines.length; index++) {
        const line = lines[index] ?? '';
        if (!line.trim()) continue;
        if (indentOf(line) < depth) return index - 1;
        if (indentOf(line) === depth && /^(<\/|\/>)/.test(line.trim())) return index;
    }
    return lines.length - 1;
};

/** The element enclosing line `at`: the nearest opening tag above it, less indented. */
const parentOf = (lines: string[], at: number) => {
    const depth = indentOf(lines[at] ?? '');
    for (let index = at - 1; index >= 0; index--) {
        const line = lines[index] ?? '';
        if (!line.trim() || indentOf(line) >= depth) continue;
        return /^<[A-Za-z]/.test(line.trim()) ? index : undefined;
    }
    return undefined;
};

const dedent = (lines: string[]) => {
    const depth = Math.min(...lines.filter(line => line.trim()).map(indentOf));
    return lines.map(line => line.slice(depth)).join('\n');
};

/** Lines `from`..`to` with each child element longer than `fold` lines folded to its open and close. */
const folded = (lines: string[], from: number, to: number, fold = 10) => {
    const childDepth = indentOf(lines[from + 1] ?? '');
    const out: string[] = [];
    for (let index = from; index <= to; index++) {
        const line = lines[index] ?? '';
        out.push(line);
        if (index === from || index === to) continue;
        if (indentOf(line) !== childDepth || !/^<[A-Za-z]/.test(line.trim())) continue;
        const close = closeOf(lines, index);
        if (close - index + 1 <= fold || !/>\s*$/.test(line)) continue;
        out.push(`${' '.repeat(childDepth + 4)}{/* … */}`, lines[close] ?? '');
        index = close;
    }
    return out;
};

/**
 * The part where it is used in a long piece: its first element, widened to the elements around it
 * while the whole stays within `maxLines`, so the excerpt shows what holds the part and what sits
 * beside it. A part too long to show whole has its long children folded; a parent too long to
 * show whole keeps its opening line and its close.
 */
export const excerptOf = (code: string, names: string[], maxLines = 45) => {
    const lines = code.split('\n');
    const tag = new RegExp(`<(?:${names.join('|')})\\b`);
    const at = lines.findIndex(line => tag.test(line));
    if (at < 0) return undefined;
    let start = at;
    let end = closeOf(lines, at);
    let body = lines.slice(start, end + 1);
    if (body.length > maxLines) {
        body = folded(lines, start, end);
        if (body.length > maxLines) body = [...body.slice(0, maxLines - 1), '// …'];
    }
    for (;;) {
        const parent = parentOf(lines, start);
        if (parent === undefined) break;
        const parentEnd = closeOf(lines, parent);
        if (parentEnd - parent + 1 <= maxLines && body.length === end - start + 1) {
            start = parent;
            end = parentEnd;
            body = lines.slice(start, end + 1);
            continue;
        }
        const open = lines[parent] ?? '';
        const name = /^<([\w.]+)/.exec(open.trim())?.[1];
        if (!/>\s*$/.test(open) || !name || body.length + 4 > maxLines) break;
        const cut = `${' '.repeat(indentOf(lines[start] ?? ''))}{/* … */}`;
        return dedent([
            open,
            ...(start > parent + 1 ? [cut] : []),
            ...body,
            ...(end < parentEnd - 1 ? [cut] : []),
            `${' '.repeat(indentOf(open))}</${name}>`,
        ]);
    }
    return dedent(body);
};

/** The source's top-level `const` declarations, each to the line that closes it at column 0. */
const declarations = (source: string) =>
    [...source.matchAll(/^const (\w+)\b/gm)].map(match => {
        const start = match.index ?? 0;
        const end = /\n(?:\);|\};|\)|\];)\n/.exec(source.slice(start));
        const text = end ? source.slice(start, start + end.index + end[0].length) : '';
        return { name: match[1] ?? '', text: text.trim() };
    });

/**
 * The entry's in-use piece: its title and note, and the code that shows the part (`names`) in it:
 * the piece's own component, or a component it renders, or the inline render; cut round the part
 * when it is long.
 */
export const inUseOf = (entry: string, names: string[] = [], maxLines = 45): InUse | undefined => {
    const at = entry.search(/export const inUse\b/);
    if (at < 0) return undefined;
    const block = balanced(entry, entry.indexOf('{', at));
    const field = (key: string) => {
        const match = new RegExp(`\\b${key}:\\s*(['"\`])([\\s\\S]*?)\\1`).exec(block);
        return match?.[2]?.replace(/\s+/g, ' ');
    };
    const component = /render:\s*\([^)]*\)\s*=>\s*<(\w+)/.exec(block)?.[1];
    const all = declarations(entry);
    const own = all.find(declaration => declaration.name === component);
    // The playground's previews are knobs on a bare part, not the part in use.
    const others = all.filter(
        declaration => declaration !== own && !/Preview$/.test(declaration.name),
    );
    const render = /render:\s*\([^)]*\)\s*=>\s*([\s\S]*)/.exec(block)?.[1]?.replace(/,?\s*\}$/, '');
    const candidates = [
        ...(own ? [own.text] : []),
        ...others.map(declaration => declaration.text),
        ...(render ? [dedent(render.trim().split('\n'))] : []),
    ];
    const tag = names.length > 0 ? new RegExp(`<(?:${names.join('|')})\\b`) : undefined;
    const text = tag ? candidates.find(candidate => tag.test(candidate)) : own?.text;
    let code: string | undefined;
    let excerpt = false;
    if (text && text.split('\n').length <= maxLines) code = text;
    else if (text && names.length > 0) {
        code = excerptOf(text, names, maxLines);
        excerpt = code !== undefined;
    }
    return { title: field('title'), note: field('note'), code, excerpt };
};
