import { Button, Notice, Spinner, useNotice } from 'continuum';
import { CircleAlert, Copy, Link2 } from 'lucide-react';
import { useEffect } from 'react';
import { type Entry, type Knob, o, type PreviewProps, previewIcon } from '../kit';

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

    // The knob holds a notice open; Copy link plays it as it really goes, out and back by itself.
    // biome-ignore lint/correctness/useExhaustiveDependencies: follows the knob only
    useEffect(() => {
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
    }, [knobs.message]);

    return (
        // Any bar with a bottom hairline will hold it; here a panel's header.
        <div className="w-[460px] overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50">
            <div className="relative flex h-12 items-center justify-between border-neutral-200 border-b px-4">
                <span className="font-medium text-neutral-950 text-xs">Share report</span>
                <Button
                    onClick={() => show('Link copied', { icon: <Link2 {...previewIcon} /> })}
                    variant="secondary"
                >
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
