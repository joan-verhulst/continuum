import 'server-only';
import { charts, components, plainText } from '@/lib/content';
import type { Faq } from '@/lib/seo';

/*
 * What a component or chart page reads out of its entry in the references, beyond the loaders: the
 * For / Not for / With paragraph as questions a reader (or an answer engine) asks, the spec without
 * that paragraph, and the other parts the spec names.
 */

export type Uses = { for?: string; notFor?: string; with?: string };

const usesPattern = /\*\*(For|Not for|With)\*\*/g;

/** The paragraph an entry opens with, **For** … **Not for** … **With** …, split into its three. */
export const usesOf = (body: string): { uses: Uses; rest: string } => {
    const start = body.search(/(^|\n)\*\*For\*\*/);
    if (start < 0) return { uses: {}, rest: body };
    const from = body.indexOf('**For**', start);
    // The paragraph ends at a blank line, or where a list or a table starts straight under it.
    const tail = body.slice(from);
    const stop = tail.search(/\n\s*\n|\n\s*[-|] /);
    const paragraph = stop < 0 ? tail : tail.slice(0, stop);
    const rest = `${body.slice(0, from)}${tail.slice(paragraph.length)}`.trim();
    const uses: Uses = {};
    const marks = [...paragraph.matchAll(usesPattern)];
    marks.forEach((mark, i) => {
        const at = (mark.index ?? 0) + mark[0].length;
        const end = marks[i + 1]?.index ?? paragraph.length;
        const text = paragraph.slice(at, end).replace(/\s+/g, ' ').trim();
        const key = mark[1] === 'For' ? 'for' : mark[1] === 'Not for' ? 'notFor' : 'with';
        uses[key] = text;
    });
    return { uses, rest };
};

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const sentence = (text: string) => capital(text.replace(/[.\s]+$/, '')).concat('.');

/** The For / Not for / With lines as questions and answers, plain text for FAQPage data. */
export const faqsOf = (name: string, uses: Uses): Faq[] => {
    const faqs: Faq[] = [];
    if (uses.for)
        faqs.push({
            question: `When should I use ${name}?`,
            answer: sentence(`For ${plainText(uses.for)}`),
        });
    if (uses.notFor) {
        faqs.push({
            question: `When should I not use ${name}?`,
            answer: sentence(`Not for ${plainText(uses.notFor)}`),
        });
    }
    if (uses.with) {
        faqs.push({
            question: `What does ${name} go with?`,
            answer: sentence(plainText(uses.with)),
        });
    }
    return faqs;
};

export type Related = { name: string; href: string };

/** Every component and chart by each name it goes by, for finding the ones a spec mentions. */
const byName = () => {
    const map = new Map<string, Related>();
    for (const item of components()) {
        for (const part of item.parts)
            map.set(part, { name: item.name, href: `/components/${item.slug}` });
    }
    for (const item of charts().charts) {
        for (const part of item.parts)
            map.set(part, { name: item.name, href: `/charts/${item.slug}` });
    }
    return map;
};

/** Each component's and chart's page, to its one-line summary. */
export const summaries = (): ReadonlyMap<string, string> =>
    new Map([
        ...components().map(item => [`/components/${item.slug}`, item.summary] as const),
        ...charts().charts.map(item => [`/charts/${item.slug}`, item.summary] as const),
    ]);

/** The other components and charts a spec names, in the order it first names them. */
export const relatedTo = (body: string, self: string): Related[] => {
    const map = byName();
    const found = new Map<string, Related>();
    for (const match of body.matchAll(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g)) {
        const hit = map.get(match[0]);
        if (!hit || hit.href === self || found.has(hit.href)) continue;
        found.set(hit.href, hit);
    }
    return [...found.values()];
};
