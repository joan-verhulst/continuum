import { Dock, DockItem } from 'continuum';
import { useState } from 'react';
import { Frame, FullScreen, FullScreenButton, Page, PageDock, PageHeader } from '../../layout';
import type { AppState } from '../../meta';
import { ownCorners, themeCorners } from '../../patterns';
import { ContinuumCms } from './continuum';
import { FreehandCms } from './freehand';

type Take = 'freehand' | 'continuum';

const takes: { id: Take; label: string }[] = [
    { id: 'freehand', label: 'Freehand' },
    { id: 'continuum', label: 'Continuum' },
];

/** Freehand or Continuum: the switch at the foot of the page, and in the bar of the full screen. */
const TakeDock = ({ take, onChange }: { take: Take; onChange: (take: Take) => void }) => (
    <Dock
        aria-label="Take"
        onValueChange={value => onChange(value === 'continuum' ? 'continuum' : 'freehand')}
        value={take}
    >
        {takes.map(entry => (
            <DockItem key={entry.id} value={entry.id}>
                {entry.label}
            </DockItem>
        ))}
    </Dock>
);

/**
 * One brief drawn twice, the Posts screen of a CMS: freehand, as a polished SaaS screen comes
 * out by default, and with Continuum, from its skill and library alone. Both sit at their
 * design size in the same frame, so switching between them shows only what changed; full
 * screen shows them as the app would open, at the window's own size.
 */
export const CmsTest = ({ state }: { state: AppState }) => {
    const [take, setTake] = useState<Take>('freehand');
    const [full, setFull] = useState(false);
    const screen = take === 'freehand' ? <FreehandCms /> : <ContinuumCms />;

    return (
        <Page className="gap-10" width="dense">
            <PageHeader
                aside={<FullScreenButton onOpen={() => setFull(true)} />}
                description="One brief, drawn twice: freehand, the way a polished SaaS screen comes out by default, and with Continuum, from its skill and library alone. The same Posts screen of a CMS at 1280 × 800, or full screen as the app would open; switch between them at the foot. Only the Continuum take follows the mode and the theme."
                title="CMS test"
            />
            {/* One copy at a time: the framed one steps aside while full screen holds the screen, so
                the two never both answer the keyboard. */}
            {!full && (
                <div style={ownCorners}>
                    <Frame designHeight={800}>
                        <div className="contents" style={themeCorners(state.radius)}>
                            {screen}
                        </div>
                    </Frame>
                </div>
            )}
            <PageDock>
                <TakeDock onChange={setTake} take={take} />
            </PageDock>
            {full && (
                <FullScreen
                    controls={<TakeDock onChange={setTake} take={take} />}
                    onClose={() => setFull(false)}
                >
                    {screen}
                </FullScreen>
            )}
        </Page>
    );
};
