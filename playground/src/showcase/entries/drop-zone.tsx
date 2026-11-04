import { DropZone, DropZoneFile, DropZoneFiles } from 'continuum';
import { useEffect, useState } from 'react';
import {
    DialogActions,
    type Entry,
    type InUse,
    type Knob,
    OpenDialog,
    o,
    type PreviewProps,
    scene,
} from '../kit';

/** Files that upload on a timer, so a drop zone in the playground fills its list as a real one would. */
export type UploadEntry = {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: 'uploading' | 'done' | 'error';
    error?: string;
};

export const useUploads = (initial: UploadEntry[]) => {
    const [files, setFiles] = useState(initial);
    const busy = files.some(file => file.status === 'uploading');

    useEffect(() => {
        if (!busy) return;
        const timer = window.setInterval(() => {
            setFiles(current =>
                current.map(file => {
                    if (file.status !== 'uploading') return file;
                    // Each file at its own pace, so a list of them does not finish in step.
                    const progress = Math.min(100, file.progress + 4 + (file.size % 7));
                    return { ...file, progress, status: progress === 100 ? 'done' : 'uploading' };
                }),
            );
        }, 240);
        return () => window.clearInterval(timer);
    }, [busy]);

    const add = (picked: File[]) =>
        setFiles(current => [
            ...current,
            ...picked.map((file, i) => ({
                id: `${file.name}-${current.length + i}`,
                name: file.name,
                size: file.size,
                progress: 0,
                status: 'uploading' as const,
            })),
        ]);
    const remove = (id: string) => setFiles(current => current.filter(file => file.id !== id));

    return { files, add, remove };
};

const dropZoneKnobs: Knob[] = [
    {
        id: 'state',
        label: 'State',
        options: [
            o('idle', 'Idle'),
            o('dragging', 'Dragging over'),
            o('invalid', 'Invalid'),
            o('disabled', 'Disabled'),
        ],
        default: 'idle',
    },
    { id: 'files', label: 'File list', switch: true, default: true },
];

const sampleUploads: UploadEntry[] = [
    {
        id: 'contacts',
        name: 'contacts-october.csv',
        size: 2_516_582,
        progress: 100,
        status: 'done',
    },
    { id: 'leads', name: 'webinar-leads.xlsx', size: 880_640, progress: 46, status: 'uploading' },
];

const rejectedUpload: UploadEntry = {
    id: 'logo',
    name: 'logo.png',
    size: 0,
    progress: 0,
    status: 'error',
    error: 'Not a CSV or XLSX file',
};

const DropZonePreview = ({ knobs }: PreviewProps) => {
    const { files, add, remove } = useUploads(sampleUploads);
    const invalid = knobs.state === 'invalid';
    const shown = invalid ? [...files, rejectedUpload] : files;

    return (
        <div className="flex w-[420px] flex-col gap-4">
            <DropZone
                accept=".csv,.xlsx"
                aria-invalid={invalid || undefined}
                // The knob holds the drag-over look; a real drag sets the same attribute.
                data-dragging={knobs.state === 'dragging' || undefined}
                description={
                    invalid
                        ? 'Only CSV and XLSX files can be imported'
                        : 'CSV or XLSX, up to 10 MB each'
                }
                disabled={knobs.state === 'disabled'}
                onFiles={add}
                title="Drop contact lists here"
            />
            {knobs.files && shown.length > 0 && (
                <DropZoneFiles>
                    {shown.map(file => (
                        <DropZoneFile
                            error={file.error}
                            key={file.id}
                            name={file.name}
                            onRemove={() => remove(file.id)}
                            progress={file.progress}
                            size={file.size}
                            status={file.status}
                        />
                    ))}
                </DropZoneFiles>
            )}
        </div>
    );
};

export const entry: Entry = {
    id: 'drop-zone',
    name: 'Drop zone',
    category: 'inputs',
    description: 'A dashed well to drop files on, with the files listed under it.',
    hero: 'min-h-96',
    knobs: dropZoneKnobs,
    Preview: DropZonePreview,
};

const contactLists: UploadEntry[] = [
    { id: 'october', name: 'contacts-october.csv', size: 2_516_582, progress: 100, status: 'done' },
    { id: 'webinar', name: 'webinar-leads.xlsx', size: 880_640, progress: 38, status: 'uploading' },
];

const ImportContacts = () => {
    const { files, add, remove } = useUploads(contactLists);
    const busy = files.some(file => file.status === 'uploading');

    return (
        <OpenDialog
            footer={
                <DialogActions
                    action={busy ? 'Uploading…' : `Import ${files.length} files`}
                    disabled={busy || files.length === 0}
                />
            }
            title="Import contacts"
            width={520}
        >
            <DropZone
                accept=".csv,.xlsx"
                description="CSV or XLSX with an email column"
                onFiles={add}
                title="Drop contact lists here"
            />
            {files.length > 0 && (
                <DropZoneFiles>
                    {files.map(file => (
                        <DropZoneFile
                            key={file.id}
                            name={file.name}
                            onRemove={() => remove(file.id)}
                            progress={file.progress}
                            size={file.size}
                            status={file.status}
                        />
                    ))}
                </DropZoneFiles>
            )}
        </OpenDialog>
    );
};

export const inUse: InUse = {
    title: 'Import contacts',
    note: 'A drop zone in a dialog, its files uploading under it; Import waits for them.',
    bare: true,
    render: scene(<ImportContacts />, 'min-h-[480px]'),
};
