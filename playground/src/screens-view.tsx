import {
    Badge,
    SegmentedControl,
    SegmentedControlItem,
    Theme,
    useTheme,
} from 'personal-design-system';
import { useState } from 'react';
import { PageHeader } from './layout';
import { themeMeta } from './meta';
import { screens } from './screens';

type ScreensViewProps = {
    screenId?: string;
    onScreenChange: (id: string) => void;
};

export const ScreensView = ({ screenId, onScreenChange }: ScreensViewProps) => {
    const picked = useTheme();
    const [source, setSource] = useState<'own' | 'picked'>('own');
    const current = screens.find(screen => screen.id === screenId) ?? screens[0];
    const own = current ? themeMeta[current.theme] : undefined;
    const theme = source === 'own' && current ? current.theme : picked.theme;
    const mode = source === 'own' && current ? current.mode : picked.mode;
    const shown = themeMeta[theme];

    return (
        <>
            <PageHeader
                description="Screens from the original Figma files, rebuilt from the system's components alone. Each opens in the theme it was drawn in; show it in the theme picked at the top to see the same screen as another product."
                eyebrow="Screens"
                title="In context"
            />
            {current ? (
                <div className="flex flex-col gap-4 p-4 lg:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="max-w-full overflow-x-auto">
                            <SegmentedControl
                                aria-label="Screen"
                                onValueChange={onScreenChange}
                                value={current.id}
                            >
                                {screens.map(screen => (
                                    <SegmentedControlItem key={screen.id} value={screen.id}>
                                        {screen.title}
                                    </SegmentedControlItem>
                                ))}
                            </SegmentedControl>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="dot">
                                {shown.name} · {shown.year} · {mode}
                            </Badge>
                            <SegmentedControl
                                aria-label="Theme for the screen"
                                onValueChange={value =>
                                    setSource(value === 'picked' ? 'picked' : 'own')
                                }
                                value={source}
                            >
                                <SegmentedControlItem value="own">
                                    Its own ({own?.name})
                                </SegmentedControlItem>
                                <SegmentedControlItem value="picked">
                                    Picked ({themeMeta[picked.theme].name})
                                </SegmentedControlItem>
                            </SegmentedControl>
                        </div>
                    </div>
                    <div
                        className="h-[calc(100dvh-148px)] min-h-[560px] overflow-auto rounded-card border border-neutral-200"
                        data-screen-frame
                    >
                        <Theme className="h-full" key={current.id} mode={mode} theme={theme}>
                            {current.render()}
                        </Theme>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 px-6 py-24 text-center">
                    <span className="font-medium text-neutral-950 text-sm">No screens yet</span>
                    <span className="max-w-sm text-neutral-600 text-xs">
                        Screens rebuilt from the Figma files will show up here.
                    </span>
                </div>
            )}
        </>
    );
};
