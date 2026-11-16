'use client';

import { CalendarDays, CircleDot, Inbox, type LucideIcon, Siren } from 'lucide-react';
import type { ReactNode } from 'react';
import { IncidentScreen } from './incident';
import { IssuesScreen } from './issues';
import { PlannerScreen } from './planner';
import { SupportScreen } from './support';

/*
 * The hero's screens: four kinds of tool built with Continuum (an incident, a support conversation,
 * a week planner, an issue cycle), each a different page kind, in the same window. Each fills its parent and is drawn as a still
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
        id: 'incident',
        title: 'Incident',
        product: 'Observability',
        icon: Siren,
        render: () => <IncidentScreen />,
    },
    {
        id: 'support',
        title: 'Conversation',
        product: 'Support',
        icon: Inbox,
        render: () => <SupportScreen />,
    },
    {
        id: 'planner',
        title: 'Week 48',
        product: 'Scheduling',
        icon: CalendarDays,
        render: () => <PlannerScreen />,
    },
    {
        id: 'issues',
        title: 'Cycle 24',
        product: 'Issues',
        icon: CircleDot,
        render: () => <IssuesScreen />,
    },
];
