import 'server-only';
import type { LinkRow } from '@/components/link-list';
import type { GalleryItem } from '@/components/preview/gallery';
import { chartsWithEntries, componentsWithEntries } from '@/lib/content';

/**
 * Rows that lead to components or charts, as the components gallery's cards: each with the
 * showcase entry that draws it, so a docs page lists its parts as the gallery shows them.
 */
export const componentCards = (rows: readonly LinkRow[]): GalleryItem[] => {
    const entryByHref = new Map<string, string | undefined>([
        ...componentsWithEntries().map(
            item => [`/components/${item.slug}`, item.entries[0]?.id] as const,
        ),
        ...chartsWithEntries().map(item => [`/charts/${item.slug}`, item.entries[0]?.id] as const),
    ]);
    return rows.map(row => ({
        href: row.href,
        name: String(row.title),
        summary: String(row.description),
        entry: entryByHref.get(row.href),
    }));
};
