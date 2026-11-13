import {
    Button,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DropZone,
    Field,
    FieldHelper,
    FieldLabel,
    Textarea,
    type ThemeOptions,
    themeFontFamilies,
    themeFromCss,
} from 'continuum';
import { useMemo, useState } from 'react';

/** What each choice is called where it is shown. */
const optionNames: Partial<Record<keyof ThemeOptions, string>> = {
    accent: 'Primary',
    action: 'Primary',
    neutral: 'Greys',
    font: 'Font',
    radius: 'Corners',
};

/** A choice as it reads: the colour, the font's name, the corner scale. */
const choiceLine = (key: keyof ThemeOptions, options: ThemeOptions) => {
    if (key === 'accent') return options.accent;
    if (key === 'action') return 'Neutral, from a grey primary';
    if (key === 'neutral')
        return options.neutral?.tint ? `Tinted, hue ${options.neutral.hue}°` : 'Pure grey';
    if (key === 'font')
        return options.font && options.font in themeFontFamilies
            ? themeFontFamilies[options.font as keyof typeof themeFontFamilies].family
            : options.font;
    if (key === 'radius') return `${options.radius}× Continuum's corners`;
    return '';
};

/**
 * The patch an imported theme makes: what it read, and a primary read without a step of its own
 * lets go of the step the old primary sat on.
 */
export const importPatch = (options: ThemeOptions): Partial<ThemeOptions> =>
    options.accent && !options.accentStep ? { ...options, accentStep: undefined } : options;

/**
 * A theme a product already has, read in: a Tailwind v4 `@theme` block or a shadcn/ui
 * `globals.css`, pasted or dropped. It shows what it read before it is taken, since only the
 * primary, the greys, the font and the corners carry over.
 */
export const ImportThemeDialog = ({
    open,
    onOpenChange,
    onImport,
    action = 'Import',
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (options: ThemeOptions) => void;
    /** The button's word: Import, or Use for a new project's start. */
    action?: string;
}) => {
    const [text, setText] = useState('');
    const read = useMemo(() => (text.trim() ? themeFromCss(text) : null), [text]);

    const close = (next: boolean) => {
        onOpenChange(next);
        if (!next) setText('');
    };

    return (
        <Dialog onOpenChange={close} open={open}>
            <DialogContent className="w-[min(520px,calc(100vw-32px))]">
                <DialogHeader>
                    <DialogTitle>Import a Tailwind theme</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <DialogDescription>
                        A Tailwind v4 theme or a shadcn/ui globals.css. Its primary colour, greys,
                        font and corners carry over; the rest stays Continuum's, to adjust in the
                        steps.
                    </DialogDescription>
                    <DropZone
                        accept=".css"
                        description="Or paste it below"
                        onFiles={async files => {
                            const file = files[0];
                            if (file) setText(await file.text());
                        }}
                        title="Drop a .css file here"
                    />
                    <Field invalid={Boolean(read && read.found.length === 0)}>
                        <FieldLabel>Stylesheet</FieldLabel>
                        <Textarea
                            className="font-mono text-xxs"
                            onChange={event => setText(event.target.value)}
                            placeholder={
                                '@theme {\n  --color-brand-600: oklch(0.55 0.2 265);\n  --font-sans: "Inter", sans-serif;\n}'
                            }
                            rows={5}
                            value={text}
                        />
                        {read && read.found.length === 0 && (
                            <FieldHelper>
                                Nothing to take: no primary, grey ramp, --font-sans or radius found.
                            </FieldHelper>
                        )}
                    </Field>
                    {read && read.found.length > 0 && (
                        <dl className="flex flex-col divide-y divide-neutral-200 rounded-item border border-neutral-200">
                            {read.found.map(item => (
                                <div
                                    className="flex items-center gap-4 px-3 py-2 text-xs"
                                    key={item.option}
                                >
                                    <dt className="w-20 shrink-0 text-neutral-600">
                                        {optionNames[item.option]}
                                    </dt>
                                    <dd className="flex min-w-0 flex-1 items-center gap-2 text-neutral-950">
                                        {item.option === 'accent' && (
                                            <span
                                                aria-hidden
                                                className="size-3 shrink-0 rounded-full ring-1 ring-neutral-950/10 ring-inset"
                                                style={{ background: read.options.accent }}
                                            />
                                        )}
                                        <span className="truncate">
                                            {choiceLine(item.option, read.options)}
                                        </span>
                                    </dd>
                                    <dd className="hidden truncate font-mono text-neutral-600 text-xxs sm:block">
                                        {item.from.split(',')[0]}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </DialogBody>
                <DialogFooter>
                    <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                    <Button
                        disabled={!read || read.found.length === 0}
                        onClick={() => {
                            if (!read) return;
                            onImport(read.options);
                            close(false);
                        }}
                    >
                        {action}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
