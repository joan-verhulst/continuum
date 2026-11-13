import type { SystemValues } from '../../system/values';
import type { AuditReport, ElementFact, Fact, Finding, Medium, Mode } from '../../types';
import { auditFacts } from '../engine';
import { report } from '../report';
import { readDeclarations } from './declarations';
import { readLiterals } from './literals';
import { readElements, readSkeleton } from './markup';
import { Consumed, lineIndex, masked } from './scan';
import { readUtilities } from './utilities';

/*
 * The audit of source files, in any stack. Every file goes through every reader: declarations in
 * any style syntax, utility classes, colour literals in any language, raw elements in any markup.
 * The readers only read; what they read becomes facts, and the one rule set the rendered audit
 * uses judges them. No reader asks what framework a file is in; the extension only says how its
 * comments are written.
 */

export type SourceFile = { path: string; content: string };

/** Folders never audited: dependencies, builds and the caches each toolchain keeps beside them. */
const skippedFolders = new Set([
    'node_modules',
    'dist',
    'build',
    'out',
    'coverage',
    '.git',
    '.next',
    '.nuxt',
    '.svelte-kit',
    '.angular',
    'vendor',
    'Pods',
    'DerivedData',
]);

/** Paths never audited: dependencies, builds, the library's own source. */
export const skippedPath = (path: string) => {
    const normal = path.replace(/\\/g, '/');
    return (
        normal
            .split('/')
            .slice(0, -1)
            .some(folder => skippedFolders.has(folder)) ||
        /\.min\.(css|js)$|\.d\.ts$|\.(test|spec|stories)\.[jt]sx?$|\.lock$|-lock\.json$/.test(
            normal,
        ) ||
        /(^|\/)continuum\/(components|charts|lib|styles)\//.test(normal)
    );
};

/** The library's own components (copied into a project or in its repo): already the spec. */
const libraryFile = (path: string, content: string) =>
    /(^|\/)src\/(components|charts)\//.test(path.replace(/\\/g, '/')) &&
    /from\s+['"]\.\.?\/(lib\/)?cn['"]/.test(content);

/** A Continuum theme file: check_theme reads it, not this audit. */
const themeFile = (content: string) =>
    /@theme\b/.test(content) && /--color-neutral-50\s*:/.test(content);

/** A label for the report per file ending, first match wins. It decides nothing. */
const mediumLabels: Array<[RegExp, Medium]> = [
    [/\.component\.(html|ts)$/, 'angular'],
    [/\.(tsx|jsx)$/, 'react'],
    [/\.vue$/, 'vue'],
    [/\.svelte$/, 'svelte'],
    [/\.(html?|php|erb|hbs|astro)$/, 'html'],
    [/\.(css|scss|sass|less|styl)$/, 'css'],
    [/\.(qss|qml|ui)$/, 'qt'],
];

/** What most of the files were, for the report's label. */
const mediumOf = (path: string): Medium =>
    mediumLabels.find(([ending]) => ending.test(path.toLowerCase()))?.[1] ?? 'other';

/** What one file holds, read by every reader. */
export const readFile = (
    file: SourceFile,
    { system, libraryAvailable = false }: { system: SystemValues; libraryAvailable?: boolean },
) => {
    const text = masked(file.path, file.content);
    const line = lineIndex(file.content);
    const consumed = new Consumed();
    const facts: Fact[] = [
        ...readDeclarations(file.path, text, consumed, line),
        ...readUtilities(file.path, text, system, consumed, line),
    ];
    facts.push(...readLiterals(file.path, text, consumed, line));
    const elements = readElements(file.path, text, line, libraryAvailable);
    const tree = readSkeleton(file.path, text, line, system);
    return { facts, elements, tree };
};

/*
 * The readers spell sides out (border-radius is four corners, px-3 two sides), so one written
 * value can come back as a finding per side. They are one mistake in one place: the findings
 * are joined again, under the property and the class that were written.
 */

type Sides = { shorthand: string; members: string[]; tailwind?: [RegExp, string] };

const sideGroups: Sides[] = [
    {
        shorthand: 'border-radius',
        members: ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map(
            corner => `border-${corner}-radius`,
        ),
        tailwind: [/rounded-(tl|tr|br|bl)-/, 'rounded-'],
    },
    ...['color', 'width', 'style'].map(part => ({
        shorthand: `border-${part}`,
        members: ['top', 'right', 'bottom', 'left'].map(side => `border-${side}-${part}`),
        tailwind: [/border-[trbl]-/, 'border-'] as [RegExp, string],
    })),
    ...(['padding', 'margin'] as const).flatMap(box => {
        const letter = box[0] ?? '';
        const sides = (list: string[]) => list.map(side => `${box}-${side}`);
        const side = new RegExp(`(^|[\\s:])-?${letter}[trbl]-`);
        return [
            {
                shorthand: box,
                members: sides(['top', 'right', 'bottom', 'left']),
                tailwind: [side, `$1${letter}-`] as [RegExp, string],
            },
            {
                shorthand: `${box}-inline`,
                members: sides(['left', 'right']),
                tailwind: [side, `$1${letter}x-`] as [RegExp, string],
            },
            {
                shorthand: `${box}-block`,
                members: sides(['top', 'bottom']),
                tailwind: [side, `$1${letter}y-`] as [RegExp, string],
            },
        ];
    }),
];

const joinSides = (findings: Finding[]) => {
    const groups = new Map<string, Finding[]>();
    const order: string[] = [];
    for (const finding of findings) {
        const group = finding.property
            ? sideGroups.find(each => each.members.includes(finding.property ?? ''))
            : undefined;
        const key = group
            ? [finding.at, finding.rule, finding.found, finding.expected, group.shorthand].join('|')
            : `\u0000${order.length}`;
        if (!groups.has(key)) {
            groups.set(key, []);
            order.push(key);
        }
        groups.get(key)?.push(finding);
    }
    return order.flatMap(key => {
        const list = groups.get(key) ?? [];
        const first = list[0];
        if (!first || list.length === 1) return list;
        const properties = new Set(list.map(each => each.property));
        // The widest shorthand whose sides are all here.
        const group = sideGroups.find(
            each =>
                each.members.length === properties.size &&
                each.members.every(member => properties.has(member)),
        );
        if (!group) return list;
        const fix: Finding['fix'] = { ...first.fix };
        if (fix.css) fix.css = fix.css.replace(/^[\w-]+:/, `${group.shorthand}:`);
        if (fix.tailwind && group.tailwind)
            fix.tailwind = fix.tailwind.replace(group.tailwind[0], group.tailwind[1]);
        return [{ ...first, property: group.shorthand, fix }];
    });
};

/** The rules that read a page's shape; the rest of a skeleton's findings are the facts' own. */
const shapeRules = new Set(['one-primary', 'nested-containers', 'views-in-dock', 'page-title']);

export const auditSource = (
    files: SourceFile[],
    {
        system,
        mode,
        notes = [],
        libraryAvailable = false,
    }: { system: SystemValues; mode: Mode; notes?: string[]; libraryAvailable?: boolean },
): AuditReport => {
    const facts: Fact[] = [];
    const elements: ElementFact[] = [];
    const shape: Finding[] = [];
    const counts = new Map<Medium, number>();
    let skipped = 0;
    let library = 0;
    let themes = 0;
    let read = 0;
    for (const file of files) {
        if (skippedPath(file.path)) {
            skipped++;
            continue;
        }
        if (libraryFile(file.path, file.content)) {
            library++;
            continue;
        }
        if (themeFile(file.content)) {
            themes++;
            continue;
        }
        const one = readFile(file, { system, libraryAvailable });
        read++;
        const medium = mediumOf(file.path);
        counts.set(medium, (counts.get(medium) ?? 0) + 1);
        facts.push(...one.facts);
        elements.push(...one.elements);
        // A page's shape is judged per file: two files each with a title are two pages.
        if (one.tree?.children?.length) {
            const page = auditFacts(
                { facts: [], tree: one.tree },
                { system, mode, medium, structure: true },
            );
            shape.push(...page.findings.filter(finding => shapeRules.has(finding.rule)));
        }
    }
    const dominant =
        [...counts].filter(([medium]) => medium !== 'other').sort((a, b) => b[1] - a[1])[0]?.[0] ??
        [...counts][0]?.[0] ??
        'other';
    const out = [...notes];
    out.push(
        `Read ${read} file${read === 1 ? '' : 's'} into ${facts.length} values and ${elements.length} elements.`,
    );
    if (skipped)
        out.push(
            `Skipped ${skipped} file${skipped === 1 ? '' : 's'}: dependencies, builds or tests.`,
        );
    if (library)
        out.push(`Skipped ${library} of the library's own component files: they are the spec.`);
    if (themes)
        out.push(
            `Skipped ${themes} theme file${themes === 1 ? '' : 's'} (an app.css with @theme): check_theme reads those.`,
        );
    out.push(
        'Source shows what is written, not what renders: spacing between parts, the page kind and contrast on the real surfaces need audit_ui on the running page.',
    );
    const audit = auditFacts({ facts, elements }, { system, mode, medium: dominant, notes: out });
    return report(joinSides([...audit.findings, ...shape]), dominant, system, mode, audit.notes);
};
