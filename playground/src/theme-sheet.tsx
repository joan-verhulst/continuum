import {
    Button,
    cn,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    defaultThemeOptions,
    Field,
    FieldLabel,
    focusRing,
    InfoTip,
    Input,
    isDefaultTheme,
    SegmentedControl,
    SegmentedControlItem,
    Sheet,
    SheetBody,
    SheetContent,
    SheetHeader,
    SheetSection,
    SheetTitle,
    Slider,
    Switch,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    type ThemeOptions,
    themeAccentRamp,
} from 'continuum';
import { Check, Copy, Download, SwatchBook } from 'lucide-react';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { C } from './article';
import type { AppState } from './meta';
import { isPreviewing, matchPreset, presetSwatch, presets } from './presets';
import { designBrief, exportTheme, tailwindEntry } from './theme-export';

const icon = { strokeWidth: 2 } as const;

const DEFAULT_ACCENT = '#3939e5';

const stepNames = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

/** Drops the keys set to undefined, so untouched options compare equal to the defaults. */
const compact = (options: ThemeOptions): ThemeOptions =>
    Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));

/** A row of the builder's form: its name in the label column, the control beside it. */
const Row = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
    <>
        <div className="flex h-[34px] items-center gap-1.5 text-neutral-600 text-xs">
            {label}
            {hint && <InfoTip content={hint} label={`About ${label.toLowerCase()}`} />}
        </div>
        <div className="flex min-w-0 items-center gap-3">{children}</div>
    </>
);

/** A slider with its value beside it; the track can carry a gradient that shows what the knob picks. */
const SliderRow = ({
    label,
    value,
    display,
    track,
    ...range
}: {
    label: string;
    value: number;
    display: string;
    track?: string;
    min: number;
    max: number;
    step: number;
    onValueChange: (value: number) => void;
}) => (
    <>
        <Slider
            aria-label={label}
            className={cn(
                track &&
                    '[&_[data-slot=slider-range]]:hidden [&_[data-slot=slider-track]]:[background:var(--track)]',
            )}
            max={range.max}
            min={range.min}
            onValueChange={([next = value]) => range.onValueChange(next)}
            step={range.step}
            style={{ '--track': track } as CSSProperties}
            value={[value]}
        />
        <span className="w-12 shrink-0 text-right text-neutral-600 text-xs tabular-nums">
            {display}
        </span>
    </>
);

/** The eleven steps of a ramp, 50 to 950, as one strip; the 500 the ramp is built around is marked. */
const RampStrip = ({ ramp, label }: { ramp: readonly string[]; label: string }) => (
    <div
        aria-label={label}
        className="flex h-6 overflow-hidden rounded-chip ring-1 ring-neutral-950/10 ring-inset"
        role="img"
    >
        {ramp.map((hex, i) => (
            <span
                className={cn('flex-1', i === 5 && 'ring-2 ring-white/80 ring-inset')}
                key={stepNames[i]}
                style={{ background: hex }}
                title={`${stepNames[i]} · ${hex}`}
            />
        ))}
    </div>
);

const Choice = <Value extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: Value;
    options: { value: Value; label: string }[];
    onChange: (value: Value) => void;
}) => (
    <SegmentedControl
        aria-label={label}
        fill
        onValueChange={next => {
            const option = options.find(item => item.value === next);
            if (option) onChange(option.value);
        }}
        value={value}
    >
        {options.map(option => (
            <SegmentedControlItem key={option.value} value={option.value}>
                {option.label}
            </SegmentedControlItem>
        ))}
    </SegmentedControl>
);

/** A hex field that lets a colour be typed out in full before it is taken. */
const HexInput = ({ value, onChange }: { value: string; onChange: (hex?: string) => void }) => {
    const [draft, setDraft] = useState(value);

    // A pick from elsewhere (the well, a preset) replaces whatever was being typed.
    useEffect(() => setDraft(value), [value]);

    return (
        <Input
            aria-label="Accent as hex"
            className="flex-1 font-mono"
            onBlur={() => setDraft(value)}
            onChange={event => {
                const next = event.target.value.trim();
                setDraft(next);
                if (/^#?[0-9a-f]{6}$/i.test(next)) {
                    const hex = (next.startsWith('#') ? next : `#${next}`).toLowerCase();
                    onChange(hex === DEFAULT_ACCENT ? undefined : hex);
                }
            }}
            placeholder={DEFAULT_ACCENT}
            size="sm"
            spellCheck={false}
            value={draft}
        />
    );
};

/** Copies a file's text, and says so for a moment. */
const CopyButton = ({ text, label }: { text: string; label: string }) => {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            return;
        }
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1500);
    };

    return (
        <Button aria-label={`Copy ${label}`} onClick={copy} variant="secondary">
            {copied ? <Check {...icon} /> : <Copy {...icon} />}
            {copied ? 'Copied' : 'Copy'}
        </Button>
    );
};

/** Saves text as a file of that name, through a link the page never shows. */
const save = (name: string, text: string, type: string) => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url));
};

type ExportFile = {
    id: string;
    name: string;
    text: string;
    note: ReactNode;
    /** The media type it downloads as; a snippet without one is only copied. */
    type?: string;
};

/**
 * The theme as a project takes it: the Tailwind entry with its tokens, the brief Claude
 * reads before it designs, and the same theme written in code. Each copies or downloads.
 */
const ExportDialog = ({
    open,
    onOpenChange,
    state,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    state: AppState;
}) => {
    const [tab, setTab] = useState('css');
    const theme = exportTheme(state.theme, state.radius, state.mode);

    const files: ExportFile[] = [
        {
            id: 'css',
            name: 'app.css',
            text: tailwindEntry(theme),
            type: 'text/css',
            note: (
                <>
                    The whole theme in Tailwind's names, as the entry in <C>src/</C>: colours, type,
                    radii, shadows, spacing and widths.
                </>
            ),
        },
        {
            id: 'md',
            name: 'DESIGN.md',
            text: designBrief(theme),
            type: 'text/markdown',
            note: (
                <>
                    For Claude, at the project's root. A line <C>@DESIGN.md</C> in CLAUDE.md has
                    every session start from it.
                </>
            ),
        },
    ];
    const current = files.find(file => file.id === tab) ?? files[0];

    return (
        <Dialog onOpenChange={onOpenChange} open={open}>
            <DialogContent className="w-[min(680px,calc(100vw-32px))]">
                <DialogHeader>
                    <DialogTitle>Use this theme</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <DialogDescription>
                        Save both files in a project and ask Claude to set it up from DESIGN.md: it
                        says where the library comes from, what to install and how to keep the look.
                    </DialogDescription>
                    <Tabs onValueChange={value => setTab(String(value))} value={current?.id}>
                        <div className="flex items-center justify-between gap-3">
                            <TabsList>
                                {files.map(file => (
                                    <TabsTrigger key={file.id} value={file.id}>
                                        {file.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {current && (
                                <div className="flex items-center gap-2">
                                    {current.type && (
                                        <Button
                                            aria-label={`Download ${current.name}`}
                                            onClick={() =>
                                                current.type &&
                                                save(current.name, current.text, current.type)
                                            }
                                            variant="secondary"
                                        >
                                            <Download {...icon} />
                                            Download
                                        </Button>
                                    )}
                                    <CopyButton
                                        key={current.id}
                                        label={current.name}
                                        text={current.text}
                                    />
                                </div>
                            )}
                        </div>
                        {files.map(file => (
                            <TabsContent
                                className="flex flex-col gap-3"
                                key={file.id}
                                value={file.id}
                            >
                                <p className="text-neutral-600 text-xs">{file.note}</p>
                                {/* One height for every tab, so the dialog keeps its place as they switch. */}
                                <pre className="h-[min(360px,45vh)] overflow-auto whitespace-pre-wrap break-words rounded-item border border-neutral-200 bg-neutral-950/[0.03] p-4 font-mono text-neutral-800 text-xxs">
                                    {file.text}
                                </pre>
                            </TabsContent>
                        ))}
                    </Tabs>
                </DialogBody>
                <DialogFooter>
                    <DialogClose render={<Button variant="secondary" />}>Done</DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const fontChoices = [
    { value: 'geist', label: 'Geist' },
    { value: 'inter', label: 'Inter' },
    { value: 'system', label: 'System' },
] as const;

type ThemeSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
};

/**
 * The theme builder, beside the page rather than on one of its own: every change
 * shows on whatever is open behind it. A starting point, the two ramps, then the
 * character of the controls, every row on one grid; the CSS to take away is at the foot.
 */
export const ThemeSheet = ({ open, onOpenChange, state, onChange }: ThemeSheetProps) => {
    const options = state.theme;
    const accent = options.accent ?? DEFAULT_ACCENT;
    const accentRamp = themeAccentRamp(options);
    const matched = matchPreset(options, state.radius);
    const untouched = isDefaultTheme(options) && state.radius === 1;
    const [exporting, setExporting] = useState(false);

    const set = (patch: ThemeOptions) => onChange({ theme: compact({ ...options, ...patch }) });

    const form = 'grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-3 gap-y-2';

    return (
        <>
            <Sheet onOpenChange={onOpenChange} open={open}>
                <SheetContent
                    aria-describedby={undefined}
                    className="w-[min(440px,calc(100vw-32px))]"
                >
                    <SheetHeader icon={<SwatchBook />}>
                        <SheetTitle>Theme</SheetTitle>
                    </SheetHeader>
                    <SheetBody>
                        {/* Off, the page is the system's own baseline; on, it starts from the first preset. */}
                        <SheetSection>
                            <Field className="flex-row items-center justify-between gap-3">
                                <FieldLabel className="cursor-pointer">Preview a theme</FieldLabel>
                                <Switch
                                    checked={isPreviewing(options, state.radius)}
                                    onCheckedChange={checked => {
                                        const first = presets[0];
                                        onChange(
                                            checked && first
                                                ? { theme: first.theme, radius: first.radius }
                                                : { theme: {}, radius: 1 },
                                        );
                                    }}
                                />
                            </Field>
                        </SheetSection>
                        <SheetSection className="flex flex-col gap-3">
                            <p className="font-medium text-neutral-950 text-xs">Start from</p>
                            <div className="grid grid-cols-5 gap-2">
                                {presets.map(preset => {
                                    const selected = matched?.id === preset.id;
                                    return (
                                        <button
                                            aria-pressed={selected}
                                            className={cn(
                                                'flex h-[52px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-item border text-xxs transition-[border-color,background-color] duration-150',
                                                selected
                                                    ? 'border-neutral-950 bg-neutral-950/5 text-neutral-950'
                                                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300',
                                                focusRing,
                                            )}
                                            key={preset.id}
                                            onClick={() =>
                                                onChange({
                                                    theme: preset.theme,
                                                    radius: preset.radius,
                                                })
                                            }
                                            type="button"
                                        >
                                            <span
                                                aria-hidden
                                                className="size-4 rounded-full ring-1 ring-neutral-950/10 ring-inset"
                                                style={{ background: presetSwatch(preset.theme) }}
                                            />
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </SheetSection>

                        <SheetSection className="flex flex-col gap-3">
                            <p className="font-medium text-neutral-950 text-xs">Colour</p>
                            <div className={form}>
                                <Row
                                    hint="The hex becomes the primary ramp's 500; the other ten steps are built around it on the same curve as Tailwind's palette."
                                    label="Accent"
                                >
                                    <label
                                        className={cn(
                                            'relative size-[34px] shrink-0 cursor-pointer overflow-hidden rounded-control ring-1 ring-neutral-950/10 ring-inset',
                                            'has-focus-visible:outline-2 has-focus-visible:outline-focus has-focus-visible:outline-solid has-focus-visible:outline-offset-2',
                                        )}
                                        style={{ background: accent }}
                                    >
                                        <input
                                            aria-label="Pick an accent"
                                            className="absolute inset-0 size-full cursor-pointer opacity-0"
                                            onChange={event =>
                                                set({
                                                    accent:
                                                        event.target.value === DEFAULT_ACCENT
                                                            ? undefined
                                                            : event.target.value,
                                                    // A preset's data colours were picked for its accent.
                                                    charts: undefined,
                                                })
                                            }
                                            type="color"
                                            value={accent}
                                        />
                                    </label>
                                    <HexInput
                                        onChange={hex => set({ accent: hex, charts: undefined })}
                                        value={accent}
                                    />
                                </Row>
                                <div className="col-start-2 pb-2">
                                    <RampStrip label="Accent ramp" ramp={accentRamp} />
                                </div>
                            </div>
                        </SheetSection>

                        <SheetSection className="flex flex-col gap-3">
                            <p className="font-medium text-neutral-950 text-xs">Controls</p>
                            <div className={form}>
                                <Row
                                    hint="Geist and Inter are read from --font-geist and --font-inter; load them yourself."
                                    label="Font"
                                >
                                    <Choice
                                        label="Font"
                                        onChange={font =>
                                            set({
                                                font:
                                                    font === defaultThemeOptions.font
                                                        ? undefined
                                                        : font,
                                            })
                                        }
                                        options={[...fontChoices]}
                                        value={
                                            fontChoices.find(
                                                choice => choice.value === options.font,
                                            )?.value ?? 'geist'
                                        }
                                    />
                                </Row>
                                <Row
                                    hint="What fills the primary button, checked controls and the active rail item."
                                    label="Action"
                                >
                                    <Choice
                                        label="Action colour"
                                        onChange={action =>
                                            set({
                                                action: action === 'neutral' ? undefined : action,
                                            })
                                        }
                                        options={[
                                            { value: 'neutral', label: 'Neutral' },
                                            { value: 'accent', label: 'Accent' },
                                        ]}
                                        value={options.action ?? defaultThemeOptions.action}
                                    />
                                </Row>
                                <Row
                                    hint="Lit adds a top highlight and a ring to the action; glossy a gradient as well."
                                    label="Shine"
                                >
                                    <Choice
                                        label="Action style"
                                        onChange={actionStyle =>
                                            set({
                                                actionStyle:
                                                    actionStyle === 'flat'
                                                        ? undefined
                                                        : actionStyle,
                                            })
                                        }
                                        options={[
                                            { value: 'flat', label: 'Flat' },
                                            { value: 'lit', label: 'Lit' },
                                            { value: 'glossy', label: 'Glossy' },
                                        ]}
                                        value={
                                            options.actionStyle ?? defaultThemeOptions.actionStyle
                                        }
                                    />
                                </Row>
                                <Row
                                    hint="Every radius token times this; round things stay round."
                                    label="Corners"
                                >
                                    <SliderRow
                                        display={`${Math.round(state.radius * 100)}%`}
                                        label="Corner scale"
                                        max={2}
                                        min={0}
                                        onValueChange={radius => onChange({ radius })}
                                        step={0.05}
                                        value={state.radius}
                                    />
                                </Row>
                            </div>
                        </SheetSection>
                    </SheetBody>
                    {/* Pinned under the body and ruled off full width, like a dialog's footer. */}
                    <div className="flex shrink-0 items-center justify-end gap-2 border-neutral-200 border-t p-3">
                        <Button
                            disabled={untouched}
                            onClick={() => onChange({ theme: {}, radius: 1 })}
                            variant="ghost"
                        >
                            Reset
                        </Button>
                        {/* The default theme sets a project up too, so this is never disabled. */}
                        <Button onClick={() => setExporting(true)}>Use this theme</Button>
                    </div>
                </SheetContent>
            </Sheet>

            <ExportDialog onOpenChange={setExporting} open={exporting} state={state} />
        </>
    );
};
