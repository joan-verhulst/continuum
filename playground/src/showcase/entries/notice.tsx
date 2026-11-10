import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    Card,
    HeaderBar,
    HeaderBarActions,
    HeaderBarStart,
    Notice,
    SettingGroup,
    SettingRow,
    Spinner,
    Switch,
    useNotice,
} from 'continuum';
import { CircleAlert, Copy, Link2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PageHead } from '../../screens/workspace';
import { type Entry, type InUse, icon, type Knob, o, type PreviewProps, previewIcon } from '../kit';

const noticeKnobs: Knob[] = [
    {
        id: 'message',
        label: 'Message',
        options: [
            o('saved', 'Saved'),
            o('saving', 'Saving…'),
            o('copied', 'Link copied'),
            o('failed', 'Not saved'),
            o('none', 'Hidden'),
        ],
        default: 'saved',
    },
];

const NoticePreview = ({ knobs }: PreviewProps) => {
    const { notice, show, clear } = useNotice();
    const settle = useRef<number | undefined>(undefined);

    // The notice the knob names, held open until the knob changes.
    const hold = () => {
        if (knobs.message === 'saved') show('Saved', { timeout: 0 });
        else if (knobs.message === 'saving')
            show('Saving…', { icon: <Spinner size="sm" />, timeout: 0 });
        else if (knobs.message === 'copied')
            show('Link copied', { icon: <Link2 {...previewIcon} />, timeout: 0 });
        else if (knobs.message === 'failed')
            show('Not saved', {
                icon: <CircleAlert {...previewIcon} />,
                tone: 'error',
                timeout: 0,
            });
        else clear();
    };

    // Copy link plays a notice as it really goes, out and back by itself, then the knob's returns.
    const copy = () => {
        window.clearTimeout(settle.current);
        show('Link copied', { icon: <Link2 {...previewIcon} />, timeout: 0 });
        settle.current = window.setTimeout(hold, 1800);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: follows the knob only
    useEffect(() => {
        hold();
        // A Copy link still under way gives way to the knob's next notice, or to leaving the page.
        return () => window.clearTimeout(settle.current);
    }, [knobs.message]);

    return (
        // Any bar with a bottom hairline will hold it; here a panel's header.
        <div className="w-115 overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50">
            <div className="relative flex h-12 items-center justify-between border-neutral-200 border-b px-4">
                <span className="font-medium text-neutral-950 text-xs">Share report</span>
                <Button onClick={copy} variant="secondary">
                    <Copy {...previewIcon} /> Copy link
                </Button>
                <Notice {...notice} />
            </div>
            <div className="h-36" />
        </div>
    );
};

export const entry: Entry = {
    id: 'notice',
    name: 'Notice',
    category: 'messages',
    description: 'The quiet toast: a word or two in a tab that hangs from a bar.',
    knobs: noticeKnobs,
    Preview: NoticePreview,
};

const sharing = [
    { id: 'link', title: 'Anyone with the link can view', description: 'No account needed.' },
    { id: 'comments', title: 'Allow comments', description: 'Viewers can comment on charts.' },
    { id: 'downloads', title: 'Allow downloads', description: 'As PDF and CSV.' },
] as const;

type SharingId = (typeof sharing)[number]['id'];

const ReportSharing = () => {
    const { notice, show } = useNotice();
    const [on, setOn] = useState<Record<SharingId, boolean>>({
        link: true,
        comments: true,
        downloads: false,
    });
    const settle = useRef<number | undefined>(undefined);

    // A switch saves as it changes: the bar says so, then lets it go.
    const change = (id: SharingId, next: boolean) => {
        setOn(current => ({ ...current, [id]: next }));
        window.clearTimeout(settle.current);
        show('Saving…', { icon: <Spinner size="sm" />, timeout: 0 });
        settle.current = window.setTimeout(() => show('Saved'), 700);
    };

    // The piece opens just after a change, so its notice is showing.
    // biome-ignore lint/correctness/useExhaustiveDependencies: once, on mount
    useEffect(() => {
        show('Saved', { timeout: 0 });
        return () => window.clearTimeout(settle.current);
    }, []);

    return (
        <div className="w-full overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50">
            <HeaderBar>
                <HeaderBarStart>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Reports</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Northwind Q3 review</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Sharing</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </HeaderBarStart>
                <HeaderBarActions>
                    <Button
                        onClick={() => {
                            // A save still settling would bring back its Saved over the copy.
                            window.clearTimeout(settle.current);
                            show('Link copied', { icon: <Link2 {...icon} /> });
                        }}
                        variant="secondary"
                    >
                        <Copy {...icon} /> Copy link
                    </Button>
                </HeaderBarActions>
                <Notice {...notice} />
            </HeaderBar>
            <div className="mx-auto flex max-w-140 flex-col gap-6 px-6 pt-14 pb-10">
                <PageHead
                    description="Who can open the report, and what they can do with it."
                    title="Sharing"
                />
                <Card layout="list">
                    <SettingGroup title="Link">
                        {sharing.map(item => (
                            <SettingRow
                                control={
                                    <Switch
                                        checked={on[item.id]}
                                        onCheckedChange={next => change(item.id, next)}
                                    />
                                }
                                description={item.description}
                                key={item.id}
                                title={item.title}
                            />
                        ))}
                    </SettingGroup>
                </Card>
            </div>
        </div>
    );
};

export const inUse: InUse = {
    title: 'Sharing a report',
    note: 'Each switch saves as it changes; the bar says Saving… and Saved, and Copy link answers from the same place.',
    canvas: true,
    render: () => <ReportSharing />,
};
