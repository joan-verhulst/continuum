import {
    Button,
    cn,
    createThemeVariables,
    defaultThemeOptions,
    drawnType,
    drawnUnit,
    type ThemeOptions,
    themeFonts,
    useTheme,
} from 'continuum';
import { ChevronRight } from 'lucide-react';
import { type CSSProperties, type ReactNode, useId, useMemo, useState } from 'react';
import { heightChoices, typeChoices, unitChoices } from '../presets';
import { fontChoices, SliderRow } from './parts';

/*
 * Everything of a theme that is not colour, chosen by looking rather than by reading: each answer is
 * drawn as the thing it changes (a button in that fill, a card at that corner, a row at that
 * density), in the project's own theme, and picking the drawing picks the answer.
 */

export type TabProps = {
    theme: ThemeOptions;
    set: (patch: Partial<ThemeOptions>) => void;
};

/**
 * A scope that draws its children in the project's theme with one answer changed. It carries no
 * theme name, only the theme's variables written on it, so every token is worked out again here
 * from the changed ones. The data colours are left out: no specimen draws a chart, and finding
 * them is the one slow part of writing a theme.
 */
export const SpecimenScope = ({
    theme,
    patch,
    className,
    children,
}: {
    theme: ThemeOptions;
    patch?: Partial<ThemeOptions>;
    className?: string;
    children: ReactNode;
}) => {
    const { mode } = useTheme();
    const key = JSON.stringify({ ...theme, ...patch, charts: { steps: [] } });
    const style = useMemo(() => {
        const { light, dark } = createThemeVariables(JSON.parse(key) as ThemeOptions);
        return (mode === 'dark' ? { ...light, ...dark } : light) as CSSProperties;
    }, [key, mode]);

    return (
        <span
            aria-hidden
            // Drawn, never used: a click on a specimen lands on the answer it sits in.
            className={cn(
                'continuum pointer-events-none flex select-none items-center justify-center bg-transparent',
                className,
            )}
            data-mode={mode}
            style={style}
        >
            {children}
        </span>
    );
};

type Answer<Value extends string> = {
    value: Value;
    label: string;
    /** The answer as a drawing. */
    specimen: ReactNode;
};

/**
 * One question answered by picking a drawing: a radio group of cards, the drawing over its name.
 * One card is in the tab order and the arrows move the choice, as radios do.
 */
export const Pick = <Value extends string>({
    label,
    hint,
    value,
    answers,
    onChange,
    columns = 3,
    size = 'md',
}: {
    label: string;
    /** What the choice changes, in a line beside its name. */
    hint?: string;
    value: Value | undefined;
    answers: Answer<Value>[];
    onChange: (value: Value) => void;
    columns?: 2 | 3 | 5 | 6;
    /** `sm` for a drawing that is only a strip of colour, `lg` and `xl` for a small piece of a page. */
    size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
    const name = useId();
    const narrow = columns === 5 || columns === 6;

    return (
        <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="mb-2 flex items-baseline gap-2 text-xs">
                <span className="font-medium text-neutral-950">{label}</span>
                {hint && <span className="text-neutral-600">{hint}</span>}
            </legend>
            <div
                className={cn(
                    'grid gap-2',
                    columns === 2 && 'grid-cols-2',
                    columns === 3 && 'grid-cols-3',
                    columns === 5 && 'grid-cols-3 sm:grid-cols-5',
                    columns === 6 && 'grid-cols-3 sm:grid-cols-6',
                )}
            >
                {answers.map(answer => {
                    const selected = answer.value === value;
                    return (
                        <label
                            className={cn(
                                // Positioned, so the hidden radio inside is placed against its own card: left to the page it
                                // stays where the card was before the panel scrolled, and focusing it makes the
                                // browser scroll the whole panel to reach it.
                                'relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-item border text-xs transition-[background-color,border-color] duration-150',
                                // The pick is told by its radio, not by a frame: a dark frame reads as
                                // part of what the card draws (a raised row, a button's edge).
                                'border-neutral-200',
                                !selected && 'hover:bg-neutral-950/3',
                                'has-focus-visible:outline-2 has-focus-visible:outline-focus has-focus-visible:outline-solid has-focus-visible:outline-offset-2',
                            )}
                            key={answer.value}
                        >
                            <input
                                checked={selected}
                                className="sr-only"
                                name={name}
                                onChange={() => onChange(answer.value)}
                                type="radio"
                                value={answer.value}
                            />
                            <span
                                className={cn(
                                    'flex items-center justify-center px-2',
                                    size === 'xl'
                                        ? 'h-36'
                                        : size === 'lg'
                                          ? 'h-24'
                                          : size === 'md'
                                            ? 'h-16'
                                            : 'h-11',
                                )}
                            >
                                {answer.specimen}
                            </span>
                            <span
                                className={cn(
                                    'text-balance px-1.5 pb-2 text-center font-medium leading-tight',
                                    // Five or six across leave no room beside a long name, so the radio stands over it.
                                    narrow && 'flex flex-col items-center gap-1.5',
                                    selected ? 'text-neutral-950' : 'text-neutral-600',
                                )}
                            >
                                {/* The radio the card stands for, inline before the name so a long name wraps under it: a ring, filled when picked. */}
                                <span
                                    aria-hidden
                                    className={cn(
                                        'size-3 place-items-center rounded-full border',
                                        narrow ? 'grid' : 'mr-1.5 inline-grid align-[-1px]',
                                        selected
                                            ? 'border-neutral-950 bg-neutral-950'
                                            : 'border-neutral-300',
                                    )}
                                >
                                    {selected && (
                                        <span className="size-1 rounded-full bg-neutral-50" />
                                    )}
                                </span>
                                {answer.label}
                            </span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
};

/** One part of a step in a container of its own, so the parts read as separate things. */
export const Block = ({ className, children }: { className?: string; children: ReactNode }) => (
    <div
        className={cn(
            'flex min-w-0 flex-col gap-4 rounded-card border border-neutral-200 p-4',
            className,
        )}
        data-slot="theme-block"
    >
        {children}
    </div>
);

/** A question on its own: its name and its picks, set apart by space rather than a box round a box. */
export const Question = ({ className, children }: { className?: string; children: ReactNode }) => (
    <section className={cn('flex min-w-0 flex-col gap-3', className)} data-slot="theme-question">
        {children}
    </section>
);

const stack = 'flex flex-col gap-8';

/* ---------- Type ---------- */

/** The font as "Ag" in each family: the Controls step's first question. */
export const FontEditor = ({ theme, set }: TabProps) => {
    const font = fontChoices.find(choice => choice.value === theme.font)?.value ?? 'geist';

    return (
        <Question>
            <Pick
                answers={fontChoices.map(choice => ({
                    value: choice.value,
                    label: choice.family,
                    specimen: (
                        <span
                            className="font-medium text-2xl text-neutral-950"
                            style={{ fontFamily: themeFonts[choice.value] }}
                        >
                            Ag
                        </span>
                    ),
                }))}
                columns={5}
                label="Font"
                onChange={value =>
                    set({ font: value === defaultThemeOptions.font ? undefined : value })
                }
                value={font}
            />
        </Question>
    );
};

/** The type size as a title over a line of body, at each of the three: the Sizes step's first question. */
export const TypeSizeEditor = ({ theme, set }: TabProps) => {
    const type = theme.type ?? drawnType;

    return (
        <Question>
            <Pick
                answers={typeChoices.map(choice => ({
                    value: String(choice.value),
                    label: `${choice.label} · ${choice.value}px`,
                    specimen: (
                        <SpecimenScope
                            className="flex-col items-start gap-0.5 whitespace-nowrap"
                            patch={{ type: choice.value }}
                            theme={theme}
                        >
                            <span className="font-medium text-base text-neutral-950">Invoices</span>
                            <span className="text-neutral-600 text-xs">48 open</span>
                        </SpecimenScope>
                    ),
                }))}
                label="Size"
                onChange={value => {
                    const next = Number(value);
                    set({ type: next === drawnType ? undefined : next });
                }}
                value={String(type)}
            />
        </Question>
    );
};

/**
 * Letter spacing and line height, free, on a sample that shows both. Advanced: closed until asked
 * for, its toggle saying what it holds when either is changed.
 */
export const TypeSpacingEditor = ({ theme, set }: TabProps) => {
    const [open, setOpen] = useState(false);
    const type = theme.type ?? drawnType;
    const tracking = theme.tracking ?? 0.025;
    const leading = theme.leading ?? 1.25;
    const changed = theme.tracking !== undefined || theme.leading !== undefined;

    return (
        <Question>
            <div className="flex items-center gap-2">
                <Button
                    aria-expanded={open}
                    className="-ml-2"
                    onClick={() => setOpen(!open)}
                    variant="ghost"
                >
                    <ChevronRight
                        aria-hidden
                        className={cn('transition-transform', open && 'rotate-90')}
                        size={14}
                        strokeWidth={1.5}
                    />
                    Advanced
                </Button>
                {changed && !open && (
                    <span className="text-neutral-600 text-xs tabular-nums">
                        Letter spacing {(tracking * type).toFixed(2)}px · line height{' '}
                        {leading.toFixed(2)}
                    </span>
                )}
            </div>
            {open && (
                <>
                    {/* A few lines of body at the size and spacing picked, so both are seen. */}
                    <SpecimenScope
                        className="flex-col items-start justify-start rounded-item border border-neutral-200 p-3"
                        theme={theme}
                    >
                        <span className="max-w-xs text-neutral-950 text-sm">
                            Invoices are sent on the first of the month and fall due thirty days
                            later.
                        </span>
                    </SpecimenScope>
                    <div className="flex flex-col gap-2">
                        <SliderRow
                            display={`${(tracking * type).toFixed(2)}px`}
                            label="Letter spacing"
                            max={0.08}
                            min={-0.03}
                            onValueChange={value =>
                                set({
                                    tracking:
                                        Math.abs(value - 0.025) < 0.0025
                                            ? undefined
                                            : Number(value.toFixed(3)),
                                })
                            }
                            step={0.005}
                            value={tracking}
                        />
                        <SliderRow
                            display={`${leading.toFixed(2)} · ${Math.round(type * leading)}px`}
                            label="Line height"
                            max={1.7}
                            min={1.1}
                            onValueChange={value =>
                                set({
                                    leading:
                                        Math.abs(value - 1.25) < 0.0125
                                            ? undefined
                                            : Number(value.toFixed(2)),
                                })
                            }
                            step={0.05}
                            value={leading}
                        />
                        {changed && (
                            <Button
                                className="self-start"
                                onClick={() => set({ tracking: undefined, leading: undefined })}
                                variant="ghost"
                            >
                                Reset spacing
                            </Button>
                        )}
                    </div>
                </>
            )}
        </Question>
    );
};

/* ---------- Buttons ---------- */

/** The main button drawn in each fill and each shine. */
export const ButtonsEditor = ({ theme, set }: TabProps) => (
    <div className={stack}>
        <Question>
            <Pick
                answers={(
                    [
                        { value: 'neutral', label: 'Neutral' },
                        { value: 'accent', label: 'Primary' },
                    ] as const
                ).map(answer => ({
                    ...answer,
                    specimen: (
                        <SpecimenScope patch={{ action: answer.value }} theme={theme}>
                            <Button tabIndex={-1}>New invoice</Button>
                        </SpecimenScope>
                    ),
                }))}
                columns={2}
                label="Fill"
                onChange={action => set({ action: action === 'accent' ? undefined : action })}
                value={theme.action ?? defaultThemeOptions.action}
            />
        </Question>
        <Question>
            <Pick
                answers={(
                    [
                        { value: 'flat', label: 'Flat' },
                        { value: 'lit', label: 'Lit' },
                        { value: 'glossy', label: 'Glossy' },
                    ] as const
                ).map(answer => ({
                    ...answer,
                    specimen: (
                        <SpecimenScope patch={{ actionStyle: answer.value }} theme={theme}>
                            <Button tabIndex={-1}>Save</Button>
                        </SpecimenScope>
                    ),
                }))}
                label="Shine"
                onChange={style => set({ actionStyle: style === 'flat' ? undefined : style })}
                value={theme.actionStyle ?? defaultThemeOptions.actionStyle}
            />
        </Question>
    </div>
);

/* ---------- The active item ---------- */

/** A sidebar on the canvas: a row, the section that holds the page, and the page on its guide line. */
const NavSpecimen = ({
    theme,
    nav,
}: {
    theme: ThemeOptions;
    nav: NonNullable<ThemeOptions['nav']>;
}) => (
    <SpecimenScope
        className="w-full flex-col items-stretch gap-0.5 rounded-item bg-neutral-100 p-1.5 text-[11px]"
        patch={{ nav }}
        theme={theme}
    >
        <span className="flex h-6 items-center gap-1.5 rounded-chip px-2 text-neutral-600">
            <span className="size-2 rounded-[2px] bg-current opacity-60" />
            Home
        </span>
        <span className="flex h-6 items-center gap-1.5 rounded-chip bg-nav-section px-2 text-nav-section-fg">
            <span className="size-2 rounded-[2px] bg-current opacity-60" />
            Reports
        </span>
        <span className="ml-[11px] flex flex-col gap-0.5 border-neutral-200 border-l py-0.5 pl-1">
            <span className="relative flex h-6 items-center rounded-chip bg-nav-active px-2 font-medium text-nav-active-fg [background-image:var(--nav-active-image)] [box-shadow:inset_0_0_0_1px_var(--color-nav-active-border),var(--shadow-nav-active)] before:absolute before:inset-y-1 before:-left-[5px] before:w-px before:bg-neutral-950 before:content-['']">
                Open
            </span>
            <span className="flex h-6 items-center rounded-chip px-2 text-neutral-600">
                Archive
            </span>
        </span>
    </SpecimenScope>
);

/** The sidebar's look for the page you are on; the section that holds it stays plain in all three. */
export const NavEditor = ({ theme, set }: TabProps) => {
    // A theme saved before the pairs named the looks alone.
    const names: Record<string, NonNullable<ThemeOptions['nav']>> = {
        neutral: 'quiet',
        tint: 'tinted',
        fill: 'quiet',
        bold: 'quiet',
    };
    const value = names[String(theme.nav)] ?? theme.nav ?? defaultThemeOptions.nav;

    return (
        <Question>
            <Pick
                answers={(
                    [
                        { value: 'quiet', label: 'Quiet' },
                        { value: 'tinted', label: 'Tinted' },
                        { value: 'raised', label: 'Raised' },
                    ] as const
                ).map(answer => ({
                    ...answer,
                    specimen: <NavSpecimen nav={answer.value} theme={theme} />,
                }))}
                label="Sidebar"
                onChange={nav => set({ nav: nav === 'quiet' ? undefined : nav })}
                size="xl"
                value={value}
            />
        </Question>
    );
};

/* ---------- Shadows ---------- */

/**
 * A card on the canvas with a field and a button in it, at one level of shadow: the card lifts at
 * Soft, the field and the button too at Full.
 */
const ElevationSpecimen = ({
    theme,
    elevation,
}: {
    theme: ThemeOptions;
    elevation: NonNullable<ThemeOptions['elevation']>;
}) => (
    <SpecimenScope
        className="w-full rounded-item bg-neutral-100 p-3"
        patch={{ elevation }}
        theme={theme}
    >
        <span className="flex w-full flex-col gap-1.5 rounded-item border border-neutral-200 bg-neutral-50 p-2 shadow-card">
            <span className="h-4 rounded-chip border border-neutral-200 bg-neutral-50 shadow-control" />
            <span className="h-4 w-3/5 rounded-chip border border-neutral-200 bg-neutral-100 shadow-control" />
        </span>
    </SpecimenScope>
);

/** How much lifts off the page, then how dark and how wide the shadows are. */
export const ElevationEditor = ({ theme, set }: TabProps) => {
    // A theme saved with the cards-only level reads as lifted.
    const elevation = theme.elevation === 'flat' || !theme.elevation ? 'flat' : 'full';
    const strength = theme.shadowStrength ?? 1;
    const size = theme.shadowSize ?? 1;

    return (
        <Question>
            <Pick
                answers={(
                    [
                        { value: 'flat', label: 'Flat' },
                        { value: 'full', label: 'Lifted' },
                    ] as const
                ).map(answer => ({
                    ...answer,
                    specimen: <ElevationSpecimen elevation={answer.value} theme={theme} />,
                }))}
                columns={2}
                label="Shadows"
                onChange={value => set({ elevation: value === 'flat' ? undefined : value })}
                size="lg"
                value={elevation}
            />
            {/* Only a level that casts a shadow has one to tune. */}
            {elevation !== 'flat' && (
                <div className="flex flex-col gap-2">
                    <SliderRow
                        display={`${Math.round(strength * 100)}%`}
                        label="Strength"
                        max={3}
                        min={0.25}
                        onValueChange={value =>
                            set({
                                shadowStrength:
                                    Math.abs(value - 1) < 0.025
                                        ? undefined
                                        : Number(value.toFixed(2)),
                            })
                        }
                        step={0.05}
                        value={strength}
                    />
                    <SliderRow
                        display={`${Math.round(size * 100)}%`}
                        label="Size"
                        max={3}
                        min={0.5}
                        onValueChange={value =>
                            set({
                                shadowSize:
                                    Math.abs(value - 1) < 0.025
                                        ? undefined
                                        : Number(value.toFixed(2)),
                            })
                        }
                        step={0.05}
                        value={size}
                    />
                </div>
            )}
        </Question>
    );
};

/* ---------- Corners ---------- */

/** The corner scale, free: every corner follows it, the dock, the rail and the chips with the rest. */
export const CornersEditor = ({ theme, set }: TabProps) => {
    const radius = theme.radius ?? 1;

    return (
        <Question>
            <p className="font-medium text-neutral-950 text-xs">Corners</p>
            <SliderRow
                display={`${Math.round(radius * 100)}%`}
                label="Corner scale"
                max={2}
                min={0}
                onValueChange={value =>
                    set({
                        radius: Math.abs(value - 1) < 0.025 ? undefined : Number(value.toFixed(2)),
                    })
                }
                step={0.05}
                value={radius}
            />
        </Question>
    );
};

/* ---------- Density ---------- */

/** The room around things as a small list, and the height of controls as a button. */
export const DensityEditor = ({ theme, set }: TabProps) => {
    const unit = theme.unit ?? drawnUnit;
    const size = theme.size ?? 1;

    return (
        <div className={stack}>
            <Question>
                <Pick
                    answers={unitChoices.map(choice => ({
                        value: String(choice.value),
                        label: `${choice.label} · ${choice.value}px`,
                        specimen: (
                            <SpecimenScope patch={{ unit: choice.value }} theme={theme}>
                                <span className="flex w-16 flex-col gap-1.5 rounded-item border border-neutral-200 p-2">
                                    <span className="h-1 w-3/4 rounded-full bg-neutral-950/60" />
                                    <span className="h-1 w-full rounded-full bg-neutral-950/15" />
                                    <span className="h-1 w-2/3 rounded-full bg-neutral-950/15" />
                                </span>
                            </SpecimenScope>
                        ),
                    }))}
                    label="Padding"
                    onChange={value => {
                        const next = Number(value);
                        set({ unit: next === drawnUnit ? undefined : next });
                    }}
                    value={String(unit)}
                />
            </Question>
            <Question>
                <Pick
                    answers={heightChoices.map(choice => ({
                        value: String(choice.value),
                        label: `${choice.label} · ${Math.round(34 * choice.value)}px`,
                        specimen: (
                            <SpecimenScope patch={{ size: choice.value }} theme={theme}>
                                <Button tabIndex={-1} variant="secondary">
                                    Export
                                </Button>
                            </SpecimenScope>
                        ),
                    }))}
                    label="Heights"
                    onChange={value => {
                        const next = Number(value);
                        set({ size: next === 1 ? undefined : next });
                    }}
                    value={String(size)}
                />
            </Question>
        </div>
    );
};
