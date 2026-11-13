import { components, entries } from 'virtual:knowledge';
import { distance, firstSentence, kebab, render, type Section, sections, squash } from './markdown';

/*
 * The parts: every ### entry of components.md under its ## group, and the charts of charts.md as
 * one more group. An entry may name several parts ("Progress · Meter"); each name finds it.
 */

export type ComponentSummary = { name: string; group: string; summary: string };

export type ComponentMatch = {
    name: string;
    group: string;
    /** The entry from components.md (or charts.md), heading included. */
    spec: string;
    /** The showcase entry's source: its knobs and its in-use piece. */
    entry?: string;
    /** The library's source file, when the part is in src/components. */
    source?: string;
    /** What a React project imports for it. */
    exports: string[];
    /** 'continuum', or 'continuum/charts' for the chart kit. */
    from: string;
    /** The entry's own names, the first one leading. */
    names: string[];
};

type Part = { names: string[]; group: string; section: Section; from: string };

const chartGroup = 'Charts';

let parts: Part[] | undefined;

const allParts = () => {
    if (parts) return parts;
    const fromComponents = sections('components.md')
        .filter(section => section.level === 3)
        .map(section => ({
            names: section.heading.split('·').map(name => name.trim()),
            group: section.path[0] ?? '',
            section,
            from: 'continuum',
        }));
    const chartSections = sections('charts.md');
    const card = chartSections.find(section => section.heading === 'The card');
    const charts = chartSections
        .filter(section => section.level === 3 && section.path[0] === 'Each chart')
        .map(section => ({
            names: section.heading.split('·').map(name => name.trim()),
            group: chartGroup,
            section,
            from: 'continuum/charts',
        }));
    const chartCard = card
        ? [
              {
                  names: ['ChartFrame', 'ChartCard', 'ChartKey'],
                  group: chartGroup,
                  section: card,
                  from: 'continuum/charts',
              },
          ]
        : [];
    parts = [...fromComponents, ...chartCard, ...charts];
    return parts;
};

export const listComponents = (): ComponentSummary[] =>
    allParts().map(part => ({
        name: part.names.join(' · '),
        group: part.group,
        summary: firstSentence(part.section.body),
    }));

/**
 * What people call a part when they do not know Continuum's name for it. A value names the part
 * by one of its own names; where two parts could be meant, the first is the likelier one.
 */
const aliases: Record<string, string> = {
    modal: 'Dialog',
    confirm: 'Dialog',
    toggle: 'Switch',
    dropdown: 'DropdownMenu',
    menu: 'DropdownMenu',
    contextmenu: 'DropdownMenu',
    textfield: 'Input',
    textinput: 'Input',
    textbox: 'Input',
    searchinput: 'Input',
    textarea: 'Textarea',
    drawer: 'Sheet',
    sidepanel: 'Sheet',
    snackbar: 'Toast',
    notification: 'Toast',
    chip: 'Chip',
    pill: 'Chip',
    tag: 'Badge',
    label: 'Badge',
    status: 'Badge',
    card: 'Card',
    panel: 'Card',
    table: 'Table',
    datagrid: 'Table',
    datatable: 'Table',
    grid: 'Table',
    tabs: 'Tabs',
    tab: 'Tabs',
    tooltip: 'Tooltip',
    hint: 'Tooltip',
    avatar: 'Avatar',
    checkbox: 'Checkbox',
    radio: 'RadioGroup',
    radiobutton: 'RadioGroup',
    select: 'Select',
    picker: 'Select',
    combobox: 'Combobox',
    autocomplete: 'Combobox',
    typeahead: 'Combobox',
    breadcrumbs: 'Breadcrumb',
    pagination: 'Pagination',
    pager: 'Pagination',
    stepper: 'Stepper',
    wizard: 'Stepper',
    steps: 'Stepper',
    progress: 'Progress',
    progressbar: 'Progress',
    spinner: 'Spinner',
    loader: 'Spinner',
    loading: 'Skeleton',
    skeleton: 'Skeleton',
    emptystate: 'EmptyState',
    empty: 'EmptyState',
    stat: 'StatCard',
    kpi: 'StatCard',
    metric: 'StatCard',
    statcard: 'StatCard',
    button: 'Button',
    btn: 'Button',
    iconbutton: 'Button',
    nav: 'Sidebar',
    navigation: 'Sidebar',
    navbar: 'TopNav',
    topbar: 'HeaderBar',
    header: 'HeaderBar',
    appbar: 'HeaderBar',
    dock: 'Dock',
    bottomnav: 'Dock',
    commandpalette: 'CommandMenu',
    cmdk: 'CommandMenu',
    search: 'Input',
    banner: 'Alert',
    callout: 'Alert',
    toggles: 'SegmentedControl',
    togglegroup: 'SegmentedControl',
    segmented: 'SegmentedControl',
    buttongroup: 'SegmentedControl',
    keyvalue: 'DescriptionList',
    definitionlist: 'DescriptionList',
    timeline: 'ActivityList',
    activity: 'ActivityList',
    upload: 'DropZone',
    fileupload: 'DropZone',
    dropzone: 'DropZone',
    datepicker: 'DatePicker',
    calendar: 'Calendar',
    daterange: 'DateRangePicker',
    otp: 'CodeInput',
    pin: 'CodeInput',
    colour: 'ColorPicker',
    colourpicker: 'ColorPicker',
    color: 'ColorPicker',
    divider: 'Separator',
    hr: 'Separator',
    meter: 'Meter',
    usage: 'Meter',
    shortcut: 'Kbd',
    keyboard: 'Kbd',
    chat: 'ChatThread',
    composer: 'ChatComposer',
    message: 'ChatMessage',
    chart: 'ChartCard',
    linechart: 'LineChart',
    piechart: 'DonutChart',
    pie: 'DonutChart',
    donut: 'DonutChart',
    sparkline: 'AreaChart',
    logo: 'ContinuumLogo',
    formfield: 'Field',
    field: 'Field',
    setting: 'SettingRow',
    settings: 'SettingRow',
    infotip: 'InfoTip',
    popup: 'Popover',
};

const partFor = (name: string) => {
    const key = squash(name);
    if (!key) return undefined;
    const byName = (wanted: string) =>
        allParts().find(part => part.names.some(each => squash(each) === wanted));
    const singular = key.endsWith('s') ? key.slice(0, -1) : key;
    const alias = aliases[key] ?? aliases[singular];
    return byName(key) ?? (alias ? byName(squash(alias)) : undefined) ?? byName(singular);
};

/** Every name and alias a lookup could have meant, nearest first: for "did you mean". */
export const closestNames = (name: string, count = 3) => {
    const key = squash(name);
    const candidates = new Map<string, number>();
    const consider = (spelling: string, part: string) => {
        const score =
            distance(key, squash(spelling)) -
            (squash(spelling).includes(key) && key.length > 2 ? 2 : 0);
        candidates.set(part, Math.min(candidates.get(part) ?? Number.POSITIVE_INFINITY, score));
    };
    for (const part of allParts()) for (const each of part.names) consider(each, each);
    for (const [spelling, part] of Object.entries(aliases)) consider(spelling, part);
    return [...candidates.entries()]
        .sort((a, b) => a[1] - b[1])
        .slice(0, count)
        .map(([part]) => part);
};

/** Parts whose showcase entry no rule below finds: they are shown inside another's. */
const entryOverrides: Record<string, string> = {
    NavItem: 'sidebar.tsx',
    NavGroup: 'sidebar.tsx',
    SidebarLevel: 'sidebar-levels.tsx',
    ContinuumMark: 'logo.tsx',
    ChartFrame: 'charts/area-chart.tsx',
};

/** The showcase entry that previews a part: by its id, its display name, a near id, or what it imports. */
const entryFor = (names: string[], group: string) => {
    const override = entryOverrides[names[0] ?? ''];
    if (override && entries[override]) return entries[override];
    const files = Object.entries(entries).filter(([path]) => path !== 'index.ts');
    const id = (path: string) => path.replace(/^charts\//, '').replace(/\.tsx$/, '');
    const shown = (text: string) =>
        squash(/export const entry\b[\s\S]*?name:\s*'([^']+)'/.exec(text)?.[1] ?? '');
    const wanted = names.map(name => kebab(name));
    const pools =
        group === chartGroup ? files.filter(([path]) => path.startsWith('charts/')) : files;
    // The entry's own names in order, so "Progress · Meter" finds progress before meter.
    const byId = wanted
        .map(name => pools.find(([path]) => id(path) === name))
        .find(hit => hit !== undefined);
    return (byId ??
        pools.find(([, text]) => names.some(name => shown(text) === squash(name))) ??
        pools
            .filter(([path]) =>
                wanted.some(
                    name => name.startsWith(`${id(path)}-`) || id(path).startsWith(`${name}-`),
                ),
            )
            .sort((a, b) => id(b[0]).length - id(a[0]).length)[0] ??
        pools.find(([, text]) =>
            new RegExp(`import\\s*\\{[^}]*\\b${names[0]}\\b[^}]*\\}\\s*from\\s*'continuum`).test(
                text,
            ),
        ))?.[1];
};

const exportsOf = (text: string) =>
    [...text.matchAll(/^export (?:const|function|class) (\w+)/gm)].map(match => match[1] ?? '');

/** The library files a part's names are exported from, and the exports that belong to the part. */
const sourceFor = (names: string[]) => {
    const files = new Map<string, string>();
    const found = new Set<string>();
    for (const name of names) {
        const hit = Object.entries(components).find(([, text]) =>
            new RegExp(`^export (?:const|function|class) ${name}\\b`, 'm').test(text),
        );
        if (!hit) continue;
        files.set(hit[0], hit[1]);
        // A part's own exports share its name as a prefix: Dialog, DialogTrigger, DialogContent …
        for (const each of exportsOf(hit[1])) if (each.startsWith(name)) found.add(each);
    }
    return { source: [...files.values()].join('\n\n') || undefined, exports: [...found] };
};

export const findComponent = (name: string): ComponentMatch | undefined => {
    const part = partFor(name);
    if (!part) return undefined;
    const { source, exports } =
        part.from === 'continuum' ? sourceFor(part.names) : { source: undefined, exports: [] };
    return {
        name: part.names.join(' · '),
        group: part.group,
        spec: render(part.section),
        entry: entryFor(part.names, part.group),
        source,
        exports:
            exports.length > 0 ? exports : part.names.filter(each => /^[A-Za-z]\w*$/.test(each)),
        from: part.from,
        names: part.names,
    };
};
