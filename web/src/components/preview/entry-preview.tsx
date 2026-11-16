'use client';

import { KnobStage } from '@playground/showcase/detail';
import { entries, inUseOf } from '@playground/showcase/entries';
import { knobDefaults } from '@playground/showcase/kit';
import { cn } from 'continuum';
import { P } from '@/components/article';
import { CodeBlock } from '@/components/code-block';
import { DefaultTheme } from '@/components/default-theme';
import { exportedFrom, type Imports, importLines, toJsx } from './to-jsx';

/*
 * The playground's previews on a site page. The server page knows only an entry's id (it reads the
 * entry files as text); these draw it from the playground's own modules, so the site and the
 * playground show the one preview. Client components, since the previews hold state.
 */

const entryOf = (id: string) => entries.find(entry => entry.id === id);

/** The entry's preview on a stage, its knobs in the panel over the corner, as the playground's page. */
export const EntryStage = ({ id }: { id: string }) => {
    const entry = entryOf(id);
    if (!entry) return null;
    const { Preview, knobs } = entry;
    return (
        // The stage stands in for the app's shell: a preview that keeps clear of the knob panel
        // where the shell is wide (Table at 720 and up) measures this, as it measures the app.
        <DefaultTheme className="@container/shell min-w-0">
            <KnobStage
                // As wide as the page's column and as the app's page draws it: the subject centred
                // on the whole stage, the knob panel floating over its corner.
                className={entry.hero}
                knobs={knobs}
                render={values => <Preview knobs={values} />}
            />
        </DefaultTheme>
    );
};

/** The piece of a product the entry is shown in: a 16:9 frame, or the app's page edge to edge. */
export const EntryInUse = ({ id }: { id: string }) => {
    const piece = inUseOf(id);
    if (!piece) return null;
    if (piece.bare) return <DefaultTheme className="min-w-0">{piece.render()}</DefaultTheme>;
    if (piece.app) {
        return (
            <DefaultTheme className="aspect-video min-w-0 overflow-hidden rounded-panel border border-neutral-200">
                {piece.render()}
            </DefaultTheme>
        );
    }
    return (
        <DefaultTheme
            className={cn(
                'flex aspect-video min-w-0 flex-col items-center justify-center rounded-panel border border-neutral-200 bg-neutral-50 p-8',
                piece.canvas && 'bg-neutral-100',
            )}
        >
            {piece.render()}
        </DefaultTheme>
    );
};

/** The in-use piece's name and what it is, as the line under the section's title. */
export const EntryInUseNote = ({ id }: { id: string }) => {
    const piece = inUseOf(id);
    if (!piece) return null;
    return (
        <P>
            <span className="font-medium text-neutral-950">{piece.title}.</span> {piece.note}
        </P>
    );
};

/** Whether an entry has an in-use piece; for a client caller that needs to know before drawing. */
export const hasInUse = (id: string) => Boolean(inUseOf(id));

/**
 * The usage code: the import line for the component's parts, then the preview's default written out.
 * `parts` are the names in the spec's heading; those the library exports make the import line when
 * the preview cannot be written out.
 */
export const EntryCode = ({ id, parts }: { id?: string; parts: readonly string[] }) => {
    const entry = id ? entryOf(id) : undefined;
    const written = entry ? toJsx(<entry.Preview knobs={knobDefaults(entry.knobs)} />) : undefined;
    // The element above is never rendered: the writer reads it, calling the preview for what it draws.
    const imports: Imports = written?.jsx ? written.imports : new Map();
    if (!written?.jsx) {
        for (const part of parts) {
            const from = exportedFrom(part);
            if (!from) continue;
            const set = imports.get(from) ?? new Set<string>();
            set.add(part);
            imports.set(from, set);
        }
    }
    const lines = importLines(imports);
    if (!lines) return null;
    return <CodeBlock code={written?.jsx ? `${lines}\n\n${written.jsx}` : lines} />;
};
