'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowUp, Plus, Square } from 'lucide-react';
import {
    type ComponentProps,
    type KeyboardEvent,
    type MouseEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { AttachContext, assignRef, focusTextOnPress, hasContent } from './chat-shared';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu';

export const chatPromptVariants = cva(
    [
        'flex min-w-0 cursor-text flex-col border border-neutral-200 bg-neutral-50 transition-[border-color] duration-150',
        'has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-focus has-[textarea:focus-visible]:outline-solid has-[textarea:focus-visible]:outline-offset-2',
    ],
    {
        variants: {
            size: {
                // The corner nests round the buttons': theirs plus the padding, so it follows the
                // theme's corners, and squares off with them at corner scale 0. The empty page's
                // prompt: room for a long question before it scrolls.
                lg: 'gap-0.5 rounded-[min(calc(var(--radius-chip)+var(--spacing)*2),calc(var(--radius-chip)*100))] p-2',
                // Docked at the foot of a conversation.
                md: 'gap-0.5 rounded-[min(calc(var(--radius-chip)+var(--spacing)*1.5),calc(var(--radius-chip)*100))] p-1.5',
            },
        },
        defaultVariants: {
            size: 'lg',
        },
    },
);

const inputSizes = {
    // Two lines and a bit at 14 before the foot: with the 8 padding, the 2 gap, the 28 foot and the
    // hairlines the box is 104.
    lg: 'min-h-14 max-h-60 px-2 pt-2 text-sm',
    // One line at 13 in 28: the box is 72 with the foot.
    md: 'min-h-7 max-h-40 px-2 pt-1.5 text-xs',
} as const;

export type ChatPromptProps = Omit<ComponentProps<'form'>, 'onSubmit' | 'children'> &
    VariantProps<typeof chatPromptVariants> & {
        /** Controlled draft. */
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
        /**
         * Called with the trimmed question on Enter or the send button. The draft clears afterwards
         * unless this returns `false`.
         */
        onSend?: (text: string) => unknown;
        /** A reply is being written: the send button becomes Stop, and Enter waits. */
        streaming?: boolean;
        /** Called by Stop while `streaming`. */
        onStop?: () => void;
        /**
         * Draws a quiet attach button before send, which opens the file picker and calls this with
         * the files chosen; show them in `attachments`. The same prop, meaning the same, as on
         * `ChatComposer`. Leave it, `onAdd` and `attach` out for no attach button.
         */
        onAttach?: (files: File[]) => void;
        /** The picker's file types, as the input's `accept`: "image/*,.pdf". */
        accept?: string;
        /** Draws the attach button and calls this instead of opening the picker. */
        onAdd?: () => void;
        /**
         * Makes the attach button open a menu above it of what can go with a question:
         * `DropdownMenuItem`s with a 16 icon, and `ChatComposerAttachItem` for files (needs `onAttach`).
         */
        attachMenu?: ReactNode;
        /** Replaces the attach button entirely, as `attach` does on `ChatComposer`. */
        attach?: ReactNode;
        /**
         * What waits to go with the question: a `ChatAttachments` row, each with `onRemove`. It sits
         * inside the box, above the text. With something waiting, the question can be sent empty.
         */
        attachments?: ReactNode;
        /** At the left of the foot: a model or mode menu, a scope chip. */
        start?: ReactNode;
        placeholder?: string;
        disabled?: boolean;
        autoFocus?: boolean;
        /** Accessible name of the text box. */
        label?: string;
        /** Accessible names of the attach, send and stop buttons. */
        attachLabel?: string;
        sendLabel?: string;
        stopLabel?: string;
        name?: string;
        maxLength?: number;
        textareaRef?: Ref<HTMLTextAreaElement>;
    };

/**
 * Where a question to an assistant is written: a text box over a foot with an optional menu at the
 * left and attach and send at the right. `lg` is the empty page's prompt, `md` the one docked under
 * a conversation. Enter sends, Shift+Enter starts a new line; while a reply streams, send becomes
 * Stop. Clicking anywhere on the box that is not a button puts the caret in the text.
 */
export const ChatPrompt = ({
    size,
    value: valueProp,
    defaultValue = '',
    onValueChange,
    onSend,
    streaming = false,
    onStop,
    onAttach,
    accept,
    onAdd,
    attachMenu,
    attach,
    attachments,
    start,
    placeholder = 'Ask anything…',
    disabled = false,
    autoFocus,
    label = 'Question',
    attachLabel = 'Attach',
    sendLabel = 'Send',
    stopLabel = 'Stop',
    name,
    maxLength,
    textareaRef,
    className,
    onMouseDown,
    ...props
}: ChatPromptProps) => {
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const controlled = valueProp !== undefined;
    const value = controlled ? valueProp : uncontrolled;
    const attached = hasContent(attachments);
    const canSend = !disabled && !streaming && (value.trim().length > 0 || attached);
    const nodeRef = useRef<HTMLTextAreaElement | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const menuCloseReason = useRef<string | null>(null);
    const resolved = size ?? 'lg';

    const setValue = (next: string) => {
        if (!controlled) setUncontrolled(next);
        onValueChange?.(next);
    };

    const setRef = useCallback<RefCallback<HTMLTextAreaElement>>(
        node => {
            nodeRef.current = node;
            assignRef(textareaRef, node);
        },
        [textareaRef],
    );

    // Grow with the draft up to max-h, then scroll; field-sizing is not in every browser yet.
    // biome-ignore lint/correctness/useExhaustiveDependencies: the height follows the value and the size.
    useLayoutEffect(() => {
        const node = nodeRef.current;

        if (!node) return;
        node.style.height = 'auto';
        node.style.height = `${node.scrollHeight}px`;
    }, [value, resolved]);

    const send = () => {
        if (!canSend) return;
        if (onSend?.(value.trim()) !== false) setValue('');
        nodeRef.current?.focus();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter during IME composition picks a candidate; it must not send half a word.
        if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
        event.preventDefault();
        send();
    };

    // The box reads as one field: a press on its padding or its foot lands in the text.
    const focusText = (event: MouseEvent<HTMLFormElement>) => {
        onMouseDown?.(event);
        focusTextOnPress(event, nodeRef.current, disabled);
    };

    const openFiles = onAttach ? () => fileRef.current?.click() : null;
    const onAttachPress = onAdd ?? openFiles ?? undefined;

    const attachButton = (
        <Button
            aria-label={attachLabel}
            data-slot="chat-prompt-attach"
            disabled={disabled}
            onClick={attachMenu ? undefined : onAttachPress}
            size="icon-sm"
            variant="ghost"
        >
            <Plus aria-hidden strokeWidth={2} />
        </Button>
    );

    const attachment =
        attach ??
        (attachMenu ? (
            <DropdownMenu
                onOpenChange={(open, details) => {
                    if (!open) menuCloseReason.current = details.reason;
                }}
            >
                <DropdownMenuTrigger disabled={disabled} render={attachButton} />
                {/* Opens upward from the "+"; picking goes back to the text, Escape leaves focus on the "+". */}
                <DropdownMenuContent
                    align="end"
                    className="min-w-menu-wide"
                    finalFocus={() =>
                        menuCloseReason.current === 'item-press' ? nodeRef.current : true
                    }
                    side="top"
                    sideOffset={8}
                >
                    {attachMenu}
                </DropdownMenuContent>
            </DropdownMenu>
        ) : (
            onAttachPress && attachButton
        ));

    return (
        <AttachContext.Provider value={{ openFiles }}>
            <form
                className={cn(
                    chatPromptVariants({ size }),
                    // The buttons dim themselves when disabled; dimming the frame too would halve them again.
                    disabled
                        ? 'cursor-not-allowed'
                        : 'hover:border-neutral-300 has-[textarea:focus]:border-neutral-300',
                    className,
                )}
                data-disabled={disabled || undefined}
                data-size={resolved}
                data-slot="chat-prompt"
                data-streaming={streaming || undefined}
                onMouseDown={focusText}
                onSubmit={event => {
                    event.preventDefault();
                    send();
                }}
                {...props}
            >
                {onAttach && (
                    <input
                        accept={accept}
                        className="hidden"
                        data-slot="chat-prompt-file"
                        disabled={disabled}
                        multiple
                        onChange={event => {
                            const files = Array.from(event.currentTarget.files ?? []);
                            // Cleared, so choosing the same file again after removing it still reports.
                            event.currentTarget.value = '';
                            if (files.length > 0) onAttach(files);
                            nodeRef.current?.focus();
                        }}
                        ref={fileRef}
                        tabIndex={-1}
                        type="file"
                    />
                )}
                {attached && (
                    // What waits to go, inside the box above the text, so the question and its files read as one.
                    <div className="min-w-0 px-1 pt-1" data-slot="chat-prompt-attachments">
                        {attachments}
                    </div>
                )}
                <textarea
                    aria-label={label}
                    // biome-ignore lint/a11y/noAutofocus: an empty assistant page has one thing to do, and asks for it.
                    autoFocus={autoFocus}
                    className={cn(
                        'block min-w-0 resize-none overflow-y-auto bg-transparent text-neutral-900 outline-none placeholder:text-neutral-600',
                        'disabled:cursor-not-allowed disabled:text-neutral-400 disabled:placeholder:text-neutral-300',
                        inputSizes[resolved],
                    )}
                    data-slot="chat-prompt-input"
                    disabled={disabled}
                    maxLength={maxLength}
                    name={name}
                    onChange={event => setValue(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    ref={setRef}
                    rows={1}
                    value={value}
                />
                <div className="flex min-w-0 items-center gap-1" data-slot="chat-prompt-foot">
                    {start != null && (
                        <div
                            className="flex min-w-0 items-center gap-1"
                            data-slot="chat-prompt-start"
                        >
                            {start}
                        </div>
                    )}
                    <div className="ml-auto flex shrink-0 items-center gap-1">
                        {attachment}
                        {streaming ? (
                            <Button
                                aria-label={stopLabel}
                                data-slot="chat-prompt-stop"
                                // Stop gives way to send, so the press would leave focus on nothing: it returns to the text.
                                onClick={() => {
                                    onStop?.();
                                    nodeRef.current?.focus();
                                }}
                                shape="pill"
                                size="icon-sm"
                                type="button"
                                variant="primary"
                            >
                                <Square
                                    aria-hidden
                                    className="size-2.5 fill-current"
                                    strokeWidth={0}
                                />
                            </Button>
                        ) : (
                            <Button
                                aria-label={sendLabel}
                                data-slot="chat-prompt-send"
                                disabled={!canSend}
                                shape="pill"
                                size="icon-sm"
                                type="submit"
                                variant="primary"
                            >
                                <ArrowUp aria-hidden strokeWidth={2} />
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </AttachContext.Provider>
    );
};
