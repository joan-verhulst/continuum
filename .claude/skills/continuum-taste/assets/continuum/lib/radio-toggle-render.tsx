import type { Toggle } from '@base-ui/react/toggle';
import type { HTMLProps } from 'react';

/*
 * Base UI's Toggle is a pressed/unpressed button (aria-pressed), but a group that always keeps one
 * value is a single choice, so each item is announced as a radio in a radiogroup.
 * Otherwise a screen reader offers to "unpress" the active item, which useSingleValue then ignores.
 */
export const radioToggleRender = (
    { 'aria-pressed': _pressed, ...props }: HTMLProps<HTMLButtonElement>,
    state: Toggle.State,
) => (
    // biome-ignore lint/a11y/useSemanticElements: a styled segment with the toggle group's roving focus, which a native radio input can't carry.
    <button {...props} aria-checked={state.pressed} role="radio" type="button" />
);
