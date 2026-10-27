import { cn, focusRing } from 'continuum';
import { ArrowRight, LayoutGrid, LayoutTemplate, Palette, SwatchBook } from 'lucide-react';
import type { ReactNode } from 'react';
import { ArticleSection, column, Figure } from './article';
import { exampleSections } from './examples';
import { Frame, Page, PageHeader } from './layout';
import { type AppState, toHash } from './meta';
import { screens } from './screens';
import { Overview } from './screens/overview';
import { entries } from './showcase/previews';

const icon = { strokeWidth: 2 } as const;

/*
 * The home page reads like Foundations: the name and what it is in the reading
 * column, then a few sections, each with one figure. A screen built from the
 * system, and the way into each part of it.
 */

type Way = {
    title: string;
    description: string;
    icon: ReactNode;
    /** Where it leads: a view, or the theme builder opened over the components. */
    patch: Partial<AppState>;
};

type HomeProps = {
    state: AppState;
    onChange: (patch: Partial<AppState>) => void;
};

export const Home = ({ state, onChange }: HomeProps) => {
    const ways: Way[] = [
        {
            title: 'Foundations',
            description:
                'Colour, type, surfaces, layout and motion: the rules every component follows.',
            icon: <Palette {...icon} />,
            patch: { view: 'foundations' },
        },
        {
            title: 'Components',
            description: `${entries.length} components, live, each with its variants and states.`,
            icon: <LayoutGrid {...icon} />,
            patch: { view: 'components' },
        },
        {
            title: 'Patterns',
            description: `${screens.length} generic screens and ${exampleSections.length} blocks, built from the system alone.`,
            icon: <LayoutTemplate {...icon} />,
            patch: { view: 'patterns' },
        },
        {
            title: 'Theme builder',
            description:
                'An accent, how the action draws, a font and the corners, taken to a project as its Tailwind entry and a DESIGN.md for Claude.',
            icon: <SwatchBook {...icon} />,
            patch: { view: 'components', builder: true },
        },
    ];

    return (
        <Page className="gap-0">
            <div className={column}>
                <PageHeader
                    description="A design system for quiet, dense tool UI: 13px type in two weights, hairline borders, one action colour and radii that nest. Enough to build a whole product, and the same hand in every one of them."
                    title="Continuum"
                />
            </div>

            <ArticleSection
                description="A product screen made from the library alone, in the system's own look."
                id="h-in-use"
                title="In use"
            >
                <Figure caption="The dashboard from Patterns: the sidebar, four numbers, revenue over twelve weeks and what moved, every part of it a Continuum component.">
                    <Frame designHeight={900} designWidth={1440} still>
                        <Overview />
                    </Frame>
                </Figure>
            </ArticleSection>

            <ArticleSection
                description="The rules, the parts, what is built from them, and a theme of your own."
                id="h-inside"
                title="What is in it"
            >
                <nav
                    aria-label="Parts of the system"
                    className="flex min-w-0 flex-col overflow-hidden rounded-card border border-neutral-200 bg-neutral-50"
                >
                    {ways.map(way => (
                        <a
                            className={cn(
                                'group/way flex min-w-0 items-center gap-4 border-neutral-200 border-b px-5 py-4 transition-[background-color] duration-150 last:border-b-0 hover:bg-neutral-950/[0.03]',
                                focusRing,
                                'focus-visible:-outline-offset-2',
                            )}
                            href={toHash({
                                ...state,
                                component: undefined,
                                screen: undefined,
                                ...way.patch,
                            })}
                            key={way.title}
                            onClick={event => {
                                event.preventDefault();
                                onChange({ component: undefined, screen: undefined, ...way.patch });
                            }}
                        >
                            <span className="grid size-8 shrink-0 place-items-center rounded-item bg-neutral-950/5 text-neutral-600 [&_svg]:size-4">
                                {way.icon}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="font-medium text-neutral-950 text-sm">
                                    {way.title}
                                </span>
                                <span className="truncate text-neutral-600 text-xs">
                                    {way.description}
                                </span>
                            </span>
                            <ArrowRight
                                aria-hidden
                                className="size-4 shrink-0 text-neutral-400 transition-[color,translate] duration-150 group-hover/way:translate-x-0.5 group-hover/way:text-neutral-950"
                                {...icon}
                            />
                        </a>
                    ))}
                </nav>
            </ArticleSection>
        </Page>
    );
};
