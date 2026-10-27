'use client';

import { CircleAlert, CircleCheck, FileText, Upload, X } from 'lucide-react';
import {
    type ComponentProps,
    type DragEvent,
    type ReactNode,
    useId,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { useFieldControl } from './field';
import { IconTile } from './icon-tile';
import { Progress } from './progress';

/** "2.4 MB", "860 KB", "312 B": one decimal only where it still says something. */
export const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
};

export type DropZoneProps = Omit<ComponentProps<'div'>, 'title' | 'onDrop'> & {
    /** What goes here, in a line: "Drop CSV files here". */
    title?: ReactNode;
    /** What is accepted and how much: "CSV or XLSX, up to 10 MB each". */
    description?: ReactNode;
    /** The secondary button that opens the file picker. */
    action?: ReactNode;
    icon?: ReactNode;
    /** Passed to the file input, and checked again on drop, where the browser does not. */
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    /** Receives the picked or dropped files that match `accept`. */
    onFiles?: (files: File[]) => void;
    /** The name the hidden file input submits under in a form. */
    name?: string;
};

/** Whether a file matches an `accept` list of extensions and MIME types (`image/*` included). */
const accepts = (file: File, accept?: string) => {
    if (!accept) return true;
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return accept
        .split(',')
        .map(rule => rule.trim().toLowerCase())
        .some(rule =>
            rule.startsWith('.')
                ? name.endsWith(rule)
                : rule.endsWith('/*')
                  ? type.startsWith(rule.slice(0, -1))
                  : type === rule,
        );
};

/**
 * The empty-state panel made a drop target: a dashed, left-aligned well with one line on what goes
 * here and a secondary button that opens the picker. Dragging files over it darkens the dash and
 * lays the 3% wash over it.
 */
export const DropZone = ({
    title = 'Drop files here',
    description,
    action = 'Choose files',
    icon = <Upload strokeWidth={2} />,
    accept,
    multiple = true,
    disabled: disabledProp,
    onFiles,
    name,
    id: idProp,
    className,
    'aria-invalid': ariaInvalid,
    ...props
}: DropZoneProps) => {
    const input = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    // dragenter and dragleave fire for every child crossed, so the zone counts them to know it is left.
    const depth = useRef(0);
    const generatedId = useId();
    const { invalid, disabled, ...control } = useFieldControl({
        id: idProp,
        disabled: disabledProp,
        'aria-invalid': ariaInvalid,
    });
    const inputId = control.id ?? generatedId;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const describedBy =
        [descriptionId, control['aria-describedby']].filter(Boolean).join(' ') || undefined;

    const take = (list: FileList | null) => {
        if (!list) return;
        const files = Array.from(list).filter(file => accepts(file, accept));
        if (files.length > 0) onFiles?.(multiple ? files : files.slice(0, 1));
    };

    const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
        if (disabled || !event.dataTransfer.types.includes('Files')) return;
        event.preventDefault();
        depth.current += 1;
        setDragging(true);
    };

    const onDragLeave = () => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
    };

    const onDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        depth.current = 0;
        setDragging(false);
        if (!disabled) take(event.dataTransfer.files);
    };

    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-x-3 gap-y-4 rounded-item border border-dashed p-4 transition-[background-color,border-color] duration-150 motion-reduce:transition-none',
                invalid ? 'border-error-500' : 'border-neutral-300',
                'data-dragging:border-neutral-500 data-dragging:bg-neutral-950/[0.03]',
                'data-disabled:opacity-50',
                className,
            )}
            data-disabled={disabled || undefined}
            data-dragging={dragging || undefined}
            data-invalid={invalid || undefined}
            data-slot="drop-zone"
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            // Without preventing dragover the browser opens the file instead of dropping it here.
            onDragOver={event => {
                if (!disabled) event.preventDefault();
            }}
            onDrop={onDrop}
            {...props}
        >
            <IconTile tone={invalid ? 'error' : 'neutral'}>{icon}</IconTile>
            <div
                className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5"
                data-slot="drop-zone-text"
            >
                <p className="font-medium text-neutral-950 text-xs">{title}</p>
                {description && (
                    <p
                        className={cn('text-xs', invalid ? 'text-error-600' : 'text-neutral-600')}
                        data-slot="drop-zone-description"
                        id={descriptionId}
                    >
                        {description}
                    </p>
                )}
            </div>
            <Button
                aria-describedby={describedBy}
                disabled={disabled}
                onClick={() => input.current?.click()}
                variant="secondary"
            >
                {action}
            </Button>
            <input
                accept={accept}
                aria-invalid={invalid || undefined}
                className="hidden"
                data-slot="drop-zone-input"
                disabled={disabled}
                id={inputId}
                multiple={multiple}
                name={name}
                onChange={event => {
                    take(event.target.files);
                    // Cleared, so picking the same file again after removing it still reports it.
                    event.target.value = '';
                }}
                ref={input}
                tabIndex={-1}
                type="file"
            />
        </div>
    );
};

/** The files taken by a drop zone, under it; spaced, not ruled. */
export const DropZoneFiles = ({ className, ...props }: ComponentProps<'ul'>) => (
    <ul className={cn('flex flex-col gap-4', className)} data-slot="drop-zone-files" {...props} />
);

export type DropZoneFileProps = Omit<ComponentProps<'li'>, 'onError'> & {
    name: string;
    /** Bytes, formatted for you, or text as it should read. */
    size?: number | string;
    /** Upload progress 0–100 while `status` is uploading. */
    progress?: number;
    status?: 'uploading' | 'done' | 'error';
    /** Why it failed, in place of the size. */
    error?: ReactNode;
    onRemove?: () => void;
};

/** One file: its tile, name and size, a bar while it uploads, and a ghost × to cancel or remove it. */
export const DropZoneFile = ({
    name,
    size,
    progress = 0,
    status = 'done',
    error,
    onRemove,
    className,
    ...props
}: DropZoneFileProps) => {
    const meta =
        status === 'error' ? error : typeof size === 'number' ? formatFileSize(size) : size;

    return (
        <li
            className={cn('flex items-center gap-3', className)}
            data-slot="drop-zone-file"
            data-status={status}
            {...props}
        >
            <IconTile
                tone={status === 'done' ? 'success' : status === 'error' ? 'error' : 'neutral'}
                variant={status === 'uploading' ? 'filled' : 'outline'}
            >
                {status === 'done' ? (
                    <CircleCheck strokeWidth={2} />
                ) : status === 'error' ? (
                    <CircleAlert strokeWidth={2} />
                ) : (
                    <FileText strokeWidth={2} />
                )}
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate font-medium text-neutral-950">{name}</span>
                    {meta && (
                        <span
                            className={cn(
                                'shrink-0 tabular-nums',
                                status === 'error' ? 'text-error-600' : 'text-neutral-500',
                            )}
                        >
                            {meta}
                        </span>
                    )}
                </div>
                {status === 'uploading' && (
                    <Progress aria-label={`${name} upload`} value={progress} />
                )}
            </div>
            {onRemove && (
                <Button
                    aria-label={`${status === 'uploading' ? 'Cancel' : 'Remove'} ${name}`}
                    onClick={onRemove}
                    size="icon-sm"
                    variant="ghost"
                >
                    <X strokeWidth={2} />
                </Button>
            )}
        </li>
    );
};
