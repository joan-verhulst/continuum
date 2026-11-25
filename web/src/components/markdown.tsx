import { cn } from '@contui/ui';
import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import { C, column } from './article';
import { CodeBlock } from './code-block';

/*
 * The references' markdown, drawn in the docs' article parts. Enough of markdown for what the skill
 * writes: paragraphs, lists, tables, fenced code, and inline code, bold, italics and links. It
 * returns its blocks as siblings, so inside an ArticleSection they take the section's flow (the
 * reading column, a paragraph's spacing, a figure's room).
 *
 *     <ArticleSection id={section.slug} title={plainText(section.title)}>
 *         <Markdown source={section.body} />
 *     </ArticleSection>
 */

/* ---------- Inline ---------- */

const inlinePattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)]+\))/g;

/** A link: within the site through next/link, elsewhere in a new tab. A .md link to a reference is dropped to its text. */
const InlineLink = ({ href, children }: { href: string; children: ReactNode }) => {
    const className =
        'text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950';
    if (href.startsWith('/')) {
        return (
            <Link className={className} href={href}>
                {children}
            </Link>
        );
    }
    if (/^https?:/.test(href)) {
        return (
            <a className={className} href={href} rel="noreferrer" target="_blank">
                {children}
            </a>
        );
    }
    return <>{children}</>;
};

/** Inline markdown to React: `code`, **bold**, *italics*, [links](…). */
export const Inline = ({ text }: { text: string }) => {
    const out: ReactNode[] = [];
    let last = 0;
    for (const match of text.matchAll(inlinePattern)) {
        const index = match.index ?? 0;
        if (index > last) out.push(text.slice(last, index));
        const [token] = match;
        const key = `${index}`;
        if (match[1]) out.push(<C key={key}>{token.slice(1, -1)}</C>);
        else if (match[2]) {
            out.push(
                <strong className="font-medium text-neutral-950" key={key}>
                    <Inline text={token.slice(2, -2)} />
                </strong>,
            );
        } else if (match[3]) {
            out.push(
                <em key={key}>
                    <Inline text={token.slice(1, -1)} />
                </em>,
            );
        } else if (match[4]) {
            const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
            out.push(
                <InlineLink href={link?.[2] ?? ''} key={key}>
                    <Inline text={link?.[1] ?? ''} />
                </InlineLink>,
            );
        }
        last = index + token.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return <>{out}</>;
};

/* ---------- Blocks ---------- */

type Block =
    | { kind: 'p'; text: string }
    | { kind: 'ul' | 'ol'; items: string[] }
    | { kind: 'table'; head: string[]; rows: string[][] }
    | { kind: 'code'; code: string; lang: string }
    | { kind: 'h'; text: string };

const cellsOf = (line: string) =>
    line
        .trim()
        .replace(/^\||\|$/g, '')
        .split(/(?<!\\)\|/)
        .map(cell => cell.trim().replace(/\\\|/g, '|'));

/** Splits markdown into blocks. */
const blocksOf = (source: string): Block[] => {
    const lines = source.replace(/\r\n/g, '\n').split('\n');
    const blocks: Block[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i] ?? '';
        if (!line.trim()) {
            i++;
            continue;
        }
        const fence = /^\s*(```|~~~)\s*(\S*)/.exec(line);
        if (fence) {
            const code: string[] = [];
            i++;
            while (i < lines.length && !(lines[i] ?? '').trim().startsWith(fence[1] ?? '```')) {
                code.push(lines[i] ?? '');
                i++;
            }
            i++;
            blocks.push({ kind: 'code', code: code.join('\n'), lang: fence[2] ?? '' });
            continue;
        }
        if (/^#{1,6}\s/.test(line)) {
            blocks.push({ kind: 'h', text: line.replace(/^#+\s*/, '') });
            i++;
            continue;
        }
        if (line.trim().startsWith('|')) {
            const rows: string[][] = [];
            while (i < lines.length && (lines[i] ?? '').trim().startsWith('|')) {
                const cells = cellsOf(lines[i] ?? '');
                // The rule under the head row.
                if (!cells.every(cell => /^:?-+:?$/.test(cell))) rows.push(cells);
                i++;
            }
            blocks.push({ kind: 'table', head: rows[0] ?? [], rows: rows.slice(1) });
            continue;
        }
        const bullet = /^(\s*)([-*]|\d+\.)\s+/.exec(line);
        if (bullet) {
            const ordered = /\d/.test(bullet[2] ?? '');
            const items: string[] = [];
            while (i < lines.length) {
                const current = lines[i] ?? '';
                const item = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(current);
                if (item) items.push(item[2] ?? '');
                // A wrapped line of the item above.
                else if (current.trim() && /^\s+/.test(current) && items.length) {
                    items[items.length - 1] += ` ${current.trim()}`;
                } else break;
                i++;
            }
            blocks.push({ kind: ordered ? 'ol' : 'ul', items });
            continue;
        }
        const paragraph: string[] = [];
        while (
            i < lines.length &&
            (lines[i] ?? '').trim() &&
            !/^\s*(```|~~~|\||#{1,6}\s|[-*]\s|\d+\.\s)/.test(lines[i] ?? '')
        ) {
            paragraph.push((lines[i] ?? '').trim());
            i++;
        }
        blocks.push({ kind: 'p', text: paragraph.join(' ') });
    }
    return blocks;
};

/** The landing's body: its leads' grey 16px, line height 1.6. */
const prose = 'text-base text-neutral-600 leading-[1.6]';

/** One block, in the reading column (a table may run wider, to the figure's width). */
const BlockView = ({ block }: { block: Block }) => {
    switch (block.kind) {
        case 'p':
            return (
                <p className={cn(column, prose)}>
                    <Inline text={block.text} />
                </p>
            );
        case 'h':
            return (
                <h3
                    className={cn(
                        column,
                        'font-medium text-lg text-neutral-950 leading-snug tracking-[-0.01em]',
                    )}
                >
                    <Inline text={block.text} />
                </h3>
            );
        case 'ul':
        case 'ol': {
            const List = block.kind;
            return (
                <List
                    className={cn(
                        column,
                        prose,
                        'flow-text flex flex-col gap-2 pl-5',
                        block.kind === 'ul' ? 'list-disc' : 'list-decimal',
                        'marker:text-neutral-400',
                    )}
                >
                    {block.items.map((item, index) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: a list's items never move
                        <li key={index}>
                            <Inline text={item} />
                        </li>
                    ))}
                </List>
            );
        }
        case 'code':
            return <CodeBlock code={block.code} />;
        case 'table':
            return (
                <div className="mx-auto w-full min-w-0 max-w-content overflow-x-auto rounded-control border border-neutral-200 bg-neutral-50">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead className="bg-neutral-100 text-neutral-600">
                            <tr>
                                {block.head.map((cell, index) => (
                                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed columns
                                    <th className="h-table-row px-3 font-normal" key={index}>
                                        <Inline text={cell} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 border-neutral-200 border-t">
                            {block.rows.map((row, r) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: fixed rows
                                <tr key={r}>
                                    {row.map((cell, c) => (
                                        <td
                                            className={cn(
                                                'px-3 py-3 align-top leading-relaxed',
                                                c === 0
                                                    ? 'font-medium text-neutral-900'
                                                    : 'text-neutral-700',
                                            )}
                                            // biome-ignore lint/suspicious/noArrayIndexKey: fixed columns
                                            key={c}
                                        >
                                            <Inline text={cell} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
    }
};

/** Markdown as the docs' blocks, siblings in the caller's flow. */
export const Markdown = ({ source }: { source: string }) => (
    <>
        {blocksOf(source).map((block, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: blocks of a fixed source
            <Fragment key={index}>
                <BlockView block={block} />
            </Fragment>
        ))}
    </>
);
