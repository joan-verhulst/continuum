import { ChartNoAxesCombined, CircleDot, Handshake, Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { AnalyticsScreen } from './analytics';
import { IssuesScreen } from './issues';
import { PipelineScreen } from './pipeline';
import { SupportScreen } from './support';

/*
 * The hero's screens: four products of one suite, each a different kind of tool, all in the
 * same frame so they read as one workspace. Each fills its parent and is drawn as a still
 * picture: nothing in it opens a portal.
 */

export type HeroScreen = {
    id: string;
    title: string;
    product: string;
    icon: LucideIcon;
    render: () => ReactNode;
};

export const heroScreens: HeroScreen[] = [
    {
        id: 'analytics',
        title: 'Traffic',
        product: 'Analytics',
        icon: ChartNoAxesCombined,
        render: () => <AnalyticsScreen />,
    },
    {
        id: 'support',
        title: 'Conversation',
        product: 'Support',
        icon: Inbox,
        render: () => <SupportScreen />,
    },
    {
        id: 'pipeline',
        title: 'Q4 pipeline',
        product: 'Sales',
        icon: Handshake,
        render: () => <PipelineScreen />,
    },
    {
        id: 'issues',
        title: 'Cycle 24',
        product: 'Issues',
        icon: CircleDot,
        render: () => <IssuesScreen />,
    },
];
