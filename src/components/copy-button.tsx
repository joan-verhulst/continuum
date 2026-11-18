'use client';

import { Check, Copy } from 'lucide-react';
import { type ComponentProps, useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { focusRing, touchTarget } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

export type CopyButtonProps = Omit<ComponentProps<'button'>, 'onCopy' | 'children'> & {
    /** The text put on the clipboard. */
    text: string;
    /** Its name and tooltip; "Copy" by default. */
    label?: string;
    /** What it says once it has copied. */
    copiedLabel?: string;
    onCopy?: (text: string) => void;
};

/**
 * A 24 square ghost button with a 14 copy icon, for a value that sits in a line of text (a table
 * cell): small enough to sit inside a 17 line without growing it. Once copied, the icon crossfades
 * to a tick for 1.5s and the change is announced; the tooltip says what it does.
 */
export const CopyButton = ({
    text,
    label = 'Copy',
    copiedLabel = 'Copied',
    onCopy,
    className,
    'aria-label': name,
    ...props
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
                        <button
                            {...props}
                            aria-label={copied ? copiedLabel : (name ?? label)}
                            className={cn(
                                'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-chip text-neutral-600 transition-[background-color,color,opacity] duration-150 ease-out-strong hover:bg-neutral-950/5 hover:text-neutral-950',
                                'data-copied:text-neutral-950',
                                touchTarget,
                                focusRing,
                                className,
                            )}
                            data-copied={copied || undefined}
                            data-slot="copy-button"
                            onClick={copy}
                            type="button"
                        />
                    }
                >
                    {/* Both stacked in one cell, so the tick crossfades in over the copy icon and back. */}
                    <span className="grid place-items-center *:col-start-1 *:row-start-1 *:size-3.5 *:transition-[opacity,scale] *:duration-150 *:ease-out-strong motion-reduce:*:scale-100">
                        <Copy className={cn(copied && 'scale-[0.8] opacity-0')} strokeWidth={2} />
                        <Check className={cn(!copied && 'scale-[0.8] opacity-0')} strokeWidth={2} />
                    </span>
                </TooltipTrigger>
                <TooltipContent>{copied ? copiedLabel : label}</TooltipContent>
            </Tooltip>
            {/* The tooltip is visual only, so the confirmation is announced separately. */}
            <span aria-live="polite" className="sr-only">
                {copied ? copiedLabel : ''}
            </span>
        </>
    );
};
