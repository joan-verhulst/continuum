'use client';

import { Button, cn } from 'continuum';
import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Code to run or paste, in mono on the surface with a hairline, and a copy button in its top corner,
 * centred on the first line. A long line wraps, so nothing runs under the button. As the playground's
 * article draws it; `flow-text` keeps a paragraph's spacing inside an ArticleSection.
 */
export const CodeBlock = ({ code, className }: { code: string; className?: string }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 1600);
        return () => clearTimeout(timer);
    }, [copied]);

    return (
        <div
            className={cn(
                'flow-text relative mx-auto w-full min-w-0 max-w-152 rounded-item border border-neutral-200 bg-neutral-50',
                className,
            )}
        >
            <pre className="wrap-anywhere whitespace-pre-wrap py-4 pr-14 pl-4 font-mono text-neutral-800 text-xs leading-relaxed">
                <code>{code}</code>
            </pre>
            <Button
                aria-label={copied ? 'Copied' : 'Copy'}
                className="absolute top-3 right-3"
                onClick={() => {
                    void navigator.clipboard?.writeText(code).then(() => setCopied(true));
                }}
                size="icon-sm"
                variant="ghost"
            >
                {copied ? <Check strokeWidth={2} /> : <Copy strokeWidth={2} />}
            </Button>
        </div>
    );
};
