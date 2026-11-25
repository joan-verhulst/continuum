'use client';

import {
    Badge,
    Button,
    createThemeVariables,
    Field,
    FieldLabel,
    Input,
    rampSteps,
    SegmentedControl,
    SegmentedControlItem,
    Switch,
    type ThemeMode,
    themeAccentRamp,
} from '@contui/ui';
import { type CSSProperties, useId, useMemo, useState } from 'react';
import { CodeBlock } from '@/components/code-block';
import { useShareAccent } from './builder-link';
import { ColourInput, ToolPanel } from './controls';
import { exportExcerpt } from './export-excerpt';
import { RampStrip } from './ramp';

/*
 * One colour on real components, light and dark at once: the theme's variables
 * (createThemeVariables) laid on two pieces of the canvas, as the builder's preview lays them, and
 * the primary's lines of the app.css it would export under them.
 */

/** A small form drawn in Continuum's own parts, so the colour lands where a theme puts it. */
const Specimen = ({ mode, style }: { mode: ThemeMode; style: CSSProperties }) => {
    const id = useId();
    const [admin, setAdmin] = useState('member');
    const [welcome, setWelcome] = useState(true);
    return (
        <div
            className="continuum flex min-w-0 flex-col bg-neutral-100 p-4 text-neutral-950 sm:p-6"
            data-mode={mode}
            style={style}
        >
            <div className="flex flex-col gap-5 rounded-card border border-neutral-200 bg-neutral-50 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                        <p className="font-medium text-neutral-950 text-sm">Invite a teammate</p>
                        <p className="text-neutral-600 text-xs">They join the Studio workspace.</p>
                    </div>
                    <Badge tone="primary">Pro seat</Badge>
                </div>
                <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input defaultValue="ana@studio.dev" size="sm" />
                </Field>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <SegmentedControl aria-label="Role" onValueChange={setAdmin} value={admin}>
                        <SegmentedControlItem value="member">Member</SegmentedControlItem>
                        <SegmentedControlItem value="admin">Admin</SegmentedControlItem>
                    </SegmentedControl>
                    <label className="flex items-center gap-2 text-xs" htmlFor={`${id}-welcome`}>
                        <Switch
                            checked={welcome}
                            id={`${id}-welcome`}
                            onCheckedChange={setWelcome}
                        />
                        Welcome email
                    </label>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="secondary">Cancel</Button>
                    <Button>Send invite</Button>
                </div>
            </div>
        </div>
    );
};

export const ThemePreviewTool = () => {
    const [hex, setHex] = useState('#0d9488');
    useShareAccent(hex);
    const options = useMemo(() => ({ accent: hex }), [hex]);
    const { light, dark } = useMemo(() => createThemeVariables(options), [options]);
    const excerpt = useMemo(() => exportExcerpt(options), [options]);

    return (
        <ToolPanel controls={<ColourInput label="Primary colour" onChange={setHex} value={hex} />}>
            <div className="grid min-w-0 overflow-hidden rounded-card border border-neutral-200 md:grid-cols-2">
                <Specimen mode="light" style={light as CSSProperties} />
                <Specimen mode="dark" style={{ ...light, ...dark } as CSSProperties} />
            </div>
            <RampStrip colours={themeAccentRamp(options)} seed={rampSteps.indexOf('500')} />
            <CodeBlock className="max-w-none" code={excerpt} />
        </ToolPanel>
    );
};
