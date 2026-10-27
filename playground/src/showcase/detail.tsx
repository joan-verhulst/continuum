import {
    Button,
    Card,
    cn,
    Field,
    FieldLabel,
    focusRing,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
} from 'continuum';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Stage } from '../layout';
import { type Knob, type KnobValues, knobDefaults } from './previews';

const icon = { strokeWidth: 2 } as const;

/*
 * The parts a detail view is built from, shared by the components and the
 * foundations so the two read as one site: a tile that opens a page, a stage
 * with its properties panel, and the links to the neighbours.
 */

type PreviewTileProps = {
    /** The small label at the tile's top. */
    badge: ReactNode;
    name: ReactNode;
    description: ReactNode;
    href: string;
    onOpen: () => void;
    /** Classes for the tile in its grid, such as a column span. */
    className?: string;
    /** Classes for the stage the preview sits on. */
    stageClassName?: string;
    /** The preview; drawn as a shot, so nothing in it takes a click. */
    children: ReactNode;
};

/**
 * A live preview on a stage, its name in a well below. The whole tile opens the page: the
 * stage is a shot, and the name is a link stretched over the card.
 */
export const PreviewTile = ({
    badge,
    name,
    description,
    href,
    onOpen,
    className,
    stageClassName,
    children,
}: PreviewTileProps) => (
    <Card
        className={cn(
            'group/tile relative min-w-0 gap-0 overflow-hidden p-0 transition-[border-color] duration-150 hover:border-neutral-300',
            className,
        )}
    >
        <div className="flex items-center justify-between px-4 pt-3">{badge}</div>
        <Stage className={cn('h-64 min-h-0 rounded-none border-0 p-6', stageClassName)} inert>
            {children}
        </Stage>
        {/*
         * The well's corners are the card's less its 6px inset, so they stay concentric at any
         * corner scale. Its sides pad by that corner, never under 10px, so larger corners don't
         * crowd the text.
         */}
        <a
            className={cn(
                'm-1.5 flex min-w-0 items-center gap-3 rounded-(--well) bg-neutral-950/[0.03] px-[max(10px,var(--well))] py-3 [--well:calc(var(--radius-card)-6px)] after:absolute after:inset-0 after:content-[""]',
                focusRing,
                'focus-visible:-outline-offset-2',
            )}
            href={href}
            onClick={event => {
                event.preventDefault();
                onOpen();
            }}
        >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium text-neutral-950 text-xs">{name}</span>
                <span className="truncate text-neutral-500 text-xxs">{description}</span>
            </span>
            <ArrowRight
                aria-hidden
                className="size-4 shrink-0 text-neutral-400 transition-[color,translate] duration-150 group-hover/tile:translate-x-0.5 group-hover/tile:text-neutral-950"
                {...icon}
            />
        </a>
    </Card>
);

type KnobStageProps = {
    knobs?: readonly Knob[];
    className?: string;
    /** Hug the subject, 48px above and below it, and grow only as far as the panel needs. */
    compact?: boolean;
    /** Draws the subject for the knobs' current values. */
    render: (values: KnobValues) => ReactNode;
};

/**
 * The stage at the top of a detail page: the subject centred on the whole stage, and a
 * narrow panel floating over its top-left corner that picks the variant and state.
 */
export const KnobStage = ({ knobs, className, compact, render }: KnobStageProps) => {
    const [values, setValues] = useState(() => knobDefaults(knobs));

    return (
        <Stage
            className={cn(
                'items-stretch p-0',
                // Compact, the panel and the subject share one grid cell: the stage is as tall as the taller.
                compact ? 'grid min-h-0 grid-cols-1 justify-normal' : knobs && 'min-h-[440px]',
                className,
            )}
        >
            {knobs && (
                <KnobPanel
                    className={
                        compact
                            ? 'relative top-auto left-auto m-4 self-start justify-self-start [grid-area:1/1]'
                            : undefined
                    }
                    knobs={knobs}
                    onChange={(id, value) => setValues(current => ({ ...current, [id]: value }))}
                    onReset={() => setValues(knobDefaults(knobs))}
                    values={values}
                />
            )}
            <div
                className={cn(
                    'flex min-w-0 flex-1 items-center justify-center p-10 [&>*]:max-w-full',
                    compact && 'py-12 [grid-area:1/1]',
                )}
            >
                {render(values)}
            </div>
        </Stage>
    );
};

type Neighbour = { id: string; name: string };

/** The previous and next page, at the foot of a detail page. */
export const Neighbours = ({
    label,
    previous,
    next,
    onOpen,
}: {
    label: string;
    previous?: Neighbour;
    next?: Neighbour;
    onOpen: (id: string) => void;
}) => (
    <nav aria-label={label} className="flex justify-between gap-4">
        {previous ? (
            <Button onClick={() => onOpen(previous.id)} variant="secondary">
                <ArrowLeft {...icon} /> {previous.name}
            </Button>
        ) : (
            <span />
        )}
        {next && (
            <Button onClick={() => onOpen(next.id)} variant="secondary">
                {next.name} <ArrowRight {...icon} />
            </Button>
        )}
    </nav>
);

type KnobPanelProps = {
    knobs: readonly Knob[];
    values: KnobValues;
    onChange: (id: string, value: string | boolean) => void;
    onReset: () => void;
    className?: string;
};

/** A choice fits a segmented control in the panel when its labels, padded, fit the 214px it has. */
const fitsSegments = (options: readonly { label: string }[]) =>
    options.length <= 4 &&
    options.reduce((sum, option) => sum + option.label.length * 6.6 + 20, 4) <= 214;

/**
 * The knobs, as a narrow panel floating over the stage's top-left corner: a choice is a
 * segmented control when its options fit, a select when they do not; a yes or no is a switch.
 * It overlays the stage and takes no room from the preview.
 */
const KnobPanel = ({ knobs, values, onChange, onReset, className }: KnobPanelProps) => {
    const defaults = knobDefaults(knobs);
    const changed = knobs.some(knob => values[knob.id] !== defaults[knob.id]);
    const choices = knobs.filter(knob => !('switch' in knob));
    const switches = knobs.filter(knob => 'switch' in knob);

    return (
        <fieldset
            aria-label="Properties"
            className={cn(
                'absolute top-4 left-4 z-10 flex max-h-[calc(100%-32px)] w-60 min-w-0 flex-col overflow-hidden rounded-item border border-neutral-200 bg-neutral-50 shadow-float',
                className,
            )}
        >
            <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-neutral-200 border-b pr-2 pl-3">
                <span className="font-medium text-neutral-950 text-xs">Properties</span>
                <Button
                    aria-label="Reset the properties"
                    disabled={!changed}
                    onClick={onReset}
                    size="icon-sm"
                    variant="ghost"
                >
                    <RotateCcw {...icon} />
                </Button>
            </div>
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-3">
                {choices.map(knob => {
                    if ('switch' in knob) return null;
                    const short = fitsSegments(knob.options);
                    const value = String(values[knob.id] ?? knob.default);

                    return (
                        <div className="flex flex-col gap-1.5" key={knob.id}>
                            <span className="text-neutral-600 text-xs">{knob.label}</span>
                            {short ? (
                                // Items grow from their own width, so a long label is never cut.
                                <SegmentedControl
                                    aria-label={knob.label}
                                    className="w-full [&>*]:flex-auto"
                                    onValueChange={next => onChange(knob.id, next)}
                                    value={value}
                                >
                                    {knob.options.map(option => (
                                        <SegmentedControlItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SegmentedControlItem>
                                    ))}
                                </SegmentedControl>
                            ) : (
                                <Select
                                    onValueChange={next => onChange(knob.id, next)}
                                    value={value}
                                >
                                    <SelectTrigger
                                        aria-label={knob.label}
                                        className="w-full"
                                        size="sm"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {knob.options.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    );
                })}
                {switches.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {switches.map(knob => (
                            <Field
                                className="flex-row items-center justify-between gap-3"
                                key={knob.id}
                            >
                                <FieldLabel className="cursor-pointer font-normal text-neutral-700">
                                    {knob.label}
                                </FieldLabel>
                                <Switch
                                    checked={Boolean(values[knob.id])}
                                    onCheckedChange={checked => onChange(knob.id, checked)}
                                />
                            </Field>
                        ))}
                    </div>
                )}
            </div>
        </fieldset>
    );
};
