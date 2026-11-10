import {
    defaultThemeOptions,
    drawnType,
    drawnUnit,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    type ThemeOptions,
    themeFonts,
} from 'continuum';
import type { ReactNode } from 'react';
import { heightChoices, typeChoices, unitChoices } from '../presets';
import { Choice, fontChoices, Row, SliderRow } from './parts';

export type TabProps = {
    theme: ThemeOptions;
    set: (patch: Partial<ThemeOptions>) => void;
};

const form = 'grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-3 gap-y-2';

/** A group of settings under an eyebrow; each after the first sits under a hairline. */
const Group = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="flex flex-col gap-4 border-neutral-200 border-t pt-6 first:border-t-0 first:pt-0">
        <h2 className="font-normal text-neutral-600 text-xs">{title}</h2>
        {children}
    </section>
);

/** The character of the controls: the font, what the action is and how it draws, the corners. */
export const ControlsTab = ({ theme, set }: TabProps) => {
    const radius = theme.radius ?? 1;

    return (
        <div className="flex flex-col gap-6">
            <Group title="Font">
                <Select
                    onValueChange={font => {
                        const choice = fontChoices.find(item => item.value === font);
                        if (!choice) return;
                        set({
                            font:
                                choice.value === defaultThemeOptions.font
                                    ? undefined
                                    : choice.value,
                        });
                    }}
                    value={
                        fontChoices.find(choice => choice.value === theme.font)?.value ?? 'geist'
                    }
                >
                    <SelectTrigger aria-label="Font" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {fontChoices.map(choice => (
                            <SelectItem
                                key={choice.value}
                                style={{ fontFamily: themeFonts[choice.value] }}
                                value={choice.value}
                            >
                                {choice.family}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Group>

            <Group title="The action">
                <div className={form}>
                    <Row
                        hint="What fills the primary button, checked controls and the active rail item."
                        label="Fill"
                    >
                        <Choice
                            label="Action colour"
                            onChange={action =>
                                set({ action: action === 'neutral' ? undefined : action })
                            }
                            options={[
                                { value: 'neutral', label: 'Neutral' },
                                { value: 'accent', label: 'Primary' },
                            ]}
                            value={theme.action ?? defaultThemeOptions.action}
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
                                    actionStyle: actionStyle === 'flat' ? undefined : actionStyle,
                                })
                            }
                            options={[
                                { value: 'flat', label: 'Flat' },
                                { value: 'lit', label: 'Lit' },
                                { value: 'glossy', label: 'Glossy' },
                            ]}
                            value={theme.actionStyle ?? defaultThemeOptions.actionStyle}
                        />
                    </Row>
                    <Row
                        hint="The active segment: filled with the action colour, or raised as a chip on its track."
                        label="Segments"
                    >
                        <Choice
                            label="Active segment"
                            onChange={segment =>
                                set({ segment: segment === 'filled' ? undefined : segment })
                            }
                            options={[
                                { value: 'filled', label: 'Filled' },
                                { value: 'raised', label: 'Raised' },
                            ]}
                            value={theme.segment ?? defaultThemeOptions.segment}
                        />
                    </Row>
                    <Row
                        hint="Behind an active pill tab or an own message: a neutral wash, or the primary's palest step."
                        label="Tint"
                    >
                        <Choice
                            label="Tint"
                            onChange={tint => set({ tint: tint === 'neutral' ? undefined : tint })}
                            options={[
                                { value: 'neutral', label: 'Neutral' },
                                { value: 'accent', label: 'Primary' },
                            ]}
                            value={theme.tint ?? defaultThemeOptions.tint}
                        />
                    </Row>
                </div>
            </Group>

            <Group title="Corners">
                <SliderRow
                    display={`${Math.round(radius * 100)}%`}
                    label="Corner scale"
                    max={2}
                    min={0}
                    onValueChange={value =>
                        set({ radius: Math.abs(value - 1) < 0.025 ? undefined : value })
                    }
                    step={0.05}
                    value={radius}
                />
                <div className={form}>
                    <Row
                        hint="The dock, the rail and small chips: full pills, or a tighter 10px corner."
                        label="Dock"
                    >
                        <Choice
                            label="Dock corners"
                            onChange={dock => set({ dock: dock === 'pill' ? undefined : dock })}
                            options={[
                                { value: 'pill', label: 'Pill' },
                                { value: 'rounded', label: 'Rounded' },
                            ]}
                            value={theme.dock ?? defaultThemeOptions.dock}
                        />
                    </Row>
                </div>
            </Group>
        </div>
    );
};

/** One size question: three judged answers, and what the picked one comes to. */
const SizeChoice = <Value extends number>({
    title,
    label,
    choices,
    value,
    onChange,
    fact,
}: {
    title: string;
    label: string;
    choices: readonly { value: Value; label: string }[];
    value: number;
    onChange: (value: Value) => void;
    fact: string;
}) => (
    <Group title={title}>
        <Choice
            label={label}
            onChange={next => {
                const pick = choices.find(choice => String(choice.value) === next);
                if (pick) onChange(pick.value);
            }}
            options={choices.map(choice => ({ value: String(choice.value), label: choice.label }))}
            value={String(choices.find(choice => choice.value === value)?.value ?? '')}
        />
        <p className="text-neutral-600 text-xs tabular-nums">{fact}</p>
    </Group>
);

/**
 * The sizes, three questions apart: the type, the room around things, the height of controls.
 * Each is a judged set, and every answer lands on whole pixels.
 */
export const SizeTab = ({ theme, set }: TabProps) => {
    const type = theme.type ?? drawnType;
    const unit = theme.unit ?? drawnUnit;
    const size = theme.size ?? 1;
    const scaled = (px: number) => Math.round(px * (type / drawnType));

    return (
        <div className="flex flex-col gap-6">
            <SizeChoice
                choices={typeChoices}
                fact={`Body ${type}px, a section title ${scaled(16)}px, a page title ${scaled(39)}px.`}
                label="Type size"
                onChange={value => set({ type: value === drawnType ? undefined : value })}
                title="Type"
                value={type}
            />
            <SizeChoice
                choices={unitChoices}
                fact={`A ${unit}px unit: p-3 is ${unit * 3}px, gap-2 ${unit * 2}px. Every padding, gap and margin is a multiple of it.`}
                label="Spacing unit"
                onChange={value => set({ unit: value === drawnUnit ? undefined : value })}
                title="Padding"
                value={unit}
            />
            <SizeChoice
                choices={heightChoices}
                fact={`Controls ${Math.round(34 * size)} and ${Math.round(38 * size)}px, a table row ${Math.round(40 * size) + 1}px.`}
                label="Height scale"
                onChange={value => set({ size: value === 1 ? undefined : value })}
                title="Heights"
                value={size}
            />
        </div>
    );
};
