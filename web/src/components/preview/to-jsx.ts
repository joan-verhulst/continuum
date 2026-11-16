import * as continuum from 'continuum';
import * as charts from 'continuum/charts';
import { Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';

/*
 * A preview's default, written out as the code that draws it. The example on a component's page is
 * read from the very element tree the stage renders, so it can never drift from what is shown: the
 * library's parts by their exported names (looked up by identity in the module namespaces, which
 * survive minification), lucide's icons by their displayName, plain tags as they are. The
 * playground's own helpers (a Scene, a Labelled) are not the library's, so they are opened up:
 * called for what they draw, or reduced to their children when they only frame something.
 */

type Source = 'continuum' | 'continuum/charts' | 'lucide-react';

const names = new Map<unknown, { name: string; from: Source }>();
for (const [name, value] of Object.entries(continuum)) {
    if (/^[A-Z]/.test(name)) names.set(value, { name, from: 'continuum' });
}
for (const [name, value] of Object.entries(charts)) {
    if (/^[A-Z]/.test(name) && !names.has(value))
        names.set(value, { name, from: 'continuum/charts' });
}

/** The parts of the library a name list holds, by where each is imported from. */
export const exportedFrom = (name: string): Source | undefined => {
    if (name in continuum) return 'continuum';
    if (name in charts) return 'continuum/charts';
    return undefined;
};

export type Imports = Map<Source, Set<string>>;

const note = (imports: Imports, from: Source, name: string) => {
    const set = imports.get(from) ?? new Set<string>();
    set.add(name);
    imports.set(from, set);
};

/** The import lines for what an example uses, the library first. */
export const importLines = (imports: Imports) =>
    (['continuum', 'continuum/charts', 'lucide-react'] as const)
        .filter(from => imports.get(from)?.size)
        .map(from => {
            const list = [...(imports.get(from) ?? [])].sort((a, b) => a.localeCompare(b));
            const one = `import { ${list.join(', ')} } from '${from}';`;
            if (one.length <= 100) return one;
            return `import {\n${list.map(name => `    ${name},`).join('\n')}\n} from '${from}';`;
        })
        .join('\n');

type AnyProps = Record<string, unknown> & { children?: ReactNode };

const typeName = (type: unknown): { name: string; from?: Source } | undefined => {
    if (typeof type === 'string') return { name: type };
    const known = names.get(type);
    if (known) return known;
    const display = (type as { displayName?: string } | null)?.displayName;
    // lucide sets each icon's displayName; nothing else in a preview has one the library lacks.
    if (display && /^[A-Z][A-Za-z0-9]*$/.test(display) && !display.includes('Context')) {
        return { name: display, from: 'lucide-react' };
    }
    return undefined;
};

const quote = (text: string) =>
    /["\n{}]/.test(text) ? `{'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'}` : `"${text}"`;

/** A value short enough to write out; a long one (a chart's rows) stands as a name of its own. */
const literal = (value: unknown, depth = 0): string | undefined => {
    if (value === null) return 'null';
    if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Date) return `new Date('${value.toISOString().slice(0, 10)}')`;
    if (depth > 2) return undefined;
    if (Array.isArray(value)) {
        const items = value.map(item => literal(item, depth + 1));
        if (items.some(item => item === undefined)) return undefined;
        return `[${items.join(', ')}]`;
    }
    if (typeof value === 'object') {
        const entries = Object.entries(value as object).filter(([, v]) => v !== undefined);
        const parts = entries.map(([k, v]) => {
            const written = literal(v, depth + 1);
            return written === undefined
                ? undefined
                : `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${written}`;
        });
        if (parts.some(part => part === undefined)) return undefined;
        return `{ ${parts.join(', ')} }`;
    }
    return undefined;
};

type Writer = { imports: Imports; budget: number };

const writeProp = (key: string, value: unknown, writer: Writer, indent: string) => {
    // A prop set to false is the part's default, and only noise in an example.
    if (value == null || value === false || typeof value === 'function') return undefined;
    if (value === true) return key;
    if (typeof value === 'string') return `${key}=${quote(value)}`;
    if (isValidElement(value)) {
        const inner = writeNode(value, writer, indent).trim();
        return inner ? `${key}={${inner}}` : undefined;
    }
    const written = literal(value);
    if (written === undefined || written.length > 72) return `${key}={${key}}`;
    return `${key}={${written}}`;
};

/** A helper of the playground's, opened up: what it draws when that is the library, else its children. */
const open = (element: ReactElement<AnyProps>): ReactNode => {
    const { type, props } = element;
    if (typeof type === 'function') {
        try {
            // A helper may use hooks; the example renders inside a component, in the same order each time.
            const drawn = (type as (p: AnyProps) => ReactNode)(props);
            if (isValidElement(drawn) && typeName(drawn.type)?.from) return drawn;
            if (props.children !== undefined) return props.children;
            return drawn;
        } catch {
            return props.children ?? null;
        }
    }
    // A memo or context object the library does not export: show what it holds.
    return props.children ?? null;
};

const writeChildren = (children: ReactNode, writer: Writer, indent: string): string[] => {
    const out: string[] = [];
    const visit = (node: ReactNode) => {
        if (node === null || node === undefined || typeof node === 'boolean') return;
        if (Array.isArray(node)) {
            for (const child of node) visit(child);
            return;
        }
        if (typeof node === 'string' || typeof node === 'number') {
            const text = String(node).trim();
            if (text) out.push(`${indent}${/[{}<>]/.test(text) ? `{'${text}'}` : text}`);
            return;
        }
        if (isValidElement(node)) {
            const written = writeNode(node, writer, indent);
            if (written) out.push(written);
        }
    };
    visit(children);
    return out;
};

const writeNode = (node: ReactNode, writer: Writer, indent = ''): string => {
    if (!isValidElement(node)) return writeChildren(node, writer, indent).join('\n');
    writer.budget -= 1;
    if (writer.budget < 0) return '';
    const element = node as ReactElement<AnyProps>;
    if (element.type === Fragment)
        return writeChildren(element.props.children, writer, indent).join('\n');
    // A box that is only there to draw nothing of its own (`contents`) is left out.
    if (element.type === 'div' && element.props.className === 'contents') {
        return writeChildren(element.props.children, writer, indent).join('\n');
    }
    const known = typeName(element.type);
    if (!known) return writeNode(open(element), writer, indent);
    if (known.from) note(writer.imports, known.from, known.name);

    const { children, ...rest } = element.props;
    const props = Object.entries(rest)
        .map(([key, value]) => writeProp(key, value, writer, `${indent}    `))
        .filter((prop): prop is string => Boolean(prop));
    const inner = writeChildren(children, writer, `${indent}    `);
    const head = props.length ? ` ${props.join(' ')}` : '';
    // Props that would run past the line go one to a line.
    const multi = `${indent}<${known.name}${head}`.length > 100 && props.length > 1;
    const opening = multi
        ? `${indent}<${known.name}\n${props.map(p => `${indent}    ${p}`).join('\n')}\n${indent}`
        : `${indent}<${known.name}${head}`;
    if (inner.length === 0) return multi ? `${opening}/>` : `${opening} />`;
    // A single short text child stays on the line.
    const only = inner.length === 1 ? (inner[0] ?? '').trim() : '';
    if (only && !only.startsWith('<') && only.length < 60 && !multi) {
        return `${opening}>${only}</${known.name}>`;
    }
    return `${opening}>\n${inner.join('\n')}\n${indent}</${known.name}>`;
};

/**
 * The code for a node: its import lines and its JSX. Empty JSX when nothing in it is the library's,
 * or when it runs longer than a reader would copy.
 */
export const toJsx = (node: ReactNode) => {
    const writer: Writer = { imports: new Map(), budget: 60 };
    const jsx = writeNode(node, writer);
    const long = writer.budget < 0 || jsx.split('\n').length > 40;
    const library =
        writer.imports.get('continuum')?.size || writer.imports.get('continuum/charts')?.size;
    return { imports: writer.imports, jsx: long || !library ? '' : jsx };
};
