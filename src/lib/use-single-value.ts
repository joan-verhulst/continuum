'use client';

import { useState } from 'react';

/**
 * Base UI's ToggleGroup hands back an empty array when the pressed item is
 * clicked again, which would leave the group empty. Segmented controls and the dock must always keep one value.
 */
export const useSingleValue = (
    value: string | undefined,
    defaultValue: string | undefined,
    onValueChange: ((value: string) => void) | undefined,
) => {
    const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '');

    const select = (next: string) => {
        if (!next) return;
        if (value === undefined) setUncontrolled(next);
        onValueChange?.(next);
    };

    return [value ?? uncontrolled, select] as const;
};
