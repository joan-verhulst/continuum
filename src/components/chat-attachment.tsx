'use client';

import { File as FileIcon, FileText, X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button, focusRing } from './button';
import { ChatToken } from './chat-reference';

/** Splits "Application.pdf" into its name and ".pdf"; a name with no dot has no extension. */
const splitName = (name: string, ext?: string) => {
    if (ext != null) {
        const dotted = ext.startsWith('.') ? ext : `.${ext}`;
        return {
            base: name.toLowerCase().endsWith(dotted.toLowerCase())
                ? name.slice(0, -dotted.length)
                : name,
            ext: dotted,
        };
    }
    const dot = name.lastIndexOf('.');
    return dot > 0 ? { base: name.slice(0, dot), ext: name.slice(dot) } : { base: name, ext: '' };
};

// The well takes a tone from the kind of file: a PDF the error ramp, as PDFs are known by their red.
const wellTones = {
    pdf: 'bg-error-500/20 text-error-800',
    neutral: 'bg-neutral-500/20 text-neutral-800',
} as const;

export type ChatAttachmentProps = Omit<ComponentProps<'div'>, 'children'> & {
    /**
     * `file`: an icon well, the name and its extension. `image`: a square thumbnail. `record`: a
     * linked record (an application, an invoice) on a line of its own: icon, kind, token, status.
     */
    variant?: 'file' | 'image' | 'record';
    /** The file's name, e.g. "Application.pdf"; also the image's alt text. A record's kind: "Application". */
    name: string;
    /** A record's identifier, shown as a ChatToken: "#app_1CU94h5M". */
    token?: ReactNode;
    /** A record's state at the end, usually a soft Badge: "In review". */
    status?: ReactNode;
    /** The extension, e.g. ".pdf"; taken from the name when left out. */
    ext?: string;
    /** The image to show, for `image`. */
    src?: string;
    /** Replaces the file icon in the well. */
    icon?: ReactNode;
    /** Draws a remove button (×) that calls it: in the composer, before the message is sent. */
    onRemove?: () => void;
    /** The remove button's name; "Remove <name>" by default. */
    removeLabel?: string;
};

/**
 * One file or record going with a message: above the composer while it waits, removable, and under
 * the message once sent. A file shows a 32 well tinted by its kind with its name and extension; an
 * image, a square thumbnail; a record, a full-width line with its kind, token and status.
 */
export const ChatAttachment = ({
    variant = 'file',
    name,
    ext,
    src,
    icon,
    token,
    status,
    onRemove,
    removeLabel,
    className,
    ...props
}: ChatAttachmentProps) => {
    const parts = splitName(name, ext);
    const label = removeLabel ?? `Remove ${name}`;

    if (variant === 'record') {
        return (
            <div
                className={cn(
                    // A line of its own, drawn as a ChatReference is (control-lg high, the control's
                    // corner, 12 apart), so a record keeps one shape waiting and in the thread.
                    'flex min-h-control-lg w-full min-w-0 shrink-0 basis-full items-center gap-3 rounded-control border border-neutral-200 bg-neutral-50 py-1 pl-3 text-neutral-950 text-xs [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
                    onRemove ? 'pr-1' : 'pr-3',
                    className,
                )}
                data-slot="chat-attachment"
                data-variant="record"
                {...props}
            >
                <span
                    aria-hidden
                    className="flex text-neutral-600"
                    data-slot="chat-attachment-icon"
                >
                    {icon ?? <FileText strokeWidth={2} />}
                </span>
                <span className="shrink-0 font-medium" data-slot="chat-attachment-name">
                    {name}
                </span>
                {token != null && (
                    <ChatToken className="min-w-0 truncate" data-slot="chat-attachment-token">
                        {token}
                    </ChatToken>
                )}
                {status != null && (
                    <span className="ml-auto flex shrink-0 pl-1" data-slot="chat-attachment-status">
                        {status}
                    </span>
                )}
                {onRemove && (
                    <Button
                        aria-label={label}
                        className={status == null ? 'ml-auto' : undefined}
                        data-slot="chat-attachment-remove"
                        onClick={onRemove}
                        size="icon-sm"
                        variant="ghost"
                    >
                        <X aria-hidden strokeWidth={2} />
                    </Button>
                )}
            </div>
        );
    }

    if (variant === 'image') {
        return (
            <div
                className={cn('relative size-row shrink-0', className)}
                data-slot="chat-attachment"
                data-variant="image"
                {...props}
            >
                <img
                    alt={name}
                    className="size-full rounded-item border border-neutral-200 bg-neutral-100 object-cover"
                    src={src}
                />
                {onRemove && (
                    <button
                        aria-label={label}
                        className={cn(
                            // A small round chip on the corner, so the picture itself stays whole.
                            'absolute -top-1.5 -right-1.5 inline-flex size-5 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-600 transition-colors duration-150 hover:text-neutral-950',
                            focusRing,
                        )}
                        data-slot="chat-attachment-remove"
                        onClick={onRemove}
                        type="button"
                    >
                        <X aria-hidden className="size-3" strokeWidth={2} />
                    </button>
                )}
            </div>
        );
    }

    const tone = parts.ext.toLowerCase() === '.pdf' ? 'pdf' : 'neutral';
    const Icon = tone === 'pdf' ? FileText : FileIcon;

    return (
        <div
            className={cn(
                // A row high (40), as the image beside it: the cell well (32) inset 4 within the hairline.
                'flex h-row min-w-0 max-w-60 shrink-0 items-center gap-2 rounded-item border border-neutral-200 bg-neutral-50 p-[calc(--spacing(1)-1px)] text-neutral-950',
                onRemove ? 'pr-1' : 'pr-3',
                className,
            )}
            data-slot="chat-attachment"
            data-variant="file"
            {...props}
        >
            <span
                aria-hidden
                className={cn(
                    'inline-flex size-cell shrink-0 items-center justify-center rounded-chip [&_svg]:size-4',
                    wellTones[tone],
                )}
                data-slot="chat-attachment-icon"
            >
                {icon ?? <Icon strokeWidth={2} />}
            </span>
            <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-xxs" data-slot="chat-attachment-name">
                    {parts.base}
                </span>
                {parts.ext && (
                    <span
                        className="truncate text-neutral-600 text-xxs"
                        data-slot="chat-attachment-ext"
                    >
                        {parts.ext}
                    </span>
                )}
            </span>
            {onRemove && (
                <Button
                    aria-label={label}
                    className="ml-auto"
                    data-slot="chat-attachment-remove"
                    onClick={onRemove}
                    size="icon-sm"
                    variant="ghost"
                >
                    <X aria-hidden strokeWidth={2} />
                </Button>
            )}
        </div>
    );
};

export type ChatAttachmentsProps = ComponentProps<'div'> & {
    /** Whose message they go with, as on `ChatMessage`: `own` at the right, `other` at the left. */
    variant?: 'own' | 'other';
    /** The same as `variant`, by side: `end` is `own`, `start` is `other`. */
    align?: 'start' | 'end';
};

/**
 * A row of `ChatAttachment`s, 8 apart, wrapping; a record takes a line of its own. In the
 * composer's `attachments` slot it waits 8 above the box; in a thread, right after a message, it
 * hangs 4 under it on the message's side.
 */
export const ChatAttachments = ({ variant, align, className, ...props }: ChatAttachmentsProps) => {
    const own = variant ? variant === 'own' : align === 'end';

    return (
        <div
            className={cn(
                'flex min-w-0 flex-wrap items-center gap-2',
                own && 'ml-auto max-w-2/3 justify-end',
                className,
            )}
            data-slot="chat-attachments"
            data-variant={own ? 'own' : 'other'}
            {...props}
        />
    );
};
