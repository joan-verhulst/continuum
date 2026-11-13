import { screens } from 'virtual:knowledge';
import { render, sections, squash } from './markdown';

/*
 * The page kinds of pages.md, each with the general sections every screen of that kind needs, and
 * the reference screens built to it (the playground's screens, copied into the skill as
 * references/screens).
 */

export type PageKind = { kind: string; anatomy: string; screens: string[] };

/** What people call a kind, keyed by the start of the kind's heading in pages.md. */
const aliases: Record<string, string> = {
    overview: 'Overview',
    dashboard: 'Overview',
    home: 'Overview',
    analytics: 'Overview',
    report: 'Overview',
    index: 'Index',
    list: 'Index',
    table: 'Index',
    collection: 'Index',
    browse: 'Index',
    search: 'Index',
    detail: 'Detail',
    details: 'Detail',
    show: 'Detail',
    view: 'Detail',
    record: 'Detail',
    profile: 'Detail',
    create: 'Create or edit',
    edit: 'Create or edit',
    form: 'Create or edit',
    new: 'Create or edit',
    editor: 'Create or edit',
    createoredit: 'Create or edit',
    createoreditoneobject: 'Create or edit',
    settings: 'Settings',
    setting: 'Settings',
    preferences: 'Settings',
    account: 'Settings',
    config: 'Settings',
    assistant: 'Assistant',
    chat: 'Assistant',
    ai: 'Assistant',
    agent: 'Assistant',
    copilot: 'Assistant',
    signin: 'Sign in',
    login: 'Sign in',
    auth: 'Sign in',
    signup: 'Sign in',
    register: 'Sign in',
};

/** The reference screens by kind, by file name; workspace.tsx is the shell every one sits in. */
const screensByKind: Record<string, string[]> = {
    Overview: ['overview.tsx', 'analytics-overview.tsx', 'checkout-funnel.tsx'],
    Index: ['customers.tsx'],
    Detail: ['customer.tsx'],
    'Create or edit': [
        'new-customer.tsx',
        'invoice-editor.tsx',
        'report-generator.tsx',
        'sequence-editor.tsx',
        'risk-report.tsx',
    ],
    Settings: ['settings.tsx'],
    Assistant: ['agent.tsx'],
    'Sign in': ['sign-in.tsx'],
};

/** The sections of pages.md any screen in the shell needs beside its kind's own. */
const general = ['The shell', 'The column', 'The page head', 'A section'];

const kindSections = () =>
    sections('pages.md').filter(
        section => section.level === 3 && section.path[0] === 'The page kinds',
    );

/** The kinds as pages.md names them, for an error that lists them. */
export const pageKinds = () =>
    kindSections().map(section => section.heading.replace(/\s*\(.*$/, ''));

export const pageKind = (kind: string): PageKind | undefined => {
    const key = squash(kind);
    const wanted = aliases[key] ?? aliases[key.replace(/page$/, '')];
    const section = kindSections().find(each => {
        const heading = squash(each.heading);
        return wanted
            ? heading.startsWith(squash(wanted))
            : key.length > 2 && heading.startsWith(key);
    });
    if (!section) return undefined;
    const name = section.heading.replace(/\s*\(.*$/, '').replace(/:.*$/, '');
    const all = sections('pages.md');
    const outside = name.startsWith('Sign in');
    const extra = [...(outside ? [] : general), 'Standing decisions']
        .map(heading => all.find(each => each.level === 2 && each.heading === heading))
        .filter(each => each !== undefined)
        .map(render);
    const known = Object.keys(screens);
    const key2 = Object.keys(screensByKind).find(each => name.startsWith(each)) ?? '';
    const files = [...(screensByKind[key2] ?? []), ...(outside ? [] : ['workspace.tsx'])].filter(
        file => known.includes(file),
    );
    return { kind: name, anatomy: [render(section), ...extra].join('\n\n'), screens: files };
};
