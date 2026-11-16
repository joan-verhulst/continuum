'use client';

import { ColorPicker, cn, Field, FieldLabel, Input, parseHex, toHex } from 'continuum';
import { type ReactNode, useEffect, useState } from 'react';
import { hexOf, readColour } from './colours';

/*
 * The small parts the tools share: a colour as a well and its hex, the panel a tool sits in, and
 * a row of labelled controls. Each tool is a figure across the page, so its panel is the one
 * framed thing in a section, as a stage is in the playground.
 */

/** A hex as the tools keep it: lower case, six digits, with its hash. */
export const normalHex = (text: string): string | null => {
    const trimmed = text.trim().replace(/^#?/, '#');
    const short = /^#([0-9a-f]{3})$/i.exec(trimmed);
    const full = short
        ? `#${[...(short[1] ?? '')].map(c => c + c).join('')}`
        : /^#[0-9a-f]{6}$/i.test(trimmed)
          ? trimmed
          : null;
    const rgb = full ? parseHex(full) : null;
    return rgb ? toHex(rgb).toLowerCase() : null;
};

/**
 * A colour: the well that opens the picker, and the hex beside it to type or paste. The text is
 * the reader's while they type; it only sets the colour once it reads as a whole hex.
 */
export const ColourInput = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (hex: string) => void;
}) => {
    const [draft, setDraft] = useState(value);
    const [typing, setTyping] = useState(false);
    useEffect(() => {
        if (!typing) setDraft(value);
    }, [value, typing]);
    const invalid = draft.trim() !== '' && normalHex(draft) === null;

    return (
        <Field className="min-w-0" invalid={invalid}>
            <FieldLabel>{label}</FieldLabel>
            <div className="flex items-center gap-2">
                <ColorPicker label={label} onChange={onChange} value={value} />
                <Input
                    aria-invalid={invalid || undefined}
                    className="w-32"
                    inputClassName="font-mono"
                    onBlur={() => setTyping(false)}
                    onChange={event => {
                        setTyping(true);
                        setDraft(event.target.value);
                        const hex = normalHex(event.target.value);
                        if (hex) onChange(hex);
                    }}
                    onFocus={() => setTyping(true)}
                    size="sm"
                    spellCheck={false}
                    value={draft}
                />
            </div>
        </Field>
    );
};

/** A labelled control in a tool's row. */
export const Control = ({ label, children }: { label: string; children: ReactNode }) => (
    <Field className="min-w-0">
        <FieldLabel>{label}</FieldLabel>
        {children}
    </Field>
);

/** The panel a tool sits in: a hairline, panel corners, the controls on top and the result under. */
export const ToolPanel = ({
    controls,
    children,
    className,
}: {
    controls: ReactNode;
    children: ReactNode;
    className?: string;
}) => (
    <div
        className={cn(
            'flex min-w-0 flex-col rounded-panel border border-neutral-200 bg-neutral-50',
            className,
        )}
    >
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-neutral-200 border-b p-6">
            {controls}
        </div>
        <div className="@container flex min-w-0 flex-col gap-6 p-6">{children}</div>
    </div>
);

/**
 * A colour in any CSS form: the well that opens the picker (which answers in hex), and the text
 * beside it, where hex, rgb(), hsl(), oklch() or a name can be typed or pasted. The text is the
 * reader's while they type; it sets the colour once it reads as one.
 */
export const CssColourInput = ({
    label,
    value,
    onChange,
    className,
}: {
    label: string;
    /** The colour as written: whatever form the reader gave it in. */
    value: string;
    onChange: (text: string) => void;
    className?: string;
}) => {
    const [draft, setDraft] = useState(value);
    const [typing, setTyping] = useState(false);
    useEffect(() => {
        if (!typing) setDraft(value);
    }, [value, typing]);
    const read = readColour(value);
    const invalid = draft.trim() !== '' && readColour(draft) === null;

    return (
        <Field className={cn('min-w-0', className)} invalid={invalid}>
            <FieldLabel>{label}</FieldLabel>
            <div className="flex items-center gap-2">
                <ColorPicker
                    label={label}
                    onChange={onChange}
                    value={read ? hexOf(read) : '#000000'}
                />
                <Input
                    aria-invalid={invalid || undefined}
                    className="w-44"
                    inputClassName="font-mono"
                    onBlur={() => setTyping(false)}
                    onChange={event => {
                        setTyping(true);
                        setDraft(event.target.value);
                        if (readColour(event.target.value)) onChange(event.target.value.trim());
                    }}
                    onFocus={() => setTyping(true)}
                    size="sm"
                    spellCheck={false}
                    value={draft}
                />
            </div>
        </Field>
    );
};
