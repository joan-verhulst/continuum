/** Text files embedded at build time (build.mjs): a stylesheet or markdown read as a string. */
declare module '*?raw' {
    const text: string;
    export default text;
}

/**
 * The system's written half, embedded at build time by build.mjs, each map keyed by the path
 * relative to its folder ('components.md', 'media/react.md', 'button.tsx').
 */
declare module 'virtual:knowledge' {
    /** .claude/skills/continuum-taste/SKILL.md */
    export const skill: string;
    /** .claude/skills/continuum-taste/references/**.md (screens excluded) */
    export const references: Record<string, string>;
    /** playground/src/showcase/entries/*.tsx: a component's knobs and in-use piece */
    export const entries: Record<string, string>;
    /** src/components/*.tsx: the library's components */
    export const components: Record<string, string>;
    /** playground/src/screens/**.tsx: the reference screens */
    export const screens: Record<string, string>;
}
