'use client';

import { ThemePreview } from '@playground/theme-editor/preview';
import { useMode } from '@/components/mode';

/*
 * The theme builder's preview of a product page in the default theme, as the builder opens on it,
 * in the site's mode: the index's look at the builder.
 */
export const ThemeFigure = () => {
    const { mode } = useMode();
    return <ThemePreview className="min-h-0 w-full flex-1" mode={mode} />;
};
