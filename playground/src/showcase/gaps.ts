import type { Category } from './previews';

/**
 * How far a missing component is from existing: a recipe already written in the
 * skill's designing-new guide, a composition of parts that exist, or new work.
 */
export type GapStart = 'recipe' | 'compose' | 'new';

export type Gap = {
    name: string;
    category: Category;
    description: string;
    start: GapStart;
    /** The Continuum parts it would be built from. */
    from: string;
};

/** What a product library usually carries that Continuum does not have yet. */
export const gaps: Gap[] = [
    {
        name: 'Data table',
        category: 'data',
        description:
            'Sorting, column choice, a selection bar and a sticky header on the ruled table.',
        start: 'new',
        from: 'Table, Toolbar, DropdownMenu',
    },
    {
        name: 'Board',
        category: 'data',
        description: 'Kanban columns of cards you drag between states.',
        start: 'recipe',
        from: 'Badge count, Card',
    },
    {
        name: 'Comment thread',
        category: 'data',
        description: 'A comment with replies and mentions beside a document.',
        start: 'compose',
        from: 'Avatar, ActivityList, Textarea',
    },
    {
        name: 'Change summary',
        category: 'data',
        description: 'What moved since last time, one metric per row with its delta.',
        start: 'compose',
        from: 'MetaRow, Badge pill',
    },
    {
        name: 'Bar chart',
        category: 'charts',
        description: 'Comparisons between categories: channels, regions, plans.',
        start: 'new',
        from: 'Chart tokens, the area chart grid',
    },
    {
        name: 'Sparkline',
        category: 'charts',
        description: 'A tiny trend inside a stat card or a table cell.',
        start: 'new',
        from: 'The area chart path',
    },
    {
        name: 'Breakdown bar',
        category: 'charts',
        description: 'One bar split into shares, with its legend below.',
        start: 'new',
        from: 'Chart tokens',
    },
    {
        name: 'Message and actions',
        category: 'ai',
        description: 'An assistant reply with copy, retry and versions under it.',
        start: 'new',
        from: 'ToolbarButton, Tooltip',
    },
    {
        name: 'Thinking state',
        category: 'ai',
        description: 'A working line that names the step the assistant is on.',
        start: 'new',
        from: 'Skeleton, Badge dot',
    },
    {
        name: 'Tool call',
        category: 'ai',
        description: 'One line per tool call with status and time; folds open to the result.',
        start: 'compose',
        from: 'ActivityItem, NavGroup fold',
    },
    {
        name: 'Approval card',
        category: 'ai',
        description: 'An agent asks before it acts: what, why, allow or deny.',
        start: 'compose',
        from: 'Card, DescriptionList, Button',
    },
    {
        name: 'Inline diff',
        category: 'ai',
        description: 'Suggested edits in the text, accepted or rejected one by one.',
        start: 'new',
        from: 'Toolbar, status ramps',
    },
    {
        name: 'Citations',
        category: 'ai',
        description: 'Numbered sources in an answer, with the source list below.',
        start: 'new',
        from: 'Badge count, Tooltip',
    },
    {
        name: 'Model picker',
        category: 'ai',
        description: 'Choose a model with a line on what it is good at.',
        start: 'compose',
        from: 'Select, OptionRow',
    },
];
