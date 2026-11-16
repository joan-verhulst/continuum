import { absolute, brand, tagline } from '@/lib/site';
import { twinGroups, twins } from '../md/twins';

/*
 * /llms.txt (llmstxt.org): the site for a language model, as one markdown file. The project's name,
 * a summary, then every page grouped by section, each a link to its markdown twin with one line on
 * what it holds. Built from the same list as the twins, so it names every page the site builds.
 */

export const dynamic = 'force-static';

export const GET = () => {
    const all = twins();
    const groups = twinGroups
        .map(group => {
            const items = all.filter(t => t.group === group);
            if (items.length === 0) return '';
            const lines = items.map(
                t => `- [${t.title}](${absolute(`${t.path}.md`)}): ${t.summary}`,
            );
            return `## ${group}\n\n${lines.join('\n')}`;
        })
        .filter(Boolean);
    const text = [
        `# ${brand.name}`,
        `> ${tagline}`,
        `${brand.name} is quiet, dense tool UI: 13px type in two weights, 1px hairline borders, one action colour, controls 34 or 38 high, a 4px spacing scale, light and dark. Its rules are written in units, so they apply in React (where it ships as a component library on Base UI and Tailwind CSS v4), in other stacks and on a design canvas. Every page below has a markdown twin at its address plus .md, and the whole reference is one file at ${absolute('/llms-full.txt')}. Its short name, for anything typed, is ${brand.short}.`,
        ...groups,
        `## Optional\n\n- [Everything in one file](${absolute('/llms-full.txt')}): the system's references (foundations, pages, components, patterns, charts) in one document.`,
    ].join('\n\n');
    return new Response(`${text}\n`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
};
