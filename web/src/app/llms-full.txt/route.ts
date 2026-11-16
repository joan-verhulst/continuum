import { referenceMarkdown } from '@/lib/content';
import { absolute, brand, tagline } from '@/lib/site';

/*
 * /llms-full.txt: the continuum-taste skill's references in one file, for an agent that wants the
 * whole system at once. They are the system's own words, read where they live; each keeps its own
 * # heading, and a rule sets the files apart.
 */

export const dynamic = 'force-static';

const files = ['foundations', 'pages', 'components', 'patterns', 'charts'] as const;

export const GET = () => {
    const head = [
        `# ${brand.name}: the full reference`,
        `> ${tagline}`,
        `The values (foundations), the composition (pages), the parts (components), the recipes (patterns) and the charts, as the continuum-taste skill states them. Each page of ${absolute('/')} has its own markdown twin; the index is ${absolute('/llms.txt')}.`,
    ].join('\n\n');
    const text = [head, ...files.map(file => referenceMarkdown(file).trim())].join('\n\n---\n\n');
    return new Response(`${text}\n`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
};
