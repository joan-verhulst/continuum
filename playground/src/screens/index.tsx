import type { ReactNode } from 'react';
import { Agent } from './agent';
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
 * Seven generic screens of one app, built from the system alone. They follow the
 * playground's mode and the theme of the current project, every colour, corner
 * and font of them. Shown live, they lead into each other: the sidebar, a row,
 * the breadcrumb and a form's actions open the screen they name.
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
            'Search and filters over a ruled table, views in the dock, rows to select, and pages at the foot.',
        render: () => <Customers />,
    },
    {
        id: 'detail',
        title: 'Detail',
        description:
            'One record: what it is, what to do with it, its facets in tabs, and its history in a sheet.',
        render: () => <CustomerDetail />,
    },
    {
        id: 'form',
        title: 'Form',
        description:
            'The company, its plan, billing and first user in short sections, and one action at the end.',
        render: () => <NewCustomer />,
    },
    {
        id: 'settings',
        title: 'Settings',
        description:
            'The areas in the dock, a card per group with a row per setting, and the plan in force under Billing.',
        render: () => <Settings />,
    },
    {
        id: 'agent',
        title: 'Agent',
        description:
            'A large prompt with the recent chats under it; a question turns the page into the conversation, the reply written out as it comes.',
        render: () => <Agent />,
    },
    {
        id: 'sign-in',
        title: 'Sign in',
        description: 'One card on the canvas: the email and password, and a way in without them.',
        render: () => <SignIn />,
    },
];
