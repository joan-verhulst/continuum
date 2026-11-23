import 'server-only';
import type { NavItem } from '@/components/page-frame';
import { charts, components } from '@/lib/content';

/*
 * The order a component's or a chart's page walks on to the next: components.md's, family by family,
 * and charts.md's for the chart kit.
 */

export const componentOrder = (): NavItem[] =>
    components().map(item => ({ href: `/components/${item.slug}`, label: item.title }));

export const chartOrder = (): NavItem[] =>
    charts().charts.map(item => ({ href: `/charts/${item.slug}`, label: item.title }));
