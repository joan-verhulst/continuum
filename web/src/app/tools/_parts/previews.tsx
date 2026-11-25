import {
    Badge,
    cn,
    defaultAccent,
    defaultNeutral,
    hexToOklch,
    type Oklch,
    oklchToHex,
    simulateVision,
    wcagContrast,
} from '@contui/ui';
import type { ReactNode } from 'react';
import type { ToolSlug } from './catalogue';
import { RampStrip } from './ramp';
import { ThemeFigure } from './theme-figure';

/*
 * A small look at each tool for the index (/tools): the theme builder's own preview of a product
 * page, and still figures worked out from the default theme with the same maths the tools use (the
 * ramps, WCAG's ratio, the colour-vision simulation). Drawn on the server, but the theme builder's.
 */

const oklch = (hex: string): Oklch => hexToOklch(hex) ?? { l: 0.5, c: 0, h: 0 };

/** The default theme's chart colours, series 1 to 4, as its tokens write them. */
const chartColours = [defaultAccent[5], '#eb6834', '#1baf7a', '#d4a800'] as const;

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-3">
        <span className="text-neutral-600 text-xs">{label}</span>
        {children}
    </div>
);

/** The colour builder's three parts: the primary ramp, the greys, the chart colours. */
const ColourFigure = () => (
    <div className="flex w-full max-w-[720px] flex-col gap-8">
        <Row label="Primary · #3939e5 at 500">
            <RampStrip colours={defaultAccent} seed={5} />
        </Row>
        <Row label="Neutral">
            <RampStrip colours={defaultNeutral} />
        </Row>
        <Row label="Charts">
            <div className="grid grid-cols-4 gap-1.5">
                {chartColours.map(colour => (
                    <span
                        className="block h-10 rounded-item border border-neutral-950/5"
                        key={colour}
                        style={{ background: colour }}
                    />
                ))}
            </div>
        </Row>
    </div>
);

/** Pairs from the default theme, each with its WCAG ratio and the levels it reaches. */
const pairs = [
    { text: defaultNeutral[10], background: defaultNeutral[0], label: 'Body text' },
    { text: defaultNeutral[6], background: defaultNeutral[0], label: 'Secondary text' },
    { text: defaultNeutral[0], background: defaultAccent[5], label: 'On the primary' },
    { text: defaultNeutral[3], background: defaultNeutral[0], label: 'Too faint' },
] as const;

const ContrastFigure = () => (
    <ul className="grid w-full max-w-[880px] gap-3 sm:grid-cols-2">
        {pairs.map(pair => {
            const ratio = wcagContrast(oklch(pair.text), oklch(pair.background));
            const aa = ratio >= 4.5;
            const aaa = ratio >= 7;
            return (
                <li
                    className="flex min-w-0 items-center gap-4 rounded-card border border-neutral-200 bg-neutral-50 p-3"
                    key={pair.label}
                >
                    <span
                        aria-hidden
                        className="flex size-14 shrink-0 items-center justify-center rounded-item border border-neutral-950/5 font-medium text-xl"
                        style={{ background: pair.background, color: pair.text }}
                    >
                        Aa
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-neutral-600 text-xs">{pair.label}</span>
                        <span className="font-medium text-lg text-neutral-950 tabular-nums">
                            {ratio.toFixed(2)}:1
                        </span>
                    </span>
                    <span className="flex shrink-0 gap-1">
                        <Badge tone={aa ? 'success' : 'error'}>AA</Badge>
                        <Badge tone={aaa ? 'success' : 'error'}>AAA</Badge>
                    </span>
                </li>
            );
        })}
    </ul>
);

const visions = [
    { id: 'normal', label: 'Normal' },
    { id: 'protan', label: 'Protanopia' },
    { id: 'deutan', label: 'Deuteranopia' },
    { id: 'tritan', label: 'Tritanopia' },
] as const;

/** The default chart colours as four kinds of colour vision see them, plus greyscale. */
const VisionFigure = () => (
    <div className="grid w-full max-w-[880px] grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-5">
        {[...visions, { id: 'achromat', label: 'Achromatopsia' } as const].map(vision => (
            <Row key={vision.id} label={vision.label}>
                <div className="grid grid-cols-4 gap-1 sm:grid-cols-2">
                    {chartColours.map(colour => {
                        const seen =
                            vision.id === 'achromat'
                                ? { ...oklch(colour), c: 0 }
                                : simulateVision(oklch(colour), vision.id);
                        return (
                            <span
                                className="block h-10 rounded-item border border-neutral-950/5"
                                key={colour}
                                style={{ background: oklchToHex(seen) }}
                            />
                        );
                    })}
                </div>
            </Row>
        ))}
    </div>
);

const figures: Record<ToolSlug, () => ReactNode> = {
    'theme-builder': () => <ThemeFigure />,
    'color-builder': () => <ColourFigure />,
    'contrast-checker': () => <ContrastFigure />,
    'color-blindness-simulator': () => <VisionFigure />,
};

/** A tool's look for the index, in a framed panel: the theme builder's preview fills its frame. */
export const ToolPreview = ({ slug }: { slug: ToolSlug }) => (
    <div
        className={cn(
            'flex min-w-0 overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50',
            slug === 'theme-builder'
                ? 'h-[640px]'
                : 'min-h-[360px] items-center justify-center px-6 py-12 sm:px-10',
        )}
    >
        {figures[slug]()}
    </div>
);
