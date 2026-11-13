/*
 * The system's written half, read from the skill's markdown and the playground's sources that
 * build.mjs embeds. Every lookup tool reads through here, so a change to the skill reaches the
 * server on the next build without a line changed in it.
 */

export {
    type ComponentMatch,
    type ComponentSummary,
    closestNames,
    findComponent,
    listComponents,
} from './components';
export { type InUse, inUseOf, type Knob, knobsOf, renderKnobs } from './entries';
export { reference, skill } from './files';
export { foundation, foundationTopics } from './foundations';
export { render, type Section, sections } from './markdown';
export { type PageKind, pageKind, pageKinds } from './pages';
export { componentsNamedIn, findPatterns, type PatternMatch, patternRows } from './patterns';
