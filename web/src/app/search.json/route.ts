import { twins } from '../md/twins';

/*
 * /search.json: the site search's index, every page the site builds with its title, its section and
 * its one line, from the same list as llms.txt and the markdown twins. Built once, fetched by the
 * search the first time it opens, so no page carries it.
 */

export const dynamic = 'force-static';

export type SearchEntry = { path: string; title: string; summary: string; group: string };

export const GET = () =>
    Response.json(
        twins().map(
            (twin): SearchEntry => ({
                path: twin.path,
                title: twin.title,
                summary: twin.summary,
                group: twin.group,
            }),
        ),
    );
