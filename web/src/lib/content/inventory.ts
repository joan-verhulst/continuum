import 'server-only';
import { entryInfos } from './entries';
import { mcpManifest } from './mcp';
import { skills } from './skills';

/*
 * What Continuum ships, counted from the sources: the components and charts are the showcase's
 * entries (the interaction patterns, which are behaviour rather than parts, left out), the tools the
 * MCP server's manifest, the skills their folders. Every page that states a count reads it here, so
 * the figures agree. The states, which need the entries' knobs, are counted on the client with
 * `knobStates` from the showcase's kit.
 */

/** The showcase's components: its parts and its charts, in the playground's categories. */
export const showcaseComponents = () => entryInfos().filter(e => e.category !== 'interaction');

export type Inventory = {
    /** Parts and charts together. */
    components: number;
    charts: number;
    tools: number;
    skills: number;
};

export const inventory = (): Inventory => {
    const all = showcaseComponents();
    return {
        components: all.length,
        charts: all.filter(e => e.category === 'charts').length,
        tools: mcpManifest().tools.length,
        skills: skills().length,
    };
};
