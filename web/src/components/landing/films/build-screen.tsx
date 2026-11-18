'use client';

import {
    Badge,
    BottomBar,
    Button,
    Card,
    cn,
    Dock,
    DockItem,
    PageContent,
    PopoverItem,
    Select,
    SelectTrigger,
    SelectValue,
    Separator,
    SettingGroup,
    SettingRow,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableSearch,
    TableToolbar,
    TableToolbarEnd,
} from 'continuum';
import { ChevronRight, EllipsisVertical, Mail, Trash2, UserCog, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Frame, type Initials, icon, PageHead, PersonName } from '../hero-screens/shell';
import { ease } from '../web';

/**
 * How far the page scrolls inside the panel once the table is on it: the page is taller than the
 * window, so it scrolls as the app's would, to bring the table clear of the dock.
 */
export const SCROLL = 200;

/** What has landed on the page so far, in the order the agent composes it. */
export type Built = {
    /** The 640 column, drawn as a guide while the page is composed in it. */
    column: boolean;
    head: boolean;
    card: boolean;
    /** The list card's 20 padding and the 24 under it, shown as get_spacing returns them. */
    spacing: boolean;
    table: boolean;
    /** One row's menu, open. */
    menu: boolean;
    /** The page scrolled down by SCROLL, the table in view. */
    scrolled: boolean;
};

const areas = ['General', 'Members', 'Notifications', 'Billing'] as const;

type Role = 'Owner' | 'Admin' | 'Member' | 'Viewer';

const members: [Initials, Role, string | null][] = [
    ['MC', 'Owner', 'Now'],
    ['LO', 'Admin', '12 min ago'],
    ['SK', 'Member', '2 h ago'],
    ['NP', 'Member', 'Yesterday'],
    ['AR', 'Member', '3 days ago'],
    ['EB', 'Viewer', '9 Nov'],
    ['TB', 'Member', null],
];

/** The row the pointer is on, its menu open. */
const POINTED: Initials = 'SK';

const clipOpen = 'inset(-12px -12px -12px -12px)';
const clipShut = 'inset(-12px -12px 100% -12px)';

/** A part landing in its place: it clips open top to bottom as it settles the last few px. */
const Land = ({
    on,
    delay = 0,
    className,
    children,
    ...props
}: {
    on: boolean;
    delay?: number;
    className?: string;
    children: ReactNode;
    'data-film'?: string;
}) => (
    <motion.div
        animate={on ? { clipPath: clipOpen, y: 0 } : { clipPath: clipShut, y: 14 }}
        className={cn('relative', className)}
        initial={false}
        transition={{ duration: 0.7, ease, delay: on ? delay : 0 }}
        {...props}
    >
        {children}
    </motion.div>
);

/**
 * The row's menu, drawn where it opens rather than portalled: a DropdownMenu's panel and rows, the
 * states set by hand as Base UI would set them. It clips open from its top right, under the button.
 */
const RowMenu = ({ on }: { on: boolean }) => (
    <motion.div
        animate={{
            clipPath: on ? 'inset(-16px -16px -16px -16px)' : 'inset(0px 0px 100% 100%)',
        }}
        className="absolute top-full right-1 z-20 mt-1 flex w-60 flex-col gap-1 rounded-item border border-neutral-200 bg-neutral-50 p-1 text-left shadow-float"
        initial={false}
        transition={{ duration: 0.3, ease }}
    >
        <PopoverItem
            data-highlighted=""
            leading={<UserCog {...icon} />}
            meta="Member"
            trailing={<ChevronRight {...icon} />}
        >
            Change role
        </PopoverItem>
        <PopoverItem leading={<Mail {...icon} />}>Copy email</PopoverItem>
        <Separator className="-mx-1 w-auto" />
        <PopoverItem leading={<Trash2 {...icon} />} variant="danger">
            Remove from workspace
        </PopoverItem>
    </motion.div>
);

/**
 * Members, a settings page as get_page_kind settings has it, composed part by part: the 640 column;
 * the head with its one primary, Invite member; the Access group as a list card of setting rows, a
 * switch or a picker each; the members in a table in its own frame, search on its bar, a menu on
 * every row. The settings areas are views in the dock, with no action of their own. Every part is
 * the library's own, at its real size; the page starts empty and each part lands as `built` says.
 */
export const BuildScreen = ({ built }: { built: Built }) => {
    return (
        <div className="size-full">
            <Frame
                bar={
                    <BottomBar floating>
                        <Dock aria-label="Settings" defaultValue="Members">
                            {areas.map(name => (
                                <DockItem key={name} value={name}>
                                    {name}
                                </DockItem>
                            ))}
                        </Dock>
                    </BottomBar>
                }
                place="settings"
                trail={['Settings', 'Members']}
            >
                {/* A block of its own round the column, so it takes the panel less its padding. */}
                <div className="relative" data-film="page">
                    <PageContent
                        className="relative flex flex-col transition-[translate] duration-900 ease-[cubic-bezier(0.65,0,0.35,1)]"
                        style={{ translate: `0 ${built.scrolled ? -SCROLL : 0}px` }}
                        width="narrow"
                    >
                        {/* The column's two edges, a guide while the page is composed in it. */}
                        <motion.span
                            animate={{
                                clipPath: built.column ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)',
                            }}
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 right-6 left-6 border-action/70 border-x-2 border-dashed"
                            initial={false}
                            transition={{ duration: 0.8, ease }}
                        />
                        <Land data-film="head" on={built.head}>
                            <PageHead
                                description="Who can open Northwind, and what each of them can do."
                                title="Members"
                            >
                                <Button>
                                    <UserPlus {...icon} />
                                    Invite member
                                </Button>
                            </PageHead>
                        </Land>
                        <Land className="mt-8" data-film="card" delay={0.1} on={built.card}>
                            <Card layout="list">
                                <SettingGroup title="Access">
                                    <SettingRow
                                        control={<Switch checked />}
                                        description="Sign in with a code as well as a password."
                                        title="Require two-factor"
                                    />
                                    <SettingRow
                                        control={
                                            <Select
                                                defaultValue="member"
                                                items={[{ value: 'member', label: 'Member' }]}
                                            >
                                                <SelectTrigger indicator="right" size="sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </Select>
                                        }
                                        description="What someone you invite starts as."
                                        title="Default role"
                                    />
                                    <SettingRow
                                        control={<Switch checked={false} />}
                                        description="Anyone with the link joins as the default role."
                                        title="Invite by link"
                                    />
                                </SettingGroup>
                            </Card>
                            {/* The card's 20 padding and the 24 to the next group, as returned. */}
                            <motion.span
                                animate={{
                                    clipPath: built.spacing
                                        ? 'inset(0 0% 0 0)'
                                        : 'inset(0 100% 0 0)',
                                }}
                                aria-hidden
                                className="pointer-events-none absolute inset-0 rounded-card border-[20px] border-action/20"
                                initial={false}
                                transition={{ duration: 0.45, ease }}
                            />
                            <motion.span
                                animate={{
                                    clipPath: built.spacing
                                        ? 'inset(0 0% 0 0)'
                                        : 'inset(0 100% 0 0)',
                                }}
                                aria-hidden
                                className="pointer-events-none absolute inset-x-0 top-full h-6 bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--color-action)_45%,transparent)_0_1px,transparent_1px_6px)]"
                                initial={false}
                                transition={{ duration: 0.45, ease, delay: 0.15 }}
                            />
                        </Land>
                        <Land className="mt-6" data-film="table" delay={0.1} on={built.table}>
                            <Table
                                toolbar={
                                    <TableToolbar>
                                        <TableSearch
                                            aria-label="Search members"
                                            placeholder="Search members"
                                        />
                                        <TableToolbarEnd>
                                            <Select
                                                defaultValue="all"
                                                items={[{ value: 'all', label: 'All roles' }]}
                                            >
                                                <SelectTrigger aria-label="Role" size="sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </Select>
                                        </TableToolbarEnd>
                                    </TableToolbar>
                                }
                            >
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead className="w-28">Role</TableHead>
                                        <TableHead className="w-32">Last active</TableHead>
                                        <TableHead className="w-12">
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map(([who, role, seen]) => {
                                        const pointed = who === POINTED;
                                        return (
                                            <TableRow
                                                className={cn(
                                                    '[&>td]:py-0',
                                                    pointed && built.menu && 'bg-neutral-950/3',
                                                )}
                                                data-film={pointed ? 'pointed' : undefined}
                                                key={who}
                                            >
                                                <TableCell className="h-[41px]">
                                                    <PersonName initials={who} />
                                                </TableCell>
                                                <TableCell className="font-normal text-neutral-700">
                                                    {role}
                                                </TableCell>
                                                <TableCell className="font-normal text-neutral-700 tabular-nums">
                                                    {seen ?? <Badge>Invited</Badge>}
                                                </TableCell>
                                                <TableCell className="relative px-1">
                                                    <Button
                                                        aria-label="Member actions"
                                                        className={cn(
                                                            pointed &&
                                                                built.menu &&
                                                                'bg-neutral-950/5 text-neutral-800',
                                                        )}
                                                        size="icon-sm"
                                                        variant="ghost"
                                                    >
                                                        <EllipsisVertical {...icon} />
                                                    </Button>
                                                    {pointed && <RowMenu on={built.menu} />}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Land>
                    </PageContent>
                </div>
            </Frame>
        </div>
    );
};
