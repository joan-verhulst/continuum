import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const pageContentVariants = cva(
    // Content-box, so the cap is the content's width and the side padding sits outside it. A page
    // starts well clear of the header bar: 96px, 128px on a large screen.
    'mx-auto box-content min-w-0 px-4 pt-24 sm:px-6 2xl:pt-32',
    {
        variants: {
            width: {
                /** 640: one object made or edited, its fields stacked: a new post, a new customer. */
                narrow: 'max-w-content-narrow',
                /** 896: settings, overviews, details; rows of inputs or light content. */
                default: 'max-w-content',
                /** 1080: content that needs the width, like a list with several columns. */
                wide: 'max-w-content-wide',
                /** 1280: a very dense table. */
                dense: 'max-w-content-dense',
                /** Lots of information, several dense tables: the panel less 64px a side, 128px on the largest screens. */
                inset: 'lg:px-16 2xl:px-content-inset',
                /** Only when asked for: the panel's whole width, edge to edge. */
                full: 'px-0 sm:px-0',
            },
        },
        defaultVariants: { width: 'default' },
    },
);

export type PageContentProps = ComponentProps<'div'> & VariantProps<typeof pageContentVariants>;

/**
 * The centred column a page's content sits in. Its width follows how dense the
 * content is, not the screen: a page never runs to the panel's edges.
 */
export const PageContent = ({ width, className, ...props }: PageContentProps) => (
    <div
        className={cn(pageContentVariants({ width }), className)}
        data-slot="page-content"
        data-width={width ?? 'default'}
        {...props}
    />
);
