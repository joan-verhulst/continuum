import {
    Badge,
    Button,
    cn,
    SegmentedControl,
    SegmentedControlItem,
    Tabs,
    TabsList,
    TabsTrigger,
    useTheme,
} from 'continuum';
import type { ReactNode } from 'react';
import { DocsPage, Note, PageHeader, type SectionEntry } from './layout';
import { themeMeta } from './meta';
import { readBackground, readFont, readFontFamily, readRadius, useResolved } from './resolve';

const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

// Written out in full so Tailwind finds every class.
const ramps = {
    neutral: [
        'bg-neutral-50',
        'bg-neutral-100',
        'bg-neutral-200',
        'bg-neutral-300',
        'bg-neutral-400',
        'bg-neutral-500',
        'bg-neutral-600',
        'bg-neutral-700',
        'bg-neutral-800',
        'bg-neutral-900',
        'bg-neutral-950',
    ],
    primary: [
        'bg-primary-50',
        'bg-primary-100',
        'bg-primary-200',
        'bg-primary-300',
        'bg-primary-400',
        'bg-primary-500',
        'bg-primary-600',
        'bg-primary-700',
        'bg-primary-800',
        'bg-primary-900',
        'bg-primary-950',
    ],
    success: [
        'bg-success-50',
        'bg-success-100',
        'bg-success-200',
        'bg-success-300',
        'bg-success-400',
        'bg-success-500',
        'bg-success-600',
        'bg-success-700',
        'bg-success-800',
        'bg-success-900',
        'bg-success-950',
    ],
    warning: [
        'bg-warning-50',
        'bg-warning-100',
        'bg-warning-200',
        'bg-warning-300',
        'bg-warning-400',
        'bg-warning-500',
        'bg-warning-600',
        'bg-warning-700',
        'bg-warning-800',
        'bg-warning-900',
        'bg-warning-950',
    ],
    error: [
        'bg-error-50',
        'bg-error-100',
        'bg-error-200',
        'bg-error-300',
        'bg-error-400',
        'bg-error-500',
        'bg-error-600',
        'bg-error-700',
        'bg-error-800',
        'bg-error-900',
        'bg-error-950',
    ],
} as const;

const neutralRoles: Partial<Record<(typeof steps)[number], string>> = {
    '50': 'Surface',
    '100': 'Canvas, hover',
    '200': 'Hairline',
    '300': 'Strong border',
    '600': 'Secondary text',
    '950': 'Primary text',
};

const Swatch = ({ className, step, role }: { className: string; step: string; role?: string }) => {
    const [ref, hex] = useResolved(readBackground);

    return (
        <div className="flex min-w-0 flex-col gap-2">
            <div
                className={cn('h-14 rounded-chip ring-1 ring-neutral-950/5 ring-inset', className)}
                ref={ref}
            />
            <div className="flex flex-col gap-0.5">
                <span className="font-medium text-neutral-950 text-xxs">{step}</span>
                <span className="text-neutral-600 text-xxs tabular-nums">{hex}</span>
                {role && <span className="text-neutral-500 text-xxs">{role}</span>}
            </div>
        </div>
    );
};

const ColourRamps = () => (
    <div className="flex flex-col gap-8">
        {Object.entries(ramps).map(([name, classes]) => (
            <div className="flex flex-col gap-3" key={name}>
                <span className="font-medium text-neutral-950 text-xs capitalize">{name}</span>
                <div className="overflow-x-auto pb-1">
                    <div className="grid min-w-[720px] grid-cols-11 gap-2">
                        {classes.map((className, i) => {
                            const step = steps[i] ?? '';
                            return (
                                <Swatch
                                    className={className}
                                    key={className}
                                    role={
                                        name === 'neutral'
                                            ? neutralRoles[step as keyof typeof neutralRoles]
                                            : undefined
                                    }
                                    step={step}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        ))}
    </div>
);

type TokenRowProps = { name: string; className: string; read?: typeof readBackground };

const TokenRow = ({ name, className, read = readBackground }: TokenRowProps) => {
    const [ref, value] = useResolved(read);

    return (
        <div className="flex items-center gap-3">
            <div
                className={cn('size-7 shrink-0 rounded-chip ring-1 ring-neutral-950/10', className)}
                ref={ref}
            />
            <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-neutral-950 text-xs">{name}</span>
                <span className="text-neutral-600 text-xxs tabular-nums">{value}</span>
            </div>
        </div>
    );
};

const SemanticCard = ({
    title,
    description,
    tokens,
    sample,
}: {
    title: string;
    description: string;
    tokens: TokenRowProps[];
    sample: ReactNode;
}) => (
    <div className="flex flex-col overflow-hidden rounded-card border border-neutral-200">
        {/* On the surface, not the canvas: Eyes' tint is the canvas colour and would vanish. */}
        <div className="flex min-h-28 items-center justify-center border-neutral-200 border-b p-6">
            {sample}
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex flex-col gap-1">
                <span className="font-medium text-neutral-950 text-sm">{title}</span>
                <span className="text-neutral-600 text-xs leading-5">{description}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {tokens.map(token => (
                    <TokenRow key={token.name} {...token} />
                ))}
            </div>
        </div>
    </div>
);

const SemanticColours = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SemanticCard
            description="Primary buttons, checked controls, the active rail item and dock item. Some themes add a gradient, a top highlight and a ring."
            sample={<Button>Save report</Button>}
            title="Action"
            tokens={[
                { name: 'action', className: 'bg-action' },
                { name: 'action-hover', className: 'bg-action-hover' },
                { name: 'on-action', className: 'bg-on-action' },
            ]}
        />
        <SemanticCard
            description="A selected wash: the active pill tab, the AI chip, a cell being edited."
            sample={
                <Tabs defaultValue="summary">
                    <TabsList>
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="sources">Sources</TabsTrigger>
                    </TabsList>
                </Tabs>
            }
            title="Tint"
            tokens={[
                { name: 'tint', className: 'bg-tint' },
                { name: 'tint-fg', className: 'bg-tint-fg' },
            ]}
        />
        <SemanticCard
            description="The active segment. Eyes fills it with the action colour; the older themes raise a chip with a hairline and the float shadow."
            sample={
                <SegmentedControl defaultValue="week">
                    <SegmentedControlItem value="day">Day</SegmentedControlItem>
                    <SegmentedControlItem value="week">Week</SegmentedControlItem>
                    <SegmentedControlItem value="month">Month</SegmentedControlItem>
                </SegmentedControl>
            }
            title="Segment"
            tokens={[
                { name: 'segment', className: 'bg-segment' },
                { name: 'segment-fg', className: 'bg-segment-fg' },
                { name: 'segment-border', className: 'bg-segment-border' },
            ]}
        />
        <SemanticCard
            description="Every focus ring: a 2px outline, offset by 2px, shared by all controls."
            sample={
                <Button
                    className="outline-2 outline-focus outline-offset-2"
                    tabIndex={-1}
                    variant="secondary"
                >
                    Focused
                </Button>
            }
            title="Focus"
            tokens={[{ name: 'focus', className: 'bg-focus' }]}
        />
        <SemanticCard
            description="Data colours from the analytics screens: forest, lime, mustard, orange and the teal line. They stay put across modes."
            sample={
                <div className="flex h-16 items-end gap-1.5">
                    <span className="h-10 w-5 rounded-xs bg-chart-1" />
                    <span className="h-16 w-5 rounded-xs bg-chart-2" />
                    <span className="h-8 w-5 rounded-xs bg-chart-3" />
                    <span className="h-12 w-5 rounded-xs bg-chart-4" />
                    <span className="h-14 w-5 rounded-xs bg-chart-5" />
                </div>
            }
            title="Data"
            tokens={[
                { name: 'chart-1', className: 'bg-chart-1' },
                { name: 'chart-2', className: 'bg-chart-2' },
                { name: 'chart-3', className: 'bg-chart-3' },
                { name: 'chart-4', className: 'bg-chart-4' },
                { name: 'chart-5', className: 'bg-chart-5' },
            ]}
        />
        <SemanticCard
            description="Status ramps carry meaning on their own, so they are used by index like the neutrals: 100 fills, 200 borders, 500 icons, 700 text."
            sample={
                <div className="flex flex-wrap justify-center gap-2">
                    <Badge tone="success">Paid</Badge>
                    <Badge tone="warning">Due soon</Badge>
                    <Badge tone="error">Overdue</Badge>
                </div>
            }
            title="Status"
            tokens={[
                { name: 'success-500', className: 'bg-success-500' },
                { name: 'warning-500', className: 'bg-warning-500' },
                { name: 'error-500', className: 'bg-error-500' },
                { name: 'primary-500', className: 'bg-primary-500' },
            ]}
        />
    </div>
);

const typeScale = [
    { name: 'xxs', className: 'text-xxs', use: 'Labels, badges, captions' },
    { name: 'xs', className: 'text-xs', use: 'Body and UI default' },
    { name: 'sm', className: 'text-sm', use: 'Inputs, dialog titles' },
    { name: 'base', className: 'text-base', use: 'Lead paragraphs' },
    { name: 'lg', className: 'text-lg', use: 'KPI values, section titles' },
    { name: 'xl', className: 'text-xl', use: 'Sub-headings' },
    { name: '2xl', className: 'text-2xl', use: 'Chart values, page titles' },
    { name: '3xl', className: 'text-3xl', use: 'Headline numbers' },
    { name: '4xl', className: 'text-4xl', use: 'Display' },
    { name: '5xl', className: 'text-5xl', use: 'Display' },
    { name: '6xl', className: 'text-6xl', use: 'Display' },
] as const;

const TypeRow = ({ name, className, use }: (typeof typeScale)[number]) => {
    const [ref, metrics] = useResolved(readFont);

    return (
        <div className="grid items-baseline gap-x-6 gap-y-2 border-neutral-200 border-b py-5 last:border-b-0 md:grid-cols-[160px_minmax(0,1fr)]">
            <div className="flex flex-col gap-0.5">
                <span className="font-medium text-neutral-950 text-xs">text-{name}</span>
                <span className="text-neutral-600 text-xxs tabular-nums">{metrics} px</span>
                <span className="text-neutral-500 text-xxs">{use}</span>
            </div>
            <div
                className={cn('flex min-w-0 flex-col gap-1 text-neutral-950', className)}
                ref={ref}
            >
                <span className="truncate font-normal">Weekly sessions 12,480</span>
                <span className="truncate font-medium">Weekly sessions 12,480</span>
            </div>
        </div>
    );
};

const TypeScale = () => {
    const [ref, family] = useResolved(readFontFamily);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-3" ref={ref}>
                <div className="flex flex-col gap-1 rounded-card border border-neutral-200 px-4 py-3">
                    <span className="text-neutral-600 text-xxs">Family</span>
                    <span className="font-medium text-neutral-950 text-sm">{family}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-card border border-neutral-200 px-4 py-3">
                    <span className="text-neutral-600 text-xxs">Weights</span>
                    <span className="text-neutral-950 text-sm">
                        <span className="font-normal">Normal 400</span>
                        <span className="text-neutral-400"> · </span>
                        <span className="font-medium">Medium 500</span>
                    </span>
                </div>
                <div className="flex flex-col gap-1 rounded-card border border-neutral-200 px-4 py-3">
                    <span className="text-neutral-600 text-xxs">Tracking</span>
                    <span className="font-medium text-neutral-950 text-sm">0.32px, everywhere</span>
                </div>
                <div className="flex flex-col gap-1 rounded-card border border-neutral-200 px-4 py-3">
                    <span className="text-neutral-600 text-xxs">Line height</span>
                    <span className="font-medium text-neutral-950 text-sm">1.25 × size</span>
                </div>
            </div>
            <div className="rounded-card border border-neutral-200 px-4">
                {typeScale.map(row => (
                    <TypeRow key={row.name} {...row} />
                ))}
            </div>
        </div>
    );
};

const radii = [
    { name: 'chip', className: 'rounded-chip', use: 'Badges, kbd, checkbox, icon tiles' },
    { name: 'item', className: 'rounded-item', use: 'Menu, nav and option rows, dropdowns' },
    { name: 'control', className: 'rounded-control', use: 'Buttons, inputs, selects' },
    { name: 'control-lg', className: 'rounded-control-lg', use: 'Large button' },
    { name: 'card', className: 'rounded-card', use: 'Cards' },
    { name: 'panel', className: 'rounded-panel', use: 'App panel, tables' },
] as const;

const RadiusTile = ({ name, className, use }: (typeof radii)[number]) => {
    const [ref, value] = useResolved(readRadius);

    return (
        <div className="flex flex-col gap-3">
            <div
                className={cn(
                    'flex h-24 items-end justify-end border border-neutral-300 bg-neutral-100 p-2',
                    className,
                )}
                ref={ref}
            >
                <span className="font-medium text-lg text-neutral-950 tabular-nums">{value}</span>
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="font-medium text-neutral-950 text-xs">rounded-{name}</span>
                <span className="text-neutral-500 text-xxs">{use}</span>
            </div>
        </div>
    );
};

const Radii = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {radii.map(radius => (
                <RadiusTile key={radius.name} {...radius} />
            ))}
        </div>
        <div className="flex flex-col gap-3">
            <span className="font-medium text-neutral-950 text-xs">How they nest</span>
            <div className="rounded-panel border border-neutral-200 bg-neutral-100 p-3">
                <span className="mb-2 block text-neutral-600 text-xxs">panel</span>
                <div className="rounded-card border border-neutral-200 bg-neutral-50 p-3">
                    <span className="mb-2 block text-neutral-600 text-xxs">card</span>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-9 flex-1 items-center gap-2 rounded-item bg-neutral-100 px-2">
                            <Badge className="bg-neutral-50">chip</Badge>
                            <span className="text-neutral-600 text-xxs">item</span>
                        </div>
                        <Button tabIndex={-1}>control</Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const spacing = [
    { name: '0.5', className: 'w-0.5' },
    { name: '1', className: 'w-1' },
    { name: '1.5', className: 'w-1.5' },
    { name: '2', className: 'w-2' },
    { name: '3', className: 'w-3' },
    { name: '4', className: 'w-4' },
    { name: '5', className: 'w-5' },
    { name: '6', className: 'w-6' },
    { name: '8', className: 'w-8' },
    { name: '10', className: 'w-10' },
    { name: '12', className: 'w-12' },
    { name: '16', className: 'w-16' },
] as const;

const Spacing = () => (
    <div className="rounded-card border border-neutral-200 px-4 py-2">
        {spacing.map(step => (
            <div
                className="grid grid-cols-[48px_56px_minmax(0,1fr)] items-center gap-4 border-neutral-200 border-b py-2.5 last:border-b-0"
                key={step.name}
            >
                <span className="font-medium text-neutral-950 text-xs">{step.name}</span>
                <span className="text-neutral-600 text-xxs tabular-nums">
                    {Number(step.name) * 4}px
                </span>
                <span className={cn('h-4 rounded-xs bg-action', step.className)} />
            </div>
        ))}
    </div>
);

const Elevation = () => (
    <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-3">
            <div className="flex h-32 items-center justify-center rounded-card border border-neutral-200 bg-neutral-100">
                <span className="rounded-item border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs">
                    Hairline
                </span>
            </div>
            <span className="text-neutral-600 text-xxs">
                border-neutral-200, 1px: how cards, tables and panels are told apart
            </span>
        </div>
        <div className="flex flex-col gap-3">
            <div className="flex h-32 items-center justify-center rounded-card border border-neutral-200 bg-neutral-100">
                <span className="rounded-item border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs shadow-float">
                    shadow-float
                </span>
            </div>
            <span className="text-neutral-600 text-xxs">
                The one soft shadow: floating bars, the selected nav item, secondary buttons, menus
            </span>
        </div>
        <div className="flex flex-col gap-3">
            <div className="flex h-32 items-center justify-center rounded-card border border-neutral-200 bg-neutral-100">
                <span className="rounded-item border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs shadow-sheet">
                    shadow-sheet
                </span>
            </div>
            <span className="text-neutral-600 text-xxs">
                Side sheets and dialogs, the only layers that sit over the page
            </span>
        </div>
    </div>
);

const sections: SectionEntry[] = [
    {
        id: 'f-colour',
        title: 'Colour ramps',
        description:
            'Ramps are semantic by index, the way the Figma screens use them: 50 is the surface, 100 the canvas and hover fill, 200 the hairline, 600 secondary text, 950 primary text. Dark mode reads every ramp back to front, so a component never flips a colour itself. Hex values are read from the page, so they follow the theme and mode.',
        render: () => <ColourRamps />,
    },
    {
        id: 'f-semantic',
        title: 'Semantic colours',
        description:
            'A handful of roles that each theme points somewhere else. Components ask for the role, never for a theme.',
        render: () => <SemanticColours />,
    },
    {
        id: 'f-type',
        title: 'Type',
        description:
            'Two weights only, normal and medium. 13px is the body size; the scale climbs in roughly 1.25 steps from there.',
        render: () => <TypeScale />,
    },
    {
        id: 'f-radius',
        title: 'Radii',
        description:
            'Radii nest: a panel holds cards, a card holds items, an item holds chips, each a step smaller than its parent. Themes change what the names resolve to, not where they are used.',
        render: () => <Radii />,
    },
    {
        id: 'f-spacing',
        title: 'Spacing',
        description: 'A 4px grid. Controls pad 8 to 12, cards 16, page sections 24 to 40.',
        render: () => <Spacing />,
    },
    {
        id: 'f-elevation',
        title: 'Elevation',
        description:
            'Surfaces share a colour and are told apart by 1px hairlines. There is one soft shadow for what floats, and one for sheets.',
        render: () => <Elevation />,
    },
];

const ids = sections.map(section => section.id);

export const Foundations = () => {
    const { theme, mode } = useTheme();
    const meta = themeMeta[theme];

    return (
        <>
            <PageHeader
                aside={
                    <Note className="max-w-xs">
                        Showing {meta.name} ({meta.year}, {meta.product.toLowerCase()}) in {mode}{' '}
                        mode. Switch either at the top and every value below is read again.
                    </Note>
                }
                description="The tokens every component is built from: ramps used by index, a few semantic roles, a two-weight type scale, nested radii and a single soft shadow."
                eyebrow="Foundations"
                title="Tokens"
            />
            {/* Remount on a switch so each swatch reads its new value on mount. */}
            <DocsPage ids={ids} key={`${theme}-${mode}`} sections={sections} />
        </>
    );
};
