import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    HeaderBar,
    HeaderBarActions,
    HeaderBarNav,
    HeaderBarStart,
    Notice,
    Spinner,
    useNotice,
    usePageHistory,
} from 'continuum';
import { FileText, Link2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type Entry, type InUse, icon, type Knob, o, type PreviewProps, previewIcon } from '../kit';

const headerBarKnobs: Knob[] = [
    {
        id: 'leading',
        label: 'Before the trail',
        options: [o('none', 'Nothing'), o('nav', 'Back and forward'), o('back', 'Back only')],
        default: 'nav',
    },
    {
        id: 'actions',
        label: 'Actions',
        options: [o('0', 'None'), o('1', 'One'), o('2', 'Two')],
        default: '2',
    },
    {
        id: 'notice',
        label: 'Notice',
        options: [o('off', 'Hidden'), o('saving', 'Saving…'), o('saved', 'Saved')],
        default: 'saved',
    },
];

const HeaderBarPreview = ({ knobs }: PreviewProps) => {
    const { notice, show, clear } = useNotice();
    const settle = useRef<number | undefined>(undefined);

    // The notice the knob names, held open until the knob changes.
    const hold = () => {
        if (knobs.notice === 'saving') show('Saving…', { icon: <Spinner size="sm" />, timeout: 0 });
        else if (knobs.notice === 'saved') show('Saved', { timeout: 0 });
        else clear();
    };

    // Save and Copy link play the real sequence, then the knob's notice comes back.
    const play = (message: string) => {
        window.clearTimeout(settle.current);
        show(message, { timeout: 0 });
        settle.current = window.setTimeout(hold, 1800);
    };

    const save = () => {
        window.clearTimeout(settle.current);
        show('Saving…', { icon: <Spinner size="sm" />, timeout: 0 });
        settle.current = window.setTimeout(() => play('Saved'), 900);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: follows the knob only
    useEffect(() => {
        hold();
        // A save still under way gives way to the knob's next notice, or to leaving the page.
        return () => window.clearTimeout(settle.current);
    }, [knobs.notice]);

    // A few pages to move between: a crumb or a report visits one, the arrows walk the history.
    const history = usePageHistory<string[]>([['Reports'], ['Reports', 'Northwind Q3 review']]);
    const trail = history.page;

    return (
        // The top of a panel: its corners, its surface, and the page under the bar.
        <div className="w-135 overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50">
            <HeaderBar>
                <HeaderBarStart>
                    {knobs.leading !== 'none' && (
                        <HeaderBarNav
                            canGoBack={history.canGoBack}
                            canGoForward={history.canGoForward}
                            onBack={history.back}
                            onForward={knobs.leading === 'nav' ? history.forward : undefined}
                        />
                    )}
                    <Breadcrumb>
                        <BreadcrumbList>
                            {trail.map((crumb, i) => (
                                <BreadcrumbItem key={crumb}>
                                    {i > 0 && <BreadcrumbSeparator />}
                                    {i === trail.length - 1 ? (
                                        <BreadcrumbPage>{crumb}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink
                                            href="#"
                                            onClick={() => history.go(trail.slice(0, i + 1))}
                                        >
                                            {crumb}
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </HeaderBarStart>
                {knobs.actions !== '0' && (
                    <HeaderBarActions>
                        {knobs.actions === '2' && (
                            <Button onClick={() => play('Link copied')} variant="secondary">
                                <Link2 {...previewIcon} /> Copy link
                            </Button>
                        )}
                        <Button onClick={save}>Save</Button>
                    </HeaderBarActions>
                )}
                <Notice {...notice} />
            </HeaderBar>
            {trail.length === 1 ? (
                <ul className="flex flex-col gap-1 px-4 pt-12 pb-6">
                    {['Northwind Q3 review', 'Acme renewal forecast', 'Board pack · October'].map(
                        report => (
                            <li key={report}>
                                <button
                                    className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-item px-2 text-left text-neutral-950 text-xs hover:bg-neutral-950/5"
                                    onClick={() => history.go(['Reports', report])}
                                    type="button"
                                >
                                    <FileText
                                        {...previewIcon}
                                        className="size-4 text-neutral-600"
                                    />
                                    {report}
                                </button>
                            </li>
                        ),
                    )}
                </ul>
            ) : (
                <div className="flex flex-col gap-2 px-6 pt-14 pb-8">
                    <div className="h-3 w-40 rounded-chip bg-neutral-950/6" />
                    <div className="h-2.5 w-72 rounded-chip bg-neutral-950/4" />
                    <div className="h-2.5 w-60 rounded-chip bg-neutral-950/4" />
                </div>
            )}
        </div>
    );
};

export const entry: Entry = {
    id: 'header-bar',
    name: 'Header bar',
    category: 'frame',
    description: 'The bar over the page: the trail, the actions, and a notice that hangs from it.',
    span: 2,
    knobs: headerBarKnobs,
    Preview: HeaderBarPreview,
};

const EditReport = () => {
    const { notice, show } = useNotice();
    // You came here from another report, so back has somewhere to go and forward returns.
    const history = usePageHistory(['Acme renewal forecast', 'Northwind Q3 review']);
    const [titles, setTitles] = useState<Record<string, string>>({});
    const title = titles[history.page] ?? history.page;
    const setTitle = (next: string) => setTitles(current => ({ ...current, [history.page]: next }));

    // The piece opens just after a save, so its notice is showing.
    // biome-ignore lint/correctness/useExhaustiveDependencies: once, on mount
    useEffect(() => show('Saved', { timeout: 0 }), []);

    const save = () => {
        show('Saving…', { icon: <Spinner size="sm" />, timeout: 0 });
        window.setTimeout(() => show('Saved'), 900);
    };

    return (
        <div className="w-full overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50">
            <HeaderBar>
                <HeaderBarStart>
                    <HeaderBarNav
                        canGoBack={history.canGoBack}
                        canGoForward={history.canGoForward}
                        onBack={history.back}
                        onForward={history.forward}
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Reports</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{title || 'Untitled report'}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </HeaderBarStart>
                <HeaderBarActions>
                    <Button onClick={() => show('Link copied')} variant="secondary">
                        <Link2 {...icon} /> Copy link
                    </Button>
                    <Button onClick={save}>Save</Button>
                </HeaderBarActions>
                <Notice {...notice} />
            </HeaderBar>
            <form
                className="mx-auto flex max-w-140 flex-col gap-3 px-6 pt-14 pb-10"
                onSubmit={event => {
                    event.preventDefault();
                    save();
                }}
            >
                <input
                    aria-label="Title"
                    className="bg-transparent font-medium text-2xl text-neutral-950 outline-none"
                    onChange={event => setTitle(event.target.value)}
                    value={title}
                />
                <p className="text-neutral-700 text-sm leading-relaxed">
                    Revenue grew 12% on the quarter, led by the Business plan. Churn held at 1.8%;
                    the two accounts that left both moved to an in-house tool.
                </p>
            </form>
        </div>
    );
};

export const inUse: InUse = {
    title: 'Editing a report',
    note: 'Save and Copy link answer from under the bar; nothing lands on the page.',
    canvas: true,
    render: () => <EditReport />,
};
