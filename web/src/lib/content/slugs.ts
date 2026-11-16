/*
 * URL slugs. Stable: a slug is made from a name the sources already use (a component's first part,
 * a heading), so a page keeps its address as long as its source keeps its name. Safe on the client.
 */

/**
 * Kebab case from any name: 'FilterMenu' → 'filter-menu', 'The action colour' → 'the-action-colour',
 * 'Overview (`default`, 896)' → 'overview-default-896', 'Key figures (KPIs)' → 'key-figures-kpis'.
 */
export const kebab = (name: string) =>
    name
        // Split camel case: FilterMenu → Filter Menu, KPIs stays one word.
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z]{2,})/g, '$1 $2')
        .normalize('NFKD')
        .replace(/\p{Mn}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

/** A heading's slug: its words before any parenthesis or colon ('Index (`wide`, 1080; …)' → 'index'). */
export const headingSlug = (heading: string) => kebab(heading.split(/[(:]/)[0] ?? heading);
