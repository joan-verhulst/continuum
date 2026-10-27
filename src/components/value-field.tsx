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
    'flex w-full min-w-0 items-center gap-2 bg-neutral-950/[0.04] font-normal text-neutral-900 text-xs',
    {
        variants: {
            size: {
                sm: 'h-[34px] rounded-control px-3',
                md: 'h-[38px] rounded-control px-3',
            },
            copyable: {
                // The copy button sits inset in the well, so the well's right padding becomes that inset.
                true: '',
                false: '',
            },
        },
        compoundVariants: [
            { size: 'sm', copyable: true, className: 'pr-[3px]' },
            { size: 'md', copyable: true, className: 'pr-[5px]' },
        ],
        defaultVariants: { size: 'md', copyable: false },
    },
);

/* A bordered pill row for a single reading, such as a web vital: label left, status and value right. */
export const valueFieldVitalVariants = cva([
    'flex h-[29px] w-full min-w-0 items-center justify-between gap-3 rounded-pill border border-neutral-200 px-3 text-xs',
]);

// The copy button is 28px, so its corner is the well's corner less the inset that centres it.
const copyButtonRadius = {
    sm: 'rounded-[calc(var(--radius-control)-3px)]',
    md: 'rounded-[calc(var(--radius-control)-5px)]',
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
    tone,
    className,
    ...props
}: ValueFieldProps) => {
    const labelId = useId();
    const empty = isEmpty(value);
    const shown = empty ? <span className="text-neutral-500">{emptyText}</span> : value;

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
};

const CopyButton = ({ text, disabled, className, describedBy, onCopy }: CopyButtonProps) => {
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
                            aria-label={copied ? 'Copied' : 'Copy'}
                            className={className}
                            data-copied={copied || undefined}
                            disabled={disabled}
                            onClick={copy}
                            size="icon-sm"
                            variant="ghost"
                        />
                    }
                >
                    {copied ? <Check strokeWidth={2} /> : <Copy strokeWidth={2} />}
                </TooltipTrigger>
                <TooltipContent>{copied ? 'Copied' : 'Copy'}</TooltipContent>
            </Tooltip>
            {/* The tooltip is visual only, so the confirmation is announced separately. */}
            <span aria-live="polite" className="sr-only">
                {copied ? 'Copied to clipboard' : ''}
            </span>
        </>
    );
};
