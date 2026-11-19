/*
 * The content loaders, server-only, read from the repository at build time. Import from here:
 *
 *     import { componentsWithEntries, foundationTopics, mcpManifest } from '@/lib/content';
 *
 * - references: sections(file), componentGroups(), components(), component(slug), charts(),
 *   pages(), foundationTopics(), readme(), referenceMarkdown(file)
 * - entries: entryInfos(), entryInfo(id), entriesFor(component), componentsWithEntries(),
 *   chartsWithEntries()
 * - screens: screenInfos(), blockInfos()
 * - inventory: inventory() (what ships, counted), showcaseComponents()
 * - mcp: mcpManifest()
 * - skills: skills(), skill(name)
 * - markdown: parseMarkdown, fullBody, findSection, plainText, firstSentence, clip
 * - slugs: kebab, headingSlug (also safe on the client, from '@/lib/content/slugs')
 */
export * from './entries';
export * from './inventory';
export * from './markdown';
export * from './mcp';
export * from './references';
export * from './screens';
export * from './skills';
export * from './slugs';
