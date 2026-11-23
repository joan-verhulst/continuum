'use client';

import { CalendarDays, CircleDot, Inbox, type LucideIcon, Sheet, Siren } from 'lucide-react';
import type { ReactNode } from 'react';
import { ForecastScreen } from './forecast';
import { IncidentScreen } from './incident';
import { IssuesScreen } from './issues';
import { PlannerScreen } from './planner';
import { SupportScreen } from './support';

/*
 * The hero's screens: five kinds of tool built with Continuum (an incident, a support conversation,
 * a week planner, an issue cycle, a forecast sheet), each a different page kind,
 * in the same window. Each fills its parent and works as the app does: it can be clicked, typed in
 * and scrolled, and its menus open in the hero's theme.
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
    {
        id: 'forecast',
        title: 'Forecast',
        product: 'Sales',
        icon: Sheet,
        render: () => <ForecastScreen />,
    },
];
