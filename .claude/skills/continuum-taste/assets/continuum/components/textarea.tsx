'use client';

import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { useFieldControl } from './field';
import { inputTextClass } from './input';

/** A multi-line Input (medium size): same border states, grows downwards only. */
export const Textarea = ({
    className,
    id,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: ComponentProps<'textarea'>) => {
    const { invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });

    return (
        <textarea
            className={cn(
                'block min-h-24 w-full resize-y rounded-control border bg-transparent px-3 py-2.5 transition-[border-color] duration-150',
                inputTextClass,
                focusRing,
                invalid
                    ? 'border-error-500'
                    : control.disabled
                      ? 'border-neutral-200'
                      : 'border-neutral-200 hover:border-neutral-300 hover:placeholder:text-neutral-600 focus:border-neutral-300',
                className,
            )}
            data-slot="textarea"
            {...control}
            {...props}
        />
    );
};
