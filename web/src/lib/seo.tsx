import type { Metadata } from 'next';
import { absolute, brand, indexable, siteUrl, tagline } from './site';

/*
 * Search and answer engines. Every page exports its metadata through `pageMetadata`, so each has a
 * unique title and description, a canonical URL, Open Graph, and the robots line the environment
 * allows (noindex everywhere until NEXT_PUBLIC_INDEXABLE is 'true'). Structured data goes in the
 * page as a <JsonLd> built from one of the helpers below.
 *
 *     export const metadata = pageMetadata({
 *         title: 'Button',
 *         description: 'A button in Continuum: one label size at two heights …',
 *         path: '/components/button',
 *     });
 *
 * For a dynamic route, return the same from `generateMetadata`.
 */

/** What robots may do, by the environment: everything once the domain is attached, nothing before. */
export const robots: Metadata['robots'] = indexable
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };

export type PageMetadataInput = {
    /** The page's own title, without the brand: the layout's template adds "· Continuum". */
    title: string;
    /** One or two plain sentences: what the page is and when to read it. Unique per page. */
    description: string;
    /** The page's path from the site's root, starting with '/'. */
    path: string;
    /** Open Graph's type: 'article' for a docs page, 'website' for a landing. */
    type?: 'website' | 'article';
    /** Sets the title as is, without the brand's template (the home page). */
    absoluteTitle?: boolean;
};

/** A page's Next metadata: title, description, canonical, Open Graph, Twitter and robots. */
export const pageMetadata = ({
    title,
    description,
    path,
    type = 'article',
    absoluteTitle = false,
}: PageMetadataInput): Metadata => {
    const url = absolute(path);
    const fullTitle = absoluteTitle ? title : `${title} · ${brand.name}`;
    return {
        title: absoluteTitle ? { absolute: title } : title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title: fullTitle,
            description,
            url,
            siteName: brand.name,
            type,
            locale: 'en_GB',
        },
        twitter: { card: 'summary_large_image', title: fullTitle, description },
        robots,
    };
};

/** The defaults the root layout sets, under every page's own. */
export const rootMetadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: `${brand.name}: a design system for tool UI`,
        template: `%s · ${brand.name}`,
    },
    description: tagline,
    applicationName: brand.name,
    robots,
    openGraph: { siteName: brand.name, type: 'website', locale: 'en_GB' },
};

/* ---------- Structured data ---------- */

type Thing = Record<string, unknown>;

/** Writes structured data into the page, as one <script type="application/ld+json">. */
export const JsonLd = ({ data }: { data: Thing | Thing[] }) => (
    <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is data the page builds itself
        dangerouslySetInnerHTML={{
            // `<` escaped, so a string holding </script> cannot close the tag.
            __html: JSON.stringify(data).replace(/</g, '\u003c'),
        }}
        type="application/ld+json"
    />
);

/** A question and its answer, for an FAQ section and its FAQPage data. */
export type Faq = { question: string; answer: string };

/** FAQPage: the questions on a tool or AI page, with their plain-text answers. */
export const faqPageLd = (faqs: readonly Faq[]): Thing => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
});

/** One step of a trail: its name and its path ('/components'). */
export type Crumb = { name: string; path: string };

/** BreadcrumbList: the trail from home to the page, as the breadcrumb at its top shows it. */
export const breadcrumbLd = (crumbs: readonly Crumb[]): Thing => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: absolute(crumb.path),
    })),
});

/** TechArticle: a docs page (a component, a foundation, a pattern, an install guide). */
export const techArticleLd = ({
    headline,
    description,
    path,
}: {
    headline: string;
    description: string;
    path: string;
}): Thing => ({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    url: absolute(path),
    inLanguage: 'en-GB',
    isPartOf: { '@type': 'WebSite', name: brand.name, url: siteUrl },
});

/** A software product, with an offer when it has a standalone price. */
export const softwareApplicationLd = ({
    name,
    description,
    path,
    category = 'DesignApplication',
    priceEUR,
}: {
    name: string;
    description: string;
    path: string;
    category?: string;
    priceEUR?: number;
}): Thing => ({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url: absolute(path),
    applicationCategory: category,
    operatingSystem: 'Any (web browser)',
    ...(priceEUR !== undefined && {
        offers: { '@type': 'Offer', price: String(priceEUR), priceCurrency: 'EUR' },
    }),
});

/** WebApplication: a free tool that runs in the browser (the tools under /tools). */
export const webApplicationLd = ({
    name,
    description,
    path,
    keywords,
}: {
    name: string;
    description: string;
    path: string;
    keywords?: readonly string[];
}): Thing => ({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: absolute(path),
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    ...(keywords?.length ? { keywords: keywords.join(', ') } : {}),
    publisher: { '@type': 'Organization', name: brand.name, url: siteUrl },
});

/* ---------- Markdown twins ---------- */

/*
 * Every content page has a markdown twin at its path plus '.md' (src/app/md), for agents and answer
 * engines that read text. The page points at it with <link rel="alternate" type="text/markdown">:
 * PageHero (components/page-frame) draws that link for every page it heads, so a page with one
 * needs nothing more. A page without one renders <MarkdownAlternate path="…" />, or puts
 * `markdownAlternates(path)` in its metadata's `alternates`.
 */

/** The twin's path for a page's ('/components/button' → '/components/button.md'). */
export const markdownPath = (path: string) => `${path.replace(/\/+$/, '') || '/index'}.md`;

/** The twin as metadata alternates: `alternates: { canonical, ...markdownAlternates(path) }`. */
export const markdownAlternates = (path: string): NonNullable<Metadata['alternates']> => ({
    types: { 'text/markdown': absolute(markdownPath(path)) },
});

/** The twin's link; React places it in <head> wherever it renders. */
export const MarkdownAlternate = ({ path }: { path: string }) => (
    <link href={absolute(markdownPath(path))} rel="alternate" type="text/markdown" />
);
