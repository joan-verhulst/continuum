import {
    ArrowDown,
    ArrowUp,
    ArrowUpRight,
    CalendarDays,
    Check,
    ChevronDown,
    ChevronsUpDown,
    Ellipsis,
    Eye,
    FileText,
    ImageIcon,
    ImageUp,
    Link2,
    type LucideIcon,
    PanelsTopLeft,
    Plus,
    Search,
    SearchX,
    Settings,
    SquarePen,
    Tag,
    Trash,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import {
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';

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
    /** Avatar background and initials colour. */
    tint: string;
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

/** The fields the details panel edits before they are saved. */
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
    maya: {
        id: 'maya',
        name: 'Maya Chen',
        initials: 'MC',
        role: 'Editor-in-chief',
        tint: 'bg-[#e9e7ff] text-[#4c43c4]',
    },
    jonas: {
        id: 'jonas',
        name: 'Jonas Berg',
        initials: 'JB',
        role: 'Staff engineer',
        tint: 'bg-[#daf1e6] text-[#17734b]',
    },
    priya: {
        id: 'priya',
        name: 'Priya Nair',
        initials: 'PN',
        role: 'Product marketing',
        tint: 'bg-[#ffe6d6] text-[#b0501d]',
    },
    sam: {
        id: 'sam',
        name: 'Sam Okafor',
        initials: 'SO',
        role: 'Design lead',
        tint: 'bg-[#dbeafa] text-[#1c67a3]',
    },
    lena: {
        id: 'lena',
        name: 'Lena Vogel',
        initials: 'LV',
        role: 'People team',
        tint: 'bg-[#fbe1ed] text-[#a03166]',
    },
};

const STATUS: Record<Status, { label: string; badge: string; dot: string }> = {
    draft: { label: 'Draft', badge: 'bg-[#f1f1f4] text-[#55555f]', dot: 'bg-[#a3a3ad]' },
    review: { label: 'In review', badge: 'bg-[#fdf4e3] text-[#94580a]', dot: 'bg-[#e7a13a]' },
    scheduled: { label: 'Scheduled', badge: 'bg-[#ecf3fe] text-[#1f5fbf]', dot: 'bg-[#3a85ee]' },
    published: { label: 'Published', badge: 'bg-[#eaf7ef] text-[#187a47]', dot: 'bg-[#27a567]' },
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

/* Visual constants */

const FONT_STACK =
    "'Inter Variable', Inter, 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

/** Shared grid for the table header and every row, so the columns line up. */
const GRID = 'grid grid-cols-[minmax(0,1fr)_96px_120px_88px_76px] items-center gap-x-3';

const BUTTON =
    'inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] px-3 font-[500] text-[13px] outline-none transition-colors duration-150 focus-visible:shadow-[0_0_0_3px_rgba(91,91,214,0.28)]';
const PRIMARY = `${BUTTON} bg-[#18181d] text-[#fff] shadow-[0_1px_2px_rgba(20,20,28,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[#2c2c34]`;
const SECONDARY = `${BUTTON} border border-[#e1e1e7] bg-[#fff] text-[#26262d] shadow-[0_1px_1px_rgba(20,20,28,0.04)] hover:bg-[#f7f7f9]`;

/** Inputs, textareas, the select and the date trigger share one chrome. */
const FIELD =
    'w-full rounded-[8px] border border-[#e1e1e7] bg-[#fff] text-[#16161b] text-[13px] shadow-[0_1px_1px_rgba(20,20,28,0.03)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#a6a6b0] hover:border-[#d2d2da] focus:border-[#9a9aea] focus:shadow-[0_0_0_3px_rgba(91,91,214,0.15)]';

const layer = (...gradients: string[]) => gradients.join(', ');

/** Mesh gradients for the cover placeholders, one per tone. */
const COVERS: Record<CoverTone, string> = {
    iris: layer(
        'radial-gradient(80% 110% at 0% 0%, #c9eeff 0%, transparent 60%)',
        'radial-gradient(70% 90% at 100% 100%, #a874ff 0%, transparent 65%)',
        'linear-gradient(135deg, #8f9dff 0%, #5656d8 100%)',
    ),
    sunset: layer(
        'radial-gradient(80% 110% at 0% 0%, #ffdca3 0%, transparent 60%)',
        'radial-gradient(70% 90% at 100% 100%, #a35cff 0%, transparent 65%)',
        'radial-gradient(60% 70% at 85% 10%, #ff9cbb 0%, transparent 70%)',
        'linear-gradient(135deg, #ff9a6c 0%, #f0567a 100%)',
    ),
    ocean: layer(
        'radial-gradient(80% 110% at 0% 100%, #a2f2df 0%, transparent 60%)',
        'radial-gradient(70% 90% at 100% 0%, #6d63ff 0%, transparent 65%)',
        'linear-gradient(135deg, #5ec8f0 0%, #2f6fe4 100%)',
    ),
    forest: layer(
        'radial-gradient(80% 110% at 100% 0%, #e9f7a0 0%, transparent 60%)',
        'radial-gradient(70% 90% at 0% 100%, #136f7a 0%, transparent 65%)',
        'linear-gradient(135deg, #7fd6a2 0%, #22906f 100%)',
    ),
    dusk: layer(
        'radial-gradient(80% 110% at 100% 100%, #ff9ad5 0%, transparent 60%)',
        'radial-gradient(70% 90% at 0% 0%, #cbbcff 0%, transparent 65%)',
        'linear-gradient(135deg, #8d7bff 0%, #4b32c8 100%)',
    ),
    sand: layer(
        'radial-gradient(80% 110% at 0% 0%, #fff3cf 0%, transparent 60%)',
        'radial-gradient(70% 90% at 100% 100%, #e7714f 0%, transparent 65%)',
        'linear-gradient(135deg, #ffd99a 0%, #f0a05a 100%)',
    ),
};

/** A fine noise texture that keeps the cover gradients from banding. */
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>",
)}")`;

/* Helpers */

/** Joins class names, skipping falsy ones. */
const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(' ');

const isStatus = (value: string): value is Status => STATUS_ORDER.some(status => status === value);

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

/** "Thu 10:00 AM" */
const formatWeekdayTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });

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

/* Small pieces */

const Avatar = ({ author, size }: { author: Author; size: number }) => (
    <span
        aria-hidden="true"
        className={cn(
            'inline-flex shrink-0 select-none items-center justify-center rounded-[999px] font-[600] tracking-[0.02em]',
            author.tint,
        )}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
        {author.initials}
    </span>
);

const StatusBadge = ({ status }: { status: Status }) => (
    <span
        className={cn(
            'inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-[999px] pr-2 pl-[7px] font-[500] text-[12px] leading-none',
            STATUS[status].badge,
        )}
    >
        <span className={cn('size-1.5 rounded-[999px]', STATUS[status].dot)} />
        {STATUS[status].label}
    </span>
);

const Kbd = ({ children }: { children: ReactNode }) => (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] border border-[#e3e3e8] bg-[#fff] px-1 font-[500] font-[inherit] text-[#6a6a74] text-[11px] leading-none shadow-[0_1px_0_#e3e3e8]">
        {children}
    </kbd>
);

/** The site's mark: a fern leaf with its vein cut out. */
const LogoMark = () => (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 13.5C2.5 7 6.5 2.5 13.5 2.5C13.5 9 9 13.5 2.5 13.5Z" fill="#fff" />
        <path d="M2.5 13.5L9 7" stroke="#5b50d4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

/* Sidebar */

const NavItem = ({
    icon: Icon,
    label,
    count,
    active = false,
}: {
    icon: LucideIcon;
    label: string;
    count?: number;
    active?: boolean;
}) => (
    <button
        type="button"
        aria-current={active ? 'page' : undefined}
        className={cn(
            'flex h-8 cursor-pointer items-center gap-2.5 rounded-[8px] px-2 text-left font-[500] text-[13px] transition-colors duration-150',
            active
                ? 'bg-[#fff] text-[#111115] shadow-[0_1px_2px_rgba(20,20,28,0.06),0_0_0_1px_rgba(20,20,28,0.06)]'
                : 'text-[#55555f] hover:bg-[#e9e9ed] hover:text-[#111115]',
        )}
    >
        <Icon
            size={16}
            strokeWidth={1.75}
            className={active ? 'text-[#5b5bd6]' : 'text-[#8a8a94]'}
        />
        <span className="flex-1 truncate">{label}</span>
        {count === undefined ? null : (
            <span className="text-[#9a9aa4] text-[12px] tabular-nums">{count}</span>
        )}
    </button>
);

const Sidebar = ({ postCount, nextUp }: { postCount: number; nextUp: Post | undefined }) => (
    <aside className="flex w-[200px] shrink-0 flex-col p-2.5">
        <button
            type="button"
            className="flex cursor-pointer items-center gap-2.5 rounded-[10px] p-1.5 text-left transition-colors duration-150 hover:bg-[#e9e9ed]"
        >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[linear-gradient(145deg,#7c7cf2,#4a3fc6)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(46,36,140,0.35)]">
                <LogoMark />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate font-[600] text-[#111115] text-[13px] leading-[17px]">
                    Fernhill
                </span>
                <span className="block truncate text-[#85858f] text-[12px] leading-[16px]">
                    {SITE}
                </span>
            </span>
            <ChevronsUpDown size={14} className="shrink-0 text-[#9a9aa4]" />
        </button>

        <nav aria-label="Sections" className="mt-5">
            <p className="px-2 pb-1 font-[500] text-[#8e8e98] text-[11.5px]">Content</p>
            <div className="flex flex-col gap-px">
                <NavItem icon={FileText} label="Posts" count={postCount} active />
                <NavItem icon={PanelsTopLeft} label="Pages" count={8} />
                <NavItem icon={ImageIcon} label="Media" count={126} />
            </div>
            <p className="mt-4 px-2 pb-1 font-[500] text-[#8e8e98] text-[11.5px]">Workspace</p>
            <div className="flex flex-col gap-px">
                <NavItem icon={Users} label="Authors" count={5} />
                <NavItem icon={Settings} label="Settings" />
            </div>
        </nav>

        <div className="mt-auto rounded-[10px] border border-[#e4e4e9] bg-[#fff] p-3 shadow-[0_1px_2px_rgba(20,20,28,0.04)]">
            <div className="flex items-center gap-2">
                <span className="size-2 rounded-[999px] bg-[#27a567] shadow-[0_0_0_3px_rgba(39,165,103,0.16)]" />
                <span className="font-[500] text-[#16161b] text-[12.5px]">Site is live</span>
                <button
                    type="button"
                    aria-label="Visit site"
                    title="Visit site"
                    className="-mr-1 ml-auto inline-flex size-6 cursor-pointer items-center justify-center rounded-[6px] text-[#8a8a94] transition-colors duration-150 hover:bg-[#f1f1f4] hover:text-[#16161b]"
                >
                    <ArrowUpRight size={14} />
                </button>
            </div>
            {nextUp?.publishAt ? (
                <div className="mt-2 border-[#efeff2] border-t pt-2">
                    <p className="text-[#85858f] text-[11.5px] leading-[16px]">
                        Next up · {formatWeekdayTime(nextUp.publishAt)}
                    </p>
                    <p className="mt-0.5 truncate text-[#26262d] text-[12.5px] leading-[18px]">
                        {nextUp.title}
                    </p>
                </div>
            ) : (
                <p className="mt-1.5 text-[#85858f] text-[12px]">Nothing scheduled</p>
            )}
        </div>

        <button
            type="button"
            className="mt-2 flex cursor-pointer items-center gap-2.5 rounded-[10px] p-1.5 text-left transition-colors duration-150 hover:bg-[#e9e9ed]"
        >
            <Avatar author={AUTHORS.maya} size={30} />
            <span className="min-w-0 flex-1">
                <span className="block truncate font-[500] text-[#111115] text-[13px] leading-[17px]">
                    {AUTHORS.maya.name}
                </span>
                <span className="block truncate text-[#85858f] text-[12px] leading-[16px]">
                    {AUTHORS.maya.role}
                </span>
            </span>
            <Ellipsis size={15} className="shrink-0 text-[#9a9aa4]" />
        </button>
    </aside>
);

/* Toolbar */

const StatusTabs = ({
    value,
    counts,
    onChange,
}: {
    value: StatusTab;
    counts: Record<StatusTab, number>;
    onChange: (value: StatusTab) => void;
}) => (
    <div className="mt-4 flex items-center gap-5 border-[#ececf0] border-b px-6">
        {TABS.map(tab => {
            const active = tab.value === value;
            return (
                <button
                    key={tab.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange(tab.value)}
                    className={cn(
                        'relative flex h-9 cursor-pointer items-center gap-1.5 font-[500] text-[13px] transition-colors duration-150',
                        active ? 'text-[#111115]' : 'text-[#6a6a74] hover:text-[#111115]',
                    )}
                >
                    {tab.label}
                    <span
                        className={cn(
                            'min-w-[20px] rounded-[6px] px-1.5 text-center text-[11.5px] tabular-nums leading-[18px]',
                            active ? 'bg-[#e9e9ef] text-[#26262d]' : 'bg-[#f2f2f5] text-[#85858f]',
                        )}
                    >
                        {counts[tab.value]}
                    </span>
                    {active ? (
                        <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-[2px] bg-[#18181d]" />
                    ) : null}
                </button>
            );
        })}
    </div>
);

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
        <div className="flex h-8 w-[248px] items-center rounded-[8px] border border-[#e1e1e7] bg-[#fff] shadow-[0_1px_1px_rgba(20,20,28,0.03)] transition-[border-color,box-shadow] duration-150 focus-within:border-[#9a9aea] focus-within:shadow-[0_0_0_3px_rgba(91,91,214,0.15)] hover:border-[#d2d2da]">
            <Search size={15} className="ml-2.5 shrink-0 text-[#9a9aa4]" />
            <input
                ref={inputRef}
                value={value}
                onChange={event => onChange(event.target.value)}
                onKeyDown={event => {
                    if (event.key === 'Escape') {
                        onChange('');
                        event.currentTarget.blur();
                    }
                }}
                placeholder="Search posts"
                aria-label="Search posts"
                className="h-full min-w-0 flex-1 bg-[transparent] px-2 text-[#16161b] text-[13px] outline-none placeholder:text-[#a1a1ab]"
            />
            {value ? (
                <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => onChange('')}
                    className="mr-1.5 inline-flex size-5 cursor-pointer items-center justify-center rounded-[5px] text-[#8a8a94] hover:bg-[#f1f1f4] hover:text-[#16161b]"
                >
                    <X size={13} />
                </button>
            ) : (
                <span className="mr-2 flex">
                    <Kbd>/</Kbd>
                </span>
            )}
        </div>
    );
};

interface FilterOption<T extends string> {
    value: T;
    label: string;
    count: number;
    leading?: ReactNode;
}

const MenuItem = ({
    label,
    leading,
    count,
    selected,
    onClick,
}: {
    label: string;
    leading?: ReactNode;
    count: number;
    selected: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-[6px] px-2 text-left text-[#26262d] text-[13px] transition-colors duration-100 hover:bg-[#f4f4f7]"
    >
        {leading}
        <span className="flex-1 truncate">{label}</span>
        <span className="text-[#a1a1ab] text-[12px] tabular-nums">{count}</span>
        <span className="flex w-4 justify-center text-[#5b5bd6]">
            {selected ? <Check size={14} strokeWidth={2.25} /> : null}
        </span>
    </button>
);

/** A filter button with a small popover of options. */
const FilterMenu = <T extends string>({
    icon: Icon,
    label,
    anyLabel,
    options,
    value,
    onChange,
}: {
    icon: LucideIcon;
    label: string;
    anyLabel: string;
    options: FilterOption<T>[];
    value: T | null;
    onChange: (value: T | null) => void;
}) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const current = options.find(option => option.value === value);
    const total = options.reduce((sum, option) => sum + option.count, 0);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: PointerEvent) => {
            if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
            setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const choose = (next: T | null) => {
        onChange(next);
        setOpen(false);
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen(isOpen => !isOpen)}
                className={cn(
                    BUTTON,
                    'border px-2.5',
                    current
                        ? 'border-[#d9d9f7] bg-[#f5f5fe] text-[#3b3baa]'
                        : 'border-[#e1e1e7] bg-[#fff] text-[#3b3b43] shadow-[0_1px_1px_rgba(20,20,28,0.04)] hover:bg-[#f7f7f9]',
                )}
            >
                {current?.leading ?? <Icon size={14} className="text-[#8a8a94]" />}
                {current ? current.label : label}
                <ChevronDown
                    size={14}
                    className={cn(
                        'text-[#9a9aa4] transition-transform duration-150',
                        open && 'rotate-180',
                    )}
                />
            </button>
            {open ? (
                <div className="absolute top-full left-0 z-30 mt-1.5 w-[232px] rounded-[10px] border border-[#e6e6eb] bg-[#fff] p-1 shadow-[0_12px_32px_-12px_rgba(20,20,28,0.28),0_2px_6px_rgba(20,20,28,0.06)]">
                    <MenuItem
                        label={anyLabel}
                        count={total}
                        selected={value === null}
                        onClick={() => choose(null)}
                    />
                    <div className="mx-1 my-1 h-px bg-[#efeff2]" />
                    {options.map(option => (
                        <MenuItem
                            key={option.value}
                            label={option.label}
                            leading={option.leading}
                            count={option.count}
                            selected={option.value === value}
                            onClick={() => choose(option.value)}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
};

/* Table */

const PostRow = ({
    post,
    selected,
    onSelect,
    onKeyDown,
}: {
    post: Post;
    selected: boolean;
    onSelect: () => void;
    onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
}) => {
    const author = AUTHORS[post.authorId];
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onSelect}
            onKeyDown={onKeyDown}
            className={cn(
                GRID,
                'h-[52px] w-full cursor-pointer border-[#f0f0f3] border-b px-6 text-left outline-none transition-colors duration-100 focus-visible:bg-[#f7f7fe]',
                selected ? 'bg-[#f5f5fe] shadow-[inset_2px_0_0_#5b5bd6]' : 'hover:bg-[#f8f8fa]',
            )}
        >
            <span className="min-w-0">
                <span className="block truncate font-[500] text-[#16161b] text-[13px] leading-[18px]">
                    {post.title}
                </span>
                <span className="mt-0.5 block truncate text-[#8a8a94] text-[12px] leading-[16px]">
                    /blog/{post.slug}
                </span>
            </span>
            <span className="flex">
                <StatusBadge status={post.status} />
            </span>
            <span className="flex min-w-0 items-center gap-2">
                <Avatar author={author} size={20} />
                <span className="truncate text-[#3b3b43]">{author.name}</span>
            </span>
            <span className="truncate text-[#55555f]">{post.category}</span>
            <span className="text-right text-[#6a6a74] text-[12.5px] tabular-nums">
                {formatEdited(post.editedAt)}
            </span>
        </button>
    );
};

const EmptyState = ({ onClear }: { onClear: () => void }) => (
    <div className="flex flex-col items-center px-6 py-20 text-center">
        <span className="flex size-10 items-center justify-center rounded-[10px] border border-[#ececf0] bg-[#fafafb] text-[#8a8a94]">
            <SearchX size={18} />
        </span>
        <p className="mt-3 font-[600] text-[#111115] text-[13.5px]">No posts found</p>
        <p className="mt-1 text-[#6a6a74] text-[13px]">Try another search, or clear the filters.</p>
        <button type="button" onClick={onClear} className={cn(SECONDARY, 'mt-4')}>
            Clear filters
        </button>
    </div>
);

/* Details panel */

const Cover = ({ tone, children }: { tone: CoverTone; children: ReactNode }) => (
    <div
        className="relative h-[120px] shrink-0 overflow-hidden"
        style={{ backgroundImage: COVERS[tone] }}
    >
        <div
            aria-hidden="true"
            className="absolute inset-0 opacity-25 mix-blend-soft-light"
            style={{ backgroundImage: GRAIN }}
        />
        <div
            aria-hidden="true"
            className="absolute -bottom-36 -left-16 size-[260px] rounded-[999px] border border-[#fff]/45"
        />
        <div
            aria-hidden="true"
            className="absolute -bottom-24 left-6 size-[170px] rounded-[999px] border border-[#fff]/35"
        />
        <div
            aria-hidden="true"
            className="absolute top-[27px] left-[143px] size-3.5 rounded-[999px] bg-[#fff] shadow-[0_0_18px_4px_rgba(255,255,255,0.6)]"
        />
        {children}
    </div>
);

const CoverButton = ({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick?: () => void;
    children: ReactNode;
}) => (
    <button
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        className="inline-flex size-7 cursor-pointer items-center justify-center rounded-[7px] text-[#2c2c33] transition-colors duration-150 hover:bg-[#fff]"
    >
        {children}
    </button>
);

const PanelSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="mt-4 border-[#efeff2] border-t pt-4">
        <h3 className="mb-2.5 font-[600] text-[#111115] text-[13px] leading-[18px]">{title}</h3>
        {children}
    </section>
);

const FieldLabel = ({
    htmlFor,
    count,
    limit,
    children,
}: {
    htmlFor: string;
    count: number;
    limit: number;
    children: ReactNode;
}) => (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="font-[500] text-[#62626c] text-[12.5px] leading-[18px]">
            {children}
        </label>
        <span
            className={cn(
                'text-[11.5px] tabular-nums',
                count > limit ? 'text-[#c2410c]' : 'text-[#a1a1ab]',
            )}
        >
            {count}/{limit}
        </span>
    </div>
);

const PropertyLabel = ({ children }: { children: ReactNode }) => (
    <span className="font-[500] text-[#62626c] text-[12.5px]">{children}</span>
);

/** Quick edit for the selected post. Edits stay local until "Save changes". */
const PostPanel = ({
    post,
    onSave,
    onDelete,
    onClose,
}: {
    post: Post;
    onSave: (changes: Partial<Post>) => void;
    onDelete: () => void;
    onClose: () => void;
}) => {
    const id = useId();
    const [draft, setDraft] = useState<Draft>(() => toDraft(post));
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const dirty = DRAFT_KEYS.some(key => draft[key] !== post[key]);
    const schedule = describeSchedule(draft.status, post.publishAt);
    const url = `${SITE}/blog/${post.slug}`;

    useEffect(() => {
        if (!saved) return;
        const timer = window.setTimeout(() => setSaved(false), 1800);
        return () => window.clearTimeout(timer);
    }, [saved]);

    useEffect(() => {
        if (!copied) return;
        const timer = window.setTimeout(() => setCopied(false), 1400);
        return () => window.clearTimeout(timer);
    }, [copied]);

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
        navigator.clipboard?.writeText(`https://${url}`).catch(() => setCopied(false));
        setCopied(true);
    };

    return (
        <aside
            aria-label="Post details"
            className="flex w-[340px] shrink-0 flex-col border-[#ececf0] border-l bg-[#fff]"
        >
            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:#d4d4dc_transparent] [scrollbar-width:thin]">
                <Cover tone={draft.cover}>
                    <div className="absolute top-3 right-3 flex items-center gap-0.5 rounded-[9px] bg-[#fff]/80 p-0.5 shadow-[0_1px_2px_rgba(20,20,28,0.12)] backdrop-blur-[10px]">
                        <CoverButton
                            label={copied ? 'Link copied' : 'Copy link'}
                            onClick={copyLink}
                        >
                            {copied ? <Check size={15} /> : <Link2 size={15} />}
                        </CoverButton>
                        <CoverButton label="Open in editor">
                            <SquarePen size={15} />
                        </CoverButton>
                        <CoverButton label="Close details" onClick={onClose}>
                            <X size={15} />
                        </CoverButton>
                    </div>
                    <button
                        type="button"
                        onClick={() => update({ cover: nextTone(draft.cover) })}
                        className="absolute right-3 bottom-3 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#fff]/80 px-2.5 font-[500] text-[#26262d] text-[12px] shadow-[0_1px_2px_rgba(20,20,28,0.12)] backdrop-blur-[10px] transition-colors duration-150 hover:bg-[#fff]"
                    >
                        <ImageUp size={14} />
                        Change cover
                    </button>
                </Cover>

                <div className="px-5 pt-4 pb-5">
                    <h2 className="font-[600] text-[#111115] text-[16px] leading-[22px] tracking-[-0.012em]">
                        {post.title}
                    </h2>
                    <p className="mt-1 truncate text-[#8a8a94] text-[12px] leading-[18px]">{url}</p>

                    <div className="mt-4">
                        <FieldLabel
                            htmlFor={`${id}-excerpt`}
                            count={draft.excerpt.length}
                            limit={200}
                        >
                            Excerpt
                        </FieldLabel>
                        <textarea
                            id={`${id}-excerpt`}
                            rows={3}
                            value={draft.excerpt}
                            onChange={event => update({ excerpt: event.target.value })}
                            placeholder="A short summary for cards, feeds and newsletters"
                            className={cn(
                                FIELD,
                                'block resize-none px-2.5 py-[7px] leading-[18px]',
                            )}
                        />
                    </div>

                    <PanelSection title="Publishing">
                        <div className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
                            <label
                                htmlFor={`${id}-status`}
                                className="font-[500] text-[#62626c] text-[12.5px]"
                            >
                                Status
                            </label>
                            <div className="relative">
                                <span
                                    className={cn(
                                        'pointer-events-none absolute top-1/2 left-2.5 size-2 -translate-y-1/2 rounded-[999px]',
                                        STATUS[draft.status].dot,
                                    )}
                                />
                                <select
                                    id={`${id}-status`}
                                    value={draft.status}
                                    onChange={event => {
                                        const next = event.target.value;
                                        if (isStatus(next)) update({ status: next });
                                    }}
                                    className={cn(
                                        FIELD,
                                        'h-8 cursor-pointer appearance-none pr-8 pl-7 font-[500]',
                                    )}
                                >
                                    {STATUS_ORDER.map(status => (
                                        <option key={status} value={status}>
                                            {STATUS[status].label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={14}
                                    className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[#8a8a94]"
                                />
                            </div>

                            <PropertyLabel>{schedule.label}</PropertyLabel>
                            <button
                                type="button"
                                className={cn(
                                    FIELD,
                                    'flex h-8 cursor-pointer items-center gap-2 px-2.5 text-left',
                                )}
                            >
                                <CalendarDays size={14} className="shrink-0 text-[#8a8a94]" />
                                <span
                                    className={cn('truncate', schedule.muted && 'text-[#a1a1ab]')}
                                >
                                    {schedule.value}
                                </span>
                            </button>

                            <PropertyLabel>Visibility</PropertyLabel>
                            <div className="grid h-8 grid-cols-3 gap-0.5 rounded-[8px] bg-[#f1f1f4] p-[3px]">
                                {VISIBILITY.map(option => {
                                    const active = draft.visibility === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => update({ visibility: option.value })}
                                            className={cn(
                                                'cursor-pointer rounded-[6px] font-[500] text-[12.5px] transition-colors duration-150',
                                                active
                                                    ? 'bg-[#fff] text-[#16161b] shadow-[0_1px_2px_rgba(20,20,28,0.1),0_0_0_0.5px_rgba(20,20,28,0.08)]'
                                                    : 'text-[#6a6a74] hover:text-[#16161b]',
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </PanelSection>

                    <PanelSection title="SEO">
                        <FieldLabel
                            htmlFor={`${id}-seo-title`}
                            count={draft.seoTitle.length}
                            limit={60}
                        >
                            Meta title
                        </FieldLabel>
                        <input
                            id={`${id}-seo-title`}
                            value={draft.seoTitle}
                            onChange={event => update({ seoTitle: event.target.value })}
                            placeholder={post.title}
                            className={cn(FIELD, 'block h-8 px-2.5')}
                        />
                        <div className="mt-3">
                            <FieldLabel
                                htmlFor={`${id}-seo-description`}
                                count={draft.seoDescription.length}
                                limit={160}
                            >
                                Meta description
                            </FieldLabel>
                            <textarea
                                id={`${id}-seo-description`}
                                rows={3}
                                value={draft.seoDescription}
                                onChange={event => update({ seoDescription: event.target.value })}
                                placeholder="Shown under the title in search results"
                                className={cn(
                                    FIELD,
                                    'block resize-none px-2.5 py-[7px] leading-[18px]',
                                )}
                            />
                        </div>
                    </PanelSection>
                </div>
            </div>

            <footer className="flex shrink-0 items-center gap-2 border-[#ececf0] border-t px-4 py-3">
                <button
                    type="button"
                    aria-label="Delete post"
                    title="Delete post"
                    onClick={onDelete}
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-[#8a8a94] transition-colors duration-150 hover:bg-[#fdeeee] hover:text-[#cf3b3b]"
                >
                    <Trash size={15} />
                </button>
                <button type="button" className={cn(SECONDARY, 'ml-auto')}>
                    <Eye size={15} className="text-[#8a8a94]" />
                    Preview
                </button>
                <button type="button" onClick={save} className={cn(PRIMARY, 'min-w-[118px]')}>
                    {saved ? (
                        <>
                            <Check size={15} strokeWidth={2.25} />
                            Saved
                        </>
                    ) : (
                        <>
                            {dirty ? (
                                <span className="size-1.5 rounded-[999px] bg-[#f5b544]" />
                            ) : null}
                            Save changes
                        </>
                    )}
                </button>
            </footer>
        </aside>
    );
};

/* Screen */

/** The Posts screen of a small company CMS: sections, a filterable post table and quick edit. */
export const FreehandCms = () => {
    const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
    const [tab, setTab] = useState<StatusTab>('all');
    const [query, setQuery] = useState('');
    const [authorId, setAuthorId] = useState<AuthorId | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [newestFirst, setNewestFirst] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>('p6');
    const created = useRef(0);

    /** Posts matching the search and the author and category filters, any status. */
    const matching = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return posts.filter(
            post =>
                (authorId === null || post.authorId === authorId) &&
                (category === null || post.category === category) &&
                (needle === '' ||
                    `${post.title} ${post.slug} ${post.excerpt}`.toLowerCase().includes(needle)),
        );
    }, [posts, query, authorId, category]);

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

    const selected = visible.find(post => post.id === selectedId);
    const nextUp = posts
        .filter(post => post.status === 'scheduled' && post.publishAt !== null)
        .sort((a, b) => (a.publishAt ?? '').localeCompare(b.publishAt ?? ''))[0];
    const hasFilters = query !== '' || authorId !== null || category !== null;

    const authorOptions: FilterOption<AuthorId>[] = Object.values(AUTHORS).map(author => ({
        value: author.id,
        label: author.name,
        count: posts.filter(post => post.authorId === author.id).length,
        leading: <Avatar author={author} size={18} />,
    }));

    const categoryOptions: FilterOption<Category>[] = CATEGORIES.map(name => ({
        value: name,
        label: name,
        count: posts.filter(post => post.category === name).length,
    }));

    const clearFilters = () => {
        setQuery('');
        setAuthorId(null);
        setCategory(null);
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
        setSelectedId(post.id);
    };

    const savePost = (id: string, changes: Partial<Post>) =>
        setPosts(current =>
            current.map(post =>
                post.id === id ? { ...post, ...changes, editedAt: NOW_ISO } : post,
            ),
        );

    const deletePost = (id: string) => {
        setPosts(current => current.filter(post => post.id !== id));
        setSelectedId(null);
    };

    /** Arrow keys move the selection, and focus, through the rows. */
    const moveSelection = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const next = visible[index + step];
        if (!next) return;
        setSelectedId(next.id);
        const sibling =
            step === 1
                ? event.currentTarget.nextElementSibling
                : event.currentTarget.previousElementSibling;
        if (sibling instanceof HTMLElement) sibling.focus();
    };

    return (
        <div
            className="flex h-full w-full min-w-[1280px] overflow-hidden bg-[#f3f3f5] text-[#1c1c21] text-[13px] leading-[20px] antialiased"
            style={{ fontFamily: FONT_STACK }}
        >
            <Sidebar postCount={posts.length} nextUp={nextUp} />

            <main className="my-2 mr-2 flex min-w-0 flex-1 overflow-hidden rounded-[14px] border border-[#e3e3e8] bg-[#fff] shadow-[0_1px_2px_rgba(20,20,28,0.04),0_6px_20px_-8px_rgba(20,20,28,0.08)]">
                <section aria-label="Posts" className="flex min-w-0 flex-1 flex-col">
                    <header className="flex items-start justify-between gap-6 px-6 pt-5">
                        <div className="min-w-0">
                            <h1 className="font-[600] text-[#111115] text-[22px] leading-[28px] tracking-[-0.02em]">
                                Posts
                            </h1>
                            <p className="mt-0.5 text-[#6a6a74] text-[13px] leading-[20px]">
                                Write, review and schedule stories for the company blog.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={createPost}
                            className={cn(PRIMARY, 'mt-0.5 pl-2.5')}
                        >
                            <Plus size={15} strokeWidth={2.25} />
                            New post
                        </button>
                    </header>

                    <StatusTabs value={tab} counts={counts} onChange={setTab} />

                    <div className="flex items-center gap-2 px-6 py-3">
                        <SearchField value={query} onChange={setQuery} />
                        <FilterMenu
                            icon={UserRound}
                            label="Author"
                            anyLabel="Any author"
                            options={authorOptions}
                            value={authorId}
                            onChange={setAuthorId}
                        />
                        <FilterMenu
                            icon={Tag}
                            label="Category"
                            anyLabel="Any category"
                            options={categoryOptions}
                            value={category}
                            onChange={setCategory}
                        />
                        {hasFilters ? (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="ml-1 cursor-pointer font-[500] text-[#6a6a74] text-[12.5px] transition-colors duration-150 hover:text-[#111115]"
                            >
                                Clear
                            </button>
                        ) : null}
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:#d4d4dc_transparent] [scrollbar-width:thin]">
                        <div
                            className={cn(
                                GRID,
                                'sticky top-0 z-10 h-[34px] border-[#ececf0] border-y bg-[#fafafb] px-6 font-[500] text-[#8a8a94] text-[12px]',
                            )}
                        >
                            <span>Title</span>
                            <span>Status</span>
                            <span>Author</span>
                            <span>Category</span>
                            <button
                                type="button"
                                onClick={() => setNewestFirst(isNewest => !isNewest)}
                                className="flex cursor-pointer items-center justify-end gap-1 transition-colors duration-150 hover:text-[#111115]"
                            >
                                Last edited
                                {newestFirst ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                            </button>
                        </div>
                        {visible.length > 0 ? (
                            visible.map((post, index) => (
                                <PostRow
                                    key={post.id}
                                    post={post}
                                    selected={post.id === selected?.id}
                                    onSelect={() => setSelectedId(post.id)}
                                    onKeyDown={event => moveSelection(event, index)}
                                />
                            ))
                        ) : (
                            <EmptyState
                                onClear={() => {
                                    clearFilters();
                                    setTab('all');
                                }}
                            />
                        )}
                    </div>

                    <footer className="flex h-11 shrink-0 items-center justify-between border-[#ececf0] border-t px-6 text-[#8a8a94] text-[12px]">
                        <span>
                            {visible.length === posts.length
                                ? `${posts.length} posts`
                                : `Showing ${visible.length} of ${posts.length} posts`}
                        </span>
                        <span className="flex items-center gap-1">
                            <Kbd>↑</Kbd>
                            <Kbd>↓</Kbd>
                            <span className="mr-2.5 ml-0.5">to move</span>
                            <Kbd>/</Kbd>
                            <span className="ml-0.5">to search</span>
                        </span>
                    </footer>
                </section>

                {selected ? (
                    <PostPanel
                        key={selected.id}
                        post={selected}
                        onSave={changes => savePost(selected.id, changes)}
                        onDelete={() => deletePost(selected.id)}
                        onClose={() => setSelectedId(null)}
                    />
                ) : null}
            </main>
        </div>
    );
};
