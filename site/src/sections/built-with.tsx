import { Reveal, Section, Window } from '../web';

/*
 * Built with Continuum: three products made in it, one under the other, each screen shown whole at
 * its own proportions, never cropped or enlarged. Each is named by the kind of product it is, not
 * by whose.
 */

/** The screenshots are 1920 by 1000. */
const IMAGE = { width: 1920, height: 1000 } as const;

/**
 * The gallery runs past the page's 1104px column, as the screens section does, so a screen is drawn
 * at up to 1280px: two thirds of its own size, sharp on every screen.
 */
const bleed = {
    marginInline: 'calc((100% - min(1282px, 100vw - 2 * var(--gutter))) / 2)',
} as const;

type Work = { id: string; kind: string; line: string; src: string; alt: string };

const work: Work[] = [
    {
        id: 'compliance',
        kind: 'Compliance',
        line: 'Security risks, scored, reasoned and signed off topic by topic.',
        src: '/work/security-assessment-report.jpg',
        alt: 'A security assessment report: twenty risk topics in a list, and the phishing topic open with its likelihood, exposure and impact scored and explained.',
    },
    {
        id: 'marketing',
        kind: 'Marketing',
        line: 'A campaign’s budget, reach and every channel’s schedule in one table.',
        src: '/work/campaign-management-table.jpg',
        alt: 'A campaign overview: impressions, click-through rate and conversions, then a table of campaigns with their status, channel, dates and owner.',
    },
    {
        id: 'analytics',
        kind: 'Analytics',
        line: 'A checkout funnel, step by step, with where people drop off.',
        src: '/work/analytics-checkout-funnel.jpg',
        alt: 'A checkout funnel: totals and completion rate on top, then four steps from pricing to completed with the share lost at each.',
    },
];

/** One product: its whole screen in a window, and its kind under it. */
const Exhibit = ({ item, index }: { item: Work; index: number }) => (
    <Reveal delay={index}>
        <figure className="m-0 flex flex-col gap-4">
            <Window bodyClassName="flex-none">
                <img
                    alt={item.alt}
                    className="block h-auto w-full"
                    decoding="async"
                    height={IMAGE.height}
                    loading="lazy"
                    src={item.src}
                    width={IMAGE.width}
                />
            </Window>
            <figcaption className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                <span className="font-medium text-base text-neutral-950">{item.kind}</span>
                <span className="text-neutral-600 text-sm">{item.line}</span>
            </figcaption>
        </figure>
    </Reveal>
);

/** Products made in Continuum: the proof that the parts hold a whole product. */
export const BuiltWith = () => (
    <Section
        description="Three products made in it: compliance, marketing and analytics."
        eyebrow="Built with Continuum"
        id="built-with"
        title="Already at work in real products."
    >
        <div className="[--gutter:16px] sm:[--gutter:24px]" style={bleed}>
            <div className="flex flex-col gap-12 lg:gap-16">
                {work.map((item, index) => (
                    <Exhibit index={index} item={item} key={item.id} />
                ))}
            </div>
        </div>
    </Section>
);
