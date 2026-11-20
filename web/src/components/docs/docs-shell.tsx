import type { ReactNode } from 'react';
import { docsNav, toolsNav } from '@/lib/docs-nav';
import { DocsFrame } from './docs-frame';

/*
 * The shells round the site's reference pages, each its map built here on the server from the
 * content and handed to the frame that draws the sidebar and the top bar round the page. The docs
 * sections (Docs, Foundations, Components, Charts, Examples, AI) share one; the tools, a thing of
 * their own, have their own, listing only the tools.
 */
export const DocsShell = ({ children }: { children: ReactNode }) => (
    <DocsFrame nav={docsNav()}>{children}</DocsFrame>
);

export const ToolsShell = ({ children }: { children: ReactNode }) => (
    <DocsFrame nav={toolsNav()}>{children}</DocsFrame>
);
