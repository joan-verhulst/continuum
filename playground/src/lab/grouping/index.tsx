import {
    Card,
    cn,
    Input,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SettingGroup,
    SettingRow,
    Switch,
    Theme,
} from 'continuum';
import { type ReactNode, useState } from 'react';

/*
 * A lab for one question from the 2026-11-18 evals: how a dependent setting reads as part of its
 * parent, and how a long group divides. A full notification page drawn six ways, switched by a knob. Lab code,
 * outside the skill: opened as `/?grouping`.
 */

export const isGroupingStandalone = () =>
    new URLSearchParams(window.location.search).has('grouping');

type Variant = 'today' | 'spacing' | 'styled' | 'marked' | 'split' | 'sub' | 'boxed' | 'combined';

const variants: { value: Variant; label: string; about: string }[] = [
    {
        value: 'today',
        label: 'Today',
        about: 'The skill as it is: a dependent is a full setting row 16 below its parent, no hairline between; 16, a hairline and 16 between settings.',
    },
    {
        value: 'spacing',
        label: 'Spacing',
        about: 'Grouped by room alone: a setting and its dependents 12 apart, groups 24, a hairline and 24 apart (about 2.5 : 1).',
    },
    {
        value: 'styled',
        label: 'Spacing + style',
        about: 'The same room, and the dependent reads as part of its parent: its label in the description style, not a setting title.',
    },
    {
        value: 'marked',
        label: 'Spacing + guide',
        about: 'The same room, and the dependents step in under the parent behind a 1px guide line.',
    },
    {
        value: 'split',
        label: 'Split',
        about: 'Spacing + guide, and every group is a section: a 16 medium title 20 above its cards, sections 48 apart. A long group splits into a card per sub-category, each under a quiet title; a short one is one card with no title of its own.',
    },
    {
        value: 'sub',
        label: 'Sub-categories',
        about: 'Spacing + guide in one card per group under its quiet title; each sub-category under a 14 medium title, 32 and a hairline apart.',
    },
    {
        value: 'combined',
        label: 'Combined',
        about: 'Split, sub-categories and bordered settings in one: each group a section (16 medium title, 48 apart, no card around it), its sub-categories under a 14 medium title 24 apart, each setting a bordered box 8 apart, its dependents 20 under it and 12 apart.',
    },
    {
        value: 'boxed',
        label: 'Bordered',
        about: 'One card per group under its quiet title; each setting, with its dependents, in a bordered box of its own (16 padding, 12 corners, 8 apart) instead of hairlines, the dependents plain rows inside it, 12 apart and 20 under their setting; sub-categories under a 14 medium title, 24 apart.',
    },
];

/** Which sub-category of its group a setting falls in; a group with none stays whole. */
const subOf: Record<string, string> = {
    'New order': 'Order updates',
    'Order cancelled': 'Order updates',
    'Order changed': 'Order updates',
    'Large orders only': 'Exceptions',
    'Late deliveries': 'Exceptions',
    'Low stock alerts': 'Levels',
    'Out of stock': 'Levels',
    'Daily stock summary': 'Reports',
    'Expiry warnings': 'Reports',
    'Invoice paid': 'Payments',
    'Invoice overdue': 'Payments',
    'Weekly summary': 'Summaries',
};

/** The settings in their sub-categories, in order; a group without any is one unnamed run. */
const bySub = (settings: Setting[]) => {
    const runs: { name?: string; settings: Setting[] }[] = [];
    for (const setting of settings) {
        const name = subOf[setting.title];
        const last = runs[runs.length - 1];
        if (last && last.name === name) last.settings.push(setting);
        else runs.push({ name, settings: [setting] });
    }
    return runs;
};

/** Settings 24, a hairline and 24 apart; inside a setting and its dependents 12. */
const Rows = ({ settings, variant }: { settings: Setting[]; variant: Variant }) => (
    <div className="flex flex-col gap-6 [&>*+*]:border-neutral-200 [&>*+*]:border-t [&>*+*]:pt-6">
        {settings.map(setting => (
            <Block key={setting.title} setting={setting} variant={variant} />
        ))}
    </div>
);

const amounts = ['€500', '€1,000', '€2,500', '€5,000'].map(value => ({ value, label: value }));

const Picker = ({ value, items }: { value: string; items: { value: string; label: string }[] }) => (
    <Select defaultValue={value} items={items}>
        <SelectTrigger indicator="right" size="sm">
            <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
            {items.map(item => (
                <SelectItem key={item.value} value={item.value}>
                    {item.label}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);

type Setting = {
    title: string;
    description?: string;
    on?: boolean;
    /** The setting's own control when it is not a switch. */
    control?: ReactNode;
    /** A quiet title over several dependents, naming what they belong to. */
    eyebrow?: string;
    dependents?: { title: string; control: ReactNode }[];
};

const options = (values: string[]) => values.map(value => ({ value, label: value }));
const times = options(['06:00', '07:00', '08:00', '18:00', '20:00', '22:00']);
const segments = (values: string[], value: string) => (
    <SegmentedControl defaultValue={value}>
        {values.map(item => (
            <SegmentedControlItem key={item} value={item}>
                {item}
            </SegmentedControlItem>
        ))}
    </SegmentedControl>
);

const groups: { title: string; settings: Setting[] }[] = [
    {
        title: 'Orders',
        settings: [
            { title: 'New order', description: 'An email for every order placed.', on: true },
            {
                title: 'Order cancelled',
                description: 'An email when a customer cancels.',
                on: true,
            },
            {
                title: 'Order changed',
                description: 'When a customer edits an order after placing it.',
                on: false,
            },
            {
                title: 'Large orders only',
                description: 'Only tell me about orders above an amount.',
                on: true,
                dependents: [
                    { title: 'Amount', control: <Picker items={amounts} value="€1,000" /> },
                ],
            },
            {
                title: 'Late deliveries',
                description: 'When an order misses its delivery window.',
                on: true,
                eyebrow: 'Tell me about late deliveries',
                dependents: [
                    {
                        title: 'After',
                        control: (
                            <Picker
                                items={options(['15 minutes', '30 minutes', '1 hour'])}
                                value="30 minutes"
                            />
                        ),
                    },
                    { title: 'Also tell the customer', control: <Switch defaultChecked /> },
                ],
            },
        ],
    },
    {
        title: 'Stock',
        settings: [
            {
                title: 'Low stock alerts',
                description: 'When a product falls below its threshold.',
                on: true,
                eyebrow: 'Low stock',
                dependents: [
                    {
                        title: 'Threshold',
                        control: (
                            <Picker
                                items={options(['10 units', '20 units', '50 units'])}
                                value="20 units"
                            />
                        ),
                    },
                    {
                        title: 'Warehouses',
                        control: (
                            <Picker
                                items={options(['All warehouses', 'Amsterdam', 'Utrecht'])}
                                value="All warehouses"
                            />
                        ),
                    },
                ],
            },
            { title: 'Out of stock', description: 'When a product reaches zero.', on: true },
            {
                title: 'Daily stock summary',
                description: 'One email with the stock of every product.',
                on: true,
                dependents: [{ title: 'Send at', control: <Picker items={times} value="07:00" /> }],
            },
            {
                title: 'Expiry warnings',
                description: 'Products within a week of their best-before date.',
                on: false,
            },
        ],
    },
    {
        title: 'Invoices',
        settings: [
            { title: 'Invoice paid', description: 'An email when a customer pays.', on: true },
            {
                title: 'Invoice overdue',
                description: 'When an invoice passes its due date.',
                on: true,
                eyebrow: 'Reminder to the customer',
                dependents: [
                    { title: 'Automatic reminder', control: <Switch defaultChecked /> },
                    {
                        title: 'When to send it',
                        control: (
                            <Picker
                                items={options(['After 1 day', 'After 3 days', 'After 7 days'])}
                                value="After 3 days"
                            />
                        ),
                    },
                ],
            },
            {
                title: 'Weekly summary',
                description: 'One email a week with what was paid and what is due.',
                on: false,
                eyebrow: 'The weekly summary',
                dependents: [
                    {
                        title: 'Day',
                        control: <Picker items={options(['Monday', 'Friday'])} value="Monday" />,
                    },
                    {
                        title: 'Sent to',
                        control: (
                            <Picker items={options(['Only me', 'All members'])} value="Only me" />
                        ),
                    },
                ],
            },
        ],
    },
    {
        title: 'Where',
        settings: [
            {
                title: 'Email address',
                control: <Input className="w-56" defaultValue="mira@larder.co" size="sm" />,
            },
            {
                title: 'Slack channel',
                description: 'Slack is connected as larder-hq.',
                control: (
                    <Picker items={options(['#orders', '#stock', '#general'])} value="#orders" />
                ),
            },
            { title: 'How often', control: segments(['Instant', 'Hourly', 'Daily'], 'Hourly') },
            {
                title: 'Browser notifications',
                description: 'Shown by this browser while Larder is open.',
                on: false,
            },
        ],
    },
    {
        title: 'Quiet hours',
        settings: [
            {
                title: 'Quiet hours',
                description: 'No notifications between the hours you set.',
                on: true,
                eyebrow: 'Quiet between',
                dependents: [
                    { title: 'From', control: <Picker items={times} value="22:00" /> },
                    { title: 'To', control: <Picker items={times} value="07:00" /> },
                ],
            },
            {
                title: 'Also at weekends',
                description: 'Keep Saturday and Sunday quiet all day.',
                on: false,
            },
        ],
    },
];

/** One setting and its dependents, as one block of the group. */
const Block = ({ setting, variant }: { setting: Setting; variant: Variant }) => {
    const parent = (
        <SettingRow
            control={setting.control ?? <Switch defaultChecked={setting.on} />}
            description={setting.description}
            title={setting.title}
        />
    );
    const dependents = (setting.dependents ?? []).map(dependent =>
        variant === 'styled' ? (
            // The dependent's label in the description's style: part of the setting above, not a sibling.
            <div
                className="flex min-h-control-lg items-center justify-between gap-4"
                key={dependent.title}
            >
                <p className="font-normal text-neutral-600 text-xs">{dependent.title}</p>
                {dependent.control}
            </div>
        ) : (
            <SettingRow control={dependent.control} key={dependent.title} title={dependent.title} />
        ),
    );
    if (setting.eyebrow) {
        dependents.unshift(
            <p className="font-normal text-neutral-600 text-xs" key="eyebrow">
                {setting.eyebrow}
            </p>,
        );
    }
    if (!dependents.length) return parent;
    return (
        // In a bordered box the setting and its dependents are two groups: 20 between, 12 inside.
        <div
            className={cn(
                'flex flex-col',
                variant === 'boxed' || variant === 'combined' ? 'gap-5' : 'gap-3',
            )}
        >
            {parent}
            {/* In a bordered box the box already groups them: no guide line there. */}
            {variant === 'marked' || variant === 'split' || variant === 'sub' ? (
                <div className="ml-1 flex flex-col gap-3 border-neutral-200 border-l pl-4">
                    {dependents}
                </div>
            ) : variant === 'boxed' || variant === 'combined' ? (
                <div className="flex flex-col gap-3">{dependents}</div>
            ) : (
                dependents
            )}
        </div>
    );
};

const Group = ({
    title,
    settings,
    variant,
}: {
    title: string;
    settings: Setting[];
    variant: Variant;
}) => {
    if (variant === 'today') {
        return (
            <Card layout="list">
                <SettingGroup title={title}>
                    {settings.flatMap(setting => [
                        <SettingRow
                            control={setting.control ?? <Switch defaultChecked={setting.on} />}
                            description={setting.description}
                            key={setting.title}
                            title={setting.title}
                        />,
                        ...(setting.eyebrow
                            ? [
                                  <p
                                      className="font-normal text-neutral-600 text-xs"
                                      data-dependent
                                      key="eyebrow"
                                  >
                                      {setting.eyebrow}
                                  </p>,
                              ]
                            : []),
                        ...(setting.dependents ?? []).map(dependent => (
                            <SettingRow
                                control={dependent.control}
                                dependent
                                key={dependent.title}
                                title={dependent.title}
                            />
                        )),
                    ])}
                </SettingGroup>
            </Card>
        );
    }
    const runs = bySub(settings);
    if (variant === 'combined') {
        return (
            <section className="flex flex-col gap-5">
                <h2 className="font-medium text-base text-neutral-950">{title}</h2>
                <div className="flex flex-col gap-6">
                    {runs.map(run => (
                        <div className="flex flex-col gap-3" key={run.name ?? 'rest'}>
                            {run.name && (
                                <p className="font-medium text-neutral-950 text-sm">{run.name}</p>
                            )}
                            <div className="flex flex-col gap-2">
                                {run.settings.map(setting => (
                                    <div
                                        className="rounded-card border border-neutral-200 bg-neutral-50 p-4"
                                        key={setting.title}
                                    >
                                        <Block setting={setting} variant={variant} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }
    if (variant === 'split') {
        return (
            <section className="flex flex-col gap-5">
                <h2 className="font-medium text-base text-neutral-950">{title}</h2>
                <div className="flex flex-col gap-4">
                    {runs.map(run => (
                        <Card key={run.name ?? 'rest'} layout="list">
                            <div className="flex flex-col gap-3">
                                {run.name && (
                                    <p className="font-normal text-neutral-600 text-xs">
                                        {run.name}
                                    </p>
                                )}
                                <Rows settings={run.settings} variant={variant} />
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
        );
    }
    if (variant === 'boxed') {
        return (
            <Card layout="list">
                <div className="flex flex-col gap-3">
                    <p className="font-normal text-neutral-600 text-xs">{title}</p>
                    <div className="flex flex-col gap-6">
                        {runs.map(run => (
                            <div className="flex flex-col gap-3" key={run.name ?? 'rest'}>
                                {run.name && (
                                    <p className="font-medium text-neutral-950 text-sm">
                                        {run.name}
                                    </p>
                                )}
                                {/* Each setting a box of its own: the border groups it, so no hairlines between. */}
                                <div className="flex flex-col gap-2">
                                    {run.settings.map(setting => (
                                        <div
                                            className="rounded-control border border-neutral-200 p-4"
                                            key={setting.title}
                                        >
                                            <Block setting={setting} variant={variant} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        );
    }
    if (variant === 'sub' && runs.some(run => run.name)) {
        return (
            <Card layout="list">
                <div className="flex flex-col gap-3">
                    <p className="font-normal text-neutral-600 text-xs">{title}</p>
                    <div className="flex flex-col gap-8 [&>*+*]:border-neutral-200 [&>*+*]:border-t [&>*+*]:pt-8">
                        {runs.map(run => (
                            <div className="flex flex-col gap-4" key={run.name ?? 'rest'}>
                                {run.name && (
                                    <p className="font-medium text-neutral-950 text-sm">
                                        {run.name}
                                    </p>
                                )}
                                <Rows settings={run.settings} variant={variant} />
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        );
    }
    return (
        <Card layout="list">
            <div className="flex flex-col gap-3">
                <p className="font-normal text-neutral-600 text-xs">{title}</p>
                {/* Blocks 24, a hairline and 24 apart; inside a block 12. */}
                <div className="flex flex-col gap-6 [&>*+*]:border-neutral-200 [&>*+*]:border-t [&>*+*]:pt-6">
                    {settings.map(setting => (
                        <Block key={setting.title} setting={setting} variant={variant} />
                    ))}
                </div>
            </div>
        </Card>
    );
};

export const GroupingStandalone = () => {
    // The two kept after the 2026-11-18 review; the rest stay in the code for the record.
    const shown = variants.filter(item => item.value === 'marked' || item.value === 'boxed');
    const [variant, setVariant] = useState<Variant>('marked');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const current = variants.find(item => item.value === variant) ?? variants[0];

    return (
        <Theme className="min-h-dvh bg-neutral-100 text-neutral-950" mode={mode}>
            <div className="mx-auto flex max-w-content-narrow flex-col gap-12 px-4 py-16">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <SegmentedControl
                            onValueChange={value => setVariant(value as Variant)}
                            value={variant}
                        >
                            {shown.map(item => (
                                <SegmentedControlItem key={item.value} value={item.value}>
                                    {item.label}
                                </SegmentedControlItem>
                            ))}
                        </SegmentedControl>
                        <SegmentedControl
                            onValueChange={value => setMode(value as 'light' | 'dark')}
                            value={mode}
                        >
                            <SegmentedControlItem value="light">Light</SegmentedControlItem>
                            <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
                        </SegmentedControl>
                    </div>
                    <p className="text-neutral-600 text-xs">{current?.about}</p>
                </div>

                <div className={cn('flex flex-col gap-12')}>
                    <div className="flex flex-col gap-1.5">
                        <h1 className="font-medium text-2xl text-neutral-950">Notifications</h1>
                        <p className="text-neutral-600 text-sm">
                            Choose what Larder tells you about, and where.
                        </p>
                    </div>
                    <div
                        className={
                            variant === 'split' || variant === 'combined'
                                ? 'flex flex-col gap-12'
                                : 'flex flex-col gap-6'
                        }
                    >
                        {groups.map(group => (
                            <Group
                                key={group.title}
                                settings={group.settings}
                                title={group.title}
                                variant={variant}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </Theme>
    );
};
