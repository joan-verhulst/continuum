import { presets } from '@playground/presets';
import { CustomerDetail } from '@screens/customer';
import {
    Button,
    createThemeCss,
    SegmentedControl,
    SegmentedControlItem,
    Theme,
    type ThemeMode,
    themeAccentRamp,
} from 'continuum';
import { ArrowUpRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Reveal, Section, Shot } from '../web';

/*
 * For agencies: one screen, three clients' themes, as a deck of windows at real size. The cards
 * behind show their bar and the top of the page (the name, the actions in their accent); the
 * visitor brings any of them to the front. Never three scaled-down screens side by side.
 */

const icon = { strokeWidth: 2 } as const;

type Client = {
    id: string;
    label: string;
    mode: ThemeMode;
    /** The theme's traits, as its bar names them. */
    traits: string;
};

/*
 * Indigo and Stone are both blue, so Stone is shown in dark: the deck then reads as three products
 * at a glance, and shows the system in both modes on the way.
 */
const clients: Client[] = [
    {
        id: 'indigo',
        label: 'Indigo',
        mode: 'light',
        traits: 'Inter · flat action · corners at 80%',
    },
    { id: 'lime', label: 'Lime', mode: 'light', traits: 'Inter · lit action · corners at 80%' },
    { id: 'stone', label: 'Stone', mode: 'dark', traits: 'Inter · glossy action · corners at 80%' },
];

const themeId = (id: string) => `agency-${id}`;

const themeOf = (id: string) => presets.find(preset => preset.id === id)?.theme ?? {};

const deckCss = clients
    .map(client => createThemeCss({ ...themeOf(client.id), name: themeId(client.id) }))
    .join('\n\n');

/** Px each card behind shows above the one in front: its bar and the page's title row. */
const STEP = 128;

/** The Pixel Perfect mark, as on MCP Hosted's pill. */
const PixelPerfectMark = () => (
    <svg aria-hidden="true" className="size-3.5 shrink-0" fill="currentColor" viewBox="0 0 16 16">
        <path
            clipRule="evenodd"
            d="M16 0V15.9997H0V0H16ZM14 13.9997V1.99996H2V13.9997H14Z"
            fillRule="evenodd"
        />
        <path d="M0 7.33351H8.66667V16H6.66667V9.33347H0V7.33351Z" />
    </svg>
);

/** One client's window: its bar, then the customer page cropped at 1:1 around its title row. */
const Card = ({ client, depth }: { client: Client; depth: number }) => (
    <Theme
        className="absolute flex flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-100"
        mode={client.mode}
        style={{
            top: (2 - depth) * STEP,
            // Each card behind is inset at either side by --deck-inset, so the deck reads as a stack.
            left: `calc(${depth} * var(--deck-inset))`,
            right: `calc(${depth} * var(--deck-inset))`,
            bottom: depth * STEP,
            zIndex: 3 - depth,
        }}
        theme={themeId(client.id)}
    >
        <div className="flex h-12 shrink-0 items-center gap-2.5 border-neutral-200 border-b bg-neutral-50 px-4 text-xs">
            <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ background: themeAccentRamp(themeOf(client.id))[5] }}
            />
            <span className="font-medium text-neutral-950">{client.label}</span>
            <span className="hidden truncate text-neutral-500 sm:inline">{client.traits}</span>
            <span className="ml-auto text-neutral-500">
                {client.mode === 'light' ? 'Light' : 'Dark'}
            </span>
        </div>
        {/*
         * The page as the app draws it, cropped at 1:1 from just above its title row. Wide, the crop
         * starts at the panel's edge and the panel runs to the card's; on a phone it keeps the
         * right of the column, where the actions in the accent are.
         */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="absolute top-[-144px] left-[calc(100%-1232px)] h-[900px] w-[1280px] sm:left-[-248px] sm:w-[calc(100%+248px)]">
                <Shot>
                    <CustomerDetail />
                </Shot>
            </div>
        </div>
    </Theme>
);

const Deck = () => {
    const [front, setFront] = useState('indigo');
    // The picked client in front, the others behind it in their own order.
    const order = useMemo(
        () => [
            ...clients.filter(client => client.id === front),
            ...clients.filter(client => client.id !== front),
        ],
        [front],
    );

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-neutral-600 text-sm">Three themes, one codebase</p>
                <SegmentedControl
                    aria-label="Client in front"
                    onValueChange={setFront}
                    value={front}
                >
                    {clients.map(client => (
                        <SegmentedControlItem key={client.id} value={client.id}>
                            {client.label}
                        </SegmentedControlItem>
                    ))}
                </SegmentedControl>
            </div>
            <style>{deckCss}</style>
            <p className="sr-only">
                The same customer page in three themes: Indigo and Lime in light mode, Stone in dark
                mode. The one in front is {clients.find(client => client.id === front)?.label}.
            </p>
            {/* A shot, not an app: nothing in it takes focus or a click. */}
            <div
                className="relative h-[600px] [--deck-inset:12px] sm:h-[680px] sm:[--deck-inset:24px]"
                inert
            >
                {order.map((client, depth) => (
                    <Card client={client} depth={depth} key={client.id} />
                ))}
            </div>
        </div>
    );
};

// biome-ignore lint/a11y/useAnchorContent: the button renders its label into the link
const pixelPerfect = <a href="https://pixelperfect.agency" rel="noopener" />;

export const Agencies = () => (
    <Section
        aside={
            <Button render={pixelPerfect} size="lg" variant="secondary">
                <PixelPerfectMark />
                Talk to Pixel Perfect
                <ArrowUpRight {...icon} />
            </Button>
        }
        description="Theme each client in the builder, ship from one codebase, and hand over plain code and a DESIGN.md the client's own Claude can follow."
        eyebrow="For agencies"
        id="agencies"
        title="One system, every client's brand."
    >
        <Reveal>
            <Deck />
        </Reveal>
    </Section>
);
