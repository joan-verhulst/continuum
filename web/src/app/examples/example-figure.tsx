'use client';

import { ToastProvider } from '@contui/ui';
import { exampleSections } from '@playground/examples';
import { Frame, Stage } from '@playground/layout';
import { screens } from '@screens/index';
import { useInView } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { DefaultTheme } from '@/components/default-theme';

/*
 * An example drawn from the playground as it stands: on its own page live, a reference screen in a
 * frame at 1440 × 900 scaled to the column, a block on a stage; on the index a still of either,
 * drawn once its card comes into view.
 */

const screenOf = (id: string) => screens.find(item => item.id === id);
const blockOf = (id: string) => exampleSections.find(item => item.id === id);

// The screens and blocks toast as the app does, so they sit in the app's provider.
const Themed = ({ className, children }: { className?: string; children: ReactNode }) => (
    <DefaultTheme className={className}>
        <ToastProvider>{children}</ToastProvider>
    </DefaultTheme>
);

/** Below this column width a screen is drawn at the column's own width, as on a phone. */
const NARROW = 640;

/**
 * A screen live: at 1440 × 900 scaled to the column, or on a phone at the column's own width and a
 * phone's height, so it is laid out (and usable) as it would be there rather than shrunk.
 */
const ScreenLive = ({ render }: { render: () => ReactNode }) => {
    const [box, setBox] = useState<HTMLDivElement | null>(null);
    const [width, setWidth] = useState<number>();
    useEffect(() => {
        if (!box) return;
        const observer = new ResizeObserver(([entry]) => {
            if (entry) setWidth(Math.round(entry.contentRect.width));
        });
        observer.observe(box);
        return () => observer.disconnect();
    }, [box]);
    const narrow = width !== undefined && width < NARROW;
    return (
        <div className="min-w-0" ref={setBox}>
            {width !== undefined &&
                (narrow ? (
                    <Frame designHeight={720} designWidth={width}>
                        {render()}
                    </Frame>
                ) : (
                    <Frame designHeight={900} designWidth={1440}>
                        {render()}
                    </Frame>
                ))}
        </div>
    );
};

/** The example on its own page: live, at the size it is designed for, across the column. */
export const ExampleLive = ({ id, kind }: { id: string; kind: 'screen' | 'block' }) => {
    if (kind === 'screen') {
        const screen = screenOf(id);
        if (!screen) return null;
        return (
            <Themed className="min-w-0">
                <ScreenLive render={() => screen.render()} />
            </Themed>
        );
    }
    const block = blockOf(id);
    if (!block) return null;
    return (
        <Themed className="min-w-0">
            <Stage className="min-h-120 p-4 sm:p-10">{block.render()}</Stage>
        </Themed>
    );
};

/** The canvas a block is laid out on for a still: 1280 wide, as tall as it needs. */
const BLOCK_WIDTH = 1280;

/**
 * A block as a still: laid out on a 1280 canvas at its own height, then scaled down whole to fit the
 * card's well, centred, so a tall block shows entire rather than cut.
 */
const BlockStill = ({ children }: { children: ReactNode }) => {
    const [outer, setOuter] = useState<HTMLDivElement | null>(null);
    const [inner, setInner] = useState<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(0);
    useEffect(() => {
        if (!outer || !inner) return;
        const fit = () =>
            setScale(
                Math.min(
                    outer.clientWidth / BLOCK_WIDTH,
                    outer.clientHeight / Math.max(1, inner.offsetHeight),
                ),
            );
        const observer = new ResizeObserver(fit);
        observer.observe(outer);
        observer.observe(inner);
        fit();
        return () => observer.disconnect();
    }, [outer, inner]);
    return (
        <div className="relative size-full overflow-hidden bg-neutral-50" inert ref={setOuter}>
            <div
                className="absolute top-1/2 left-1/2 flex justify-center p-16"
                ref={setInner}
                style={{
                    width: BLOCK_WIDTH,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    visibility: scale ? undefined : 'hidden',
                }}
            >
                {children}
            </div>
        </div>
    );
};

/**
 * An example as a still for an index card: a screen at 1440 × 900 scaled to fill the card's 16:10
 * well, a block scaled to fit it whole.
 */
export const ExampleStill = ({ id, kind }: { id: string; kind: 'screen' | 'block' }) => {
    const box = useRef<HTMLDivElement>(null);
    const seen = useInView(box, { once: true, margin: '200px' });
    const screen = kind === 'screen' ? screenOf(id) : undefined;
    const block = kind === 'block' ? blockOf(id) : undefined;
    return (
        <div className="size-full" ref={box}>
            {seen && (screen || block) && (
                <Themed className="size-full">
                    {screen ? (
                        <Frame
                            className="rounded-none border-0"
                            designHeight={900}
                            designWidth={1440}
                            still
                        >
                            {screen.render(true)}
                        </Frame>
                    ) : (
                        <BlockStill>{block?.render()}</BlockStill>
                    )}
                </Themed>
            )}
        </div>
    );
};
