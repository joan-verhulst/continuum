import { AppWindow, Blocks, Grid3x3, Moon, Palette, Shapes, Sun } from 'lucide-react';
import {
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
    themes,
} from 'continuum';
import type { ReactNode } from 'react';
import { type AppState, themeMeta, type View, views } from './meta';

const icon = { strokeWidth: 1.5 } as const;

const viewTabs: Record<View, { label: string; icon: ReactNode }> = {
    foundations: { label: 'Foundations', icon: <Palette {...icon} /> },
    components: { label: 'Components', icon: <Blocks {...icon} /> },
    screens: { label: 'Screens', icon: <AppWindow {...icon} /> },
    raster: { label: 'Raster', icon: <Grid3x3 {...icon} /> },
};

type ShellProps = {
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
    children: ReactNode;
};

/** Top bar on the canvas, the current view on an inset panel below it. */
export const Shell = ({ state, onChange, children }: ShellProps) => (
    <>
        <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 bg-neutral-100 px-4 py-3 lg:grid lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-item bg-action text-on-action shadow-action [background-image:var(--pds-action-gradient)]">
                    <Shapes className="size-4" {...icon} />
                </span>
                <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-neutral-950 text-sm">
                        Continuum
                    </span>
                    <span className="truncate text-neutral-600 text-xxs">
                        Six products, one set of components
                    </span>
                </div>
            </div>

            {/* The library's tab group: the pill tabs' tint would vanish on this canvas in Eyes. */}
            <nav
                aria-label="Section"
                className="order-last w-full overflow-x-auto lg:order-none lg:w-auto"
            >
                <SegmentedControl
                    onValueChange={value => {
                        const view = views.find(name => name === value);
                        if (view) onChange({ view });
                    }}
                    value={state.view}
                >
                    {views.map(view => (
                        <SegmentedControlItem key={view} value={view}>
                            {viewTabs[view].icon}
                            {viewTabs[view].label}
                        </SegmentedControlItem>
                    ))}
                </SegmentedControl>
            </nav>

            <div className="flex items-center gap-4 lg:justify-self-end">
                <Select
                    onValueChange={value => {
                        const theme = themes.find(name => name === value);
                        if (theme) onChange({ theme, mode: themeMeta[theme].mode });
                    }}
                    value={state.theme}
                >
                    <SelectTrigger aria-label="Theme" className="w-40" size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end" className="w-72">
                        {themes.map(theme => (
                            <SelectItem key={theme} value={theme}>
                                <span className="text-neutral-950">{themeMeta[theme].name}</span>{' '}
                                <span className="font-normal text-neutral-500">
                                    {themeMeta[theme].year}
                                </span>
                                {/* The trigger shows the item text too; the product only fits the list. */}
                                <span className="in-data-[slot=select-trigger]:hidden font-normal text-neutral-500">
                                    {' '}
                                    · {themeMeta[theme].product}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-neutral-600">
                    <Sun aria-hidden className="size-4" {...icon} />
                    <Switch
                        aria-label="Dark mode"
                        checked={state.mode === 'dark'}
                        onCheckedChange={checked => onChange({ mode: checked ? 'dark' : 'light' })}
                    />
                    <Moon aria-hidden className="size-4" {...icon} />
                </div>
            </div>
        </header>

        <main className="mx-2 mb-2 rounded-panel border border-neutral-200 bg-neutral-50 sm:mx-3 sm:mb-3">
            {children}
        </main>
    </>
);
