'use client';

import {
    Badge,
    BottomBar,
    Button,
    Card,
    cn,
    Dock,
    DockAction,
    DockCount,
    DockItem,
    FilterMenu,
    FilterMenuTrigger,
    Input,
    PageContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableSearch,
    TableToolbar,
    TableToolbarEnd,
    Tabs,
    TabsCount,
    TabsList,
    TabsTrigger,
} from '@contui/ui';
import { Download, ListFilter, Plus, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Frame,
    formatEuro,
    type Initials,
    icon,
    PageHead,
    PersonName,
} from '../hero-screens/shell';

/** The size the screen is drawn at, its real size: a laptop window, about as tall as the film is. */
export const SCREEN = { width: 1240, height: 1000 } as const;

/** Where the screen is in its repair: each fault, as an agent built it, until it is fixed. */
export type Repair = {
    /** Export has gone secondary, leaving New customer the one primary. */
    answered: boolean;
    /** The views have left the tabs for the dock, New customer with them as its action. */
    docked: boolean;
    /** Search and the filter are on the table's own bar. */
    toolbar: boolean;
    /** The card the table was wrapped in is gone. */
    uncarded: boolean;
    /** The rows are back to the table's own height. */
    tight: boolean;
};

/** A part of the screen a film can point the camera at or mark as a finding. */
export type Region = 'head' | 'actions' | 'tabs' | 'search' | 'table' | 'rows' | 'dock';

const views = [
    ['All', 248],
    ['Active', 201],
    ['Trial', 31],
    ['Past due', 9],
] as const;

type Status = 'Active' | 'Trial' | 'Past due';

const customers: [string, Initials, string, number, Status][] = [
    ['Harbour & Co', 'MC', 'Business', 1240, 'Active'],
    ['Northwind Labs', 'LO', 'Team', 480, 'Active'],
    ['Lumen Studio', 'SK', 'Team', 360, 'Past due'],
    ['Atlas Freight', 'NP', 'Business', 2150, 'Active'],
    ['Kestrel Health', 'AR', 'Starter', 90, 'Trial'],
    ['Fieldnote', 'TB', 'Team', 520, 'Active'],
    ['Orbit Payments', 'EB', 'Business', 1780, 'Active'],
    ['Quill & Ink', 'MC', 'Starter', 60, 'Trial'],
    ['Meridian Group', 'LO', 'Business', 960, 'Active'],
];

const tone: Record<Status, 'success' | 'warning' | 'error'> = {
    Active: 'success',
    Trial: 'warning',
    'Past due': 'error',
};

/** Height between 0 and the content's own, with the CSS grid's row, so nothing fades. */
const Fold = ({ open, children }: { open: boolean; children: ReactNode }) => (
    <div
        className={cn(
            'grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]',
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
    >
        <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
);

/** A finding marked on the screen: a red outline round the part, gone once the film moves on. */
const Mark = ({ on }: { on: boolean }) => (
    <span
        aria-hidden
        className={cn(
            'pointer-events-none absolute -inset-1.5 z-20 rounded-[inherit] outline-2 outline-error-500 outline-solid transition-[outline-color] duration-200',
            !on && 'outline-transparent',
        )}
    />
);

/**
 * Customers, an index as an agent first built it and as the index anatomy (get_page_kind index) has
 * it. Built: two primary actions in the head, the views as tabs above the table, search and a filter
 * floating outside it, the table wrapped in a card, its rows 52 high. Repaired, one fault at a time:
 * Export secondary, the views in the floating dock with New customer as its action, search and the
 * filter on the table's own bar, the table in its own frame, the rows at the table's height. Every
 * part is the library's own, at its real size.
 */
export const CustomersScreen = ({ repair, mark }: { repair: Repair; mark: Region | null }) => {
    const { answered, docked, toolbar, uncarded, tight } = repair;
    return (
        <Frame
            bar={
                <BottomBar
                    className={cn(
                        'transition-[translate] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]',
                        !docked && 'translate-y-[calc(100%+48px)]',
                    )}
                    data-film="dock"
                    floating
                >
                    <Dock aria-label="Views" defaultValue="All">
                        {views.map(([name, count]) => (
                            <DockItem key={name} value={name}>
                                {name} <DockCount>{count}</DockCount>
                            </DockItem>
                        ))}
                    </Dock>
                    <DockAction>
                        <Plus {...icon} />
                        New customer
                    </DockAction>
                </BottomBar>
            }
            place="customers"
            trail={['Customers']}
        >
            {/* A block of its own round the column, so it takes the panel less its padding, not more. */}
            <div>
                <PageContent className="flex flex-col" width="wide">
                    <div className="relative" data-film="head">
                        <PageHead
                            description="Everyone who pays you, newest first."
                            title="Customers"
                        >
                            <div
                                className="relative flex gap-2 rounded-control"
                                data-film="actions"
                            >
                                <Button variant={answered ? 'secondary' : 'primary'}>
                                    <Download {...icon} />
                                    Export
                                </Button>
                                {!docked && (
                                    <Button>
                                        <Plus {...icon} />
                                        New customer
                                    </Button>
                                )}
                                <Mark on={mark === 'actions'} />
                            </div>
                        </PageHead>
                    </div>
                    <Fold open={!docked}>
                        <div className="relative mt-8" data-film="tabs">
                            <Tabs defaultValue="All">
                                <TabsList>
                                    {views.map(([name, count]) => (
                                        <TabsTrigger key={name} value={name}>
                                            {name} <TabsCount>{count}</TabsCount>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                            <Mark on={mark === 'tabs'} />
                        </div>
                    </Fold>
                    <Fold open={!toolbar}>
                        <div
                            className="relative mt-4 flex gap-2 rounded-control"
                            data-film="search"
                        >
                            <Input
                                aria-label="Search customers"
                                className="w-64"
                                leadingIcon={<Search {...icon} />}
                                placeholder="Search customers"
                            />
                            <Button variant="secondary">
                                <ListFilter {...icon} />
                                Filter
                            </Button>
                            <Mark on={mark === 'search'} />
                        </div>
                    </Fold>
                    {/* The card the agent wrapped the table in, until it goes. */}
                    <Card
                        className="relative mt-8 transition-[padding,border-color,background-color,box-shadow] duration-700"
                        data-film="table"
                        style={
                            uncarded
                                ? {
                                      padding: 0,
                                      borderColor: 'transparent',
                                      background: 'transparent',
                                      boxShadow: 'none',
                                  }
                                : { padding: 24 }
                        }
                    >
                        <Mark on={mark === 'table'} />
                        <div className="relative rounded-panel" data-film="rows">
                            <Table
                                toolbar={
                                    <Fold open={toolbar}>
                                        <TableToolbar>
                                            <TableSearch
                                                aria-label="Search customers"
                                                placeholder="Search customers"
                                            />
                                            <TableToolbarEnd>
                                                <FilterMenu>
                                                    <FilterMenuTrigger />
                                                </FilterMenu>
                                            </TableToolbarEnd>
                                        </TableToolbar>
                                    </Fold>
                                }
                            >
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="w-48">Owner</TableHead>
                                        <TableHead className="w-28">Plan</TableHead>
                                        <TableHead className="w-28" numeric>
                                            MRR
                                        </TableHead>
                                        <TableHead className="w-28">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map(([name, owner, plan, mrr, status]) => (
                                        <TableRow
                                            className="[&>td]:py-0 [&>td]:transition-[height] [&>td]:duration-500"
                                            key={name}
                                        >
                                            <TableCell
                                                className="font-medium text-neutral-950"
                                                style={{ height: tight ? 41 : 52 }}
                                            >
                                                {name}
                                            </TableCell>
                                            <TableCell>
                                                <PersonName initials={owner} />
                                            </TableCell>
                                            <TableCell className="text-neutral-700">
                                                {plan}
                                            </TableCell>
                                            <TableCell numeric>{formatEuro(mrr)}</TableCell>
                                            <TableCell>
                                                <Badge tone={tone[status]}>{status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Mark on={mark === 'rows'} />
                        </div>
                    </Card>
                </PageContent>
            </div>
        </Frame>
    );
};
