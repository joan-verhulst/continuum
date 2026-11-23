import 'server-only';
import { examples, kindLead } from '@/app/examples/content';
import type { LinkRow } from '@/components/link-list';
import { charts, components, foundationTopics, plainText } from '@/lib/content';

/*
 * The links between sections, all read from the references' own words: an example lists the parts it
 * is built from, a component the examples that use it and the foundations its spec leans on, a
 * foundation the parts it names and the examples it shapes. Nothing is listed by hand.
 */

/** A component's name as it is written in running text: 'StatCard' → 'stat card'. */
const spoken = (name: string) =>
    name
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .replace(/-/g, ' ');

// Names too common in prose to mean the component ("a menu", "a card's corners" do).
const tooCommon = new Set(['separator', 'page content']);

/** Running text as `spoken` writes names, so "StatCard" and "stat cards" both read as "stat card". */
const spokenText = (text: string) => spoken(plainText(text));

/** Whether text (already through `spokenText`) names a part, 'StatCard' as "stat card(s)". */
const namesPart = (text: string, part: string) => {
    const words = spoken(part);
    if (tooCommon.has(words) || words.length < 3) return false;
    return new RegExp(`\\b${words.replace(/ /g, '\\s+')}(s|es)?\\b`).test(text);
};

/** The components and charts a text names, in the references' order. */
export const partsNamedIn = (source: string, skip?: string): LinkRow[] => {
    const text = spokenText(source);
    return [
        ...components()
            .filter(item => item.parts.some(part => namesPart(text, part)))
            .map(item => ({
                href: `/components/${item.slug}`,
                title: item.title,
                meta: item.group,
                description: item.summary,
            })),
        ...charts()
            .charts.filter(item => item.parts.some(part => namesPart(text, part)))
            .map(item => ({
                href: `/charts/${item.slug}`,
                title: item.title,
                meta: 'Charts',
                description: item.summary,
            })),
    ].filter(row => row.href !== skip);
};

// Which words in a spec mean it leans on a foundation. Each topic is listed when its own vocabulary
// shows up, so a spec that states corners links to Radius and one that states paddings to Spacing.
const topicWords: Record<string, RegExp> = {
    colour: /\bcolou?rs?\b|\bwash\b|\baccent\b|\bneutral-\d/i,
    type: /\bfont\b|\bweights?\b|\btype (size|scale)\b|\b1[1-6]px\b|\btext-(xxs|xs|sm|base)\b/i,
    'surfaces-and-depth': /\bshadows?\b|\bsurfaces?\b|\braised\b|\bhairlines?\b/i,
    radius: /\bradius\b|\bcorners?\b|\brounded\b/i,
    spacing: /\bpadding\b|\bgaps?\b|\bspacing\b|\binset\b/i,
    heights: /\bheights?\b|\b\d+ high\b/i,
    icons: /\bicons?\b/i,
    states: /\bhover\b|\bfocus\b|\bdisabled\b|\bpressed\b/i,
    motion: /\bmotion\b|\banimat|\btransitions?\b|\b\d+ ?ms\b/i,
    layout: /\bwidths?\b|\bcolumns?\b|\bnarrow\b|\bbreakpoints?\b/i,
};

/** The foundations a text's words lean on, as markdown links in foundations.md's order. */
export const foundationsFor = (text: string) =>
    foundationTopics()
        .filter(topic => topicWords[topic.slug]?.test(text))
        .map(topic => ({ name: topic.name, href: `/foundations/${topic.slug}` }));

/** The screens a foundation shapes: those whose page kind's anatomy uses the topic's words. */
export const examplesFor = (slug: string): LinkRow[] => {
    const words = topicWords[slug];
    if (!words) return [];
    return examples().flatMap(example =>
        example.pageKind && words.test(example.pageKind.body)
            ? [
                  {
                      href: `/examples/${example.path}`,
                      title: example.title,
                      meta: example.label,
                      description: kindLead(example.pageKind),
                  },
              ]
            : [],
    );
};

/** "A, B and C" as markdown links. */
export const linkSentence = (links: readonly { name: string; href: string }[]) => {
    const md = links.map(link => `[${link.name}](${link.href})`);
    return md.length > 1 ? `${md.slice(0, -1).join(', ')} and ${md.at(-1)}` : (md[0] ?? '');
};
