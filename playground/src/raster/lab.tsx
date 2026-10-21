import {
    Button,
    Card,
    Field,
    FieldLabel,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Slider,
    Switch,
    Theme,
    type ThemeMode,
    type ThemeName,
    themes,
    useTheme,
} from 'continuum';
import { ExternalLink, Grid3x3, Ruler, SlidersHorizontal, X } from 'lucide-react';
import { type ComponentType, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { PageHeader } from '../layout';
import { themeMeta } from '../meta';
import { AnalyticsOverview } from '../screens/analytics-overview';
import { InvoiceEditor } from '../screens/invoice-editor';
import { SequenceEditor } from '../screens/sequence-editor';
import { AnalyticsRaster } from './analytics-raster';
import { computeRaster, containerFor, navColumnsFor } from './engine';
import { InvoiceRaster } from './invoice-raster';
import { type Density, SequenceRaster } from './sequence-raster';

const VIEWPORT_HEIGHT = 1080;

type RasterScreenProps = {
    params: { line: number; minColumn: number };
    containerMax: number;
    height: number;
    density: Density;
    overlay: boolean;
};

const labScreens = {
    sequence: {
        label: 'Email sequencing',
        Raster: SequenceRaster,
        Original: SequenceEditor,
    },
    invoice: {
        label: 'Invoice editor',
        Raster: InvoiceRaster,
        Original: InvoiceEditor,
    },
    analytics: {
        label: 'Analytics',
        Raster: AnalyticsRaster,
        Original: AnalyticsOverview,
    },
} satisfies Record<
    string,
    {
        label: string;
        Raster: ComponentType<RasterScreenProps>;
        Original: ComponentType;
    }
>;

type ScreenId = keyof typeof labScreens;

const screenIds = Object.keys(labScreens) as ScreenId[];

/** The screen on the raster, or the original for comparison. */
const versions = ['raster', 'original'] as const;

type Version = (typeof versions)[number];

type LabSettings = {
    screen: ScreenId;
    version: Version;
    density: Density;
    line: number;
    containerMax: number;
    minColumn: number;
    overlay: boolean;
};

const defaults: LabSettings = {
    screen: 'sequence',
    version: 'raster',
    density: 'figma',
    line: 16,
    containerMax: 1280,
    minColumn: 64,
    overlay: true,
};

/** The settings, the theme and the mode as a query string for the standalone tab. */
const toSearch = (settings: LabSettings, theme: ThemeName, mode: ThemeMode) =>
    `?${new URLSearchParams({
        raster: settings.screen,
        version: settings.version,
        density: settings.density,
        line: String(settings.line),
        container: String(settings.containerMax),
        column: String(settings.minColumn),
        grid: settings.overlay ? '1' : '0',
        theme,
        mode,
    })}`;

const fromSearch = (search: string) => {
    const params = new URLSearchParams(search);
    const number = (key: string, fallback: number) => Number(params.get(key)) || fallback;
    const theme = themes.find(name => name === params.get('theme')) ?? 'eyes';
    const mode: ThemeMode = params.get('mode') === 'dark' ? 'dark' : 'light';

    const settings: LabSettings = {
        screen: screenIds.find(id => id === params.get('raster')) ?? defaults.screen,
        version: versions.find(version => version === params.get('version')) ?? 'raster',
        density: params.get('density') === 'lots' ? 'lots' : 'figma',
        line: number('line', defaults.line),
        containerMax: number('container', defaults.containerMax),
        minColumn: number('column', defaults.minColumn),
        overlay: params.get('grid') !== '0',
    };

    return { settings, theme, mode };
};

/** True when the page was opened as the standalone screen. */
export const isRasterStandalone = () => new URLSearchParams(window.location.search).has('raster');

const Range = ({
    label,
    value,
    min,
    max,
    step = 1,
    format,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    format: (value: number) => string;
    onChange: (value: number) => void;
}) => (
    <Field className="min-w-48 flex-1">
        <div className="flex justify-between gap-4">
            <FieldLabel>{label}</FieldLabel>
            <span className="text-neutral-600 text-xs tabular-nums">{format(value)}</span>
        </div>
        <Slider
            aria-label={label}
            max={max}
            min={min}
            onValueChange={([next]) => {
                if (next !== undefined) onChange(next);
            }}
            step={step}
            value={[value]}
        />
    </Field>
);

const Choice = <Value extends string>({
    label,
    value,
    options,
    onChange,
    disabled,
    fill,
}: {
    label: string;
    value: Value;
    options: { value: Value; label: ReactNode }[];
    onChange: (value: Value) => void;
    disabled?: boolean;
    fill?: boolean;
}) => {
    // A segmented control is a group, not a labelable element, so it points at its label.
    const labelId = useId();

    return (
        <Field disabled={disabled}>
            <FieldLabel id={labelId}>{label}</FieldLabel>
            <SegmentedControl
                aria-labelledby={labelId}
                disabled={disabled}
                fill={fill}
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
        </Field>
    );
};

/** The lab's settings; the same set in the playground and in the standalone tab. */
const LabControls = ({
    settings,
    onChange,
    panel,
}: {
    settings: LabSettings;
    onChange: (patch: Partial<LabSettings>) => void;
    /** Stacked in a narrow panel: controls take its full width, the screen is a select. */
    panel?: boolean;
}) => {
    const original = settings.version === 'original';

    return (
        <>
            {panel ? (
                <Field>
                    <FieldLabel>Screen</FieldLabel>
                    <Select
                        onValueChange={value => {
                            const screen = screenIds.find(id => id === value);
                            if (screen) onChange({ screen });
                        }}
                        value={settings.screen}
                    >
                        <SelectTrigger size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {screenIds.map(id => (
                                <SelectItem key={id} value={id}>
                                    {labScreens[id].label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            ) : (
                <Choice
                    label="Screen"
                    onChange={screen => onChange({ screen })}
                    options={screenIds.map(value => ({ value, label: labScreens[value].label }))}
                    value={settings.screen}
                />
            )}
            <Choice
                fill={panel}
                label="Version"
                onChange={version => onChange({ version })}
                options={[
                    {
                        value: 'raster',
                        label: (
                            <>
                                <Grid3x3 strokeWidth={1.5} />
                                Raster
                            </>
                        ),
                    },
                    { value: 'original', label: 'Original' },
                ]}
                value={settings.version}
            />
            <Choice
                disabled={original}
                fill={panel}
                label="Content"
                onChange={density => onChange({ density })}
                options={[
                    { value: 'figma', label: 'As drawn' },
                    { value: 'lots', label: 'Lots' },
                ]}
                value={settings.density}
            />
            <Choice
                disabled={original}
                fill={panel}
                label="Line"
                onChange={value => onChange({ line: Number(value) })}
                options={[
                    { value: '16', label: '13 / 16' },
                    { value: '20', label: '13 / 20' },
                ]}
                value={String(settings.line)}
            />
            <Choice
                disabled={original}
                fill={panel}
                label="Container"
                onChange={value => onChange({ containerMax: Number(value) })}
                options={[
                    { value: '1024', label: '1024' },
                    { value: '1280', label: '1280' },
                    { value: '1440', label: '1440' },
                ]}
                value={String(settings.containerMax)}
            />
            <Field disabled={original}>
                <FieldLabel>Grid</FieldLabel>
                {/* As tall as a segmented control, so the row's controls share a centre line. */}
                <div className="flex h-[34px] items-center">
                    <Switch
                        checked={settings.overlay}
                        onCheckedChange={overlay => onChange({ overlay })}
                    />
                </div>
            </Field>
            <Range
                format={value => `${value}px`}
                label="Narrowest column"
                max={120}
                min={32}
                onChange={minColumn => onChange({ minColumn })}
                value={settings.minColumn}
            />
        </>
    );
};

/** Describes both grids in words, as a check on what the overlay shows. */
const describe = (viewport: number, settings: LabSettings) => {
    const params = { line: settings.line, minColumn: settings.minColumn };
    const outer = computeRaster(viewport, params);
    const nav = navColumnsFor(outer.columns);
    const available =
        (outer.columns - nav) * outer.column + (outer.columns - nav - 1) * outer.gutter;
    const navWidth = nav * outer.column + (nav - 1) * outer.gutter + outer.margin;
    const container = containerFor(available, settings.containerMax);
    const inner = computeRaster(container, params);

    return `Viewport ${Math.round(viewport)}: ${outer.columns} columns, navigation ${nav} of them (${Math.round(navWidth)}px). Container ${Math.round(container)}${container < 768 ? ' (fluid)' : ''}: ${inner.columns} columns of ${inner.column.toFixed(1)}px. ${settings.line}px line, ${outer.gutter}px gutters, 4px baselines.`;
};

const LabScreen = ({ settings, height }: { settings: LabSettings; height: number }) => {
    const { Raster, Original } = labScreens[settings.screen];

    if (settings.version === 'original') {
        return (
            <div className="h-full">
                <Original />
            </div>
        );
    }

    return (
        <Raster
            containerMax={settings.containerMax}
            density={settings.density}
            height={height}
            overlay={settings.overlay}
            params={{ line: settings.line, minColumn: settings.minColumn }}
        />
    );
};

/**
 * An experiment: screens laid out on a Swiss raster instead of panels and
 * borders, shown at full viewport size and scaled to fit, beside the original.
 */
export const RasterLab = () => {
    const { theme, mode } = useTheme();
    const stageRef = useRef<HTMLDivElement>(null);
    const [available, setAvailable] = useState(1280);
    const [viewport, setViewport] = useState(1920);
    const [settings, setSettings] = useState(defaults);
    const update = (patch: Partial<LabSettings>) =>
        setSettings(current => ({ ...current, ...patch }));

    useEffect(() => {
        const element = stageRef.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => {
            if (entry) setAvailable(Math.floor(entry.contentRect.width));
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    // The whole viewport, scaled down to the stage like zoom to fit.
    const scale = Math.min(1, available / viewport);

    return (
        <>
            <PageHeader
                description="Screens on a raster after Müller-Brockmann, made dynamic after Gerstner. The text line is the unit: gutters, margins and gaps are whole lines and every baseline sits on a 4px grid. Grids sit in grids: the viewport's columns size the navigation, and beside it a container steps from 1440 to 768 with columns of its own. Panels and borders give way to columns and space; colour only marks state and data."
                eyebrow="Experiment"
                title="Raster"
            />

            <div className="flex flex-col gap-6 p-4 lg:p-6">
                <Card className="flex-row flex-wrap items-end gap-x-8 gap-y-4">
                    <LabControls onChange={update} settings={settings} />
                    <Range
                        format={value => `${value}px`}
                        label="Viewport"
                        max={2560}
                        min={640}
                        onChange={setViewport}
                        step={8}
                        value={viewport}
                    />
                </Card>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <p className="flex items-start gap-2 text-neutral-600 text-xs tabular-nums">
                        {settings.version !== 'original' && (
                            <>
                                <Ruler className="size-4 shrink-0" strokeWidth={1.5} />
                                {describe(viewport, settings)}
                            </>
                        )}
                    </p>
                    <Button asChild variant="secondary">
                        <a href={toSearch(settings, theme, mode)} rel="noopener" target="_blank">
                            Open in new tab
                            <ExternalLink strokeWidth={1.5} />
                        </a>
                    </Button>
                </div>

                <div ref={stageRef} style={{ height: VIEWPORT_HEIGHT * scale }}>
                    <Theme
                        className="origin-top-left overflow-auto bg-neutral-50 outline outline-neutral-200"
                        mode={mode}
                        style={{
                            width: viewport,
                            height: VIEWPORT_HEIGHT,
                            transform: `scale(${scale})`,
                        }}
                        theme={theme}
                    >
                        <LabScreen height={VIEWPORT_HEIGHT} settings={settings} />
                    </Theme>
                </div>
            </div>
        </>
    );
};

const useWindowSize = () => {
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return size;
};

/**
 * The screen alone at the window's own size, opened from the lab in a new tab.
 * Settings sit in a panel that folds away, and live in the address so a reload
 * or a shared link opens the same thing.
 */
export const RasterStandalone = () => {
    const [initial] = useState(() => fromSearch(window.location.search));
    const [settings, setSettings] = useState(initial.settings);
    const [theme, setTheme] = useState(initial.theme);
    const [mode, setMode] = useState(initial.mode);
    const [open, setOpen] = useState(false);
    const size = useWindowSize();
    const update = (patch: Partial<LabSettings>) =>
        setSettings(current => ({ ...current, ...patch }));

    useEffect(() => {
        window.history.replaceState(null, '', toSearch(settings, theme, mode));
        document.title = `${labScreens[settings.screen].label} · Raster`;
    }, [settings, theme, mode]);

    return (
        <Theme className="h-screen overflow-auto bg-neutral-50" mode={mode} theme={theme}>
            <LabScreen height={size.height} settings={settings} />

            {/* Lab chrome, not part of the screen: it floats above it and folds away */}
            <div className="fixed top-3 right-3 z-50 flex flex-col items-end gap-2">
                <Button
                    aria-expanded={open}
                    onClick={() => setOpen(current => !current)}
                    size="icon"
                    variant="secondary"
                    className="bg-neutral-50"
                >
                    {open ? <X strokeWidth={1.5} /> : <SlidersHorizontal strokeWidth={1.5} />}
                    <span className="sr-only">{open ? 'Hide settings' : 'Show settings'}</span>
                </Button>
                {open && (
                    <Card className="max-h-[calc(100vh-72px)] w-80 overflow-y-auto overflow-x-hidden shadow-sheet">
                        <LabControls onChange={update} panel settings={settings} />
                        <Field>
                            <FieldLabel>Theme</FieldLabel>
                            <Select
                                onValueChange={value => {
                                    const next = themes.find(name => name === value);
                                    if (next) setTheme(next);
                                }}
                                value={theme}
                            >
                                <SelectTrigger size="sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {themes.map(name => (
                                        <SelectItem key={name} value={name}>
                                            {themeMeta[name].name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field className="flex-row items-center justify-between">
                            <FieldLabel>Dark mode</FieldLabel>
                            <Switch
                                checked={mode === 'dark'}
                                onCheckedChange={dark => setMode(dark ? 'dark' : 'light')}
                            />
                        </Field>
                        {settings.version !== 'original' && (
                            <p className="text-neutral-600 text-xs tabular-nums">
                                {describe(size.width, settings)}
                            </p>
                        )}
                    </Card>
                )}
            </div>
        </Theme>
    );
};
