import { Grid3x3, Ruler } from 'lucide-react';
import {
    SegmentedControl,
    SegmentedControlItem,
    Switch,
    Theme,
    useTheme,
} from 'continuum';
import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../layout';
import { SequenceEditor } from '../screens/sequence-editor';
import { computeRaster } from './engine';
import { SequenceRaster } from './sequence-raster';

const FRAME_HEIGHT = 860;

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
    <label className="flex min-w-48 flex-1 flex-col gap-2 text-xs">
        <span className="flex justify-between gap-4">
            <span className="text-neutral-600">{label}</span>
            <span className="text-neutral-950 tabular-nums">{format(value)}</span>
        </span>
        <input
            className="w-full accent-[var(--pds-action)]"
            max={max}
            min={min}
            onChange={event => onChange(Number(event.target.value))}
            step={step}
            type="range"
            value={value}
        />
    </label>
);

/**
 * An experiment: the email sequence editor laid out on a Swiss raster instead of
 * panels and borders, beside the original for comparison.
 */
export const RasterLab = () => {
    const { theme, mode } = useTheme();
    const stageRef = useRef<HTMLDivElement>(null);
    const [available, setAvailable] = useState(1280);
    const [width, setWidth] = useState(1280);
    const [version, setVersion] = useState<'raster' | 'original'>('raster');
    const [overlay, setOverlay] = useState(true);
    const [line, setLine] = useState(16);
    const [minColumn, setMinColumn] = useState(64);

    useEffect(() => {
        const element = stageRef.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => {
            if (entry) setAvailable(Math.floor(entry.contentRect.width));
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const raster = computeRaster(width, { line, minColumn });

    return (
        <>
            <PageHeader
                description="The email sequence editor on a raster after Müller-Brockmann, made dynamic after Gerstner. The text line is the unit: gutters, margins and gaps are whole lines and every baseline sits on a 4px grid. The column count follows the space, from 4 to 8 to 12 to 24, and the page drops panels and borders for columns and space."
                eyebrow="Experiment"
                title="Raster"
            />

            <div className="flex flex-col gap-6 p-4 lg:p-6">
                <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
                    <SegmentedControl
                        aria-label="Version"
                        onValueChange={value =>
                            setVersion(value === 'original' ? 'original' : 'raster')
                        }
                        value={version}
                    >
                        <SegmentedControlItem value="raster">
                            <Grid3x3 strokeWidth={1.5} />
                            Raster
                        </SegmentedControlItem>
                        <SegmentedControlItem value="original">Original</SegmentedControlItem>
                    </SegmentedControl>

                    <SegmentedControl
                        aria-label="Line"
                        disabled={version === 'original'}
                        onValueChange={value => setLine(Number(value))}
                        value={String(line)}
                    >
                        <SegmentedControlItem value="16">13 / 16</SegmentedControlItem>
                        <SegmentedControlItem value="20">13 / 20</SegmentedControlItem>
                    </SegmentedControl>

                    <div className="flex items-center gap-2 text-neutral-600 text-xs">
                        <Switch
                            aria-label="Grid overlay"
                            checked={overlay}
                            disabled={version === 'original'}
                            onCheckedChange={setOverlay}
                        />
                        Grid
                    </div>

                    <Range
                        format={value => `${value}px`}
                        label="Frame width"
                        max={Math.max(available, 720)}
                        min={560}
                        onChange={setWidth}
                        value={Math.min(width, Math.max(available, 720))}
                    />
                    <Range
                        format={value => `${value}px`}
                        label="Narrowest column"
                        max={120}
                        min={32}
                        onChange={setMinColumn}
                        value={minColumn}
                    />
                </div>

                {version === 'raster' && (
                    <p className="flex items-center gap-2 text-neutral-600 text-xs tabular-nums">
                        <Ruler className="size-4" strokeWidth={1.5} />
                        {raster.columns} columns of {raster.column.toFixed(1)}px, {raster.gutter}px
                        gutters and margins, a {line}px line on a {raster.quantum}px baseline grid
                    </p>
                )}

                <div className="overflow-x-auto" ref={stageRef}>
                    <Theme
                        className="overflow-auto rounded-panel border border-neutral-200 bg-neutral-50"
                        mode={mode}
                        style={{
                            width: Math.min(width, Math.max(available, 720)),
                            height: FRAME_HEIGHT,
                        }}
                        theme={theme}
                    >
                        {version === 'raster' ? (
                            <SequenceRaster line={line} minColumn={minColumn} overlay={overlay} />
                        ) : (
                            <div className="h-full">
                                <SequenceEditor />
                            </div>
                        )}
                    </Theme>
                </div>
            </div>
        </>
    );
};
