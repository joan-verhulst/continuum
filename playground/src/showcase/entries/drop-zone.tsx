import {
    Button,
    DropZone,
    DropZoneFile,
    DropZoneFiles,
    Field,
    FieldLabel,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'continuum';
import { ArrowRight, ListChecks } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHead } from '../../screens/workspace';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

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
        <div className="flex w-105 flex-col gap-4">
            <DropZone
                accept=".csv,.xlsx"
                aria-invalid={invalid || undefined}
                // The knob holds the drag-over look. Passed only then: the zone spreads its props
                // after its own attribute, so an undefined here would hide a real drag.
                {...(knobs.state === 'dragging' && { 'data-dragging': true })}
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
    {
        id: 'badges',
        name: 'trade-show-badges.pdf',
        size: 1_204_224,
        progress: 0,
        status: 'error',
        error: 'Not a CSV or XLSX file',
    },
];

// A step of its own, reached from Customers: one thing done, so the narrow column.
const ImportContacts = () => {
    const { files, add, remove } = useUploads(contactLists);
    const busy = files.some(file => file.status === 'uploading');
    const ready = files.filter(file => file.status === 'done').length;

    return (
        <AppWindow nav="top" place="customers">
            <div className="mx-auto flex w-full max-w-content-narrow flex-col gap-6">
                <PageHead
                    description="Add people from a CSV or XLSX file; the columns are matched on the next step."
                    title="Import contacts"
                />
                <div className="flex flex-col gap-4">
                    <DropZone
                        accept=".csv,.xlsx"
                        description="CSV or XLSX with an email column, up to 10 MB each"
                        onFiles={add}
                        title="Drop contact lists here"
                    />
                    {files.length > 0 && (
                        <DropZoneFiles>
                            {files.map(file => (
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
                <Field>
                    <FieldLabel>Add them to</FieldLabel>
                    <Select defaultValue="webinar">
                        <SelectTrigger leadingIcon={<ListChecks {...icon} />}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No list</SelectItem>
                            <SelectItem value="newsletter">Monthly newsletter</SelectItem>
                            <SelectItem value="webinar">Webinar follow-up</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
                <div className="flex justify-end gap-2">
                    <Button variant="secondary">Cancel</Button>
                    <Button disabled={busy || ready === 0}>
                        {busy ? 'Uploading…' : 'Match columns'}
                        {!busy && <ArrowRight {...icon} />}
                    </Button>
                </div>
            </div>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Import contacts',
    note: 'The import step’s drop zone, a file uploading and one turned away under it, the next step waiting for them.',
    app: true,
    render: () => <ImportContacts />,
};
