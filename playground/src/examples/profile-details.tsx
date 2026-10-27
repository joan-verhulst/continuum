import {
    Avatar,
    Badge,
    Button,
    DialogFooter,
    InfoTip,
    MetaItem,
    MetaList,
    Sheet,
    SheetBody,
    SheetContent,
    SheetHeader,
    SheetSection,
    SheetTitle,
    SheetTrigger,
    StatusDot,
    type StatusDotTone,
    TooltipProvider,
    ValueField,
} from 'continuum';
import {
    Globe,
    Laptop,
    LoaderCircle,
    MapPin,
    Monitor,
    PanelRight,
    RotateCcw,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';

type PageView = {
    path: string;
    timeOnPage: string;
    scroll: string;
    /** Where the visit came from; only the first page has one. */
    entry?: string;
    current?: boolean;
};

const pages: PageView[] = [
    { path: '/home', timeOnPage: '1m 12s', scroll: '62%', entry: 'x.com' },
    { path: '/about', timeOnPage: '2m 45s', scroll: '80%' },
    { path: '/services', timeOnPage: '3m 30s', scroll: '50%' },
    { path: '/contact', timeOnPage: '1m 5s', scroll: '30%', current: true },
];

const vitals: { label: string; value: string; tone: StatusDotTone }[] = [
    { label: 'LCP', value: '4.8s', tone: 'error' },
    { label: 'CLS', value: '0.24', tone: 'warning' },
    { label: 'INP', value: '290ms', tone: 'warning' },
    { label: 'TTFB', value: '0.6s', tone: 'success' },
];

const summaryText =
    'Arrived from a post on x.com and read the about and services pages closely, spending the longest on services (3m 30s). Now on the contact page but has only scrolled 30% of it, so the form may not have been seen. Slow loading on the home page (LCP 4.8s) is the one friction point in the session.';

type SummaryState = 'idle' | 'generating' | 'done';

/** The visitor profile from the analytics app, as an inline panel and as a real side sheet sharing one state. */
export const profileDetailsExample = () => <ProfileDetailsExample />;

const ProfileDetailsExample = () => {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [summary, setSummary] = useState<SummaryState>('idle');
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const titleId = useId();

    useEffect(() => () => clearTimeout(timer.current), []);

    // Stands in for the request to the model; long enough to see the working state.
    const generate = () => {
        setSummary('generating');
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setSummary('done'), 1400);
    };

    const body = <ProfileBody onGenerate={generate} summary={summary} />;

    return (
        <TooltipProvider>
            <div className="flex w-full max-w-[720px] flex-col items-start gap-3">
                <Sheet onOpenChange={setSheetOpen} open={sheetOpen}>
                    <SheetTrigger render={<Button variant="secondary" />}>
                        <PanelRight strokeWidth={2} /> Open as sheet
                    </SheetTrigger>
                    {/* Wider than the default sheet, so the three replay columns keep their room. */}
                    <SheetContent className="w-[min(720px,calc(100vw-32px))]">
                        <SheetHeader>
                            <SheetTitle>Profile details</SheetTitle>
                        </SheetHeader>
                        {body}
                        <ProfileFooter />
                    </SheetContent>
                </Sheet>

                {/* The same sheet drawn in place: header and footer ruled off full width, only the body scrolls. */}
                <section
                    aria-labelledby={titleId}
                    className="flex h-[760px] w-full flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50"
                >
                    <div className="flex h-[52px] shrink-0 items-center border-neutral-200 border-b px-4">
                        <h2
                            className="min-w-0 truncate font-medium text-neutral-950 text-sm"
                            id={titleId}
                        >
                            Profile details
                        </h2>
                    </div>
                    {body}
                    <ProfileFooter />
                </section>
            </div>
        </TooltipProvider>
    );
};

type ProfileBodyProps = {
    summary: SummaryState;
    onGenerate: () => void;
};

/** Sheet-level section titles: one step over the replay's column titles. */
const sectionTitle = 'font-medium text-neutral-950 text-sm';

const figures = [
    { label: 'Total sessions', value: '7' },
    { label: 'First seen', value: '12 Apr' },
    { label: 'Avg session', value: '6m 14s' },
    { label: 'Session time', value: '10m 32s' },
];

const ProfileBody = ({ summary, onGenerate }: ProfileBodyProps) => (
    // A container, so the figures and replay columns respond to the sheet's width, not the window's.
    // A sheet holds its parts with space and full-width rules, so every part is a section, never a card.
    <SheetBody className="@container">
        <SheetSection className="flex flex-col gap-6">
            <ProfilePerson />
            <dl className="grid @lg:grid-cols-4 grid-cols-2 gap-4">
                {figures.map(figure => (
                    <div className="flex min-w-0 flex-col gap-1" key={figure.label}>
                        <dt className="text-neutral-600 text-xs">{figure.label}</dt>
                        <dd className="font-medium text-lg text-neutral-950 tabular-nums">
                            {figure.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </SheetSection>

        <CurrentSession />

        <SessionReplay onGenerate={onGenerate} summary={summary} />
    </SheetBody>
);

/** The person, as a plain header over their figures. */
const ProfilePerson = () => (
    <div className="flex items-start gap-3">
        <Avatar fallback="PH" shape="round" size={36} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
                <p className="min-w-0 truncate font-medium text-neutral-950 text-sm">PietHein18</p>
                <StatusDot label="Online now" pulse />
            </div>
            <MetaList className="max-w-[360px]" layout="grid">
                <MetaItem icon={<MapPin strokeWidth={2} />} label="Location">
                    Zierikzee, Zeeland
                </MetaItem>
                <MetaItem icon={<Globe strokeWidth={2} />} label="Browser">
                    Chrome 141
                </MetaItem>
                <MetaItem icon={<Monitor strokeWidth={2} />} label="OS">
                    Windows 11
                </MetaItem>
                <MetaItem icon={<Laptop strokeWidth={2} />} label="Device">
                    Desktop
                </MetaItem>
            </MetaList>
        </div>
    </div>
);

const CurrentSession = () => {
    const titleId = useId();

    return (
        // Its own section of the sheet; the pages are kept apart by space, not by rules or a card.
        <SheetSection aria-labelledby={titleId} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
                <h3 className={sectionTitle} id={titleId}>
                    Current session
                </h3>
                <span className="text-neutral-500 text-xs tabular-nums">{pages.length} pages</span>
            </div>
            <ol aria-labelledby={titleId} className="flex flex-col gap-4">
                {pages.map(page => (
                    <li
                        aria-current={page.current ? 'page' : undefined}
                        className="flex flex-col gap-1.5"
                        key={page.path}
                    >
                        <div className="flex items-center gap-2">
                            <span className="min-w-0 truncate font-medium text-neutral-950 text-xs">
                                {page.path}
                            </span>
                            {page.current && <Badge tone="success">Viewing now</Badge>}
                        </div>
                        <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            {page.entry && (
                                <div className="flex items-center gap-1.5">
                                    <dt className="text-neutral-500">Entry</dt>
                                    <dd>
                                        <Badge>{page.entry}</Badge>
                                    </dd>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <dt className="text-neutral-500">Time on page</dt>
                                <dd className="text-neutral-900 tabular-nums">{page.timeOnPage}</dd>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <dt className="text-neutral-500">Scroll</dt>
                                <dd className="text-neutral-900 tabular-nums">{page.scroll}</dd>
                            </div>
                        </dl>
                    </li>
                ))}
            </ol>
        </SheetSection>
    );
};

const SessionReplay = ({ summary, onGenerate }: ProfileBodyProps) => (
    <SheetSection className="flex flex-col gap-4">
        <h3 className={sectionTitle}>Session replay</h3>

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="flex min-w-0 flex-col gap-1">
                <p className="min-w-0 truncate font-medium text-neutral-950 text-xs tabular-nums">
                    a720e16585ad4e6d8b9072e9
                </p>
                <MetaList className="text-neutral-500" separated>
                    <MetaItem>
                        <time dateTime="2026-10-26T14:22:10">26 Oct 2026, 14:22</time>
                    </MetaItem>
                    <MetaItem label="Duration">4m 18s</MetaItem>
                </MetaList>
            </div>
            <MetaList>
                <MetaItem icon={<MapPin strokeWidth={2} />} label="Location">
                    Zierikzee
                </MetaItem>
                <MetaItem icon={<Monitor strokeWidth={2} />} label="OS">
                    Windows
                </MetaItem>
                <MetaItem icon={<Globe strokeWidth={2} />} label="Browser">
                    Chrome
                </MetaItem>
                <MetaItem icon={<Laptop strokeWidth={2} />} label="Device">
                    Desktop
                </MetaItem>
            </MetaList>
        </div>

        {/* Polite, so the finished summary is read out without stealing focus from the button. */}
        <div aria-live="polite" className="flex flex-col gap-3">
            {summary === 'done' ? (
                <div className="flex flex-col gap-2 rounded-control bg-tint p-4 text-tint-fg">
                    <div className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-1.5 font-medium text-xs">
                            <Sparkles className="size-4" strokeWidth={2} /> AI summary
                        </p>
                        <Button
                            aria-label="Regenerate summary"
                            onClick={onGenerate}
                            size="icon-sm"
                            variant="ghost"
                        >
                            <RotateCcw strokeWidth={2} />
                        </Button>
                    </div>
                    <p className="text-xs">{summaryText}</p>
                </div>
            ) : (
                <Button
                    className="w-full justify-between"
                    disabled={summary === 'generating'}
                    onClick={onGenerate}
                    size="lg"
                    variant="tint"
                >
                    {summary === 'generating' ? 'Generating summary…' : 'Generate AI summary'}
                    {summary === 'generating' ? (
                        <LoaderCircle
                            className="animate-spin motion-reduce:animate-none"
                            strokeWidth={2}
                        />
                    ) : (
                        <Sparkles strokeWidth={2} />
                    )}
                </Button>
            )}
        </div>

        {/* Three facets of the visit, kept apart by space rather than the design's column rules. */}
        <div className="mt-2 grid @lg:grid-cols-3 grid-cols-1 gap-x-4 gap-y-6">
            <ReplayColumn title="Entry / exit">
                <ValueField copyable label="Entry" size="sm" value="/home" />
                <ValueField copyable label="Exit" size="sm" value="/contact" />
                <ValueField label="Referrer" size="sm" value="x.com" />
            </ReplayColumn>
            <ReplayColumn title="UTM">
                {/* A shared post carries no campaign tags, so these stay empty. */}
                <ValueField label="Source" size="sm" value={null} />
                <ValueField label="Medium" size="sm" value={null} />
                <ValueField label="Campaign" size="sm" value={null} />
            </ReplayColumn>
            <ReplayColumn
                gap="tight"
                info="Measured on this visitor's device. Red is poor, amber needs improvement, green is good."
                title="Web vitals"
            >
                {vitals.map(vital => (
                    <ValueField
                        key={vital.label}
                        label={vital.label}
                        tone={vital.tone}
                        value={vital.value}
                        variant="vital"
                    />
                ))}
            </ReplayColumn>
        </div>
    </SheetSection>
);

type ReplayColumnProps = {
    title: string;
    info?: string;
    /** Vitals are one-line rows and stack closer than labelled wells. */
    gap?: 'tight' | 'default';
    children: ReactNode;
};

const ReplayColumn = ({ title, info, gap = 'default', children }: ReplayColumnProps) => {
    const titleId = useId();

    return (
        <section aria-labelledby={titleId} className="flex min-w-0 flex-col gap-3">
            <h3
                className="flex items-center gap-1.5 font-medium text-neutral-950 text-xs"
                id={titleId}
            >
                {title}
                {info && <InfoTip content={info} />}
            </h3>
            <div className={gap === 'tight' ? 'flex flex-col gap-1.5' : 'flex flex-col gap-3'}>
                {children}
            </div>
        </section>
    );
};

const ProfileFooter = () => (
    <DialogFooter>
        <Button variant="secondary">
            View full user profile <UserRound strokeWidth={2} />
        </Button>
        <Button>
            Ask about this session <Sparkles strokeWidth={2} />
        </Button>
    </DialogFooter>
);
