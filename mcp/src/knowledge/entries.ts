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

export type InUse = { title?: string; note?: string; code?: string };

/** The entry's in-use piece: its title and note, and its code when it is short enough to read. */
export const inUseOf = (entry: string, maxLines = 45): InUse | undefined => {
    const at = entry.search(/export const inUse\b/);
    if (at < 0) return undefined;
    const block = balanced(entry, entry.indexOf('{', at));
    const field = (key: string) => {
        const match = new RegExp(`\\b${key}:\\s*(['"\`])([\\s\\S]*?)\\1`).exec(block);
        return match?.[2]?.replace(/\s+/g, ' ');
    };
    const component = /render:\s*\([^)]*\)\s*=>\s*<(\w+)/.exec(block)?.[1];
    let code: string | undefined;
    if (component) {
        const start = entry.search(new RegExp(`^const ${component}\\b`, 'm'));
        if (start >= 0) {
            // A top-level declaration ends at the first line that closes at column 0.
            const end = /\n(?:\);|\};|\))\n/.exec(entry.slice(start));
            const text = end
                ? entry.slice(start, start + end.index + end[0].length).trim()
                : undefined;
            if (text && text.split('\n').length <= maxLines) code = text;
        }
    }
    return { title: field('title'), note: field('note'), code };
};
