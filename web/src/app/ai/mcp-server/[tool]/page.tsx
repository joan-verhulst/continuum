import { Badge } from '@contui/ui';
import { notFound } from 'next/navigation';
import { ArticleSection, DividedList, H, P } from '@/components/article';
import { CodeBlock } from '@/components/code-block';
import { Inline, Markdown } from '@/components/markdown';
import { Article, PageHero, PrevNext } from '@/components/page-frame';
import { clip, firstSentence, mcpManifest } from '@/lib/content';
import { JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';
import { Row, RowName, RowText } from '../../_components/rows';
import { callText, clipAnswer, liveTool } from '../../_lib/mcp-live';
import { mcpToolOrder, toolPath } from '../../_lib/nav';
import { toolSummary } from '../../_lib/text';

/*
 * One MCP tool: what it does (its whole description, as the agent reads it), its arguments as the
 * server declares them, and an example call with the answer the built server really gives. The
 * description is the manifest's; the arguments and the answer come from mcp-live.ts.
 */

type Params = { tool: string };

export const dynamicParams = false;

export const generateStaticParams = (): Params[] =>
    mcpManifest().tools.map(tool => ({ tool: tool.slug }));

const findTool = (slug: string) => mcpManifest().tools.find(tool => tool.slug === slug);

export const generateMetadata = async ({ params }: { params: Promise<Params> }) => {
    const tool = findTool((await params).tool);
    if (!tool) return {};
    return pageMetadata({
        title: `${tool.name} — Continuum MCP tool`,
        absoluteTitle: true,
        description: clip(
            `${tool.title}, a tool of Continuum's MCP server: ${toolSummary(tool.description)}`,
        ),
        path: toolPath(tool.slug),
    });
};

/** One argument: its name, whether it must be given, its type and what it means. */
const Argument = ({
    name,
    type,
    required,
    description,
}: {
    name: string;
    type: string;
    required: boolean;
    description: string;
}) => (
    <Row className="gap-1.5">
        <span className="flex flex-wrap items-center gap-2">
            <RowName mono>{name}</RowName>
            <Badge tone={required ? 'primary' : 'neutral'}>
                {required ? 'required' : 'optional'}
            </Badge>
        </span>
        <RowText className="font-mono">{type}</RowText>
        {description && (
            <RowText className="text-neutral-700">
                <Inline text={description} />
            </RowText>
        )}
    </Row>
);

const ToolPage = async ({ params }: { params: Promise<Params> }) => {
    const tool = findTool((await params).tool);
    if (!tool) notFound();
    const live = liveTool(tool.name);
    const path = toolPath(tool.slug);
    // The description's whole first sentence, never cut: the page opens with it.
    const lead = `${tool.name} is a tool of Continuum's MCP server. ${firstSentence(tool.description)}`;
    const answer = live?.output ? clipAnswer(live.output) : '';
    const clipped = live?.output ? answer !== live.output.trim() : false;

    return (
        <>
            <JsonLd
                data={techArticleLd({
                    headline: `${tool.name} — Continuum MCP tool`,
                    description: lead,
                    path,
                })}
            />
            <PageHero
                crumbs={[
                    { name: 'AI', path: '/ai' },
                    { name: 'MCP server', path: '/ai/mcp-server' },
                    { name: tool.name, path },
                ]}
                eyebrow="MCP tool"
                lead={lead}
                title={<span className="font-mono">{tool.name}</span>}
            />
            <Article>
                <ArticleSection
                    description="As the agent reads it when it chooses a tool."
                    id="what-it-does"
                    tight
                    title="What it does"
                >
                    <Markdown source={tool.description} />
                </ArticleSection>

                <ArticleSection
                    description={
                        live && live.args.length > 0
                            ? `${live.args.length} ${live.args.length === 1 ? 'argument' : 'arguments'}, ${live.args.filter(arg => arg.required).length} of them required, as the server declares them.`
                            : 'None.'
                    }
                    id="arguments"
                    tight
                    title="Arguments"
                >
                    {live && live.args.length > 0 && (
                        <DividedList>
                            {live.args.map(arg => (
                                <Argument key={arg.name} {...arg} />
                            ))}
                        </DividedList>
                    )}
                </ArticleSection>

                {live?.example && (
                    <ArticleSection
                        description="A call an agent makes, and what the server answers: run against the built server when this page was made."
                        id="example"
                        tight
                        title="Example"
                    >
                        <H>The call</H>
                        <CodeBlock code={callText(tool.name, live.example)} />
                        <H>The answer</H>
                        {clipped && (
                            <P>
                                Cut for the page: long values and lists are shortened, and the rest
                                of the answer is counted at its end.
                            </P>
                        )}
                        <CodeBlock code={answer} />
                    </ArticleSection>
                )}
            </Article>
            <PrevNext groups={mcpToolOrder()} label="MCP tools" path={path} />
        </>
    );
};

export default ToolPage;
