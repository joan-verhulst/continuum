import { notFound } from 'next/navigation';
import { twin, twins } from '../twins';

/*
 * A page's markdown twin. next.config.ts rewrites /components/button.md to /md/components/button,
 * which lands here; every twin is built at build time from the sections' routes.
 */

export const dynamic = 'force-static';
export const dynamicParams = false;

export const generateStaticParams = () =>
    twins().map(t => ({ path: t.path.split('/').filter(Boolean) }));

export const GET = async (
    _request: Request,
    { params }: { params: Promise<{ path: string[] }> },
) => {
    const { path } = await params;
    const found = twin(`/${path.join('/')}`);
    if (!found) notFound();
    return new Response(`${found.markdown().trim()}\n`, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
};
