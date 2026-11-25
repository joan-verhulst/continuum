import { Button } from '@contui/ui';
import { ArticleSection } from '@/components/article';
import { Markdown } from '@/components/markdown';
import { Article, PageHero } from '@/components/page-frame';
import { findSection, readme } from '@/lib/content';
import { JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';
import { appLink, themeBuilderUrl } from '@/lib/site';
import { installParts } from '../_parts/nav';

/*
 * Installing Continuum, from the README: its sections are the source, drawn here in the docs'
 * article parts, so the repository and the site say the same thing. Each part gets a line of its
 * own above the README's words, and the page a closing pointer to where each part is explained.
 */

const description =
    'Install Continuum with npx contui init: the React component library from npm with Tailwind v4 or a prebuilt stylesheet, the Claude skills, and the MCP server for Claude Code, Cursor and VS Code.';

export const metadata = pageMetadata({
    title: 'Install',
    description,
    path: '/docs/install',
});

/** Which README section each part of the guide draws. */
const readmeSlugs: Record<(typeof installParts)[number]['id'], string> = {
    library: 'use-the-library-in-a-react-project',
    'skills-and-mcp': 'get-started',
    'with-claude': 'use-it-with-claude',
    theme: 'give-a-product-its-own-look',
};

/** What follows a part, where the site says more than the README. */
const after: Partial<Record<(typeof installParts)[number]['id'], string>> = {
    library:
        'The [components](/components) and [charts](/charts) pages show each part with its props and values.',
    'with-claude':
        'The [MCP server](/ai/mcp-server) page lists every tool and prompt; [Skills](/ai/skills) says what each skill knows.',
    theme: `[Open the theme builder](${themeBuilderUrl}): it makes the theme in the browser, colour first, and exports it.`,
};

const InstallPage = () => {
    const doc = readme();
    return (
        <>
            <JsonLd
                data={techArticleLd({
                    headline: 'Install Continuum',
                    description,
                    path: '/docs/install',
                })}
            />
            <PageHero
                crumbs={[
                    { name: 'Docs', path: '/docs' },
                    { name: 'Install', path: '/docs/install' },
                ]}
                actions={
                    <Button
                        // biome-ignore lint/a11y/useAnchorContent: the button renders its label into the link
                        render={<a href={appLink()} />}
                        size="lg"
                    >
                        Get started
                    </Button>
                }
                eyebrow="Docs"
                lead="One command installs Continuum in a project, as a dependency: the React library to build with its components, and the Claude skills and the MCP server to have Claude and other agents build in it."
                title="Install"
            />
            <Article>
                {/* The README's inline code runs long (an import line, a path); on a phone it may break,
                rather than widen the reading column past the screen. */}
                <div className="max-sm:[&_p_code]:wrap-anywhere max-sm:[&_p_code]:whitespace-normal">
                    {installParts.map(part => {
                        const section = findSection(doc, readmeSlugs[part.id]);
                        return (
                            <ArticleSection
                                description={part.summary}
                                id={part.id}
                                key={part.id}
                                tight
                                title={part.title}
                            >
                                {section && <Markdown source={section.body} />}
                                {after[part.id] && <Markdown source={after[part.id] ?? ''} />}
                            </ArticleSection>
                        );
                    })}
                </div>
            </Article>
        </>
    );
};

export default InstallPage;
