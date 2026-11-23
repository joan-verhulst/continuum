'use client';

import { foundations, TypeRow, typeScale } from '@playground/foundations';
import { entries } from '@playground/showcase/entries';
import { DefaultTheme } from '@/components/default-theme';
import { Preview, Scaled } from '@/components/preview/gallery';

/*
 * What the header's foldout shows for the pick under the pointer: the thing itself, live, drawn as
 * the components gallery draws it (a showcase entry, or a foundation's specimen on its stage, at its
 * defaults, scaled to the well). Its own module, loaded when a foldout first opens, so the header
 * does not carry the playground on every page.
 */

const byId = new Map(entries.map(entry => [entry.id, entry]));

/** The type scale's first sizes, measured off the page, as the Type page opens on. */
const TypeRows = () => (
    <Scaled width={520}>
        <DefaultTheme className="size-full">
            <div className="flex size-full flex-col justify-center bg-neutral-100 p-6">
                <div className="flex flex-col overflow-hidden rounded-card border border-neutral-200 bg-neutral-50">
                    {typeScale.slice(0, 5).map(row => (
                        <TypeRow key={row.name} {...row} />
                    ))}
                </div>
            </div>
        </DefaultTheme>
    </Scaled>
);

/** A visual by its key: 'type', a foundation's id ('f-colour') or a showcase entry's ('button'). */
export const HeaderPreview = ({ visual }: { visual: string }) => {
    if (visual === 'type') return <TypeRows />;
    const foundation = foundations.find(item => item.id === visual);
    if (foundation?.Stage)
        return <Preview entry={{ Preview: foundation.Stage, knobs: foundation.knobs, span: 2 }} />;
    const entry = byId.get(visual);
    return entry ? <Preview entry={entry} /> : null;
};
