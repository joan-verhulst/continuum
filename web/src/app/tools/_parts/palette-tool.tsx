'use client';

import {
    formatOklch,
    type Gamut,
    Input,
    type Oklch,
    oklchToHex,
    type RampStep,
    rampSteps,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    themeAccentCurves,
    toCss,
} from 'continuum';
import { useMemo, useState } from 'react';
import { CodeBlock } from '@/components/code-block';
import { useShareAccent } from './builder-link';
import { ColourInput, Control, ToolPanel } from './controls';
import { RampStrip } from './ramp';

/*
 * One colour to a scale of eleven, by the same maths the theme builder makes its primary with
 * (themeAccentCurves): Tailwind's curves for the nearest hues, the colour held at the step picked.
 * The palette page writes hex by default and keeps to sRGB; the oklch page writes oklch and shows
 * the channels, in P3 or sRGB.
 */

type Format = 'hex' | 'oklch';

/** A name as a CSS custom property takes it: lower case, words joined by hyphens. */
const cssName = (text: string) =>
    text
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'brand';

const round = (value: number, digits: number) => Number(value.toFixed(digits));

export const PaletteTool = ({ oklch = false }: { oklch?: boolean }) => {
    const [hex, setHex] = useState('#e5932b');
    useShareAccent(hex);
    const [name, setName] = useState('brand');
    const [step, setStep] = useState<RampStep>('500');
    const [format, setFormat] = useState<Format>(oklch ? 'oklch' : 'hex');
    const [gamut, setGamut] = useState<Gamut>(oklch ? 'p3' : 'srgb');
    // Hex is sRGB by definition; the gamut only matters while the scale is written in oklch.
    const shownGamut: Gamut = format === 'hex' ? 'srgb' : gamut;

    const ramp = useMemo<Oklch[]>(
        () =>
            themeAccentCurves({ accent: hex, accentStep: step, gamut: shownGamut }) ??
            Array.from({ length: 11 }, () => ({ l: 0.5, c: 0, h: 0 })),
        [hex, step, shownGamut],
    );
    const values = ramp.map(colour =>
        format === 'hex' ? oklchToHex(colour) : formatOklch(colour),
    );
    const property = cssName(name);
    const css = `@theme {\n${values
        .map((value, i) => `    --color-${property}-${rampSteps[i]}: ${value};`)
        .join('\n')}\n}`;

    return (
        <ToolPanel
            controls={
                <>
                    <ColourInput label="Colour" onChange={setHex} value={hex} />
                    <Control label="Name">
                        <Input
                            className="w-32"
                            onChange={event => setName(event.target.value)}
                            size="sm"
                            spellCheck={false}
                            value={name}
                        />
                    </Control>
                    <Control label="Your colour is the">
                        <Select onValueChange={setStep} value={step}>
                            <SelectTrigger className="w-24" size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {rampSteps.map(item => (
                                    <SelectItem key={item} value={item}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Control>
                    {oklch ? (
                        <Control label="Gamut">
                            <SegmentedControl
                                onValueChange={value => setGamut(value as Gamut)}
                                value={gamut}
                            >
                                <SegmentedControlItem value="p3">Display P3</SegmentedControlItem>
                                <SegmentedControlItem value="srgb">sRGB</SegmentedControlItem>
                            </SegmentedControl>
                        </Control>
                    ) : (
                        <Control label="Format">
                            <SegmentedControl
                                onValueChange={value => setFormat(value as Format)}
                                value={format}
                            >
                                <SegmentedControlItem value="hex">Hex</SegmentedControlItem>
                                <SegmentedControlItem value="oklch">OKLCH</SegmentedControlItem>
                            </SegmentedControl>
                        </Control>
                    )}
                </>
            }
        >
            <RampStrip
                colours={ramp.map(colour => toCss(colour, shownGamut))}
                seed={rampSteps.indexOf(step)}
                values={oklch ? undefined : values}
            />
            {oklch && <Channels ramp={ramp} />}
            <CodeBlock className="max-w-none" code={css} />
        </ToolPanel>
    );
};

/** Each step's lightness, chroma and hue, as a ruled table: what the oklch page is about. */
const Channels = ({ ramp }: { ramp: readonly Oklch[] }) => (
    <div className="min-w-0 overflow-x-auto">
        <table className="w-full min-w-xl border-collapse text-xs tabular-nums">
            <thead>
                <tr className="border-neutral-200 border-b text-left text-neutral-600">
                    <th className="py-2 pr-4 font-normal">Channel</th>
                    {rampSteps.map(step => (
                        <th className="py-2 pr-2 text-right font-normal" key={step}>
                            {step}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="text-neutral-900">
                {(
                    [
                        ['L', (c: Oklch) => `${round(c.l * 100, 1)}%`],
                        ['C', (c: Oklch) => round(c.c, 3).toFixed(3)],
                        ['H', (c: Oklch) => (c.c < 0.0005 ? '0' : round(c.h, 1).toFixed(1))],
                    ] as const
                ).map(([label, read]) => (
                    <tr className="border-neutral-200 border-b last:border-b-0" key={label}>
                        <th className="py-2 pr-4 text-left font-medium" scope="row">
                            {label}
                        </th>
                        {ramp.map((colour, i) => (
                            <td className="py-2 pr-2 text-right" key={rampSteps[i]}>
                                {read(colour)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
