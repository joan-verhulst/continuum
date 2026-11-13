/*
 * Reading source text without parsing it. Every file is scanned as text: comments are blanked
 * (kept the same length, so an offset still points at the same line), and the pieces a reader
 * needs (a block, a class string, a literal) are found by position. The comment syntax is the one
 * thing the file's extension decides.
 */

export type Comments = 'js' | 'css' | 'scss' | 'html' | 'qml';

/**
 * The text with its comments replaced by spaces, newlines kept. Strings are walked over, so a
 * '//' inside a URL is not a comment.
 */
export const maskComments = (text: string, kind: Comments) => {
    const out = text.split('');
    const blank = (from: number, to: number) => {
        for (let i = from; i < to && i < out.length; i++) if (out[i] !== '\n') out[i] = ' ';
    };
    const lineComments = kind === 'js' || kind === 'scss' || kind === 'qml';
    let quote: string | null = null;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quote) {
            if (char === '\\') i++;
            else if (char === quote || (char === '\n' && quote !== '`')) quote = null;
            continue;
        }
        if (kind === 'html') {
            if (text.startsWith('<!--', i)) {
                const end = text.indexOf('-->', i);
                const stop = end < 0 ? text.length : end + 3;
                blank(i, stop);
                i = stop - 1;
            }
            continue;
        }
        if (char === '"' || char === "'" || (char === '`' && kind === 'js')) {
            quote = char;
            continue;
        }
        if (char === '/' && text[i + 1] === '*') {
            const end = text.indexOf('*/', i + 2);
            const stop = end < 0 ? text.length : end + 2;
            blank(i, stop);
            i = stop - 1;
        } else if (lineComments && char === '/' && text[i + 1] === '/' && text[i - 1] !== ':') {
            const end = text.indexOf('\n', i);
            const stop = end < 0 ? text.length : end;
            blank(i, stop);
            i = stop - 1;
        }
    }
    return out.join('');
};

/**
 * The comment syntaxes a file can hold, by its extension: a stylesheet's, markup's, code's, or
 * both for markup with scripts in it (a single-file component, a server template).
 */
const commentTable: Array<[RegExp, Comments[]]> = [
    [/\.(css|qss)$/, ['css']],
    [/\.(scss|less|sass|styl)$/, ['scss']],
    [/\.qml$/, ['qml']],
    [/\.(html?|xml|ui|xaml|svg)$/, ['html']],
    [/\.(vue|svelte|astro|php|erb|hbs|handlebars|njk|liquid|twig|cshtml|razor)$/, ['js', 'html']],
];

/** First match in the table wins; anything else is code. */
export const commentsOf = (path: string): Comments[] =>
    commentTable.find(([ending]) => ending.test(path.toLowerCase()))?.[1] ?? ['js'];

/** The text with every comment syntax it can hold blanked. */
export const masked = (path: string, text: string) =>
    commentsOf(path).reduce((current, kind) => maskComments(current, kind), text);

/** Turns an offset into a 1-based line number. */
export const lineIndex = (text: string) => {
    const starts = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
    return (offset: number) => {
        let low = 0;
        let high = starts.length - 1;
        while (low < high) {
            const mid = (low + high + 1) >> 1;
            if ((starts[mid] ?? 0) <= offset) low = mid;
            else high = mid - 1;
        }
        return low + 1;
    };
};

/** The index of the bracket that closes the one at `open`, or the text's end. */
export const closing = (text: string, open: number) => {
    const pairs: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
    const opener = text[open] ?? '(';
    const closer = pairs[opener] ?? ')';
    let depth = 0;
    let quote: string | null = null;
    for (let i = open; i < text.length; i++) {
        const char = text[i];
        if (quote) {
            if (char === '\\') i++;
            else if (char === quote) quote = null;
            continue;
        }
        if (char === '"' || char === "'" || char === '`') quote = char;
        else if (char === opener) depth++;
        else if (char === closer && --depth === 0) return i;
    }
    return text.length;
};

/** Where a markup tag ends: its '>', past quotes and braces ('=>' in a JSX handler). */
export const tagEnd = (text: string, start: number) => {
    let quote: string | null = null;
    let depth = 0;
    for (let i = start; i < text.length; i++) {
        const char = text[i];
        if (quote) {
            if (char === '\\') i++;
            else if (char === quote) quote = null;
            continue;
        }
        if (char === '"' || char === "'" || char === '`') quote = char;
        else if (char === '{') depth++;
        else if (char === '}') depth--;
        else if (char === '>' && depth <= 0) return i;
        else if (char === '<' && depth <= 0 && i > start) return i - 1;
    }
    return text.length;
};

export type Literal = { text: string; offset: number };

/** The string literals in a stretch of code, each with the offset of its first character. */
export const stringLiterals = (text: string, base = 0): Literal[] => {
    const literals: Literal[] = [];
    const pattern = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
    for (const match of text.matchAll(pattern)) {
        // A template's ${…} parts are code, not classes.
        const body = (match[2] ?? '').replace(/\$\{[^}]*\}/g, m => ' '.repeat(m.length));
        literals.push({ text: body, offset: base + (match.index ?? 0) + 1 });
    }
    return literals;
};

/** The attributes in a tag's text, values unquoted: { class: 'btn', type: 'checkbox' }. */
export const attributesOf = (text: string) => {
    const out: Record<string, string> = {};
    const pattern =
        /([:@\w.[\]()*#-]+)(?:\s*=\s*("[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\}|[^\s>]+))?/g;
    for (const match of text.matchAll(pattern)) {
        const name = match[1] ?? '';
        let value = match[2] ?? '';
        if (/^["'{]/.test(value)) value = value.slice(1, -1);
        if (/^["'`].*["'`]$/.test(value)) value = value.slice(1, -1);
        out[name] = value.trim();
    }
    return out;
};

/** Ranges of the text a reader has already read, so the next one does not read them again. */
export class Consumed {
    private ranges: Array<[number, number]> = [];
    add(from: number, to: number) {
        this.ranges.push([from, to]);
    }
    has(offset: number) {
        return this.ranges.some(([from, to]) => offset >= from && offset < to);
    }
}
