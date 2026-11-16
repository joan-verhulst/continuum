import { CardGrid, FrameSection, JumpLinks, LinkCard, PageHero } from '@/components/page-frame';
import { JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';
import { examples } from './content';
import { ExampleStill } from './example-figure';

/*
 * The examples index: the app's reference screens, one per page kind, then the blocks rebuilt from
 * earlier products, each a large card with a still of it.
 */

const screens = () => examples().filter(item => item.kind === 'screen');
const blocks = () => examples().filter(item => item.kind === 'block');

const lead = () =>
    `Screens and blocks built from Continuum alone: ${screens().length} reference screens of one app, one for each page kind, and ${blocks().length} blocks rebuilt from earlier products.`;

export const metadata = pageMetadata({
    title: 'Examples: screens and blocks built with Continuum',
    description:
        'Reference screens for each page kind (overview, index, detail, create or edit, settings, assistant, sign in) and blocks from real products, built with Continuum.',
    path: '/examples',
});

const ExamplesPage = () => (
    <>
        <JsonLd
            data={techArticleLd({ headline: 'Examples', description: lead(), path: '/examples' })}
        />
        <PageHero
            actions={
                <JumpLinks
                    links={[
                        { href: '#screens', label: 'Screens' },
                        { href: '#blocks', label: 'Blocks' },
                    ]}
                />
            }
            crumbs={[{ name: 'Examples', path: '/examples' }]}
            eyebrow={`${screens().length} screens · ${blocks().length} blocks`}
            lead={lead()}
            title="Examples"
        />
        <FrameSection
            count={screens().length}
            description="One generic app, a screen for each kind of page: each sets the column's width and what goes in it, in order."
            id="screens"
            title="Screens"
        >
            <CardGrid columns={2}>
                {screens().map((item, index) => (
                    <LinkCard
                        delay={index % 2}
                        description={item.description}
                        href={`/examples/${item.path}`}
                        key={item.path}
                        meta={item.label}
                        title={item.title}
                        visual={<ExampleStill id={item.id} kind="screen" />}
                    />
                ))}
            </CardGrid>
        </FrameSection>
        <FrameSection
            count={blocks().length}
            description="Parts of earlier products, rebuilt from the system alone."
            id="blocks"
            title="Blocks"
        >
            <CardGrid columns={2}>
                {blocks().map((item, index) => (
                    <LinkCard
                        delay={index % 2}
                        description={item.description}
                        href={`/examples/${item.path}`}
                        key={item.path}
                        meta={item.label}
                        title={item.title}
                        visual={<ExampleStill id={item.id} kind="block" />}
                    />
                ))}
            </CardGrid>
        </FrameSection>
    </>
);

export default ExamplesPage;
