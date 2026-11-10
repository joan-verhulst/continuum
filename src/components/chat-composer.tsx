'use client';

import { ArrowUp, Paperclip, Plus } from 'lucide-react';
import {
    type ComponentProps,
    type KeyboardEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    useCallback,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import {
    AttachContext,
    assignRef,
    focusTextOnPress,
    hasContent,
    SuggestionsContext,
} from './chat-shared';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    type DropdownMenuItemProps,
    DropdownMenuTrigger,
} from './dropdown-menu';

let warnedNoPicker = false;

/**
 * The "Add attachments" row of an `attachMenu`, in `ChatComposer` or `ChatPrompt`: a paperclip and
 * the label, opening that part's own file picker, so the files arrive through `onAttach` as they do
 * without a menu. It needs `onAttach` on the part round it.
 */
export const ChatComposerAttachItem = ({
    children = 'Add attachments',
    onClick,
    ...props
}: DropdownMenuItemProps) => {
    const picker = useContext(AttachContext);

    return (
        <DropdownMenuItem
            data-slot="chat-composer-attach-item"
            onClick={event => {
                onClick?.(event);
                if (picker?.openFiles) picker.openFiles();
                else if (!warnedNoPicker) {
                    warnedNoPicker = true;
                    console.warn(
                        'ChatComposerAttachItem: pass `onAttach` to the ChatComposer or ChatPrompt round it, or this row opens no file picker.',
                    );
                }
            }}
            {...props}
        >
            <Paperclip aria-hidden strokeWidth={2} />
            {children}
        </DropdownMenuItem>
    );
};

export type ChatComposerProps = Omit<ComponentProps<'form'>, 'onSubmit' | 'children'> & {
    /** Controlled draft. */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /**
     * Called with the trimmed draft on Enter or the send button. The draft clears afterwards
     * unless this returns `false`, e.g. when the message could not be queued. With attachments
     * waiting, it is called even for an empty draft.
     */
    onSend?: (text: string) => unknown;
    /**
     * Draws the leading attach button, which opens the file picker and calls this with the files
     * chosen. Show them in `attachments`. The same prop, meaning the same, as on `ChatPrompt`.
     */
    onAttach?: (files: File[]) => void;
    /** The picker's file types, as the input's `accept`: "image/*,.pdf". */
    accept?: string;
    /** Draws the leading attach button and calls this instead of opening the picker. */
    onAdd?: () => void;
    /**
     * Makes the attach button open a menu above it of what can go with a message: `DropdownMenuItem`s
     * with a 16 icon, and `ChatComposerAttachItem` for files (it opens the picker; needs `onAttach`).
     */
    attachMenu?: ReactNode;
    /** Replaces the attach button entirely, as `attach` does on `ChatPrompt`. */
    attach?: ReactNode;
    /** @deprecated Use `attach`; `start` is the foot's left slot on `ChatPrompt`. */
    start?: ReactNode;
    /**
     * What waits to go: a `ChatAttachments` row of `ChatAttachment`s (files, images, linked
     * records), each with `onRemove`. It sits in a row 8 above the box, never inside it.
     */
    attachments?: ReactNode;
    /**
     * Who else is typing: a `ChatTyping`, in a row above everything else. Passed, the row's height
     * is kept whether anyone types or not, so the box never moves when they start.
     */
    typing?: ReactNode;
    /**
     * A `ChatSuggestions` panel, shown just above the box over whatever is there while it is passed:
     * the records a "#" or "@" being typed could mean (see `useChatTrigger`). While it shows, the
     * arrows move through its rows, Enter and Tab pick, and Escape calls `onSuggestionsClose`.
     */
    suggestions?: ReactNode;
    /** Escape, or the text losing focus, while `suggestions` show: stop passing them. */
    onSuggestionsClose?: () => void;
    placeholder?: string;
    disabled?: boolean;
    /** Accessible name of the text box. */
    label?: string;
    /** Accessible names of the attach and send buttons. */
    attachLabel?: string;
    /** @deprecated Use `attachLabel`. */
    addLabel?: string;
    sendLabel?: string;
    name?: string;
    maxLength?: number;
    textareaRef?: Ref<HTMLTextAreaElement>;
};

const optionSelector = '[role=option]:not([aria-disabled=true])';

/**
 * Where the current user writes: an attach button filled in the action colour, a text box that
 * grows with the draft and a quiet send arrow that wakes once there is something to send. Enter
 * sends; Shift+Enter starts a new line. Above the box, from the top: who else is typing, then what
 * waits to go with the message; suggestions for a reference being typed float just over the box.
 */
export const ChatComposer = ({
    value: valueProp,
    defaultValue = '',
    onValueChange,
    onSend,
    onAttach,
    accept,
    onAdd,
    attachMenu,
    attach: attachSlot,
    start,
    attachments,
    typing,
    suggestions,
    onSuggestionsClose,
    placeholder = 'Write a message',
    disabled = false,
    label = 'Message',
    attachLabel,
    addLabel,
    sendLabel = 'Send',
    name,
    maxLength,
    textareaRef,
    className,
    ...props
}: ChatComposerProps) => {
    const attachName = attachLabel ?? addLabel ?? 'Attach';
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const controlled = valueProp !== undefined;
    const value = controlled ? valueProp : uncontrolled;
    const attached = hasContent(attachments);
    const canSend = !disabled && (value.trim().length > 0 || attached);
    const suggesting = !disabled && hasContent(suggestions);
    const nodeRef = useRef<HTMLTextAreaElement | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const listId = useId();
    const menuCloseReason = useRef<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

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
    // biome-ignore lint/correctness/useExhaustiveDependencies: the height follows the value.
    useLayoutEffect(() => {
        const node = nodeRef.current;

        if (!node) return;
        node.style.height = 'auto';
        node.style.height = `${node.scrollHeight}px`;
    }, [value]);

    const options = () =>
        Array.from(listRef.current?.querySelectorAll<HTMLElement>(optionSelector) ?? []);

    // The first row is active as the suggestions open, and again whenever the active one leaves the list.
    useLayoutEffect(() => {
        if (!suggesting) {
            if (activeId !== null) setActiveId(null);
            return;
        }
        const rows = Array.from(
            listRef.current?.querySelectorAll<HTMLElement>(optionSelector) ?? [],
        );
        if (!rows.some(row => row.id === activeId)) setActiveId(rows[0]?.id ?? null);
    });

    // The active row is kept in view as the arrows move past the list's edge.
    useEffect(() => {
        if (!activeId) return;
        listRef.current
            ?.querySelector(`[id="${CSS.escape(activeId)}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [activeId]);

    const send = () => {
        if (!canSend) return;
        if (onSend?.(value.trim()) !== false) setValue('');
        nodeRef.current?.focus();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter during IME composition picks a candidate; it must not send half a word.
        if (event.nativeEvent.isComposing) return;

        if (suggesting) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const rows = options();
                if (rows.length === 0) return;
                const at = rows.findIndex(row => row.id === activeId);
                const step = event.key === 'ArrowDown' ? 1 : -1;
                const next =
                    at === -1
                        ? step === 1
                            ? 0
                            : rows.length - 1
                        : (at + step + rows.length) % rows.length;
                setActiveId(rows[next]?.id ?? null);
                return;
            }
            if ((event.key === 'Enter' || event.key === 'Tab') && !event.shiftKey) {
                const row = options().find(option => option.id === activeId);
                if (row) {
                    event.preventDefault();
                    row.click();
                    return;
                }
            }
            if (event.key === 'Escape') {
                // Only the suggestions close: a sheet or dialog round the composer stays open.
                event.preventDefault();
                event.stopPropagation();
                onSuggestionsClose?.();
                return;
            }
        }

        if (event.key !== 'Enter' || event.shiftKey) return;
        event.preventDefault();
        send();
    };

    const openFiles = onAttach ? () => fileRef.current?.click() : null;
    const attach = onAdd ?? openFiles ?? undefined;

    const addButton = (
        <Button
            aria-label={attachName}
            // The composer's one filled control: the send beside it stays a quiet arrow.
            className="size-cell rounded-item"
            data-slot="chat-composer-add"
            disabled={disabled}
            onClick={attachMenu ? undefined : attach}
            // No size variant: the cell square (32) and its corner are its own, not the 34 control row.
            size={null}
            variant="primary"
        >
            <Plus aria-hidden strokeWidth={2} />
        </Button>
    );

    const leading =
        attachSlot ??
        start ??
        (attachMenu ? (
            <DropdownMenu
                onOpenChange={(open, details) => {
                    if (!open) menuCloseReason.current = details.reason;
                }}
            >
                <DropdownMenuTrigger disabled={disabled} render={addButton} />
                {/* Opens upward from the "+", its left edge on the button's. Picking goes back to the
                    text; Escape or a press outside leaves focus where a menu leaves it, on the "+". */}
                <DropdownMenuContent
                    align="start"
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
            attach && addButton
        ));

    return (
        <AttachContext.Provider value={{ openFiles }}>
            <form
                className={cn('flex min-w-0 flex-col', className)}
                data-disabled={disabled || undefined}
                data-slot="chat-composer"
                onSubmit={event => {
                    event.preventDefault();
                    send();
                }}
                {...props}
            >
                {typing !== undefined && (
                    // Held at its 24 row (6 above it, 8 clear of what follows) while nobody types, so the box never moves.
                    <div
                        className="box-content flex h-6 min-w-0 items-center pt-1.5 pb-2"
                        data-slot="chat-composer-typing"
                    >
                        {typing}
                    </div>
                )}
                {onAttach && (
                    <input
                        accept={accept}
                        className="hidden"
                        data-slot="chat-composer-file"
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
                    // What waits to go, outside the box and 8 above it, so the box keeps its one-line look.
                    <div className="min-w-0 pb-2" data-slot="chat-composer-attachments">
                        {attachments}
                    </div>
                )}
                <div className="relative min-w-0" data-slot="chat-composer-field">
                    {suggesting && (
                        // Over whatever is above the box, 8 clear of it and its full width.
                        <div
                            className="absolute inset-x-0 bottom-full z-10 pb-2"
                            data-slot="chat-composer-suggestions"
                            ref={listRef}
                        >
                            <SuggestionsContext.Provider value={{ listId, activeId, setActiveId }}>
                                {suggestions}
                            </SuggestionsContext.Provider>
                        </div>
                    )}
                    <div
                        className={cn(
                            // 48 high at one line (control-xl): a cell row in 8 of room, the hairline inside
                            // it. The corner is the attach button's and 4 more, not the padding's full 8, so
                            // box and button read as one shape; it squares off with them at corner scale 0.
                            'flex min-h-control-xl cursor-text items-end gap-3 rounded-[min(calc(var(--radius-item)+4px),calc(var(--radius-item)*100))] border border-neutral-100 bg-neutral-50 py-[calc(--spacing(2)-1px)] pr-[calc(--spacing(2.5)-1px)] pl-[calc(--spacing(2)-1px)] shadow-composer transition-[border-color] duration-150',
                            'has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-focus has-[textarea:focus-visible]:outline-solid has-[textarea:focus-visible]:outline-offset-2',
                            // The buttons dim themselves when disabled; dimming the frame too would halve them again.
                            disabled
                                ? 'cursor-not-allowed'
                                : 'hover:border-neutral-200 has-[textarea:focus]:border-neutral-200',
                        )}
                        data-slot="chat-composer-box"
                        onMouseDown={event => focusTextOnPress(event, nodeRef.current, disabled)}
                    >
                        {leading}
                        <textarea
                            aria-activedescendant={(suggesting && activeId) || undefined}
                            aria-controls={suggesting ? listId : undefined}
                            aria-label={label}
                            className={cn(
                                // One line is the cell row of the buttons beside it: text-xs's line and the rest either side.
                                'block max-h-40 min-h-cell min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-[calc((var(--spacing-cell)-var(--text-xs--line-height))/2)] text-neutral-900 text-xs outline-none placeholder:text-neutral-600',
                                'disabled:cursor-not-allowed disabled:text-neutral-400 disabled:placeholder:text-neutral-300',
                                !leading && 'pl-2',
                            )}
                            data-slot="chat-composer-input"
                            disabled={disabled}
                            maxLength={maxLength}
                            name={name}
                            onBlur={() => {
                                if (suggesting) onSuggestionsClose?.();
                            }}
                            onChange={event => setValue(event.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder={placeholder}
                            ref={setRef}
                            rows={1}
                            value={value}
                        />
                        <Button
                            aria-label={sendLabel}
                            // Quiet: an arrow in the text's grey that darkens on hover, dimmed until there is something to send.
                            className="size-cell rounded-item [&_svg]:size-5"
                            data-slot="chat-composer-send"
                            disabled={!canSend}
                            size={null}
                            type="submit"
                            variant="ghost"
                        >
                            <ArrowUp aria-hidden strokeWidth={2} />
                        </Button>
                    </div>
                </div>
            </form>
        </AttachContext.Provider>
    );
};
