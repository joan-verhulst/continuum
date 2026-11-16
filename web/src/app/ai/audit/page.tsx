import { Badge } from 'continuum';
import Link from 'next/link';
import { ArticleSection, C, DividedList, Figure, H, P } from '@/components/article';
import { CodeBlock } from '@/components/code-block';
import { FaqSection } from '@/components/faq-section';
import { Article, PageHero, PrevNext } from '@/components/page-frame';
import { type Faq, JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';
import { Row, RowText } from '../_components/rows';
import { auditedFile } from '../_lib/examples';
import { liveTool } from '../_lib/mcp-live';
import { aiWays, toolPath } from '../_lib/nav';

/*
 * The audit: Continuum's consistency check for UI that already exists. The worked example is real:
 * the toolbar in _lib/examples.ts is audited by the built server at build time (mcp-live.ts), so
 * the findings on this page are the ones an agent gets today.
 */

type Finding = {
    at?: string;
    rule: string;
    severity: 'fix' | 'advise';
    confidence: 'high' | 'medium' | 'low';
    property?: string;
    found: string;
    expected: string;
    why: string;
    fix?: Record<string, string>;
};

type Audit = {
    summary: { fix: number; advise: number; byRule: Record<string, number> };
    findings: Finding[];
    notes?: string[];
};

/** The example audit, as audit_source answered it at build time. */
const exampleAudit = (): Audit | undefined => {
    const output = liveTool('audit_source')?.output;
    if (!output) return undefined;
    try {
        return JSON.parse(output) as Audit;
    } catch {
        return undefined;
    }
};

const lead =
    "Continuum's audit is a consistency check for UI that already exists: it reads source files or a rendered page in any stack and says, in units, what is off, what Continuum wants, why, and the fix written for the file.";

export const metadata = pageMetadata({
    title: 'Design system audit for UI in any stack',
    description:
        'An audit an AI agent runs on existing UI: heights, corners, colours, type, shadows and spacing against Continuum, in React, Angular, Vue, Svelte, HTML, CSS, Qt or a canvas.',
    path: '/ai/audit',
});

const linkClass =
    'text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950';

const checks = [
    {
        name: 'Values',
        severity: 'fix',
        text: 'Heights off the two control rows, corners off the named steps, colours that are not a role of the theme, a third type weight, a size off the scale, shadows on what does not float, borders thicker than a hairline, padding off the spacing formula.',
    },
    {
        name: 'Parts',
        severity: 'advise',
        text: 'A hand-built element the system has a part for (a <button>, an <input>, a <table>, a badge), with the call that gives that part’s spec.',
    },
    {
        name: 'Structure',
        severity: 'advise',
        text: 'More than one primary action, containers nested in containers, tabs where the dock goes, dividers between sections, a page without its title. Read from a rendered tree, not from source.',
    },
] as const;

const faqs: Faq[] = [
    {
        question: 'Which stacks can the audit read?',
        answer: 'Source in any language: CSS, SCSS, Less, Sass, Qt stylesheets and QML, style blocks and attributes in any markup, CSS in template literals, style objects and utility classes, and colour literals anywhere. Rendered UI from any framework through a snapshot script run in the page, and Paper or Figma canvases through their computed styles.',
    },
    {
        question: 'Does the audit change my code?',
        answer: 'No. It returns findings; the agent applies them. Each finding carries its fix in the form the file uses, a utility class where the file wrote one and a declaration where it wrote one.',
    },
    {
        question: 'What can the audit not read?',
        answer: 'A size written as code rather than as a property and a value or a utility class, such as height(36.dp). Source shows what is written, not what renders, so spacing between parts and contrast on the real surfaces need the rendered audit.',
    },
];

const AuditPage = () => {
    const audit = exampleAudit();
    const first = audit?.findings[0];
    return (
        <>
            <JsonLd
                data={[
                    techArticleLd({
                        headline: 'Design system audit for UI in any stack',
                        description: lead,
                        path: '/ai/audit',
                    }),
                ]}
            />
            <PageHero
                crumbs={[
                    { name: 'AI', path: '/ai' },
                    { name: 'Audit', path: '/ai/audit' },
                ]}
                eyebrow="AI"
                lead={lead}
                title="Audit"
            />
            <Article>
                <ArticleSection
                    description="Every input becomes the same facts, judged by one set of rules."
                    id="how-it-reads"
                    tight
                    title="How it reads"
                >
                    <P>
                        <Link className={linkClass} href={toolPath('audit-source')}>
                            <C>audit_source</C>
                        </Link>{' '}
                        reads source files in any language: style declarations in any syntax (CSS,
                        SCSS, Less, QSS, QML, inline styles, style objects), utility classes, colour
                        literals and raw elements.{' '}
                        <Link className={linkClass} href={toolPath('audit-ui')}>
                            <C>audit_ui</C>
                        </Link>{' '}
                        reads what is rendered: a running page through{' '}
                        <Link className={linkClass} href={toolPath('get-snapshot-script')}>
                            <C>get_snapshot_script</C>
                        </Link>
                        , a canvas through Paper's or Figma's computed styles, or facts another tool
                        has already extracted.
                    </P>
                    <P>
                        Each value becomes a fact: a property, its value, what it sits on, how it
                        was written. One set of rules judges every fact the same way, so a button in
                        Vue and a button in QML are held to the same 34.
                    </P>
                </ArticleSection>

                <ArticleSection
                    description={`${checks.length} kinds of finding: values are fixed, the rest is advice.`}
                    id="what-it-finds"
                    tight
                    title="What it finds"
                >
                    <DividedList>
                        {checks.map(check => (
                            <Row className="gap-1.5" key={check.name}>
                                <span className="flex items-center gap-2">
                                    <span className="font-medium text-neutral-950 text-sm">
                                        {check.name}
                                    </span>
                                    <Badge tone={check.severity === 'fix' ? 'primary' : 'neutral'}>
                                        {check.severity}
                                    </Badge>
                                </span>
                                <RowText className="text-neutral-700">{check.text}</RowText>
                            </Row>
                        ))}
                    </DividedList>
                </ArticleSection>

                {audit && (
                    <ArticleSection
                        description={`A toolbar as a codebase has it before Continuum, read by audit_source: ${audit.summary.fix} fixes and ${audit.summary.advise} advice.`}
                        id="example"
                        tight
                        title="An example"
                    >
                        <Figure caption={`${auditedFile.path}, the file the audit reads.`}>
                            <CodeBlock code={auditedFile.content.trimEnd()} />
                        </Figure>
                        <DividedList>
                            {audit.findings.map((finding, index) => (
                                <Row
                                    className="gap-1.5"
                                    // A finding has no id; the audit's order is stable.
                                    // biome-ignore lint/suspicious/noArrayIndexKey: the list never reorders
                                    key={index}
                                >
                                    <span className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-neutral-950 text-sm">
                                            {finding.found} → {finding.expected}
                                        </span>
                                        <Badge
                                            tone={
                                                finding.severity === 'fix' ? 'primary' : 'neutral'
                                            }
                                        >
                                            {finding.severity} · {finding.confidence}
                                        </Badge>
                                    </span>
                                    <RowText>{finding.why}</RowText>
                                    {finding.fix && (
                                        <RowText className="font-mono text-neutral-800">
                                            {finding.fix.tailwind ??
                                                finding.fix.code ??
                                                finding.fix.css}
                                        </RowText>
                                    )}
                                </Row>
                            ))}
                        </DividedList>
                        {first && (
                            <>
                                <H>One finding, as the agent gets it</H>
                                <P>
                                    Where it is, the rule, how sure the audit is, what it found and
                                    what Continuum wants, why, and the fix in each form the file
                                    might use.
                                </P>
                                <CodeBlock code={JSON.stringify(first, null, 2)} />
                            </>
                        )}
                    </ArticleSection>
                )}

                <ArticleSection
                    description="By severity and confidence, then again until the audit is clean."
                    id="how-an-agent-takes-them"
                    tight
                    title="How an agent takes the findings"
                >
                    <P>
                        Fixes of high confidence it applies; medium ones it applies and looks at;
                        low ones (a colour far from every token, perhaps a brand's) it asks about.
                        Advice (two primary actions, nested containers, tabs that belong in the
                        dock) it proposes with the reason before changing anything.
                    </P>
                    <P>
                        Then it audits again until clean, and looks at the result in light and dark.
                        The <C>improve_ui</C> prompt of the{' '}
                        <Link className={linkClass} href="/ai/mcp-server#prompts">
                            MCP server
                        </Link>{' '}
                        runs this loop.
                    </P>
                </ArticleSection>

                <ArticleSection
                    description="Where the audit stops, so an agent knows to look."
                    id="what-it-cannot-read"
                    tight
                    title="What it cannot read"
                >
                    <P>
                        Sizes are read where they are written as a property and a value, or as a
                        utility class; a size written as code (<C>height(36.dp)</C>) is not. Colours
                        are read in any language. A value whose subject it cannot tell (a hex in a
                        constant) is judged less surely.
                    </P>
                    <P>
                        Source shows what is written, not what renders: spacing between parts, the
                        page kind and contrast on the real surfaces need <C>audit_ui</C> on the
                        running page.
                    </P>
                </ArticleSection>

                {/* The questions, and the same as FAQPage data. */}
                <FaqSection description={`${faqs.length} questions about the audit.`} faqs={faqs} />
            </Article>
            <PrevNext groups={aiWays()} label="AI" path="/ai/audit" />
        </>
    );
};

export default AuditPage;
