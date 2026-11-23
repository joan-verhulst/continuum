import {
    Avatar,
    Button,
    cn,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    SidebarSwitcherMark,
} from 'continuum';
import { Bell, Boxes, Check, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';

/*
 * The two-row header, as a sketch to judge before anything goes in the library. Who and where on
 * the first row (the mark, a slash, the workspace; search, the bell and the account at the end),
 * the sections as line tabs on the second, sitting on the header's hairline. A section with pages
 * of its own opens a third row while you are in it: its pages, in their groups. Every row keeps to
 * the page's column, so the mark, the first tab and the page's title start on one line.
 */

export type Section = {
    id: string;
    label: string;
    /** What waits there: a plain figure after the label. */
    count?: number;
    /** Its pages, in groups; a section with pages opens the third row while you are in it. */
    groups?: { label?: string; pages: { id: string; label: string; count?: number }[] }[];
};

export type Workspace = { id: string; name: string; plan: string; color: string };

type TwoRowHeaderProps = {
    /** The column's classes: its cap and side padding, as the page's. */
    column: string;
    sections: Section[];
    workspaces: Workspace[];
    workspace: number;
    onWorkspace: (index: number) => void;
    /** The page you are on: a section's id, or one of its pages'. */
    page: string;
    onPage: (id: string) => void;
    /** Where a section's pages go: a third row of the header, or the top of the page. */
    subItems: 'header' | 'page';
};

const icon = { strokeWidth: 2 };

/** The section a page belongs to: itself, or the one whose pages hold it. */
export const sectionOf = (sections: Section[], page: string) =>
    sections.find(
        section =>
            section.id === page ||
            section.groups?.some(group => group.pages.some(item => item.id === page)),
    );

const Count = ({ children }: { children: ReactNode }) => (
    <span className="font-normal text-neutral-500 tabular-nums">{children}</span>
);

const Mark = ({ workspace, size }: { workspace: Workspace; size: 20 | 28 }) => (
    <SidebarSwitcherMark color={workspace.color} size={size}>
        {workspace.name.slice(0, 1)}
    </SidebarSwitcherMark>
);

export const TwoRowHeader = ({
    column,
    sections,
    workspaces,
    workspace,
    onWorkspace,
    page,
    onPage,
    subItems,
}: TwoRowHeaderProps) => {
    const space = workspaces[workspace] ?? workspaces[0];
    const current = sectionOf(sections, page);
    const pages = current?.groups;

    return (
        <header className="sticky top-0 z-30 shrink-0 border-neutral-200 border-b bg-neutral-50">
            {/* Who and where, on the bar's 52. */}
            <div className={cn('mx-auto box-content flex h-bar items-center gap-2', column)}>
                <a
                    aria-label="Home"
                    // Pulled 5 left, so the 16 icon in its 26 box starts on the column edge with the tabs and the title.
                    className="-ml-1.25 grid size-6.5 shrink-0 place-items-center rounded-item text-neutral-950 [&_svg]:size-4"
                    href="#home"
                >
                    <Boxes {...icon} />
                </a>
                <span aria-hidden className="text-lg text-neutral-300">
                    /
                </span>
                {space && (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            aria-label={`${space.name}. Switch workspace`}
                            className="-ml-1 flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-item px-2 transition-colors duration-150 hover:bg-neutral-950/5 data-popup-open:bg-selected"
                        >
                            <Mark size={20} workspace={space} />
                            <span className="truncate font-medium text-neutral-950 text-xs">
                                {space.name}
                            </span>
                            <ChevronsUpDown
                                aria-hidden
                                className="size-icon shrink-0 text-neutral-500"
                                strokeWidth={2}
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-menu-wide">
                            {workspaces.map((item, index) => (
                                <DropdownMenuItem key={item.id} onClick={() => onWorkspace(index)}>
                                    <Mark size={20} workspace={item} />
                                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                                    {index === workspace && <Check {...icon} />}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Plus {...icon} />
                                New workspace
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <div className="ml-auto flex shrink-0 items-center gap-2">
                    <Button aria-label="Search" size="icon" variant="ghost">
                        <Search {...icon} />
                    </Button>
                    <Button aria-label="Notifications" size="icon" variant="ghost">
                        <Bell {...icon} />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            aria-label="Account"
                            className="cursor-pointer rounded-chip outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                        >
                            <Avatar fallback="MC" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Sign out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/*
             * The sections, as line tabs on a hairline. A section with pages adds the same tab row
             * under it, on the next hairline: two rows of one kind, each underlining where you are.
             */}
            <nav
                aria-label="Sections"
                className={cn(
                    // 8 above the tabs, so the row starts clear of the switcher's row, not right under it.
                    'scrollbar-none mx-auto -mb-px box-content flex overflow-x-auto pt-2',
                    column,
                )}
            >
                <div className="-ml-3 flex">
                    {sections.map(section => {
                        const active = section.id === current?.id;
                        return (
                            <button
                                aria-current={active ? 'page' : undefined}
                                className={cn(line, 'h-tab font-medium')}
                                key={section.id}
                                onClick={() =>
                                    onPage(section.groups?.[0]?.pages[0]?.id ?? section.id)
                                }
                                type="button"
                            >
                                {section.label}
                                {section.count !== undefined && <Count>{section.count}</Count>}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* The open section's pages: the same tab row again. */}
            {pages && subItems === 'header' && current && (
                // The same tab row again, on a hairline of its own across the shell.
                <div className="border-neutral-200 border-t">
                    <div
                        className={cn(
                            'scrollbar-none mx-auto -mb-px box-content flex overflow-x-auto',
                            column,
                        )}
                    >
                        <SubItems
                            groups={pages}
                            label={current.label}
                            onPage={onPage}
                            page={page}
                        />
                    </div>
                </div>
            )}
        </header>
    );
};

/*
 * A link in the header's rows: text only, 12 a side, the label 13 `neutral-600`, `neutral-950` on hover
 * and when current; a 2px underline in `neutral-950` under the current one, inset to its label.
 */
const line = [
    'relative flex shrink-0 cursor-pointer items-center gap-2 px-3 text-neutral-600 text-xs transition-colors duration-150 hover:text-neutral-950 aria-[current=page]:text-neutral-950',
    "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-neutral-950 after:opacity-0 after:transition-opacity after:duration-150 after:content-[''] aria-[current=page]:after:opacity-100",
];

type SubItemsProps = {
    /** The section's name, for the list's label. */
    label: string;
    groups: NonNullable<Section['groups']>;
    page: string;
    onPage: (id: string) => void;
};

/**
 * A section's pages: the same tab row as the sections. Groups are parted by a hairline the height
 * of a label, 12 either side; their names are not drawn in the row, where grey text reads as a
 * disabled tab, a screen reader still hears them.
 */
export const SubItems = ({ label, groups, page, onPage }: SubItemsProps) => (
    <nav aria-label={label} className="-ml-3 flex shrink-0 items-center">
        {groups.map((group, index) => (
            <Fragment key={group.label ?? index}>
                {index > 0 && (
                    <span aria-hidden className="mx-3 h-4 w-px shrink-0 bg-neutral-200" />
                )}
                <div className="flex">
                    {group.label && <span className="sr-only">{group.label}</span>}
                    {group.pages.map(item => (
                        <button
                            aria-current={item.id === page ? 'page' : undefined}
                            className={cn(line, 'h-tab font-medium')}
                            key={item.id}
                            onClick={() => onPage(item.id)}
                            type="button"
                        >
                            {item.label}
                            {item.count !== undefined && <Count>{item.count}</Count>}
                        </button>
                    ))}
                </div>
            </Fragment>
        ))}
    </nav>
);
