import { cn, Input, SegmentedControl, SegmentedControlItem, Theme } from '@contui/ui';
import { useState } from 'react';
import {
    type AvatarSvgOptions,
    avatarFor,
    avatarSvg,
    colours,
    contrast,
    type Neutral,
    neutrals,
    type Sprite,
    spriteNames,
} from './sprites';

/*
 * A lab for pixel avatars: eight patterns, each in 32 colours and neutral-950 or neutral-50, so 256 avatars. Pick a pattern
 * and a colour, or type a name to see the one it lands on. Lab code, outside the package: opened as
 * `/app?avatars`.
 */

export const isAvatarsStandalone = () => new URLSearchParams(window.location.search).has('avatars');

const PixelAvatar = ({
    size,
    className,
    ...options
}: AvatarSvgOptions & { size: number; className?: string }) => (
    <img
        alt={options.sprite}
        className={cn('block shrink-0', className)}
        height={size}
        // Pixel art stays sharp at any size only if the browser does not smooth it.
        src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg(options))}`}
        style={{ imageRendering: 'pixelated' }}
        width={size}
    />
);

const names = [
    'Ada Lovelace',
    'Tim Berners',
    'Grace Hopper',
    'Linus T',
    'Margaret H',
    'Alan Turing',
    'Joan',
    'Ken Thompson',
];

export const AvatarsStandalone = () => {
    const [sprite, setSprite] = useState<Sprite>('dither');
    const [colour, setColour] = useState(colours[16]?.id ?? '');
    const [fill, setFill] = useState<'ground' | 'figure'>('ground');
    const [neutral, setNeutral] = useState<Neutral>(950);
    const [shape, setShape] = useState<'square' | 'round'>('round');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const [name, setName] = useState('Ada Lovelace');
    const hex = colours.find(item => item.id === colour)?.hex[neutral] ?? '';
    const seeded = avatarFor(name);

    return (
        <Theme className="min-h-dvh bg-neutral-100 text-neutral-950" mode={mode}>
            <div className="mx-auto flex max-w-content-narrow flex-col gap-12 px-4 py-16">
                <header className="flex flex-col gap-1">
                    <h1 className="font-medium text-lg">Pixel avatars</h1>
                    <p className="text-neutral-600">
                        Eight patterns on a 16 × 16 grid, each in one of 32 colours and neutral-950
                        or neutral-50: 256 avatars.
                    </p>
                </header>

                <section className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <SegmentedControl
                            onValueChange={value => setFill(value as 'ground' | 'figure')}
                            value={fill}
                        >
                            <SegmentedControlItem value="ground">
                                Colour ground
                            </SegmentedControlItem>
                            <SegmentedControlItem value="figure">
                                Colour figure
                            </SegmentedControlItem>
                        </SegmentedControl>
                        <SegmentedControl
                            onValueChange={value => setNeutral(Number(value) as Neutral)}
                            value={String(neutral)}
                        >
                            <SegmentedControlItem value="950">Neutral 950</SegmentedControlItem>
                            <SegmentedControlItem value="50">Neutral 50</SegmentedControlItem>
                        </SegmentedControl>
                        <SegmentedControl
                            onValueChange={value => setShape(value as 'square' | 'round')}
                            value={shape}
                        >
                            <SegmentedControlItem value="round">Round</SegmentedControlItem>
                            <SegmentedControlItem value="square">Square</SegmentedControlItem>
                        </SegmentedControl>
                        <SegmentedControl
                            onValueChange={value => setMode(value as 'light' | 'dark')}
                            value={mode}
                        >
                            <SegmentedControlItem value="light">Light</SegmentedControlItem>
                            <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
                        </SegmentedControl>
                    </div>

                    <div className="flex items-end gap-4">
                        <PixelAvatar
                            className={shape === 'square' ? 'rounded-card' : undefined}
                            colour={hex}
                            fill={fill}
                            neutral={neutral}
                            shape={shape}
                            size={96}
                            sprite={sprite}
                        />
                        {[36, 32, 24].map(size => (
                            <PixelAvatar
                                className={shape === 'square' ? 'rounded-chip' : undefined}
                                colour={hex}
                                fill={fill}
                                neutral={neutral}
                                key={size}
                                shape={shape}
                                size={size}
                                sprite={sprite}
                            />
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {spriteNames.map(item => (
                            <button
                                aria-label={item}
                                aria-pressed={item === sprite}
                                className={cn(
                                    'rounded-item p-1 outline-none ring-1 ring-transparent focus-visible:ring-neutral-950',
                                    item === sprite && 'ring-neutral-950',
                                )}
                                key={item}
                                onClick={() => setSprite(item)}
                                type="button"
                            >
                                <PixelAvatar
                                    colour={hex}
                                    fill={fill}
                                    neutral={neutral}
                                    shape={shape}
                                    size={36}
                                    sprite={item}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-16 gap-1.5">
                        {colours.map(item => (
                            <button
                                aria-label={item.id}
                                aria-pressed={item.id === colour}
                                className={cn(
                                    'aspect-square rounded-chip outline-none ring-offset-2 ring-offset-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-950',
                                    item.id === colour && 'ring-2 ring-neutral-950',
                                )}
                                key={item.id}
                                onClick={() => setColour(item.id)}
                                style={{ background: item.hex[neutral] }}
                                title={`${item.hex[neutral]} · ${contrast(item.hex[neutral], neutrals[neutral]).toFixed(1)} : 1 with neutral-${neutral}`}
                                type="button"
                            />
                        ))}
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-medium">From a name</h2>
                    <div className="flex items-center gap-3">
                        <PixelAvatar
                            colour={seeded.colour.hex[neutral]}
                            fill={fill}
                            neutral={neutral}
                            shape={shape}
                            size={36}
                            sprite={seeded.sprite}
                        />
                        <Input
                            className="max-w-64"
                            onChange={event => setName(event.target.value)}
                            value={name}
                        />
                        <span className="text-neutral-600">
                            {seeded.sprite}, {seeded.colour.id}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {names.map(item => {
                            const pick = avatarFor(item);
                            return (
                                <PixelAvatar
                                    colour={pick.colour.hex[neutral]}
                                    fill={fill}
                                    neutral={neutral}
                                    key={item}
                                    shape={shape}
                                    size={32}
                                    sprite={pick.sprite}
                                />
                            );
                        })}
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-medium">All 256</h2>
                    <div className="flex flex-col gap-1.5">
                        {spriteNames.map(item => (
                            <div className="grid grid-cols-16 gap-1.5" key={item}>
                                {colours.map(tone => (
                                    <PixelAvatar
                                        className="size-full"
                                        colour={tone.hex[neutral]}
                                        fill={fill}
                                        neutral={neutral}
                                        key={tone.id}
                                        shape={shape}
                                        size={32}
                                        sprite={item}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </Theme>
    );
};
