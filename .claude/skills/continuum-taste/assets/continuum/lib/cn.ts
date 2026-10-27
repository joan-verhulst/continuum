import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            text: ['xxs'],
            radius: ['chip', 'item', 'control', 'card', 'panel', 'dock', 'pill'],
            shadow: ['float', 'sheet', 'action'],
        },
    },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/*
 * Base UI lets className be a function of state; Continuum composes classes with cn(), and clsx
 * silently drops a function, so every wrapped part takes a plain string instead.
 */
export type WithClassName<T> = Omit<T, 'className'> & { className?: string };
