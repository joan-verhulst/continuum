import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Badge } from './badge';

/*
 * The card is a card-frame (theme.css): its padding and gap are set as the part's plain values, so a
 * theme that frames its cards can move them onto the frame, the head and the stage.
 */
export const cardVariants = cva(
    'card-frame flex min-w-0 flex-col border border-neutral-200 shadow-card',
    {
        variants: {
            layout: {
                default: '[--card-gap:calc(var(--spacing)*4)] [--card-pad:calc(var(--spacing)*4)]',
                list: '[--card-gap:calc(var(--spacing)*4)] [--card-pad:calc(var(--spacing)*5)]',
                // The deep bottom pad leaves room under a chart's x labels.
                chart: '[--card-gap:calc(var(--spacing)*8)] [--card-pad:calc(var(--spacing)*5)_calc(var(--spacing)*5)_calc(var(--spacing)*12)]',
            },
        },
        defaultVariants: {
            layout: 'default',
        },
    },
);

export type CardProps = ComponentProps<'div'> & VariantProps<typeof cardVariants>;

/**
 * Bordered surface from the analytics screens. Cards share the page colour and
 * are told apart by the hairline alone, so there is no shadow. `list` is the
 * top pages and donut cards, `chart` the area chart cards. A card with a head
 * puts its content in CardContent, so a theme that frames cards can stage it.
 */
export const Card = ({ layout, className, ...props }: CardProps) => (
    <div className={cn(cardVariants({ layout }), className)} data-slot="card" {...props} />
);

export const CardHeader = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn('card-head flex flex-col gap-0.5', className)}
        data-slot="card-header"
        {...props}
    />
);

/**
 * What a card holds under its head. Plain, a box with nothing of its own; in a theme that frames
 * its cards, the stage: the surface with a hairline inside the frame. Its children keep the card's gap.
 */
export const CardContent = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        // It fills the card, so a card stretched to its row's height keeps its stage to the frame's foot.
        className={cn('card-stage flex min-w-0 flex-1 flex-col gap-(--card-gap)', className)}
        data-slot="card-content"
        {...props}
    />
);

/** What closes a card under its content: on the frame when framed, under a hairline when plain. */
export const CardFooter = ({ className, ...props }: ComponentProps<'div'>) => (
    <div className={cn('card-foot', className)} data-slot="card-footer" {...props} />
);

export const CardTitle = ({ className, ...props }: ComponentProps<'p'>) => (
    <p
        className={cn('font-normal text-neutral-600 text-xs', className)}
        data-slot="card-title"
        {...props}
    />
);

export const cardValueVariants = cva('font-medium text-neutral-950 tabular-nums', {
    variants: {
        size: {
            md: 'text-lg',
            lg: 'text-2xl',
            xl: 'text-3xl',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export type CardValueProps = ComponentProps<'p'> & VariantProps<typeof cardValueVariants>;

/** Headline number: 18px in KPI cards, 24 or 31 in chart card headers. */
export const CardValue = ({ size, className, ...props }: CardValueProps) => (
    <p className={cn(cardValueVariants({ size }), className)} data-slot="card-value" {...props} />
);

/**
 * The way a change figure points when no trend is given: down when its text starts with a minus
 * (a hyphen, the minus sign or an en dash), up otherwise.
 */
const trendOf = (figure: ReactNode): 'up' | 'down' => {
    const text =
        typeof figure === 'string' || typeof figure === 'number'
            ? String(figure)
            : Array.isArray(figure) &&
                (typeof figure[0] === 'string' || typeof figure[0] === 'number')
              ? String(figure[0])
              : '';
    return /^\s*[-−–]/.test(text) ? 'down' : 'up';
};

/** A figure that stands beside the key one in a stat card's foot: "Plan" $118K. */
export type StatFact = { label: ReactNode; value: ReactNode };

export type StatCardProps = Omit<ComponentProps<'div'>, 'children'> & {
    label: ReactNode;
    value: ReactNode;
    /**
     * A secondary figure that belongs to the value ("1 invoice, due 30 Nov", "of 418"): a quiet line
     * under it, never inline after it.
     */
    note?: ReactNode;
    delta?: ReactNode;
    /**
     * Colours the delta pill; `neutral` for changes that are neither good nor bad. Read from a
     * leading minus on the delta when left out.
     */
    trend?: 'up' | 'down' | 'neutral';
    /** What the change is measured against, after the pill in the quiet ink: "on last month". */
    comparison?: ReactNode;
    /** A 16 icon before the label, for a dashboard of many cards. */
    icon?: ReactNode;
    /** The card's own controls at the label's right: a ghost `icon-sm` menu button. */
    actions?: ReactNode;
    /** The figure's recent shape under it: a `Sparkline` from `continuum/charts`. */
    chart?: ReactNode;
    /** Two or three figures that stand beside the key one, in a foot of their own. */
    facts?: readonly StatFact[];
};

/**
 * A key figure. Plain, it is the label, the value and its change in a pill. When the reader needs
 * more of the figure it grows by parts, each only when there is something to put in it: an icon
 * and a menu on the label's line, what the change is measured against, the figure's recent shape,
 * and a foot of the figures that stand beside it.
 */
export const StatCard = ({
    label,
    value,
    note,
    delta,
    trend: trendProp,
    comparison,
    icon,
    actions,
    chart,
    facts,
    className,
    ...props
}: StatCardProps) => {
    const trend = trendProp ?? trendOf(delta);
    const hasFacts = facts != null && facts.length > 0;

    const head = (
        <div className="flex min-w-0 items-center justify-between gap-2">
            <CardTitle className="flex min-w-0 items-center gap-2">
                {icon && (
                    <span aria-hidden className="flex shrink-0 text-neutral-600 [&_svg]:size-4">
                        {icon}
                    </span>
                )}
                <span className="truncate">{label}</span>
            </CardTitle>
            {/* Pulled into the padding, so a 28 button sits on the label's line without growing it. */}
            {actions && <div className="-my-1.5 -mr-1.5 flex shrink-0 items-center">{actions}</div>}
        </div>
    );

    /*
     * A card that carries more than its figure (a trend, facts) reads as a small chart card: the
     * label on a line of its own, then the figure at the chart card's size with its change beside
     * it, so the eye has one thing to land on and the rest stands back. A plain card keeps the
     * label over the value and the pill under them.
     */
    const rich = chart != null || hasFacts;

    const pill = delta !== undefined && (
        <Badge
            className="shrink-0"
            tone={trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'neutral'}
            variant="pill"
        >
            {delta}
        </Badge>
    );

    const figure = rich ? (
        <div className="flex flex-col gap-3.5" data-slot="stat-card-figure">
            {/*
             * Each zone keeps its height whatever it holds, so cards side by side stay level line for
             * line: the figure is always one line (the comparison gives way first), and the note's line
             * is held open even when a card has no note.
             */}
            <div className="flex flex-col gap-1">
                <div className="flex min-w-0 items-center gap-2">
                    {/* 20, a step under the page title's 24, so a row of cards never reads as loud as
                        the head over it. */}
                    <CardValue className="shrink-0 text-xl" size="lg">
                        {value}
                    </CardValue>
                    {pill}
                    {comparison != null && (
                        <span className="min-w-0 truncate text-neutral-600 text-xs">
                            {comparison}
                        </span>
                    )}
                </div>
                <p aria-hidden={note == null} className="truncate text-neutral-600 text-xs">
                    {note ?? ' '}
                </p>
            </div>
            {chart}
        </div>
    ) : (
        <div className="flex flex-col gap-3" data-slot="stat-card-figure">
            <div className="flex flex-col gap-1">
                <CardValue>{value}</CardValue>
                {note != null && <p className="text-neutral-600 text-xs">{note}</p>}
            </div>
            {(pill || comparison != null) && (
                <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    {pill}
                    {comparison != null && <span className="text-neutral-600">{comparison}</span>}
                </p>
            )}
        </div>
    );

    const foot = hasFacts && (
        // One line, always: a label gives way before a fact wraps and pushes its card out of level.
        <dl className="flex min-w-0 gap-4 text-xs" data-slot="stat-card-facts">
            {facts.map((fact, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: the facts are given in order
                <div className="flex min-w-0 items-baseline gap-1.5" key={index}>
                    <dt className="min-w-0 truncate text-neutral-600">{fact.label}</dt>
                    <dd className="shrink-0 font-medium text-neutral-950 tabular-nums">
                        {fact.value}
                    </dd>
                </div>
            ))}
        </dl>
    );

    // Plain, the label sits 4 over the figure; framed, the label stands on the frame as the card's
    // head and the figure on a 16 stage, as a stat card in a row of framed ones should.
    if (!rich) {
        return (
            <Card
                data-slot="stat-card"
                {...props}
                className={cn(
                    '[--card-gap:var(--spacing)] [--card-stage-pad:calc(var(--spacing)*4)]',
                    className,
                )}
            >
                <div className="card-head">{head}</div>
                <div className="card-stage flex flex-1 flex-col">{figure}</div>
            </Card>
        );
    }

    /*
     * Its padding by what it holds (the formula): 24, 16 under the facts. The figure and its trend
     * are the card's content, its stage when the theme frames cards; the label and the facts stand
     * on the frame then, and the hairline over the facts gives way to the stage's edge.
     */
    return (
        <Card
            className={cn(
                '[--card-gap:calc(var(--spacing)*3.5)]',
                hasFacts
                    ? '[--card-pad:calc(var(--spacing)*6)_calc(var(--spacing)*6)_calc(var(--spacing)*4)]'
                    : '[--card-pad:calc(var(--spacing)*6)]',
                className,
            )}
            data-slot="stat-card"
            {...props}
        >
            <div className="card-head">{head}</div>
            <div className="card-stage flex flex-1 flex-col">{figure}</div>
            {hasFacts && (
                <div className="card-foot mt-auto">
                    <div className="card-rule [--card-rule-bleed:calc(var(--spacing)*6)] [--card-rule-space:calc(var(--spacing)*4)]">
                        {foot}
                    </div>
                </div>
            )}
        </Card>
    );
};
