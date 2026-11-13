import { references } from 'virtual:knowledge';
import { listComponents } from './components';
import { tokens, words } from './markdown';

/*
 * patterns.md is one table, a need and what to build it as. A need is found by the words it shares
 * with a row, the need's own column counting three times the build column, with a few synonyms so
 * "KPI" finds "Key figures" and "wizard" finds "Long form".
 */

export type PatternRow = { need: string; build: string };
export type PatternMatch = PatternRow & { score: number };

let rows: PatternRow[] | undefined;

export const patternRows = () => {
    if (rows) return rows;
    rows = [];
    for (const line of (references['patterns.md'] ?? '').split(/\r?\n/)) {
        const match = /^\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*$/.exec(line);
        if (match?.[1] && match[2]) rows.push({ need: match[1], build: match[2] });
    }
    return rows;
};

/** Phrases that mean the same need; a query holding one also searches for the others. */
const synonyms = [
    ['kpi', 'key figure', 'metric', 'stat', 'number', 'figure'],
    ['filter', 'facet', 'refine', 'filter bar'],
    ['empty', 'empty state', 'blank', 'no result', 'nothing yet', 'zero state'],
    ['wizard', 'long form', 'multi step', 'stepper'],
    ['toast', 'notification', 'snackbar', 'feedback', 'undo'],
    ['delete', 'destructive', 'remove', 'danger', 'confirm'],
    ['loading', 'skeleton', 'spinner', 'loader'],
    ['table', 'list of object', 'data grid', 'datagrid', 'record'],
    ['tab', 'view switch', 'segmented', 'toggle view', 'views'],
    ['upload', 'drop zone', 'file', 'dropzone'],
    ['date', 'calendar', 'date range', 'period'],
    ['chat', 'message', 'conversation', 'support', 'comment'],
    ['ai', 'agent', 'assistant', 'copilot', 'llm'],
    ['kanban', 'board', 'pipeline'],
    ['tree', 'hierarchy', 'nested', 'folder'],
    ['onboarding', 'checklist', 'getting started'],
    ['usage', 'credit', 'quota', 'meter', 'limit', 'plan'],
    ['search', 'find', 'lookup'],
    ['command palette', 'command menu', 'cmdk', 'quick switcher'],
    ['bulk', 'selection', 'select row', 'multi select', 'batch'],
    ['status', 'workflow', 'state', 'badge'],
    ['chart', 'graph', 'plot', 'visualisation', 'visualization', 'trend'],
    ['create', 'edit', 'new', 'form'],
    ['setting', 'preference', 'configuration', 'config'],
    ['sign in', 'login', 'log in', 'auth', 'otp', 'verification code'],
    ['mobile', 'phone', 'narrow', 'responsive', 'small screen'],
    ['help', 'tooltip', 'info tip', 'explain'],
    ['save', 'autosave', 'saving', 'saved'],
    ['live', 'realtime', 'real time', 'online', 'presence'],
    ['timeline', 'history', 'activity', 'audit log', 'changelog'],
    ['log', 'run', 'trace', 'job'],
    ['schedule', 'planner', 'roster', 'booking'],
    ['media', 'gallery', 'image', 'thumbnail', 'photo'],
    ['document', 'rich text', 'editor', 'article', 'writing'],
    ['workspace', 'project switch', 'team switch', 'tenant', 'organisation', 'organization'],
    ['total', 'sum', 'subtotal'],
    ['inline add', 'add row', 'add line'],
    ['editable', 'inline edit', 'edit cell', 'spreadsheet'],
    ['ranked', 'breakdown', 'top', 'leaderboard'],
    ['key value', 'fact', 'property', 'metadata', 'detail'],
    ['typing', 'someone typing', 'presence'],
    ['mention', 'reference', 'hashtag'],
].map(group => group.map(phrase => tokens(phrase).join(' ')));

const contains = (haystack: string, needle: string) => ` ${haystack} `.includes(` ${needle} `);

export const findPatterns = (need: string, limit = 3): PatternMatch[] => {
    const own = tokens(need);
    if (own.length === 0) return [];
    const query = own.join(' ');
    // Words the query names itself weigh 1; words a synonym brings in weigh less.
    const weights = new Map<string, number>(own.map(word => [word, 1]));
    for (const group of synonyms) {
        if (!group.some(phrase => contains(query, phrase))) continue;
        for (const phrase of group)
            for (const word of phrase.split(' ')) if (!weights.has(word)) weights.set(word, 0.5);
    }
    return patternRows()
        .map(row => {
            const needWords = new Set(tokens(row.need));
            const buildWords = new Set(tokens(row.build));
            let score = 0;
            for (const [word, weight] of weights) {
                if (needWords.has(word)) score += 3 * weight;
                else if (buildWords.has(word)) score += weight;
            }
            // The whole query inside the need is as close as it gets.
            if (contains(tokens(row.need).join(' '), query)) score += 2;
            return { ...row, score: Math.round((score / own.length) * 100) / 100 };
        })
        .filter(row => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
};

/** The parts a row of text names, by the words the prose uses for them ("stat cards", "a bar list"). */
export const componentsNamedIn = (text: string) => {
    let rest = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
    const names = listComponents()
        .flatMap(entry => entry.name.split(' · '))
        .map(name => ({ name, phrase: words(name) }))
        .filter(({ phrase }) => phrase.length > 2)
        // Longest first, so "stat card" is taken before "card" can be.
        .sort((a, b) => b.phrase.length - a.phrase.length);
    const found: string[] = [];
    for (const { name, phrase } of names) {
        const pattern = new RegExp(` ${phrase}(?:s|es)? `, 'g');
        if (!pattern.test(rest)) continue;
        found.push(name);
        rest = rest.replace(pattern, ' ');
    }
    return found;
};
