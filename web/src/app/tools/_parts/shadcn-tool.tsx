'use client';

import {
    Field,
    FieldHelper,
    FieldLabel,
    rampSteps,
    Textarea,
    themeAccentRamp,
    themeFromCss,
    themeNeutralRamp,
} from 'continuum';
import { useMemo, useState } from 'react';
import { ToolPanel } from './controls';
import { RampStrip } from './ramp';

/*
 * A shadcn/ui or Tailwind theme read the way the builder's import reads it (themeFromCss): what it
 * found, where it found it, and the primary and grey ramps Continuum builds from that. It starts
 * on shadcn's own zinc-and-violet example, so the page shows a result before anything is pasted.
 */

const example = `:root {
  --radius: 0.65rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.541 0.281 293.009);
  --primary-foreground: oklch(0.969 0.016 293.756);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --border: oklch(0.92 0.004 286.32);
  --font-sans: "Inter", sans-serif;
}`;

const choiceNames: Record<string, string> = {
    accent: 'Primary',
    action: 'Main button',
    neutral: 'Greys',
    font: 'Font',
    radius: 'Corners',
};

export const ShadcnTool = () => {
    const [css, setCss] = useState(example);
    const read = useMemo(() => themeFromCss(css), [css]);
    const { options, found } = read;
    const nothing = css.trim() !== '' && found.length === 0;

    const value = (option: string) => {
        if (option === 'accent') return `${options.accent} at the ${options.accentStep ?? '500'}`;
        if (option === 'action')
            return options.action === 'neutral' ? 'Near-black, from the greys' : 'The primary';
        if (option === 'neutral')
            return options.neutral && options.neutral.tint > 0
                ? `Tinted, hue ${options.neutral.hue}°, chroma ${options.neutral.tint}`
                : 'Pure grey';
        if (option === 'font') return String(options.font);
        if (option === 'radius') return `${options.radius}× Continuum’s corners`;
        return '';
    };

    return (
        <ToolPanel
            controls={
                <Field className="w-full" invalid={nothing}>
                    <FieldLabel>Your globals.css or @theme block</FieldLabel>
                    <Textarea
                        className="font-mono text-xxs"
                        onChange={event => setCss(event.target.value)}
                        rows={8}
                        spellCheck={false}
                        value={css}
                    />
                    {nothing && (
                        <FieldHelper>
                            Nothing recognised: the builder reads --primary, a brand or grey ramp,
                            --font-sans and --radius.
                        </FieldHelper>
                    )}
                </Field>
            }
        >
            {found.length > 0 && (
                <ul className="divide-y divide-neutral-200 overflow-hidden rounded-card border border-neutral-200">
                    {found.map(item => (
                        <li
                            className="grid gap-x-4 gap-y-0.5 px-4 py-3 text-xs sm:grid-cols-[8rem_1fr_auto]"
                            key={item.option}
                        >
                            <span className="text-neutral-950">
                                {choiceNames[item.option] ?? item.option}
                            </span>
                            <span className="text-neutral-700">{value(item.option)}</span>
                            <span className="font-mono text-neutral-600 text-xxs">
                                from {item.from}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            {options.accent && (
                <div className="flex min-w-0 flex-col gap-3">
                    <p className="text-neutral-600 text-xs">The primary ramp it becomes</p>
                    <RampStrip
                        colours={themeAccentRamp(options)}
                        seed={rampSteps.indexOf(options.accentStep ?? '500')}
                    />
                </div>
            )}
            {options.neutral && (
                <div className="flex min-w-0 flex-col gap-3">
                    <p className="text-neutral-600 text-xs">The greys it becomes</p>
                    <RampStrip colours={themeNeutralRamp(options)} />
                </div>
            )}
        </ToolPanel>
    );
};
