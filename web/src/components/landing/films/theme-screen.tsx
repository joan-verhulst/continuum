'use client';

import { FooterSlotProvider } from '@playground/layout';
import { ProjectFlow } from '@playground/theme-editor/flow';
import { Theme, type ThemeOptions } from 'continuum';
import { useLayoutEffect, useState } from 'react';
import { CustomersScreen } from './customers-screen';

/** Where the film has the builder: a step of the flow, and in Colour which part of it. */
export type BuilderStep = 'primary' | 'neutral' | 'type' | 'controls' | 'review';

/** The flow's step for each: Colour is 0 (its parts inside it), Review 4. */
const stepIndex: Record<BuilderStep, number> = {
    primary: 0,
    neutral: 0,
    type: 1,
    controls: 2,
    review: 4,
};

/** The project the builder is theming, as its flow names it. */
export const PROJECT = 'Northwind';

const tag = (element: Element | null | undefined, name: string) =>
    element?.setAttribute('data-film', name);

/**
 * Marks the parts of the builder the camera visits, by what the flow draws: its head, the step's
 * builder, the step's containers and questions, the corner scale, the review. Run after every render,
 * since a new step draws new parts.
 */
const tagBuilder = (area: HTMLElement) => {
    for (const element of area.querySelectorAll('[data-film]'))
        element.removeAttribute('data-film');
    const [head, step] = Array.from(area.children);
    tag(head, 'b-head');
    tag(step, 'b-step');
    const blocks = area.querySelectorAll('[data-slot="theme-block"]');
    tag(blocks[0], 'b-block-1');
    tag(blocks[1], 'b-block-2');
    const questions = Array.from(area.querySelectorAll('[data-slot="theme-question"]'));
    tag(questions[0], 'b-question-1');
    tag(
        questions.find(question => question.textContent?.includes('Corner scale')),
        'b-corners',
    );
};

/**
 * The theme builder at its real size, as the hero's Customize draws it: the flow's own steps (the
 * playground's ProjectFlow) in a sheet-wide panel, with Customers beside it in the rest of the window wearing the theme as it
 * is now (scoped to `themeId`). The flow opens at the film's step; the Colour step's Neutral part is
 * reached as a person reaches it, by pressing Neutral.
 */
export const ThemeScreen = ({
    theme,
    set,
    step,
    themeId,
}: {
    theme: ThemeOptions;
    set: (patch: Partial<ThemeOptions>) => void;
    step: BuilderStep;
    themeId: string;
}) => {
    const [area, setArea] = useState<HTMLDivElement | null>(null);
    const [footer, setFooter] = useState<HTMLElement | null>(null);
    const index = stepIndex[step];

    // Neutral is the second of the Colour step's parts: pressed, as a person would.
    useLayoutEffect(() => {
        if (step !== 'neutral' || !area) return;
        const item = Array.from(area.querySelectorAll('button')).find(
            button => button.textContent?.trim() === 'Neutral',
        );
        if (item?.getAttribute('aria-pressed') !== 'true') item?.click();
    }, [step, area]);

    // After every render: a new step draws new parts to mark.
    useLayoutEffect(() => {
        if (area) tagBuilder(area);
    });

    return (
        <div className="flex size-full gap-2 bg-neutral-100 p-2">
            <div
                className="flex w-sheet shrink-0 flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50"
                data-film="builder"
            >
                <div
                    className="flex min-h-0 flex-1 flex-col gap-10 overflow-hidden p-6"
                    data-slot="sheet-area"
                    ref={setArea}
                >
                    <FooterSlotProvider value={footer}>
                        {/* Opened at the film's step, as a project is opened where it was left. */}
                        <ProjectFlow
                            dirty={false}
                            inUse={false}
                            key={index}
                            labels={{ use: 'Use this theme', useAnyway: 'Use it anyway' }}
                            name={PROJECT}
                            narrowNote=""
                            onExport={() => {}}
                            onProgress={() => {}}
                            onSave={() => {}}
                            onUse={() => {}}
                            progress={index}
                            set={set}
                            theme={theme}
                            titleAs="h2"
                            used={false}
                        />
                    </FooterSlotProvider>
                </div>
                <div className="contents" ref={setFooter} />
            </div>
            <div
                className="min-w-0 flex-1 overflow-hidden rounded-panel border border-neutral-200"
                data-film="preview"
            >
                <Theme className="size-full" mode="dark" theme={themeId}>
                    <CustomersScreen
                        mark={null}
                        repair={{
                            answered: true,
                            docked: true,
                            toolbar: true,
                            uncarded: true,
                            tight: true,
                        }}
                    />
                </Theme>
            </div>
        </div>
    );
};
