import assert from 'node:assert/strict';
import { test } from 'node:test';
import { call, callRaw, flat, has, namesIn, textOf, useServer } from './helpers.mjs';

/*
 * The lookups an agent builds from: the parts, the patterns, the page kinds and the values, each
 * answered from the skill's own markdown.
 */

const server = useServer();

test('list_components names the library’s parts', async () => {
    const names = namesIn(await call(server.client, 'list_components'));
    for (const part of ['Button', 'Table', 'Dialog']) {
        assert.ok(
            names.includes(part),
            `Expected ${part} among the components, got: ${names.join(', ')}`,
        );
    }
});

test('get_component gives the Button’s spec in React, with its height and its import', async () => {
    const body = flat(
        await call(server.client, 'get_component', { name: 'Button', medium: 'react' }),
    );
    has(body, /\b34\b/, `Expected the Button's 34 height in:\n${body.slice(0, 1500)}`);
    has(
        body,
        /from ['"]continuum['"]/,
        `Expected an import from 'continuum' in:\n${body.slice(0, 1500)}`,
    );
});

test('get_component reads a common name as the part it means: a modal is a Dialog', async () => {
    const body = flat(await call(server.client, 'get_component', { name: 'modal' }));
    has(body, /\bDialog\b/, `Expected 'modal' to resolve to Dialog, got:\n${body.slice(0, 800)}`);
});

test('an unknown component is a tool error that points at list_components', async () => {
    const result = await callRaw(server.client, 'get_component', { name: 'Flibbertigibbet' });
    const body = textOf(result);
    assert.equal(result.isError, true, `Expected an error, got:\n${body.slice(0, 400)}`);
    has(body, /list_components/, `Expected the error to name list_components:\n${body}`);
});

test('find_pattern answers a filter bar with the Filters row', async () => {
    const body = flat(await call(server.client, 'find_pattern', { need: 'filter bar' }));
    has(body, /Filters/, `Expected the Filters pattern, got:\n${body.slice(0, 1200)}`);
});

test('get_page_kind reads a dashboard as the Overview and gives its anatomy', async () => {
    const body = flat(await call(server.client, 'get_page_kind', { kind: 'dashboard' }));
    has(body, /Overview/, `Expected the Overview kind, got:\n${body.slice(0, 1200)}`);
    has(
        body,
        /[Ss]tat cards/,
        `Expected the Overview's anatomy (stat cards), got:\n${body.slice(0, 1200)}`,
    );
});

test('get_foundation gives the radius scale: 6, 10, 12, 16, 20', async () => {
    const body = flat(await call(server.client, 'get_foundation', { topic: 'radius' }));
    const missing = ['6', '10', '12', '16', '20'].filter(
        px => !new RegExp(`\\b${px}(px)?\\b`).test(body),
    );
    assert.deepEqual(missing, [], `Expected every radius in:\n${body.slice(0, 1500)}`);
});

test('an unknown foundation topic is a tool error that lists the topics', async () => {
    const result = await callRaw(server.client, 'get_foundation', { topic: 'astrology' });
    assert.equal(result.isError, true, `Expected an error, got:\n${textOf(result).slice(0, 400)}`);
    has(textOf(result), /radius/i, `Expected the error to list the topics:\n${textOf(result)}`);
});
