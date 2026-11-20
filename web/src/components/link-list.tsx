import type { ReactNode } from 'react';
import { column } from '@/components/article';
import { CardGrid, LinkCard } from '@/components/page-frame';

/*
 * Pages a page leads on to (the parts an example is built from, the examples a component is used in)
 * as the site's cards: two across, each a name over one line of what it is, the card the link. They
 * keep to the article's reading column, so they share the text's edges.
 */

export type LinkRow = { href: string; title: ReactNode; meta?: ReactNode; description: ReactNode };

export const LinkList = ({ rows }: { rows: readonly LinkRow[] }) => (
    <CardGrid className={column} columns={2}>
        {rows.map((row, index) => (
            <LinkCard
                delay={index % 2}
                description={row.description}
                href={row.href}
                key={row.href}
                meta={row.meta}
                title={row.title}
            />
        ))}
    </CardGrid>
);
