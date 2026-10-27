import {
    AppPanel,
    AppShell,
    Avatar,
    Badge,
    BottomBar,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    cn,
    countFilters,
    Dock,
    DockAction,
    DockItem,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    EmptyState,
    Field,
    FieldHelper,
    FieldLabel,
    FilterBar,
    FilterChip,
    FilterMenu,
    FilterMenuClear,
    FilterMenuContent,
    FilterMenuGroup,
    FilterMenuItem,
    FilterMenuTrigger,
    type FilterValues,
    focusRing,
    HeaderBar,
    HeaderBarActions,
    HeaderBarNotice,
    Input,
    Kbd,
    NavItem,
    PageContent,
    Pagination,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    StatusDot,
    type StatusDotTone,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Textarea,
    toggleFilter,
    useHeaderNotice,
    ValueField,
} from 'continuum';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpRight,
    Check,
    Ellipsis,
    EllipsisVertical,
    Eye,
    FileText,
    ImageIcon,
    ImageUp,
    Leaf,
    Link2,
    PanelsTopLeft,
    Plus,
    Search,
    SearchX,
    Settings,
    SquarePen,
    Tag,
    Trash2,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import {
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

/*
 * The Posts screen of a small company CMS, built as Continuum builds an app: the library's sidebar,
 * a header bar with the trail, an index of posts in a wide column, and each post on a page of its
 * own, a form in one column. The posts, filters and fields are the freehand screen's.
 */

const icon = { strokeWidth: 2 } as const;

/* Types and demo data */

type Status = 'draft' | 'review' | 'scheduled' | 'published';
type StatusTab = 'all' | Status;
type Visibility = 'public' | 'members' | 'private';
type AuthorId = 'maya' | 'jonas' | 'priya' | 'sam' | 'lena';
type CoverTone = 'iris' | 'sunset' | 'ocean' | 'forest' | 'dusk' | 'sand';

const CATEGORIES = ['Product', 'Engineering', 'Design', 'Company', 'Customers', 'Guides'] as const;
type Category = (typeof CATEGORIES)[number];

interface Author {
    id: AuthorId;
    name: string;
    initials: string;
    role: string;
}

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    status: Status;
    authorId: AuthorId;
    category: Category;
    /** Local time of the last edit, as `YYYY-MM-DDTHH:mm`. */
    editedAt: string;
    /** Local time the post went or goes live, if it has one. */
    publishAt: string | null;
    visibility: Visibility;
    seoTitle: string;
    seoDescription: string;
    cover: CoverTone;
}

/** The fields the post page edits before they are saved. */
type Draft = Pick<
    Post,
    'excerpt' | 'status' | 'visibility' | 'seoTitle' | 'seoDescription' | 'cover'
>;

const DRAFT_KEYS = [
    'excerpt',
    'status',
    'visibility',
    'seoTitle',
    'seoDescription',
    'cover',
] as const;

/** The demo is frozen at this moment, so relative dates always read the same. */
const NOW_ISO = '2026-10-27T11:40';
const NOW = new Date(NOW_ISO);
const DAY = 86_400_000;

const SITE = 'fernhill.co';

const AUTHORS: Record<AuthorId, Author> = {
    maya: { id: 'maya', name: 'Maya Chen', initials: 'MC', role: 'Editor-in-chief' },
    jonas: { id: 'jonas', name: 'Jonas Berg', initials: 'JB', role: 'Staff engineer' },
    priya: { id: 'priya', name: 'Priya Nair', initials: 'PN', role: 'Product marketing' },
    sam: { id: 'sam', name: 'Sam Okafor', initials: 'SO', role: 'Design lead' },
    lena: { id: 'lena', name: 'Lena Vogel', initials: 'LV', role: 'People team' },
};

/**
 * Workflow colours mean workflow: a draft is nothing yet, in review waits on someone, scheduled is
 * information, published is done.
 */
const STATUS: Record<Status, { label: string; tone: StatusDotTone }> = {
    draft: { label: 'Draft', tone: 'neutral' },
    review: { label: 'In review', tone: 'warning' },
    scheduled: { label: 'Scheduled', tone: 'primary' },
    published: { label: 'Published', tone: 'success' },
};

const STATUS_ORDER: Status[] = ['draft', 'review', 'scheduled', 'published'];

const TABS: { value: StatusTab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Drafts' },
    { value: 'review', label: 'In review' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
];

const VISIBILITY: { value: Visibility; label: string }[] = [
    { value: 'public', label: 'Public' },
    { value: 'members', label: 'Members' },
    { value: 'private', label: 'Private' },
];

const INITIAL_POSTS: Post[] = [
    {
        id: 'p1',
        title: 'Introducing shared workspaces',
        slug: 'shared-workspaces',
        excerpt:
            'One place for every team to plan, write and review together, with permissions that finally match how you work.',
        status: 'published',
        authorId: 'priya',
        category: 'Product',
        editedAt: '2026-10-24T16:05',
        publishAt: '2026-10-22T09:00',
        visibility: 'public',
        seoTitle: 'Introducing shared workspaces | Fernhill',
        seoDescription:
            'Shared workspaces give every team one home to plan, write and review together, with permissions that match how you work.',
        cover: 'iris',
    },
    {
        id: 'p2',
        title: 'How we cut our build times in half',
        slug: 'faster-builds',
        excerpt:
            'Caching, parallel test runs and a few small habits took our average build from fourteen minutes to just under seven.',
        status: 'published',
        authorId: 'jonas',
        category: 'Engineering',
        editedAt: '2026-10-22T11:30',
        publishAt: '2026-10-20T10:00',
        visibility: 'public',
        seoTitle: 'How we cut our build times in half',
        seoDescription:
            'Caching, parallel test runs and a few small habits took our average build from 14 minutes to under 7. Here is what worked.',
        cover: 'ocean',
    },
    {
        id: 'p3',
        title: 'A practical guide to accessible forms',
        slug: 'accessible-forms',
        excerpt:
            'Labels, errors, focus order and the small details that make forms work for everyone, with patterns you can copy today.',
        status: 'review',
        authorId: 'sam',
        category: 'Guides',
        editedAt: '2026-10-27T06:50',
        publishAt: null,
        visibility: 'public',
        seoTitle: 'A practical guide to accessible web forms',
        seoDescription:
            'Labels, error messages, focus order and the small details that make web forms usable for everyone, with patterns to copy.',
        cover: 'forest',
    },
    {
        id: 'p4',
        title: 'Lessons from 200 customer interviews',
        slug: 'lessons-from-200-interviews',
        excerpt:
            'Six months, two hundred conversations and one spreadsheet that got out of hand. What we heard, and what we changed.',
        status: 'scheduled',
        authorId: 'priya',
        category: 'Customers',
        editedAt: '2026-10-27T11:22',
        publishAt: '2026-10-29T10:00',
        visibility: 'public',
        seoTitle: 'Lessons from 200 customer interviews | Fernhill',
        seoDescription:
            'What six months of customer conversations taught us about onboarding, pricing and the features people rely on every day.',
        cover: 'sunset',
    },
    {
        id: 'p5',
        title: 'Our approach to remote-first onboarding',
        slug: 'remote-first-onboarding',
        excerpt:
            'How new teammates get set up, meet the team and ship something real in their first two weeks, wherever they live.',
        status: 'draft',
        authorId: 'lena',
        category: 'Company',
        editedAt: '2026-10-26T15:20',
        publishAt: null,
        visibility: 'public',
        seoTitle: 'Remote-first onboarding, step by step',
        seoDescription: '',
        cover: 'sand',
    },
    {
        id: 'p6',
        title: 'October release notes',
        slug: 'october-release-notes',
        excerpt:
            'Bulk editing, faster search, a new activity feed and 23 smaller fixes that landed across the product this month.',
        status: 'scheduled',
        authorId: 'maya',
        category: 'Product',
        editedAt: '2026-10-27T09:35',
        publishAt: '2026-10-30T09:00',
        visibility: 'public',
        seoTitle: 'October release notes: bulk editing, faster search and more',
        seoDescription:
            'Everything that shipped in October: bulk editing, faster search, a new activity feed and 23 smaller fixes across the product.',
        cover: 'dusk',
    },
    {
        id: 'p7',
        title: 'Designing a calmer notification system',
        slug: 'calmer-notifications',
        excerpt:
            'Fewer pings, smarter digests and settings people actually understand. Notes from three rounds of research.',
        status: 'review',
        authorId: 'sam',
        category: 'Design',
        editedAt: '2026-10-26T10:05',
        publishAt: null,
        visibility: 'public',
        seoTitle: 'Designing a calmer notification system',
        seoDescription:
            'Fewer pings, smarter digests and settings people understand: how three rounds of research reshaped our notifications.',
        cover: 'iris',
    },
    {
        id: 'p8',
        title: 'Scaling support with a team of four',
        slug: 'scaling-support',
        excerpt:
            'How a small support team answers thousands of questions a month without burning out, and the tools that help most.',
        status: 'published',
        authorId: 'maya',
        category: 'Customers',
        editedAt: '2026-10-15T14:10',
        publishAt: '2026-10-14T09:00',
        visibility: 'public',
        seoTitle: 'Scaling customer support with a team of four',
        seoDescription:
            'How a four-person support team answers thousands of questions every month without burning out, and the tools that help.',
        cover: 'forest',
    },
    {
        id: 'p9',
        title: 'Why we moved our docs into the product',
        slug: 'docs-in-the-product',
        excerpt:
            'Help that shows up where you need it: the thinking behind in-product guides, and what it did to our ticket volume.',
        status: 'draft',
        authorId: 'jonas',
        category: 'Product',
        editedAt: '2026-10-19T17:45',
        publishAt: null,
        visibility: 'members',
        seoTitle: '',
        seoDescription: '',
        cover: 'sand',
    },
    {
        id: 'p10',
        title: 'How we hire, and what we look for',
        slug: 'how-we-hire',
        excerpt:
            'Curiosity, clear writing and kindness under pressure. A candid look at how we hire, and how to stand out.',
        status: 'published',
        authorId: 'lena',
        category: 'Company',
        editedAt: '2026-10-09T12:00',
        publishAt: '2026-10-08T09:00',
        visibility: 'public',
        seoTitle: 'How we hire, and what we look for in every role',
        seoDescription:
            'Curiosity, clear writing and kindness under pressure. A candid look at how we hire across every team, and how to stand out.',
        cover: 'sunset',
    },
];

const COVER_TONES: CoverTone[] = ['iris', 'ocean', 'forest', 'sunset', 'dusk', 'sand'];

/*
 * A cover stands in for an image the editor uploads. It borrows the avatar hues, the system's
 * identity colours: one pale fill and one deep ink per hue, which dark mode swaps for itself.
 */
const COVER_HUE: Record<CoverTone, string> = {
    iris: '[--avatar-h:var(--avatar-blue)]',
    ocean: '[--avatar-h:var(--avatar-teal)]',
    forest: '[--avatar-h:var(--avatar-green)]',
    sunset: '[--avatar-h:var(--avatar-rose)]',
    dusk: '[--avatar-h:var(--avatar-violet)]',
    sand: '[--avatar-h:var(--avatar-amber)]',
};

/* Helpers */

const isStatus = (value: string): value is Status => STATUS_ORDER.some(status => status === value);
const isStatusTab = (value: string): value is StatusTab => TABS.some(tab => tab.value === value);
const isVisibility = (value: string): value is Visibility =>
    VISIBILITY.some(option => option.value === value);

/** "Just now", "18 min ago", "4h ago", "Yesterday" or a short date. */
const formatEdited = (iso: string) => {
    const time = new Date(iso).getTime();
    const minutes = Math.floor((NOW.getTime() - time) / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const today = new Date(NOW);
    today.setHours(0, 0, 0, 0);
    if (time >= today.getTime()) return `${Math.floor(minutes / 60)}h ago`;
    if (time >= today.getTime() - DAY) return 'Yesterday';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** "Thu, Oct 29 · 10:00 AM" */
const formatPublish = (iso: string) => {
    const date = new Date(iso);
    const day = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${day} · ${time}`;
};

/** How the date row of the publish settings reads for a given status. */
const describeSchedule = (status: Status, publishAt: string | null) => {
    if (status === 'published') {
        return {
            label: 'Published',
            value: publishAt ? formatPublish(publishAt) : 'When you save',
            muted: !publishAt,
        };
    }
    if (status === 'scheduled') {
        return {
            label: 'Goes live',
            value: publishAt ? formatPublish(publishAt) : 'Pick a date',
            muted: !publishAt,
        };
    }
    return { label: 'Publish date', value: 'Not scheduled', muted: true };
};

const toDraft = (post: Post): Draft => ({
    excerpt: post.excerpt,
    status: post.status,
    visibility: post.visibility,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    cover: post.cover,
});

/** The next placeholder in the cycle, for "Change cover". */
const nextTone = (tone: CoverTone) =>
    COVER_TONES[(COVER_TONES.indexOf(tone) + 1) % COVER_TONES.length] ?? 'iris';

/** Which page shows: the index by this name, or else a post by its id. */
const INDEX = 'posts';

/** Rows on a page of the index: the ten posts make one page, and an eleventh starts a second. */
const PAGE_SIZE = 10;

/** A person's avatar: their initials pick the same tone on every screen. */
const AuthorAvatar = ({ author }: { author: Author }) => (
    <Avatar alt="" fallback={author.initials} shape="round" size={24} />
);

const StatusLabel = ({ status }: { status: Status }) => (
    <span className="flex items-center gap-2">
        <StatusDot tone={STATUS[status].tone} />
        {STATUS[status].label}
    </span>
);

/** A page's title and the line under it, with its actions beside it, as the reference pages set it. */
const PageHead = ({
    title,
    description,
    children,
}: {
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
}) => (
    <div className="flex items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="truncate font-medium text-2xl text-neutral-950">{title}</h1>
            {description && <p className="truncate text-neutral-600 text-sm">{description}</p>}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
);

/** A form section's title and the line under it, with the section's action beside it. */
const SectionHead = ({
    title,
    description,
    children,
}: {
    title: ReactNode;
    description: ReactNode;
    children?: ReactNode;
}) => (
    <div className="flex items-start justify-between gap-6">
        <div className="flex max-w-125 flex-col gap-1">
            <h2 className="font-medium text-base text-neutral-950">{title}</h2>
            <p className="text-neutral-600 text-xs">{description}</p>
        </div>
        {children}
    </div>
);

/* Shell */

const CmsSidebar = ({ postCount, onPosts }: { postCount: number; onPosts: () => void }) => (
    <Sidebar>
        <SidebarHeader>
            <span className="flex min-w-0 items-center gap-1">
                <SidebarLogo>
                    <Leaf {...icon} />
                </SidebarLogo>
                <span className="truncate font-medium text-neutral-950 text-sm">Fernhill</span>
            </span>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Content" label="Content">
            <NavItem
                active
                icon={<FileText {...icon} />}
                onClick={onPosts}
                trailing={<Badge variant="count">{postCount}</Badge>}
            >
                Posts
            </NavItem>
            <NavItem icon={<PanelsTopLeft {...icon} />} trailing={<Badge variant="count">8</Badge>}>
                Pages
            </NavItem>
            <NavItem icon={<ImageIcon {...icon} />} trailing={<Badge variant="count">126</Badge>}>
                Media
            </NavItem>
        </SidebarGroup>
        <SidebarGroup aria-label="Workspace" label="Workspace">
            <NavItem icon={<Users {...icon} />} trailing={<Badge variant="count">5</Badge>}>
                Authors
            </NavItem>
            <NavItem icon={<Settings {...icon} />}>Settings</NavItem>
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount
                avatar={<Avatar alt="" fallback={AUTHORS.maya.initials} size={36} />}
                name={AUTHORS.maya.name}
                plan={AUTHORS.maya.role}
            />
            <Button aria-label="Account options" size="icon" variant="ghost">
                <Ellipsis {...icon} />
            </Button>
        </SidebarFooter>
    </Sidebar>
);

/** A crumb that leads somewhere in the app; a button, as the app keeps its pages in state. */
const CrumbLink = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
    <BreadcrumbLink render={<button onClick={onClick} type="button" />}>{children}</BreadcrumbLink>
);

/* Posts index */

/** Search box; "/" focuses it from anywhere on the page, Escape clears it. */
const SearchField = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
            const target = event.target;
            if (
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
            ) {
                return;
            }
            event.preventDefault();
            inputRef.current?.focus();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <Input
            aria-label="Search posts"
            className="w-64"
            leadingIcon={<Search {...icon} />}
            onChange={event => onChange(event.target.value)}
            onKeyDown={event => {
                if (event.key === 'Escape') {
                    onChange('');
                    event.currentTarget.blur();
                }
            }}
            placeholder="Search posts"
            ref={inputRef}
            size="sm"
            trailing={
                value ? (
                    <Button
                        aria-label="Clear search"
                        className="-mr-1.5 size-6"
                        onClick={() => onChange('')}
                        size="icon-sm"
                        variant="ghost"
                    >
                        <X {...icon} />
                    </Button>
                ) : (
                    <Kbd>/</Kbd>
                )
            }
            value={value}
        />
    );
};

interface FilterOption<T extends string> {
    value: T;
    label: string;
    count: number;
    leading?: ReactNode;
}

const PostRow = ({
    post,
    current,
    tabbable,
    onOpen,
    onKeyDown,
}: {
    post: Post;
    /** The post last opened or moved to with the arrows: it keeps the selected wash. */
    current: boolean;
    /** The one row Tab lands on: the current one, or the first when none is on this page. */
    tabbable: boolean;
    onOpen: () => void;
    onKeyDown: (event: ReactKeyboardEvent<HTMLTableRowElement>) => void;
}) => {
    const author = AUTHORS[post.authorId];

    return (
        <TableRow
            aria-selected={current}
            className={cn(
                'cursor-pointer outline-none',
                // The table's frame clips, so the ring is drawn inside the row.
                'focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:-outline-offset-2',
            )}
            data-post-row={post.id}
            data-selected={current || undefined}
            onClick={onOpen}
            onKeyDown={onKeyDown}
            tabIndex={tabbable ? 0 : -1}
        >
            <TableCell>
                {/* The title over its address, as the customers list sets a name over its domain. */}
                <span className="flex min-w-0 flex-col">
                    <span className="truncate text-neutral-950">{post.title}</span>
                    <span className="truncate font-normal text-neutral-500 text-xxs">
                        /blog/{post.slug}
                    </span>
                </span>
            </TableCell>
            <TableCell>
                <Badge tone={STATUS[post.status].tone} variant="dot">
                    {STATUS[post.status].label}
                </Badge>
            </TableCell>
            <TableCell>
                <span className="flex min-w-0 items-center gap-2 font-normal text-neutral-700">
                    <AuthorAvatar author={author} />
                    <span className="truncate">{author.name}</span>
                </span>
            </TableCell>
            <TableCell className="truncate font-normal text-neutral-700">{post.category}</TableCell>
            <TableCell align="right" className="font-normal text-neutral-600 tabular-nums">
                {formatEdited(post.editedAt)}
            </TableCell>
        </TableRow>
    );
};

/* Post page */

/**
 * The post's cover, standing in for the image an editor uploads: a sun and two hills in the
 * hue's ink, laid over its line colour. Flat shapes at a few opacities, no gradient.
 */
const Cover = ({ tone, className }: { tone: CoverTone; className?: string }) => (
    <div
        aria-label="Cover image"
        className={cn(
            'relative overflow-hidden bg-[oklch(var(--avatar-line)_var(--avatar-h))] text-[oklch(var(--avatar-ink)_var(--avatar-h))]',
            COVER_HUE[tone],
            className,
        )}
        data-slot="post-cover"
        role="img"
    >
        <svg
            aria-hidden="true"
            className="absolute inset-0 size-full"
            preserveAspectRatio="xMidYMax slice"
            viewBox="0 0 448 88"
        >
            <circle cx="104" cy="32" fill="currentColor" fillOpacity={0.4} r="11" />
            <path
                d="M0 58C72 42 150 46 232 60S376 74 448 52V88H0Z"
                fill="currentColor"
                fillOpacity={0.16}
            />
            <path
                d="M0 74C96 64 196 68 288 76S404 86 448 75V88H0Z"
                fill="currentColor"
                fillOpacity={0.26}
            />
        </svg>
    </div>
);

/** A field's length against its limit, under it; the field turns invalid past the limit. */
const Counter = ({ count, limit }: { count: number; limit: number }) => (
    <FieldHelper className="text-right tabular-nums">
        {count}/{limit}
    </FieldHelper>
);

/** One post on a page of its own: its title and actions, then the form, in one column. */
const PostPage = ({
    post,
    onSave,
    onDelete,
    onCopyLink,
}: {
    post: Post;
    onSave: (changes: Partial<Post>) => void;
    onDelete: () => void;
    onCopyLink: () => void;
}) => {
    const [draft, setDraft] = useState<Draft>(() => toDraft(post));
    const [saved, setSaved] = useState(false);
    const dirty = DRAFT_KEYS.some(key => draft[key] !== post[key]);
    const schedule = describeSchedule(draft.status, post.publishAt);
    const url = `${SITE}/blog/${post.slug}`;

    useEffect(() => {
        if (!saved) return;
        const timer = window.setTimeout(() => setSaved(false), 1800);
        return () => window.clearTimeout(timer);
    }, [saved]);

    const update = (changes: Partial<Draft>) => {
        setDraft(current => ({ ...current, ...changes }));
        setSaved(false);
    };

    const save = () => {
        onSave({
            ...draft,
            publishAt:
                draft.status === 'published' && post.publishAt === null ? NOW_ISO : post.publishAt,
        });
        setSaved(true);
    };

    const copyLink = () => {
        navigator.clipboard?.writeText(`https://${url}`).catch(() => undefined);
        onCopyLink();
    };

    return (
        // One post, made or edited: the narrow column, its fields stacked one to a row.
        <PageContent className="flex flex-col gap-10 pb-24" width="narrow">
            {/*
             * The title may wrap beside the actions; its status and address take the column's
             * whole width under them, so the address is not cut short by the buttons.
             */}
            <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-6">
                    <h1 className="min-w-0 font-medium text-2xl text-neutral-950">{post.title}</h1>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button variant="secondary">
                            <Eye {...icon} />
                            Preview
                        </Button>
                        {/* As wide as its longest label, so "Saved" does not shift the row. */}
                        <Button className="min-w-31" onClick={save}>
                            {saved ? (
                                <>
                                    <Check {...icon} />
                                    Saved
                                </>
                            ) : (
                                <>
                                    {dirty && (
                                        <StatusDot
                                            label="Unsaved changes"
                                            size="sm"
                                            tone="warning"
                                        />
                                    )}
                                    Save changes
                                </>
                            )}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button aria-label="More actions" size="icon" variant="ghost" />
                                }
                            >
                                <EllipsisVertical {...icon} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={copyLink}>
                                    <Link2 {...icon} />
                                    Copy link
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <SquarePen {...icon} />
                                    Open in editor
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onDelete} variant="danger">
                                    <Trash2 {...icon} />
                                    Delete post
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                    <Badge className="shrink-0" tone={STATUS[post.status].tone} variant="dot">
                        {STATUS[post.status].label}
                    </Badge>
                    <span className="truncate text-neutral-600 text-sm">{url}</span>
                </div>
            </div>

            <section className="flex flex-col gap-5">
                <SectionHead
                    description="The image at the top of the post, and in feeds and link previews."
                    title="Cover"
                >
                    <Button
                        className="shrink-0"
                        onClick={() => update({ cover: nextTone(draft.cover) })}
                        variant="secondary"
                    >
                        <ImageUp {...icon} />
                        Change cover
                    </Button>
                </SectionHead>
                <Cover className="h-44 rounded-card" tone={draft.cover} />
            </section>

            <section aria-labelledby="post-excerpt" className="flex flex-col gap-5">
                <div id="post-excerpt">
                    <SectionHead
                        description="The summary under the title on the blog, in feeds and in newsletters."
                        title="Excerpt"
                    />
                </div>
                <Field invalid={draft.excerpt.length > 200}>
                    <Textarea
                        aria-labelledby="post-excerpt"
                        onChange={event => update({ excerpt: event.target.value })}
                        placeholder="A short summary for cards, feeds and newsletters"
                        rows={3}
                        value={draft.excerpt}
                    />
                    <Counter count={draft.excerpt.length} limit={200} />
                </Field>
            </section>

            <section className="flex flex-col gap-5">
                <SectionHead
                    description="When the post goes live, and who can read it once it has."
                    title="Publishing"
                />
                <div className="flex flex-col gap-5">
                    <Field>
                        <FieldLabel>Status</FieldLabel>
                        <Select
                            onValueChange={next => {
                                if (isStatus(next)) update({ status: next });
                            }}
                            value={draft.status}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_ORDER.map(status => (
                                    <SelectItem key={status} value={status}>
                                        <StatusLabel status={status} />
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    {/* The date follows the status, so it reads as a fact, not a field to type in. */}
                    <ValueField
                        emptyText={schedule.value}
                        label={schedule.label}
                        value={schedule.muted ? undefined : schedule.value}
                    />
                    <Field>
                        <FieldLabel id="post-visibility" render={<span />}>
                            Visibility
                        </FieldLabel>
                        <SegmentedControl
                            aria-labelledby="post-visibility"
                            onValueChange={next => {
                                if (isVisibility(next)) update({ visibility: next });
                            }}
                            value={draft.visibility}
                        >
                            {VISIBILITY.map(option => (
                                <SegmentedControlItem key={option.value} value={option.value}>
                                    {option.label}
                                </SegmentedControlItem>
                            ))}
                        </SegmentedControl>
                    </Field>
                </div>
            </section>

            <section className="flex flex-col gap-5">
                <SectionHead
                    description="The title and the line under it that search results show for the post."
                    title="Search engines"
                />
                <div className="flex flex-col gap-5">
                    <Field invalid={draft.seoTitle.length > 60}>
                        <FieldLabel>Meta title</FieldLabel>
                        <Input
                            onChange={event => update({ seoTitle: event.target.value })}
                            placeholder={post.title}
                            value={draft.seoTitle}
                        />
                        <Counter count={draft.seoTitle.length} limit={60} />
                    </Field>
                    <Field invalid={draft.seoDescription.length > 160}>
                        <FieldLabel>Meta description</FieldLabel>
                        <Textarea
                            onChange={event => update({ seoDescription: event.target.value })}
                            placeholder="Shown under the title in search results"
                            rows={3}
                            value={draft.seoDescription}
                        />
                        <Counter count={draft.seoDescription.length} limit={160} />
                    </Field>
                </div>
            </section>
        </PageContent>
    );
};

/* Screen */

/** The Posts screen of a small company CMS: an index of posts, and a page for each post. */
export const ContinuumCms = () => {
    const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
    const [tab, setTab] = useState<StatusTab>('all');
    const [query, setQuery] = useState('');
    // Picked authors and categories, by group; none picked in a group lets every value through.
    const [filters, setFilters] = useState<FilterValues>({});
    const [newestFirst, setNewestFirst] = useState(true);
    // No row is current until the keyboard picks one: rows open pages, so a wash on load reads as a stale selection.
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    // Which page shows: the index, or a post by its id. The app keeps its pages in state.
    const [place, setPlace] = useState<string>(INDEX);
    const { notice, show } = useHeaderNotice();
    const created = useRef(0);

    /** Posts matching the search and the author and category filters, any status. */
    const matching = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const authors = filters.author ?? [];
        const categories = filters.category ?? [];
        return posts.filter(
            post =>
                (authors.length === 0 || authors.includes(post.authorId)) &&
                (categories.length === 0 || categories.includes(post.category)) &&
                (needle === '' ||
                    `${post.title} ${post.slug} ${post.excerpt}`.toLowerCase().includes(needle)),
        );
    }, [posts, query, filters]);

    const counts = useMemo(() => {
        const result: Record<StatusTab, number> = {
            all: matching.length,
            draft: 0,
            review: 0,
            scheduled: 0,
            published: 0,
        };
        for (const post of matching) result[post.status] += 1;
        return result;
    }, [matching]);

    const visible = useMemo(() => {
        const list = tab === 'all' ? matching : matching.filter(post => post.status === tab);
        const direction = newestFirst ? -1 : 1;
        return [...list].sort((a, b) => a.editedAt.localeCompare(b.editedAt) * direction);
    }, [matching, tab, newestFirst]);

    const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const page = Math.min(pageNumber, pageCount);
    const rows = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const open = place === INDEX ? undefined : posts.find(post => post.id === place);
    const filterCount = countFilters(filters);
    const hasFilters = query !== '' || filterCount > 0;
    const tabbableId = rows.some(post => post.id === currentId) ? currentId : rows[0]?.id;

    const authorOptions: FilterOption<AuthorId>[] = Object.values(AUTHORS).map(author => ({
        value: author.id,
        label: author.name,
        count: posts.filter(post => post.authorId === author.id).length,
        leading: <AuthorAvatar author={author} />,
    }));

    const categoryOptions: FilterOption<Category>[] = CATEGORIES.map(name => ({
        value: name,
        label: name,
        count: posts.filter(post => post.category === name).length,
    }));

    // A narrower list starts again at its first page.
    const filter =
        <T,>(set: (value: T) => void) =>
        (value: T) => {
            set(value);
            setPageNumber(1);
        };

    const setFilterValues = filter(setFilters);

    // One menu holds both dimensions, as the library's filter menu does: a checkbox per value, its count
    // at the edge. What is picked shows beside it as a chip per group.
    const filterGroups: {
        id: string;
        label: string;
        icon: ReactNode;
        options: FilterOption<string>[];
    }[] = [
        { id: 'author', label: 'Author', icon: <UserRound {...icon} />, options: authorOptions },
        { id: 'category', label: 'Category', icon: <Tag {...icon} />, options: categoryOptions },
    ];

    const clearFilters = () => {
        setQuery('');
        setFilters({});
        setPageNumber(1);
    };

    const openPost = (id: string) => {
        setCurrentId(id);
        setPlace(id);
    };

    const createPost = () => {
        created.current += 1;
        const n = created.current;
        const post: Post = {
            id: `new-${n}`,
            title: 'Untitled post',
            slug: n === 1 ? 'untitled-post' : `untitled-post-${n}`,
            excerpt: '',
            status: 'draft',
            authorId: 'maya',
            category: 'Company',
            editedAt: NOW_ISO,
            publishAt: null,
            visibility: 'public',
            seoTitle: '',
            seoDescription: '',
            cover: COVER_TONES[n % COVER_TONES.length] ?? 'iris',
        };
        setPosts(current => [post, ...current]);
        clearFilters();
        setTab('all');
        setNewestFirst(true);
        openPost(post.id);
    };

    const savePost = (id: string, changes: Partial<Post>) =>
        setPosts(current =>
            current.map(post =>
                post.id === id ? { ...post, ...changes, editedAt: NOW_ISO } : post,
            ),
        );

    const deletePost = (id: string) => {
        setPosts(current => current.filter(post => post.id !== id));
        setCurrentId(null);
        setPlace(INDEX);
    };

    /** Arrow keys move the current row, and focus, through the page; Enter or Space opens it. */
    const onRowKeyDown = (event: ReactKeyboardEvent<HTMLTableRowElement>, index: number) => {
        const post = rows[index];
        if ((event.key === 'Enter' || event.key === ' ') && post) {
            event.preventDefault();
            openPost(post.id);
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const next = rows[index + step];
        if (!next) return;
        setCurrentId(next.id);
        const sibling =
            step === 1
                ? event.currentTarget.nextElementSibling
                : event.currentTarget.previousElementSibling;
        if (sibling instanceof HTMLElement) sibling.focus();
    };

    const toIndex = () => setPlace(INDEX);

    const root = useRef<HTMLDivElement>(null);

    // The arrows move through the list from anywhere in the screen, as the hints at its foot say,
    // and Enter opens the row they rest on; Escape lets go of it. Typing in a field is left alone.
    useEffect(() => {
        if (place !== INDEX) return;
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target instanceof HTMLElement ? event.target : null;
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
            if (
                target?.closest(
                    'input, textarea, select, [contenteditable], [role=combobox], [role=listbox], [role=menu], [role=dialog]',
                )
            ) {
                return;
            }
            const onRow = Boolean(target?.closest('[data-post-row]'));
            if (event.key === 'Escape') {
                if (!currentId) return;
                setCurrentId(null);
                if (onRow) target?.blur();
                return;
            }
            // A focused row moves itself; from anywhere else, the screen moves it for it.
            if (onRow) return;
            if (event.key === 'Enter' && currentId && !target?.closest('button, a')) {
                event.preventDefault();
                openPost(currentId);
                return;
            }
            if ((event.key !== 'ArrowDown' && event.key !== 'ArrowUp') || rows.length === 0) return;
            event.preventDefault();
            const step = event.key === 'ArrowDown' ? 1 : -1;
            const at = rows.findIndex(row => row.id === currentId);
            const next =
                at < 0
                    ? rows[step === 1 ? 0 : rows.length - 1]
                    : rows[Math.min(Math.max(at + step, 0), rows.length - 1)];
            if (!next) return;
            setCurrentId(next.id);
            root.current?.querySelector<HTMLElement>(`[data-post-row="${next.id}"]`)?.focus();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    });

    const keyHints = (
        <span className="flex items-center gap-1.5 text-neutral-500 text-xs">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span className="mr-2">to move</span>
            <Kbd>Esc</Kbd>
            <span className="mr-2">to let go</span>
            <Kbd>/</Kbd>
            <span>to search</span>
        </span>
    );

    const results =
        visible.length > PAGE_SIZE
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, visible.length)} of ${visible.length} posts`
            : visible.length === posts.length
              ? `${posts.length} posts`
              : `Showing ${visible.length} of ${posts.length} posts`;

    return (
        <AppShell
            className="h-full min-h-0 min-w-[1280px]"
            // A press anywhere but on a row lets go of the current one, as Escape does.
            onPointerDown={event => {
                if (event.target instanceof Element && !event.target.closest('[data-post-row]')) {
                    setCurrentId(null);
                }
            }}
            ref={root}
        >
            <CmsSidebar onPosts={toIndex} postCount={posts.length} />

            <AppPanel>
                <HeaderBar>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <CrumbLink onClick={toIndex}>
                                    <BreadcrumbHome />
                                </CrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {open ? (
                                    <CrumbLink onClick={toIndex}>Posts</CrumbLink>
                                ) : (
                                    <BreadcrumbPage>Posts</BreadcrumbPage>
                                )}
                            </BreadcrumbItem>
                            {open && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{open.title}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </>
                            )}
                        </BreadcrumbList>
                    </Breadcrumb>
                    <HeaderBarActions>
                        {/* The site's state, quiet beside the way to it. */}
                        <span className="flex items-center gap-2 px-2 text-neutral-600 text-xs">
                            <StatusDot pulse />
                            Site is live
                        </span>
                        <Button variant="ghost">
                            View site
                            <ArrowUpRight {...icon} />
                        </Button>
                    </HeaderBarActions>
                    <HeaderBarNotice {...notice} />
                </HeaderBar>

                {/* Keyed by the page, so each one opens at its top. */}
                <div className="min-h-0 flex-1 overflow-auto" key={open?.id ?? INDEX}>
                    {open ? (
                        <PostPage
                            key={open.id}
                            onCopyLink={() => show('Link copied')}
                            onDelete={() => deletePost(open.id)}
                            onSave={changes => savePost(open.id, changes)}
                            post={open}
                        />
                    ) : (
                        // The foot pads past the dock, so the last rows can scroll clear of it.
                        <PageContent className="flex flex-col pb-28" width="wide">
                            <PageHead
                                description="Write, review and schedule stories for the company blog."
                                title="Posts"
                            />

                            {/* The statuses and New post float in the dock; the head keeps search and filters. */}
                            <div className="mt-6 flex items-center gap-2">
                                <SearchField onChange={filter(setQuery)} value={query} />
                                <FilterBar onClear={hasFilters ? clearFilters : undefined}>
                                    <FilterMenu>
                                        <FilterMenuTrigger count={filterCount} />
                                        <FilterMenuContent>
                                            {filterGroups.map(group => (
                                                <FilterMenuGroup key={group.id} label={group.label}>
                                                    {group.options.map(option => (
                                                        <FilterMenuItem
                                                            checked={
                                                                filters[group.id]?.includes(
                                                                    option.value,
                                                                ) ?? false
                                                            }
                                                            count={option.count}
                                                            icon={option.leading}
                                                            key={option.value}
                                                            onCheckedChange={() =>
                                                                setFilterValues(
                                                                    toggleFilter(
                                                                        filters,
                                                                        group.id,
                                                                        option.value,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            {option.label}
                                                        </FilterMenuItem>
                                                    ))}
                                                </FilterMenuGroup>
                                            ))}
                                            <FilterMenuClear
                                                disabled={filterCount === 0}
                                                onClick={() => setFilterValues({})}
                                            />
                                        </FilterMenuContent>
                                    </FilterMenu>
                                    {filterGroups.map(group => {
                                        const picked = group.options.filter(option =>
                                            filters[group.id]?.includes(option.value),
                                        );
                                        return (
                                            picked.length > 0 && (
                                                <FilterChip
                                                    icon={group.icon}
                                                    key={group.id}
                                                    onRemove={() =>
                                                        setFilterValues(
                                                            Object.fromEntries(
                                                                Object.entries(filters).filter(
                                                                    ([key]) => key !== group.id,
                                                                ),
                                                            ),
                                                        )
                                                    }
                                                >
                                                    {group.label}:{' '}
                                                    {picked.map(option => option.label).join(', ')}
                                                </FilterChip>
                                            )
                                        );
                                    })}
                                </FilterBar>
                            </div>

                            {visible.length > 0 ? (
                                <>
                                    <Table
                                        aria-label="Posts"
                                        className="table-fixed"
                                        role="grid"
                                        wrapperClassName="mt-4"
                                    >
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead className="w-28">Status</TableHead>
                                                <TableHead className="w-40">Author</TableHead>
                                                <TableHead className="w-32">Category</TableHead>
                                                <TableHead
                                                    align="right"
                                                    aria-sort={
                                                        newestFirst ? 'descending' : 'ascending'
                                                    }
                                                    className="w-32"
                                                >
                                                    <button
                                                        className={cn(
                                                            'inline-flex cursor-pointer items-center gap-1 rounded-chip transition-[color] duration-150 hover:text-neutral-950',
                                                            focusRing,
                                                        )}
                                                        onClick={() =>
                                                            setNewestFirst(isNewest => !isNewest)
                                                        }
                                                        type="button"
                                                    >
                                                        Last edited
                                                        {newestFirst ? (
                                                            <ArrowDown
                                                                className="size-3.5"
                                                                {...icon}
                                                            />
                                                        ) : (
                                                            <ArrowUp
                                                                className="size-3.5"
                                                                {...icon}
                                                            />
                                                        )}
                                                    </button>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.map((post, index) => (
                                                <PostRow
                                                    current={post.id === currentId}
                                                    key={post.id}
                                                    onKeyDown={event => onRowKeyDown(event, index)}
                                                    onOpen={() => openPost(post.id)}
                                                    post={post}
                                                    tabbable={post.id === tabbableId}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {/* Page buttons only once there is a second page to go to. */}
                                    {pageCount > 1 ? (
                                        <Pagination
                                            className="mt-4"
                                            end={keyHints}
                                            onPageChange={setPageNumber}
                                            page={page}
                                            pageCount={pageCount}
                                            results={results}
                                        />
                                    ) : (
                                        <div className="mt-4 flex items-center justify-between gap-4">
                                            <span className="font-medium text-neutral-800 text-xs">
                                                {results}
                                            </span>
                                            {keyHints}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <EmptyState
                                    action={
                                        <Button
                                            onClick={() => {
                                                clearFilters();
                                                setTab('all');
                                            }}
                                            variant="secondary"
                                        >
                                            Clear filters
                                        </Button>
                                    }
                                    className="mt-4"
                                    description="Try another search, or clear the filters."
                                    icon={<SearchX {...icon} />}
                                    title="No posts found"
                                />
                            )}
                        </PageContent>
                    )}
                </div>

                {/*
                 * The index's dock floats at the panel's foot, over the page as it scrolls: the
                 * statuses to switch between, and beside them the page's one action.
                 */}
                {!open && (
                    <BottomBar floating>
                        <Dock
                            aria-label="Status"
                            onValueChange={next => {
                                if (isStatusTab(next)) filter(setTab)(next);
                            }}
                            value={tab}
                        >
                            {TABS.map(item => (
                                <DockItem key={item.value} value={item.value}>
                                    {item.label}
                                    <span className="tabular-nums opacity-60">
                                        {counts[item.value]}
                                    </span>
                                </DockItem>
                            ))}
                        </Dock>
                        <DockAction onClick={createPost}>
                            <Plus {...icon} />
                            New post
                        </DockAction>
                    </BottomBar>
                )}
            </AppPanel>
        </AppShell>
    );
};
