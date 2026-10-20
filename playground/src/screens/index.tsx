import type { ThemeMode, ThemeName } from 'personal-design-system';
import type { ReactNode } from 'react';
import { AnalyticsOverview } from './analytics-overview';
import { CheckoutFunnel } from './checkout-funnel';
import { InvoiceEditor } from './invoice-editor';
import { ReportGenerator } from './report-generator';
import { RiskReport } from './risk-report';
import { SequenceEditor } from './sequence-editor';

export type Screen = {
    id: string;
    title: string;
    theme: ThemeName;
    mode: ThemeMode;
    render: () => ReactNode;
};

/** The original Figma screens rebuilt from the system, each with the theme it was drawn in. */
export const screens: Screen[] = [
    {
        id: 'analytics-overview',
        title: 'Analytics overview',
        theme: 'eyes',
        mode: 'light',
        render: () => <AnalyticsOverview />,
    },
    {
        id: 'checkout-funnel',
        title: 'Checkout funnel',
        theme: 'eyes',
        mode: 'light',
        render: () => <CheckoutFunnel />,
    },
    {
        id: 'invoice-editor',
        title: 'Invoice editor',
        theme: 'stone',
        mode: 'dark',
        render: () => <InvoiceEditor />,
    },
    {
        id: 'report-generator',
        title: 'Report generator',
        theme: 'lime',
        mode: 'light',
        render: () => <ReportGenerator />,
    },
    {
        id: 'sequence-editor',
        title: 'Sequence editor',
        theme: 'indigo',
        mode: 'light',
        render: () => <SequenceEditor />,
    },
    {
        id: 'risk-report',
        title: 'Risk report',
        theme: 'electric',
        mode: 'light',
        render: () => <RiskReport />,
    },
];
