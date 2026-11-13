import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { test } from 'node:test';
import { mcpDir } from './helpers.mjs';

/*
 * The standard, held in code. The audit is one pipeline (any input → a reader → facts → one rule
 * set → findings), so no code path in src/audit may branch on a stack. This scans the audit's
 * source and fails on control flow that names one: a condition, a case, a comparison, a
 * membership test or a ternary, and a function named for a stack or a syntax (auditQml,
 * readAngular).
 *
 * What stays allowed, and why:
 * - Comments and descriptions: words about stacks, not branches on them. Comments are blanked
 *   before the scan, and a string outside a branch is never looked at.
 * - Tables: an object or array may list stacks (extensions to read, folders to skip, a syntax per
 *   extension), and a branch may then test membership of the table by its name. Data may name a
 *   stack; control flow may not.
 * - The one alias table (a file named for aliases), which maps each syntax's spellings to CSS.
 * - Syntaxes in readers: 'qss' and 'qml' (like 'css' and 'js') are Written.syntax values, and a
 *   reader may branch on them for comment masking and for finding pairs. Rules may not:
 *   rules/, engine.ts and structure.ts never know a syntax either.
 * - Fix writing: in a report or fix file, a condition on the medium or the syntax picks how the
 *   fix is written back, which is the point of carrying them, and a function may be named for
 *   the syntax it writes (qmlLine).
 * - Frameworks' dev hooks (__reactFiber, __svelte_meta, __vue__): read in the browser only to tell
 *   where a node is written, never to judge it.
 */

/** Frameworks and tools: never in a branch, anywhere in the audit. */
const stacks = [
    'angular',
    'vue',
    'svelte',
    'react',
    'kotlin',
    'compose',
    'imgui',
    'figma',
    'paper',
];
/** Syntaxes: in a reader's branches, yes; in a rule's branches or any function's name, no. */
const syntaxes = ['qml', 'qss'];

/* ---------- Two views of the source ---------- */

/** Where a `/` opens a regex literal rather than dividing: after one of these, or a keyword. */
const regexBefore =
    /(?:[(,=:[!&|?{};+\-*%<>~^]|(?:^|[^\w$])(?:return|typeof|case|in|of|void|delete|throw|new))$/;

const blankOf = piece => piece.replace(/[^\n]/g, ' ');

/**
 * Two views of the source, the same length, so an index means the same place in both. `code` has
 * every comment blanked (newlines kept, so lines still count) and keeps strings, template text and
 * regex literals, whose words a branch may name. `shape` blanks their insides too, so brackets and
 * keywords are found only where they are code: a '(' in a regex, a 'case' in a string, a '//'
 * after 'https:' never count. A small scanner, not a parser: enough for this source.
 */
export const scan = text => {
    let code = '';
    let shape = '';
    let i = 0;
    // Template literals nest through ${ … }: the depth of braces at which each one resumes.
    const templates = [];
    let depth = 0;
    const comment = start => {
        const piece = blankOf(text.slice(start, i));
        code += piece;
        shape += piece;
    };
    // A literal: kept in code; in shape its delimiters stay, so it still reads as a value.
    const literal = (start, open, close) => {
        const piece = text.slice(start, i);
        const end = piece.length - close;
        code += piece;
        shape += piece.slice(0, open) + blankOf(piece.slice(open, end)) + piece.slice(end);
    };
    const readString = quote => {
        const start = i++;
        while (i < text.length && text[i] !== quote && text[i] !== '\n')
            i += text[i] === '\\' ? 2 : 1;
        i++;
        literal(start, 1, 1);
    };
    const readTemplate = () => {
        // Called on the opening backtick, or on the } that closes a ${ … }.
        const start = i++;
        let close = 0;
        while (i < text.length) {
            if (text[i] === '\\') i += 2;
            else if (text[i] === '`') {
                i++;
                close = 1;
                break;
            } else if (text[i] === '$' && text[i + 1] === '{') {
                i += 2;
                close = 2;
                templates.push(depth);
                depth++;
                break;
            } else i++;
        }
        literal(start, 1, close);
    };
    const plain = () => {
        code += text[i];
        shape += text[i];
        i++;
    };
    while (i < text.length) {
        const char = text[i];
        const next = text[i + 1];
        if (char === '/' && next === '/') {
            const start = i;
            while (i < text.length && text[i] !== '\n') i++;
            comment(start);
        } else if (char === '/' && next === '*') {
            const start = i;
            const end = text.indexOf('*/', i + 2);
            i = end < 0 ? text.length : end + 2;
            comment(start);
        } else if (char === "'" || char === '"') readString(char);
        else if (char === '`') readTemplate();
        else if (char === '{') {
            depth++;
            plain();
        } else if (char === '}') {
            depth--;
            if (templates.length && templates.at(-1) === depth) {
                templates.pop();
                readTemplate();
            } else plain();
        } else if (char === '/' && regexBefore.test(shape.trimEnd())) {
            // A regex literal: to the closing / outside a character class, then its flags.
            const start = i++;
            let inClass = false;
            while (i < text.length && text[i] !== '\n') {
                if (text[i] === '\\') i++;
                else if (text[i] === '[') inClass = true;
                else if (text[i] === ']') inClass = false;
                else if (text[i] === '/' && !inClass) break;
                i++;
            }
            i++;
            const flags = i;
            while (/[a-z]/.test(text[i] ?? '')) i++;
            literal(start, 1, 1 + i - flags);
        } else plain();
    }
    return { code, shape };
};

/* ---------- Finding branches ---------- */

/** The index just past the bracket that closes the one at `open`, read in shape. */
const closing = (shape, open) => {
    const close = { '(': ')', '[': ']' }[shape[open]];
    let level = 0;
    for (let i = open; i < shape.length; i++) {
        if (shape[i] === shape[open]) level++;
        else if (shape[i] === close && --level === 0) return i + 1;
    }
    return shape.length;
};

/** The words in a piece of code: identifiers split at camelCase and underscores, strings' words too. */
const wordsOf = snippet =>
    snippet
        // Dev hooks of frameworks, read only for a node's source: see the comment at the top.
        .replace(/__[\w$]+/g, ' ')
        .match(/[A-Za-z]+/g)
        ?.flatMap(token => token.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])/g) ?? [])
        .map(word => word.toLowerCase()) ?? [];

/**
 * Each branch in a source: its line, the text that decides it (from `code`, so a string's words
 * count), and whether it is a function's name. Found in `shape`, so only real code is a branch.
 */
export const branchesIn = text => {
    const { code, shape } = scan(text);
    const branches = [];
    const add = (start, end, name = false) =>
        branches.push({
            line: shape.slice(0, start).split('\n').length,
            snippet: code.slice(start, end).trim(),
            name,
        });
    for (const match of shape.matchAll(/\b(?:if|while|switch)\s*\(/g)) {
        const open = match.index + match[0].length - 1;
        add(match.index, closing(shape, open));
    }
    for (const match of shape.matchAll(/\bcase\s+([^:\n]+):/g))
        add(match.index, match.index + match[0].length);
    // A comparison: the operands on either side of ===, !==, == or !=.
    const operand = String.raw`(?:'[^'\n]*'|"[^"\n]*"|\x60[^\x60\n]*\x60|[\w$.\[\]?]+)`;
    for (const match of shape.matchAll(new RegExp(`${operand}\\s*[!=]==?\\s*${operand}`, 'g'))) {
        add(match.index, match.index + match[0].length);
    }
    // A membership or pattern test: from the start of the line to the end of the call, so the
    // receiver (a list, a regex) is read with it.
    for (const match of shape.matchAll(
        /\.(?:includes|has|startsWith|endsWith|test|match|indexOf|search|some)\s*\(/g,
    )) {
        const lineStart = shape.lastIndexOf('\n', match.index) + 1;
        add(lineStart, closing(shape, match.index + match[0].length - 1));
    }
    // A ternary on a name: `react ? … : …` (not `a?.b`, `a ?? b` or an optional `name?:`).
    for (const match of shape.matchAll(/([\w$.]+)\s*\?(?![?.:])/g))
        add(match.index, match.index + match[1].length);
    // A function named for a stack or a syntax: auditQml, readAngular.
    const declared =
        /\bfunction\s+([\w$]+)|\b(?:const|let|var)\s+([\w$]+)\s*(?::[^=\n]+)?=\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*(?::[^=\n]+)?=>|[\w$]+\s*=>)/g;
    for (const match of shape.matchAll(declared)) {
        const name = match[1] ?? match[2];
        const start = match.index + match[0].indexOf(name);
        add(start, start + name.length, true);
    }
    return branches;
};

/** The rules side of the audit: files that judge facts, where not even a syntax may be named. */
const isRuleFile = path =>
    /(^|\/)rules\//.test(path) || /^(engine|structure)\.ts$/.test(basename(path));
const isAliasFile = path => /alias/i.test(basename(path));
const isFixWriting = path => /report|fix|write/i.test(basename(path));

/** The branches in one file that name a stack, as 'path:line  snippet', one per line. */
export const violationsIn = (path, text) => {
    if (isAliasFile(path)) return [];
    const everything = new Set([...stacks, ...syntaxes]);
    const inBranches = isRuleFile(path) ? everything : new Set(stacks);
    const lines = new Map();
    for (const { line, snippet, name } of branchesIn(text)) {
        const words = wordsOf(snippet);
        // A fix writer may have a function per syntax (qmlLine): the form a fix is written back in.
        const forbidden = name ? (isFixWriting(path) ? new Set(stacks) : everything) : inBranches;
        if (!words.some(word => forbidden.has(word))) continue;
        if (!name && isFixWriting(path) && (words.includes('medium') || words.includes('syntax')))
            continue;
        if (!lines.has(line))
            lines.set(line, `${path}:${line}  ${snippet.replace(/\s+/g, ' ').slice(0, 140)}`);
    }
    return [...lines.values()];
};

const sourcesUnder = async dir => {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(entry => {
            const path = join(dir, entry.name);
            if (entry.isDirectory()) return sourcesUnder(path);
            return entry.name.endsWith('.ts') ? [path] : [];
        }),
    );
    return files.flat();
};

test('no code path in the audit branches on a stack', async () => {
    const auditDir = join(mcpDir, 'src/audit');
    const problems = [];
    for (const path of await sourcesUnder(auditDir)) {
        const name = relative(auditDir, path).replace(/\\/g, '/');
        problems.push(...violationsIn(name, await readFile(path, 'utf8')));
    }
    assert.deepEqual(
        problems,
        [],
        `The audit is one pipeline: readers make facts, one rule set judges them. These branch on a stack:\n${problems.join('\n')}`,
    );
});

test('the guard catches branches on a stack and lets comments, tables and words through', () => {
    const flagged = (code, path = 'readers/declarations.ts') => violationsIn(path, code).length > 0;
    const caught = [
        "if (medium === 'angular') read(text);",
        "switch (stack) {\n    case 'vue':\n        break;\n}",
        "const svelte = path.endsWith('.svelte');",
        "if (['.vue', '.svelte'].includes(extension)) masked = mask(text);",
        'if (/\\.(vue|svelte)$/.test(path)) masked = mask(text);',
        'export const auditQml = (check, text) => {};',
        'export const readQss = (text: string): Fact[] => [];',
        'function readAngular(text) {}',
        ['const reactFix = finding => finding;', 'fix.ts'],
        'const fix = react ? component : css;',
        // biome-ignore lint/suspicious/noTemplateCurlyInString: source under test
        "const writer = `${medium}` === 'compose' ? a : b;",
        ["const sure = fact.written.syntax === 'qml' ? 'high' : 'low';", 'rules/colour.ts'],
        ["if (medium === 'react') return component;", 'match.ts'],
    ];
    const through = [
        "// if (medium === 'angular') read the template\nconst a = 1;",
        "/* case 'vue': handled by the reader */\nconst a = 1;",
        "const description = 'Reads Angular, Vue and Svelte files alike.';",
        "const why = 'if (vue) never: case \\'svelte\\' is a word here';",
        "const syntaxOf = { '.qml': 'qml', '.vue': 'css', '.svelte': 'css' };",
        "const skipped = ['node_modules', '.svelte-kit', '.angular'];\nif (skipped.some(dir => path.includes(dir))) return;",
        "const url = 'https://example.com'; if (isReactive) go();",
        "if (/@Component\\s*\\(/.test(text)) kind = 'x'; const label = 'react';",
        ["if (syntax === 'qml') lineComments = true;", 'readers/scan.ts'],
        ["if (fact.written.syntax === 'qss') fix.qss = text;", 'report.ts'],
        ["if (medium === 'react') fix.code = component;", 'fix.ts'],
        ["const qmlLine = (property, value) => property + ': ' + value;", 'fix.ts'],
        ["if (syntax === 'qml' && tag === 'Text') return 'color';", 'readers/aliases.ts'],
        ["if (key.indexOf('__reactFiber$') === 0) fiber = el[key];", 'snapshot-script.ts'],
        'const pattern = /\\/\\/ react/; const b = 2;',
        'const name = composed ? first : second;',
        // biome-ignore lint/suspicious/noTemplateCurlyInString: source under test
        'const a = `${b ? `paper ${c}` : d}`;',
    ];
    const wrong = [
        ...caught
            .filter(item => !flagged(...[item].flat()))
            .map(item => `missed: ${[item].flat()[0]}`),
        ...through
            .filter(item => flagged(...[item].flat()))
            .map(item => `flagged: ${[item].flat()[0]}`),
    ];
    assert.deepEqual(wrong, []);
});
