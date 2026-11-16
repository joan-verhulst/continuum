// The playground's Vite imports, typed as Vite's client types type them there (see next.config.ts).
declare module '*?raw' {
    const text: string;
    export default text;
}

declare module '*.svg' {
    const url: string;
    export default url;
}
