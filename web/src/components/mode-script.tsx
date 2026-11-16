import { modeStorageKey } from './mode-key';

/*
 * Sets the mode before the first paint, so the page never flashes the wrong one. The site opens
 * dark: light only for a reader who chose it, and the landing (/) is dark whatever the choice.
 * Rendered twice: in <head>, where it sets <html data-mode> (the canvas <html> paints), and as the
 * first child of the site's Theme, where it also sets the Theme's own element, which exists by then
 * and holds everything after it. React then hydrates with the same value, read by `useMode`.
 */
const script = `(function(){try{var m='dark';try{m=localStorage.getItem(${JSON.stringify(modeStorageKey)})==='light'?'light':'dark'}catch(e){}if(location.pathname==='/')m='dark';document.documentElement.setAttribute('data-mode',m);var p=document.currentScript&&document.currentScript.parentElement;if(p&&p!==document.head)p.setAttribute('data-mode',m)}catch(e){}})()`;

/** The no-flash mode script; render it in <head> and as the first child inside <SiteTheme>. */
export const ModeScript = () => (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: a fixed script of the site's own
    <script dangerouslySetInnerHTML={{ __html: script }} />
);
