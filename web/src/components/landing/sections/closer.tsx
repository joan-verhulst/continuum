'use client';

import { ContinuumMark } from '@playground/brand';
import { Button, createThemeCss, Theme } from 'continuum';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { themeBuilderUrl } from '@/lib/site';
import { siteTheme } from '../theme';
import { CommandChip, Container, installCommand, Reveal } from '../web';

/*
 * The close and the footer. The close is the page's one panel band: the headline at the hero's
 * size, the hero's action again, and six accents that recolour the band's own action and mark, so
 * "pick your accent" is something you do here before it is something you are told. The footer
 * stays on the page's surface, quiet, with the maker named.
 */

const accents = [
    { id: 'indigo', name: 'Indigo', hex: '#3939e5' },
    { id: 'violet', name: 'Violet', hex: '#7c5cff' },
    { id: 'rose', name: 'Rose', hex: '#f0436a' },
    { id: 'amber', name: 'Amber', hex: '#ffa31a' },
    { id: 'jade', name: 'Jade', hex: '#00b386' },
    { id: 'lime', name: 'Lime', hex: '#a3e635' },
] as const;

type AccentId = (typeof accents)[number]['id'];

const themeOf = (id: AccentId) => `closer-${id}`;

/**
 * The site's own theme with the accent swapped and filling the action, so picking one recolours the
 * band's button and mark: here, and only here, the accent is what is being shown.
 */
const accentCss = accents
    .map(accent =>
        createThemeCss({
            ...siteTheme,
            accent: accent.hex,
            action: 'accent',
            name: themeOf(accent.id),
        }),
    )
    .join('\n\n');

const AccentPicker = ({
    value,
    onChange,
}: {
    value: AccentId;
    onChange: (id: AccentId) => void;
}) => {
    const current = accents.find(accent => accent.id === value) ?? accents[0];

    return (
        <fieldset className="flex flex-col gap-4">
            <legend className="mb-4 text-neutral-600 text-sm">Try an accent</legend>
            <div className="flex flex-wrap gap-1">
                {accents.map(accent => (
                    <label
                        className="relative grid size-9 cursor-pointer place-items-center rounded-full border-2 border-transparent transition-[border-color] duration-150 hover:border-neutral-300 has-checked:border-neutral-950 has-focus-visible:outline-2 has-focus-visible:outline-focus has-focus-visible:outline-offset-2"
                        key={accent.id}
                    >
                        <input
                            checked={accent.id === value}
                            className="sr-only"
                            name="closer-accent"
                            onChange={() => onChange(accent.id)}
                            type="radio"
                            value={accent.id}
                        />
                        <span className="sr-only">{accent.name}</span>
                        <span
                            aria-hidden
                            className="size-6 rounded-full"
                            style={{ backgroundColor: accent.hex }}
                        />
                    </label>
                ))}
            </div>
            <p className="font-mono text-neutral-500 text-xs">
                {current.name} · {current.hex}
            </p>
        </fieldset>
    );
};

const ClosingBand = () => {
    const [accent, setAccent] = useState<AccentId>('indigo');

    return (
        <section
            aria-labelledby="closer-title"
            className="px-2 pt-16 sm:px-3 md:pt-32"
            data-hides-floating-card
            id="get-started"
        >
            <style>{accentCss}</style>
            <Theme
                className="overflow-hidden rounded-panel border border-neutral-200 bg-neutral-100"
                theme={themeOf(accent)}
            >
                <Container className="grid gap-14 py-16 md:py-28 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
                    <div className="flex flex-col">
                        <Reveal>
                            <h2
                                className="max-w-[680px] text-balance font-medium text-4xl text-neutral-950 leading-[1.05] tracking-[-0.02em] md:text-5xl"
                                id="closer-title"
                            >
                                Pick your accent. Ask for a screen.
                            </h2>
                        </Reveal>
                        <Reveal delay={1}>
                            <p className="mt-6 max-w-[576px] text-base text-neutral-600 leading-[1.6] md:text-lg">
                                Theme your product in the free builder, run one command to add the
                                skill and the MCP server, then give Claude your first page's
                                content.
                            </p>
                        </Reveal>
                        <Reveal className="mt-10 flex flex-wrap items-center gap-3" delay={2}>
                            <Button
                                render={props => <a {...props} href={themeBuilderUrl} />}
                                size="lg"
                            >
                                Theme your product
                                <ArrowRight strokeWidth={2} />
                            </Button>
                            <CommandChip command={installCommand} />
                        </Reveal>
                    </div>
                    <Reveal
                        className="flex flex-col gap-10 lg:items-start lg:border-neutral-200 lg:border-l lg:pl-16"
                        delay={3}
                    >
                        <ContinuumMark
                            className="size-20 text-action transition-[color] duration-150 md:size-36"
                            size={144}
                        />
                        <AccentPicker onChange={setAccent} value={accent} />
                    </Reveal>
                </Container>
            </Theme>
        </section>
    );
};

/**
 * The last ask, kept while the page goes without it; the footer after it is the site's own
 * (components/site-footer.tsx), on every page.
 */
export const Closer = ClosingBand;
