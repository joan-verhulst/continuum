'use client';

import {
    foundations,
    GridFigure,
    MotionStage,
    motionKnobs,
    TypeRow,
    typeScale,
    WidthsFigure,
} from '@playground/foundations';
import { KnobStage } from '@playground/showcase/detail';
import type { Knob, PreviewProps } from '@playground/showcase/kit';
import type { ReactNode } from 'react';
import { Figure, showcase } from '@/components/article';
import { DefaultTheme } from '@/components/default-theme';

/*
 * A foundation's specimen, the playground's own: a stage with its knobs over it, every value on it
 * read off the page, so the reader's mode shows through. A topic the playground draws no specimen for
 * has no entry, and its page is its tables alone.
 */

const Specimen = ({
    knobs,
    Stage,
}: {
    knobs?: readonly Knob[];
    Stage: (props: PreviewProps) => ReactNode;
}) => (
    <KnobStage
        className={showcase}
        compact
        knobs={knobs}
        render={values => <Stage knobs={values} />}
    />
);

/** A foundation of the playground's Foundations page, by its id there, as its specimen. */
const FoundationStage = ({ id }: { id: string }) => {
    const foundation = foundations.find(entry => entry.id === id);
    if (!foundation?.Stage) return null;
    return (
        <Figure caption={foundation.description}>
            <Specimen knobs={foundation.knobs} Stage={foundation.Stage} />
        </Figure>
    );
};

/** The type scale up to 3xl, tool UI's last size, each measured off the page. */
const TypeScale = () => (
    <Figure caption="Every size of tool UI, measured off the page: 13px is the base; above 3xl is marketing.">
        <div className="flex min-w-0 flex-col overflow-hidden rounded-card border border-neutral-200 bg-neutral-50">
            {typeScale.slice(0, 8).map(row => (
                <TypeRow key={row.name} {...row} />
            ))}
        </div>
    </Figure>
);

const figures: Record<string, () => ReactNode> = {
    colour: () => <FoundationStage id="f-colour" />,
    type: () => <TypeScale />,
    'surfaces-and-depth': () => <FoundationStage id="f-surfaces" />,
    radius: () => <FoundationStage id="f-surfaces" />,
    spacing: () => (
        <>
            <FoundationStage id="f-padding" />
            <GridFigure />
        </>
    ),
    states: () => <FoundationStage id="f-states" />,
    motion: () => (
        <Figure caption="A menu or a dialog enters in 200ms on a strong ease-out; a colour changes in 150ms. Slow it down to see the curve.">
            <Specimen knobs={motionKnobs} Stage={MotionStage} />
        </Figure>
    ),
    layout: () => <WidthsFigure />,
};

/** The topic's specimen, or nothing. */
export const FoundationFigure = ({ slug }: { slug: string }) => {
    const Draw = figures[slug];
    return Draw ? (
        <DefaultTheme className="flex min-w-0 flex-col gap-16">{Draw()}</DefaultTheme>
    ) : null;
};
