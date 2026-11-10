'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Copy } from 'lucide-react';
import { type ComponentProps, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { StatusDot, type StatusDotTone } from './status-dot';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

/*
 * The well is a read-only twin of Input: the same heights and radii, but filled with the 4% wash instead of
 * bordered, so a fact never looks like something to type into.
 */
export const valueFieldWellVariants = cva(
    'flex w-full min-w-0 items-center gap-2 bg-neutral-950/4 font-normal text-neutral-900 text-xs',
    {
        variants: {
            size: {
                sm: 'h-control rounded-control px-3',
                md: 'h-control-lg rounded-control px-3',
            },
            copyable: {
                // The copy button sits inset in the well, so the well's right padding becomes that inset.
                true: '',
                false: '',
            },
        },
        // The inset is the well's height less the 28px button, halved, so it matches the inset above
        // and below at every size scale, and the button's corner calc below uses the same sum.
        compoundVariants: [
            { size: 'sm', copyable: true, className: 'pr-[3px]' },
            {
                size: 'md',
                copyable: true,
                className: 'pr-[calc((var(--spacing-control-lg)-var(--spacing-control-sm))/2)]',
            },
        ],
        defaultVariants: { size: 'md', copyable: false },
    },
);

/* A bordered pill row for a single reading, such as a web vital: label left, status and value right. */
export const valueFieldVitalVariants = cva([
    'flex h-segment w-full min-w-0 items-center justify-between gap-3 rounded-pill border border-neutral-200 px-3 text-xs',
]);

// The copy button is 28px, so its corner is the well's corner less the inset that centres it.
const copyButtonRadius = {
    sm: 'rounded-[calc(var(--radius-control)-3px)]',
    md: 'rounded-[calc(var(--radius-control)-(var(--spacing-control-lg)-var(--spacing-control-sm))/2)]',
} as const;

const isEmpty = (value: ReactNode) =>
    value === null || value === undefined || value === false || value === '';

// onCopy is the copy button's callback here, not the div's clipboard event.
export type ValueFieldProps = Omit<ComponentProps<'div'>, 'children' | 'onCopy'> &
    Pick<VariantProps<typeof valueFieldWellVariants>, 'size'> & {
        label: ReactNode;
        value?: ReactNode;
        /** `well` stacks the label over a filled box; `vital` is a compact bordered row for one reading. */
        variant?: 'well' | 'vital';
        /** Shown, quieter, when there is no value. */
        emptyText?: ReactNode;
        /** Well only: adds a copy button. */
        copyable?: boolean;
        /** The text copied; defaults to the value when it is a string or number. */
        copyValue?: string;
        onCopy?: (text: string) => void;
        /** The copy button's name and tooltip, and what it says once it has copied. */
        copyLabel?: string;
        copiedLabel?: string;
        /** Vital only: the colour of the dot before the value; leave it out for no dot. */
        tone?: StatusDotTone;
    };

/** A read-only fact in a form layout: a label over a filled well, or a compact vital row with a status dot. */
export const ValueField = ({
    label,
    value,
    variant = 'well',
    size,
    emptyText = '—',
    copyable = false,
    copyValue,
    onCopy,
    copyLabel = 'Copy',
    copiedLabel = 'Copied',
    tone,
    className,
    ...props
}: ValueFieldProps) => {
    const labelId = useId();
    const empty = isEmpty(value);
    const shown = empty ? <span className="text-neutral-600">{emptyText}</span> : value;

    if (variant === 'vital') {
        return (
            <div
                className={cn(valueFieldVitalVariants(), className)}
                data-empty={empty || undefined}
                data-slot="value-field"
                data-variant="vital"
                {...props}
            >
                <span
                    className="min-w-0 truncate font-normal text-neutral-600"
                    data-slot="value-field-label"
                    id={labelId}
                >
                    {label}
                </span>
                <span
                    className="flex shrink-0 items-center gap-1.5 font-medium text-neutral-950 tabular-nums"
                    data-slot="value-field-value"
                >
                    {tone && !empty && <StatusDot size="sm" tone={tone} />}
                    {shown}
                </span>
            </div>
        );
    }

    const text =
        copyValue ?? (typeof value === 'string' || typeof value === 'number' ? String(value) : '');
    const canCopy = copyable && !empty && text !== '';
    const resolvedSize = size ?? 'md';

    return (
        <div
            className={cn('flex min-w-0 flex-col gap-1.5', className)}
            data-empty={empty || undefined}
            data-slot="value-field"
            data-variant="well"
            {...props}
        >
            <span
                className="font-normal text-neutral-600 text-xs"
                data-slot="value-field-label"
                id={labelId}
            >
                {label}
            </span>
            <div
                className={valueFieldWellVariants({ size: resolvedSize, copyable: copyable })}
                data-slot="value-field-well"
            >
                <span
                    className="min-w-0 flex-1 truncate tabular-nums"
                    data-slot="value-field-value"
                >
                    {shown}
                </span>
                {copyable && (
                    <CopyButton
                        className={copyButtonRadius[resolvedSize]}
                        copiedLabel={copiedLabel}
                        copyLabel={copyLabel}
                        describedBy={labelId}
                        disabled={!canCopy}
                        onCopy={onCopy}
                        text={text}
                    />
                )}
            </div>
        </div>
    );
};

type CopyButtonProps = {
    text: string;
    disabled: boolean;
    className: string;
    /** The field's label, so "Copy" is announced with what it copies. */
    describedBy: string;
    onCopy?: (text: string) => void;
    copyLabel: string;
    copiedLabel: string;
};

const CopyButton = ({
    text,
    disabled,
    className,
    describedBy,
    onCopy,
    copyLabel,
    copiedLabel,
}: CopyButtonProps) => {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // No clipboard (an insecure origin or a denied permission): leave the state alone rather than lie.
            return;
        }
        onCopy?.(text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1500);
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Button
                            aria-describedby={describedBy}
                            aria-label={copied ? copiedLabel : copyLabel}
                            className={className}
                            data-copied={copied || undefined}
                            disabled={disabled}
                            onClick={copy}
                            size="icon-sm"
                            variant="ghost"
                        />
                    }
                >
                    {/* Both stacked in one cell, so the tick crossfades in over the copy icon and back. */}
                    <span className="grid place-items-center *:col-start-1 *:row-start-1 *:transition-[opacity,scale] *:duration-150 *:ease-out-strong motion-reduce:*:scale-100">
                        <Copy className={cn(copied && 'scale-[0.8] opacity-0')} strokeWidth={2} />
                        <Check className={cn(!copied && 'scale-[0.8] opacity-0')} strokeWidth={2} />
                    </span>
                </TooltipTrigger>
                <TooltipContent>{copied ? copiedLabel : copyLabel}</TooltipContent>
            </Tooltip>
            {/* The tooltip is visual only, so the confirmation is announced separately. */}
            <span aria-live="polite" className="sr-only">
                {copied ? copiedLabel : ''}
            </span>
        </>
    );
};
