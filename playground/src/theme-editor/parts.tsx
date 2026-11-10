import {
    BlockSlider,
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
    InfoTip,
    Input,
    SegmentedControl,
    SegmentedControlItem,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    type ThemeFontId,
    type ThemeMode,
    type ThemeOptions,
    themeFontFamilies,
} from 'continuum';
import { Check, Copy, Download } from 'lucide-react';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { C } from '../article';
import { designBrief, exportTheme, tailwindEntry } from '../theme-export';

const icon = { strokeWidth: 2 } as const;

const DEFAULT_ACCENT = '#3939e5';

const stepNames = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

/** A row of the builder's form: its name in the label column, the control beside it. */
export const Row = ({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
}) => (
    <>
        <div className="flex h-8.5 items-center gap-1.5 text-neutral-600 text-xs">
            {label}
            {hint && <InfoTip content={hint} label={`About ${label.toLowerCase()}`} />}
        </div>
        <div className="flex min-w-0 items-center gap-3">{children}</div>
    </>
);

/**
 * The hue wheel at one lightness and chroma, left to right from 0° to 360°: clean enough to read as
 * the wheel on either surface, since it runs as a band beside the label rather than under it.
 */
export const hueBand = `linear-gradient(90deg in oklab, ${Array.from(
    { length: 13 },
    (_, i) => `oklch(0.72 0.15 ${i * 30})`,
).join(', ')})`;

/** A hue as the band draws it, for the knob that sits on the band at that hue. */
export const hueKnob = (hue: number) => `oklch(0.72 0.15 ${hue})`;

/**
 * A setting as a block slider, 48px, full width: its name inside on the left, its value on the right.
 * It stands on its own in a stack, never in a Row, which would name it twice.
 *
 * A track (a gradient) shows what the value picks, a hue for instance: it runs as a 4px band along
 * the foot of the box, from the label's edge to the value's, with a knob on it at the value, always
 * shown. The label and the value move up to make room, and stay on the plain surface, so the band can
 * be drawn at full strength and the text still reads. The knob is filled with `knob` (the band's colour
 * at the value) inside a ring of the surface, the way the ramp graph draws its points.
 */
export const SliderRow = ({
    label,
    value,
    display,
    track,
    knob,
    ...range
}: {
    label: string;
    value: number;
    display: string;
    track?: string;
    /** The knob's fill on a track; the surface unless given. */
    knob?: string;
    min: number;
    max: number;
    step: number;
    onValueChange: (value: number) => void;
}) => {
    const slider = (
        <BlockSlider
            className={cn(
                track && [
                    // No grey fill and no hover grip: the band and its knob say where the value is.
                    '**:data-[slot=block-slider-range]:bg-transparent **:data-[slot=block-slider-thumb]:after:hidden',
                    // A 20px grip, so its centre at either end lands on the band's end, level with the text.
                    '**:data-[slot=block-slider-thumb]:w-5',
                    // The label and the value sit in the upper part of the box, over the band.
                    '**:data-[slot=block-slider-info]:pb-3.5',
                ],
            )}
            format={() => display}
            label={label}
            max={range.max}
            min={range.min}
            onValueChange={([next = value]) => range.onValueChange(next)}
            size="lg"
            step={range.step}
            // Inset by half the grip, so the ends of the range are the ends of the band, not the box's edges.
            {...(track ? { thumbAlignment: 'edge' as const } : {})}
            value={[value]}
        />
    );
    if (!track) return slider;

    const at = Math.min(1, Math.max(0, (value - range.min) / (range.max - range.min)));
    // The band runs between the grip's centres at either end: the box's 1px border, its 2px padding,
    // then half the 20px grip.
    const inset = 'calc(1px + var(--spacing) * 3)';

    return (
        <div className="relative" data-slot="slider-row">
            {slider}
            <span
                aria-hidden
                className="pointer-events-none absolute bottom-3 h-1 rounded-full"
                style={{ left: inset, right: inset, background: track }}
            />
            <span
                aria-hidden
                className="pointer-events-none absolute bottom-2 size-3 -translate-x-1/2 rounded-full border-2 border-neutral-50 shadow-float ring-1 ring-neutral-950/15"
                style={
                    {
                        left: `calc(${inset} + (100% - 2 * ${inset}) * ${at})`,
                        background: knob ?? 'var(--color-neutral-50)',
                    } as CSSProperties
                }
            />
        </div>
    );
};

/** Sliders stacked, 8px apart, as one group of settings. */
export const SliderStack = ({ children }: { children: ReactNode }) => (
    <div className="flex flex-col gap-2">{children}</div>
);

/** The eleven steps of a ramp, 50 to 950, as one strip; the 500 the ramp is built around is marked. */
export const RampStrip = ({ ramp, label }: { ramp: readonly string[]; label: string }) => (
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

export const Choice = <Value extends string>({
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
export const HexInput = ({
    value,
    onChange,
}: {
    value: string;
    onChange: (hex?: string) => void;
}) => {
    const [draft, setDraft] = useState(value);

    // A pick from elsewhere (the well, a preset) replaces whatever was being typed.
    useEffect(() => setDraft(value), [value]);

    return (
        <Input
            aria-label="Primary as hex"
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
export const ExportDialog = ({
    open,
    onOpenChange,
    options,
    label,
    mode,
    unsaved = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The project's theme as it is edited, which is what the preview shows. */
    options: ThemeOptions;
    /** The project's name, which the brief calls the theme by. */
    label: string;
    mode: ThemeMode;
    /** The theme has changes not saved yet; the files carry them. */
    unsaved?: boolean;
}) => {
    const [tab, setTab] = useState('css');
    const theme = exportTheme(options, label, mode);

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
                    <DialogTitle>Export the theme</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <DialogDescription>
                        Save both files in a project and ask Claude to set it up from DESIGN.md: it
                        says where the library comes from, what to install and how to keep the look.
                        {unsaved && ' Unsaved changes are included; save to keep them.'}
                    </DialogDescription>
                    <Tabs onValueChange={value => setTab(String(value))} value={current?.id}>
                        <div className="flex items-center justify-between gap-3">
                            <TabsList variant="pill">
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
                                <pre className="wrap-break-word h-[min(360px,45vh)] overflow-auto whitespace-pre-wrap rounded-item border border-neutral-200 bg-neutral-950/3 p-4 font-mono text-neutral-800 text-xxs">
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

/** The named fonts, each shown in its own face in the picker. */
export const fontChoices = Object.entries(themeFontFamilies).map(([value, font]) => ({
    value: value as ThemeFontId,
    family: font.family,
}));
