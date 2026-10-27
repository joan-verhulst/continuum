import type { ReactNode } from 'react';
import { CustomerDetail } from './customer';
import { Customers } from './customers';
import { NewCustomer } from './new-customer';
import { Overview } from './overview';
import { Settings } from './settings';
import { SignIn } from './sign-in';

export type Screen = {
    id: string;
    title: string;
    description: string;
    /** `still` draws it as a shot: nothing opens on its own. */
    render: (still?: boolean) => ReactNode;
};

/**
 * Six generic screens of one app, built from the system alone. They follow the
 * playground's mode and the theme previewed from the pill, every colour, corner
 * and font of them.
 */
export const screens: Screen[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Four numbers, revenue over twelve weeks, where it comes from and what moved.',
        render: () => <Overview />,
    },
    {
        id: 'list',
        title: 'List',
        description:
            'Search and filters over a ruled table, rows to select, and pages at the foot.',
        render: () => <Customers />,
    },
    {
        id: 'detail',
        title: 'Detail',
        description:
            'One record: what it is, what to do with it, its numbers, what happened and its facts.',
        render: () => <CustomerDetail />,
    },
    {
        id: 'form',
        title: 'Form',
        description: 'Three short sections of fields, a choice of plan, and one action at the end.',
        render: () => <NewCustomer />,
    },
    {
        id: 'settings',
        title: 'Settings',
        description:
            'A row per setting with its control at the end, grouped, and the plan in a card.',
        render: () => <Settings />,
    },
    {
        id: 'sign-in',
        title: 'Sign in',
        description: 'One card on the canvas: the email and password, and a way in without them.',
        render: () => <SignIn />,
    },
];
