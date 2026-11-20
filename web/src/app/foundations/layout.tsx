import type { ReactNode } from 'react';
import { DocsShell } from '@/components/docs/docs-shell';

/* The section is part of the docs: its pages sit in the docs' shell, the sidebar beside them and the trail over them. */
const FoundationsLayout = ({ children }: { children: ReactNode }) => (
    <DocsShell>{children}</DocsShell>
);

export default FoundationsLayout;
