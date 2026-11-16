import type { ReactNode } from 'react';
import { SectionMain } from '@/components/page-frame';

/* The section's pages wear the site's one frame: the board on top, the content under it, no sidebar. */
const ExamplesLayout = ({ children }: { children: ReactNode }) => (
    <SectionMain>{children}</SectionMain>
);

export default ExamplesLayout;
