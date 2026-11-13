import { render, sections, squash, tokens } from './markdown';

/*
 * One topic of foundations.md: a ## section, or a ### inside one, found by the name people use
 * for it ("color", "corners", "padding") as well as the heading's own.
 */

/** A word people use → the heading it means. */
const aliases: Record<string, string> = {
    colour: 'Colour',
    color: 'Colour',
    colours: 'Colour',
    colors: 'Colour',
    palette: 'The ramps',
    ramps: 'The ramps',
    greys: 'The ramps',
    grays: 'The ramps',
    neutral: 'The ramps',
    roles: 'Roles',
    tokens: 'Roles',
    text: 'Roles',
    action: 'The action colour',
    actioncolour: 'The action colour',
    actioncolor: 'The action colour',
    primary: 'The action colour',
    accent: 'The action colour',
    washes: 'Washes: selection and hover are translucent',
    wash: 'Washes: selection and hover are translucent',
    selection: 'Washes: selection and hover are translucent',
    selected: 'Washes: selection and hover are translucent',
    hover: 'Washes: selection and hover are translucent',
    status: 'Status colour',
    statuscolour: 'Status colour',
    statuscolor: 'Status colour',
    success: 'Status colour',
    error: 'Status colour',
    warning: 'Status colour',
    focus: 'Focus',
    focusring: 'Focus',
    shadow: 'Shadows',
    shadows: 'Shadows',
    elevation: 'Surfaces and depth',
    datacolours: 'Data colours',
    datacolors: 'Data colours',
    data: 'Data colours',
    charts: 'Data colours',
    chart: 'Data colours',
    chartcolours: 'Data colours',
    avatar: 'Avatar tones',
    avatars: 'Avatar tones',
    never: 'Never',
    type: 'Type',
    typography: 'Type',
    font: 'Type',
    fonts: 'Type',
    family: 'Family',
    fontfamily: 'Family',
    typeface: 'Family',
    scale: 'Scale',
    typescale: 'Scale',
    textsize: 'Scale',
    fontsize: 'Scale',
    sizes: 'Heights',
    weight: 'Weight and hierarchy',
    weights: 'Weight and hierarchy',
    fontweight: 'Weight and hierarchy',
    hierarchy: 'Weight and hierarchy',
    surfaces: 'Surfaces and depth',
    surface: 'Surfaces and depth',
    depth: 'Surfaces and depth',
    radius: 'Radius',
    radii: 'Radius',
    corners: 'Radius',
    corner: 'Radius',
    rounded: 'Radius',
    borderradius: 'Radius',
    spacing: 'Spacing',
    space: 'Spacing',
    padding: 'Spacing',
    gap: 'Spacing',
    gaps: 'Spacing',
    margin: 'Spacing',
    sidepadding: 'Fixed side padding, by kind of control',
    derivedpadding: 'Derived padding: a box holds content',
    rhythm: "The page's rhythm",
    heights: 'Heights',
    height: 'Heights',
    size: 'Heights',
    controlheight: 'Heights',
    icons: 'Icons',
    icon: 'Icons',
    states: 'States',
    state: 'States',
    disabled: 'States',
    motion: 'Motion',
    animation: 'Motion',
    transition: 'Motion',
    easing: 'Motion',
    layout: 'Layout',
    grid: 'Layout',
    narrow: 'Narrow screens',
    narrowscreens: 'Narrow screens',
    mobile: 'Narrow screens',
    responsive: 'Narrow screens',
    phone: 'Narrow screens',
    touch: 'Touch',
    widths: 'Fixed widths',
    width: 'Fixed widths',
    fixedwidths: 'Fixed widths',
};

const all = () => sections('foundations.md');

/** The topics by their headings, for an error that lists them. */
export const foundationTopics = () => all().map(section => section.heading.replace(/:.*$/, ''));

export const foundation = (topic: string): string | undefined => {
    const key = squash(topic);
    if (!key) return undefined;
    const singular = key.replace(/s$/, '');
    const wanted = aliases[key] ?? aliases[singular];
    const sections = all();
    const exact =
        sections.find(section => wanted && section.heading === wanted) ??
        sections.find(section => squash(section.heading) === key) ??
        sections.find(section => squash(section.heading.replace(/:.*$/, '')) === key) ??
        sections.find(section => squash(section.heading).startsWith(key) && key.length > 2);
    if (exact) return render(exact);
    // Last, the heading that shares the most words with the topic.
    const asked = new Set(tokens(topic));
    const best = sections
        .map(section => ({
            section,
            hits: tokens(section.heading).filter(word => asked.has(word)).length,
        }))
        .sort((a, b) => b.hits - a.hits)[0];
    return best && best.hits > 0 ? render(best.section) : undefined;
};
