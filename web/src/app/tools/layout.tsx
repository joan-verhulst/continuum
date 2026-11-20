import type { ReactNode } from 'react';
import { ToolsShell } from '@/components/docs/docs-shell';

/* The tools have a shell of their own, the docs' frame listing only the tools: the sidebar beside them and the trail over them. */
const ToolsLayout = ({ children }: { children: ReactNode }) => <ToolsShell>{children}</ToolsShell>;

export default ToolsLayout;
