import { Copy, EllipsisVertical, Pencil, Rocket, Trash2 } from 'lucide-react';
import {
    Button,
    cn,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    focusRing,
} from 'continuum';
import { Fragment, useState } from 'react';
import { type Span, type TableColumn, tableSpans } from './engine';
import { Area, Band, RasterPage, Row, Text, useRaster } from './raster';

type Email = { id: number; name: string; delay?: string };
type Phase = { id: string; title: string; interval?: string; emails: Email[] };

const initialPhases: Phase[] = [
    { id: 'unassigned', title: 'Unassigned', emails: [{ id: 1, name: 'New email' }] },
    {
        id: 'phase-1',
        title: 'Phase 1',
        interval: '72h interval',
        emails: [
            { id: 2, name: 'Welcome email' },
            { id: 3, name: 'Getting started guide', delay: '+72h' },
            { id: 4, name: 'Tips & tricks', delay: '+72h' },
        ],
    },
    {
        id: 'phase-2',
        title: 'Phase 2',
        interval: '4w interval',
        emails: [
            { id: 5, name: 'Case study', delay: '+4w' },
            { id: 6, name: 'Feedback request', delay: '+4w' },
        ],
    },
];

const navigation = ['All sequences', 'Active campaigns', 'Drafts', 'Templates'];
const projects = [
    {
        label: 'Q1 growth campaign',
        pages: ['Campaigns', 'Automations', 'Analytics', 'Permissions'],
    },
    { label: 'Mobile app launch' },
    { label: 'Customer retention program' },
    { label: 'Brand refresh initiative' },
];
const sections = ['Eligibility', 'Audience', 'Settings'];

const columns: { key: TableColumn; label: string }[] = [
    { key: 'delay', label: 'Delay' },
    { key: 'name', label: 'Email' },
    { key: 'template', label: 'Template' },
    { key: 'click', label: 'Click rate' },
    { key: 'open', label: 'Open rate' },
];

/** A plain text action: no fill, no border, only colour on hover. */
const textAction = cn(
    'cursor-pointer select-none text-left text-neutral-600 transition-colors duration-150 hover:text-neutral-950',
    focusRing,
);

const Navigation = () => {
    const { raster } = useRaster();
    const row = raster.line + 8;

    return (
        <nav aria-label="Sequences" className="sticky top-0 flex flex-col">
            <Row height={raster.line * 2}>
                <Text className="font-medium text-neutral-950">Northwind</Text>
            </Row>

            <div className="flex flex-col" style={{ marginTop: raster.line * 4 }}>
                <Row height={row}>
                    <button className={cn(textAction, 'text-neutral-950')} type="button">
                        <Text>+ New sequence</Text>
                    </button>
                </Row>
                <div style={{ height: raster.line }} />
                {navigation.map(label => {
                    const active = label === 'Active campaigns';
                    return (
                        <Row height={row} key={label}>
                            <button
                                aria-current={active ? 'page' : undefined}
                                className={cn(textAction, active && 'text-neutral-950')}
                                type="button"
                            >
                                {/* The marker hangs in the margin, so the labels keep one edge. */}
                                {active && (
                                    <span className="absolute mt-1 -ml-3 size-1.5 bg-action" />
                                )}
                                <Text>{label}</Text>
                            </button>
                        </Row>
                    );
                })}
            </div>

            <div className="flex flex-col" style={{ marginTop: raster.line * 2 }}>
                <Row height={row}>
                    <Text className="text-neutral-500">Projects</Text>
                </Row>
                {projects.map(project => (
                    <Fragment key={project.label}>
                        <Row height={row}>
                            <button
                                className={cn(textAction, project.pages && 'text-neutral-950')}
                                type="button"
                            >
                                <Text className="truncate">{project.label}</Text>
                            </button>
                        </Row>
                        {project.pages?.map(page => (
                            <Row height={row} key={page} style={{ paddingLeft: raster.line }}>
                                <button className={textAction} type="button">
                                    <Text>{page}</Text>
                                </button>
                            </Row>
                        ))}
                    </Fragment>
                ))}
            </div>

            <div className="flex flex-col" style={{ marginTop: raster.line * 4 }}>
                <Text className="text-neutral-950">Northwind Agency</Text>
                <Text className="text-neutral-500">Startup</Text>
            </div>
        </nav>
    );
};

const EmailActions = ({ name, onDelete }: { name: string; onDelete: () => void }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
                aria-label={`Actions for ${name}`}
                className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                size="icon-sm"
                variant="ghost"
            >
                <EllipsisVertical strokeWidth={1.5} />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem>
                <Pencil strokeWidth={1.5} />
                Edit email
            </DropdownMenuItem>
            <DropdownMenuItem>
                <Copy strokeWidth={1.5} />
                Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} variant="danger">
                <Trash2 strokeWidth={1.5} />
                Delete
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

/** The table's columns laid onto the content columns, left to right. */
const useTableColumns = () => {
    const { content } = useRaster();
    const spans = tableSpans(content.main[1]);
    let start = 1;

    return columns
        .filter(column => spans[column.key] > 0)
        .map(column => {
            const within: Span = [start, spans[column.key]];
            start += spans[column.key];
            return { ...column, within };
        });
};

const SequenceTable = ({
    phases,
    onAddPhase,
    onRemove,
}: {
    phases: Phase[];
    onAddPhase: () => void;
    onRemove: (id: number) => void;
}) => {
    const { raster, content } = useRaster();
    const tableColumns = useTableColumns();
    const row = raster.line * 2;
    const hanging = Boolean(content.head);

    return (
        <>
            <Band>
                {tableColumns.map(column => (
                    <Area area="main" key={column.key} within={column.within}>
                        <Row height={row}>
                            <Text className="text-neutral-500">{column.label}</Text>
                        </Row>
                    </Area>
                ))}
            </Band>

            {phases.map(phase => (
                <Band key={phase.id} style={{ marginTop: raster.line }}>
                    {/* The phase hangs beside its first two rows; without room it heads them. */}
                    <Area area="head" className="flex flex-col">
                        <Row height={row}>
                            <Text className="text-neutral-950">{phase.title}</Text>
                        </Row>
                        {hanging && (
                            <Row height={row}>
                                <Text className="text-neutral-500">
                                    {phase.interval ?? 'No interval'}
                                </Text>
                            </Row>
                        )}
                    </Area>
                    <Area area="main" className="grid grid-cols-subgrid">
                        {phase.emails.map((email, index) => (
                            <div
                                className="group relative col-span-full grid grid-cols-subgrid"
                                key={email.id}
                            >
                                {/* The number hangs in the gutter before the content's edge. */}
                                {phase.interval && (
                                    <Row
                                        className="absolute justify-end text-neutral-500"
                                        height={row}
                                        style={{
                                            right: '100%',
                                            width: raster.gutter * 2,
                                            paddingRight: raster.gutter / 2,
                                        }}
                                    >
                                        <Text className="tabular-nums">{index + 1}</Text>
                                    </Row>
                                )}
                                {tableColumns.map(column => (
                                    <Row
                                        height={row}
                                        key={column.key}
                                        style={{
                                            gridColumn: `${column.within[0]} / span ${column.within[1]}`,
                                        }}
                                    >
                                        <Text
                                            className={cn(
                                                'truncate',
                                                column.key === 'name'
                                                    ? 'text-neutral-950'
                                                    : 'text-neutral-600',
                                                column.key === 'delay' && 'tabular-nums',
                                            )}
                                        >
                                            {column.key === 'delay' && (email.delay ?? '—')}
                                            {column.key === 'name' && email.name}
                                            {column.key === 'template' && 'Template'}
                                            {(column.key === 'click' || column.key === 'open') &&
                                                'N/A'}
                                        </Text>
                                    </Row>
                                ))}
                                <div className="absolute top-1 right-0">
                                    <EmailActions
                                        name={email.name}
                                        onDelete={() => onRemove(email.id)}
                                    />
                                </div>
                            </div>
                        ))}
                        {phase.emails.length === 0 && (
                            <Row className="col-span-full" height={row}>
                                <Text className="text-neutral-500">No emails yet</Text>
                            </Row>
                        )}
                    </Area>
                </Band>
            ))}

            <Band style={{ marginTop: raster.line }}>
                <Area area="main">
                    <Row height={row}>
                        <button
                            className={cn(textAction, 'text-neutral-950')}
                            onClick={onAddPhase}
                            type="button"
                        >
                            <Text>+ Add phase</Text>
                        </button>
                    </Row>
                </Area>
            </Band>
        </>
    );
};

/**
 * The email sequence editor on a raster: no panels, borders or fills. The grid
 * alone separates navigation from page, labels from content, row from row.
 */
export const SequenceRaster = ({
    line,
    minColumn,
    overlay,
}: {
    line: number;
    minColumn: number;
    overlay: boolean;
}) => {
    const [phases, setPhases] = useState(initialPhases);
    const [section, setSection] = useState<string>();

    const nextId = () => Math.max(0, ...phases.flatMap(p => p.emails.map(e => e.id))) + 1;

    const addEmail = () =>
        setPhases(current =>
            current.map(phase =>
                phase.id === 'unassigned'
                    ? { ...phase, emails: [...phase.emails, { id: nextId(), name: 'New email' }] }
                    : phase,
            ),
        );

    const addPhase = () =>
        setPhases(current => [
            ...current,
            {
                id: `phase-${current.length}`,
                title: `Phase ${current.length}`,
                interval: '1w interval',
                emails: [],
            },
        ]);

    const removeEmail = (id: number) =>
        setPhases(current =>
            current.map(phase => ({ ...phase, emails: phase.emails.filter(e => e.id !== id) })),
        );

    return (
        <RasterPage nav={<Navigation />} overlay={overlay} params={{ line, minColumn }}>
            <SequencePage
                onAddEmail={addEmail}
                onAddPhase={addPhase}
                onRemove={removeEmail}
                onSection={setSection}
                phases={phases}
                section={section}
            />
        </RasterPage>
    );
};

const SequencePage = ({
    phases,
    section,
    onAddEmail,
    onAddPhase,
    onRemove,
    onSection,
}: {
    phases: Phase[];
    section?: string;
    onAddEmail: () => void;
    onAddPhase: () => void;
    onRemove: (id: number) => void;
    onSection: (section: string) => void;
}) => {
    const { raster, content } = useRaster();
    const line = raster.line;
    const descriptionSpan = Math.max(
        Math.round((content.main[1] * 3) / 4),
        Math.min(content.main[1], 4),
    );

    return (
        <>
            {/* Where you are, on the same baseline as the name above the navigation */}
            <Band>
                <Area area="head">
                    <Row height={line * 2}>
                        <Text className="text-neutral-500">Email campaigns</Text>
                    </Row>
                </Area>
                <Area area="main">
                    <Row height={line * 2}>
                        <Text className="text-neutral-950">Q1 growth campaign</Text>
                    </Row>
                </Area>
            </Band>

            <Band style={{ marginTop: line * 4 }}>
                <Area area="head">
                    <dl className="flex flex-col" style={{ gap: line }}>
                        <div>
                            <Text as="dt" className="text-neutral-500">
                                Status
                            </Text>
                            <Text as="dd" className="mt-1 text-neutral-950">
                                Inactive
                            </Text>
                        </div>
                        <div>
                            <Text as="dt" className="text-neutral-500">
                                Markets
                            </Text>
                            <Text as="dd" className="mt-1 text-neutral-950">
                                NL, DE, BE
                            </Text>
                        </div>
                    </dl>
                </Area>
                <Area area="main">
                    <Text
                        as="h1"
                        className="font-medium text-[31px] text-neutral-950 leading-[calc(var(--rx-line)*2)] tracking-[-0.01em]"
                    >
                        Q1 growth campaign
                    </Text>
                </Area>
            </Band>

            <Band style={{ marginTop: line * 4 }}>
                <Area area="head">
                    <Text as="h2" className="font-medium text-neutral-950">
                        Email sequencing
                    </Text>
                </Area>
                <Area area="main" within={[1, descriptionSpan]}>
                    <Text as="p" className="text-neutral-600">
                        Build the sequence by adding emails and grouping them into phases. Emails in
                        a phase go out in order at the set interval.
                    </Text>
                </Area>
            </Band>

            <Band style={{ marginTop: line * 2 }}>
                <Area area="main">
                    <button
                        className={cn(textAction, 'text-neutral-950')}
                        onClick={onAddEmail}
                        type="button"
                    >
                        <Text>+ Add email</Text>
                    </button>
                </Area>
            </Band>

            <div className="col-span-full grid grid-cols-subgrid" style={{ marginTop: line * 2 }}>
                <SequenceTable onAddPhase={onAddPhase} onRemove={onRemove} phases={phases} />
            </div>

            {/* The page's sections and its one action, on the content's columns */}
            <Band
                className="sticky bottom-0 z-10 bg-neutral-50"
                style={{ marginTop: line * 4, paddingBlock: line }}
            >
                <Area area="main" className="flex items-center justify-between gap-6">
                    <div className="flex gap-6">
                        {sections.map(name => (
                            <button
                                aria-pressed={section === name}
                                className={cn(
                                    textAction,
                                    section === name &&
                                        'text-neutral-950 underline underline-offset-4',
                                )}
                                key={name}
                                onClick={() => onSection(name)}
                                type="button"
                            >
                                <Text>{name}</Text>
                            </button>
                        ))}
                    </div>
                    <Button className="h-8">
                        Start campaign
                        <Rocket strokeWidth={1.5} />
                    </Button>
                </Area>
            </Band>
        </>
    );
};
