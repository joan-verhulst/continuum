// Private to the chat parts; not exported from the package.
import { Children, createContext, type MouseEvent, type ReactNode, type Ref } from 'react';

export const assignRef = <T>(ref: Ref<T> | undefined, node: T | null) => {
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
};

type SuggestionsContextValue = {
    listId: string;
    activeId: string | null;
    setActiveId: (id: string) => void;
};

export const SuggestionsContext = createContext<SuggestionsContextValue | null>(null);

type AttachContextValue = {
    /** Opens the composer's or prompt's file picker; null without `onAttach`. */
    openFiles: (() => void) | null;
};

/** Lets `ChatComposerAttachItem` open the file picker of the composer or prompt round it. */
export const AttachContext = createContext<AttachContextValue | null>(null);

export const hasContent = (node: ReactNode) =>
    node != null && node !== false && Children.toArray(node).length > 0;

/**
 * The box reads as one field: a press on its padding, its foot or between its buttons puts the
 * caret in the text. Presses on anything interactive keep their own behaviour.
 */
export const focusTextOnPress = (
    event: MouseEvent<HTMLElement>,
    text: HTMLTextAreaElement | null,
    disabled: boolean,
) => {
    const target = event.target as HTMLElement;
    if (disabled || target.closest('button, a, input, textarea, [role]')) return;
    event.preventDefault();
    text?.focus();
};
