import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { auditUi, describeFinding, fixturesDir, readJson, useServer } from './helpers.mjs';

/*
 * The composition advice on a rendered page: a page planted with each mistake in how it is laid
 * out comes back with each one named, and a tree without them with none.
 */

const server = useServer();

let id = 0;
const node = (fields, children = []) => ({ id: `n${++id}`, ...fields, children });
const text = (content, y, size = 13, weight = 400) =>
    node({
        tag: 'span',
        content,
        font: { size, weight },
        box: { x: 220, y, width: 200, height: size + 6 },
    });
const card = (x, y, width, height, children) =>
    node(
        {
            tag: 'div',
            box: { x, y, width, height, radius: 16 },
            border: { width: 1, color: '#e5e5e5' },
        },
        children,
    );
const stat = (x, height) =>
    card(x, 420, 320, height, [text('Revenue', 440), text('€4,800', 460, 22, 500)]);
const row = (y, cells) =>
    node(
        { tag: 'tr', role: 'row', box: { x: 220, y, width: 1000, height: 40 } },
        cells.map(cell =>
            node({
                tag: 'td',
                role: 'cell',
                content: cell,
                box: { x: 220, y, width: 300, height: 40 },
            }),
        ),
    );

const planted = () =>
    node({ tag: 'body', box: { x: 0, y: 0, width: 1440, height: 1800 } }, [
        node({ tag: 'div', name: 'column', box: { x: 200, y: 0, width: 1040, height: 1800 } }, [
            text('Orders', 40, 24, 500),
            node({ tag: 'svg', box: { x: 220, y: 120, width: 1000, height: 260 } }),
            node({ tag: 'div', box: { x: 220, y: 420, width: 1000, height: 140 } }, [
                stat(220, 120),
                stat(560, 140),
                stat(900, 120),
            ]),
            text('Recent orders', 620, 16, 500),
            card(220, 660, 1000, 200, [
                text('Details', 680, 16, 500),
                node(
                    {
                        tag: 'table',
                        role: 'table',
                        box: { x: 220, y: 720, width: 1000, height: 120 },
                    },
                    [
                        row(720, ['A-1', 'Maya', '€40']),
                        row(760, ['A-2', 'Tomás', '€12']),
                        row(800, ['A-3', 'Priya', '€90']),
                    ],
                ),
            ]),
        ]),
    ]);

test('audit_ui names each mistake in how a rendered page is composed', async () => {
    const findings = await auditUi(server.client, { tree: planted(), medium: 'react' });
    const rules = new Set(findings.map(finding => finding.rule));
    for (const rule of ['figures-first', 'end-level', 'section-titles', 'table-head', 'page-width'])
        assert.ok(
            rules.has(rule),
            `Expected a '${rule}' finding, got:\n${findings.map(describeFinding).join('\n')}`,
        );
    for (const finding of findings.filter(each => rules.has(each.rule) && each.rule !== 'weights'))
        if (
            ['figures-first', 'end-level', 'section-titles', 'table-head', 'page-width'].includes(
                finding.rule,
            )
        )
            assert.equal(finding.severity, 'advise', `${finding.rule} is advice, never a fix`);
});

test('audit_ui gives no composition advice on the clean tree', async () => {
    const tree = await readJson(join(fixturesDir, 'snapshot/clean.json'));
    const findings = await auditUi(server.client, { tree, medium: 'html' });
    const composed = findings.filter(finding =>
        [
            'side-panel',
            'one-column',
            'figures-first',
            'end-level',
            'section-titles',
            'table-head',
            'long-list',
            'page-width',
        ].includes(finding.rule),
    );
    assert.equal(composed.length, 0, composed.map(describeFinding).join('\n'));
});
