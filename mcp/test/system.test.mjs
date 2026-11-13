import assert from 'node:assert/strict';
import { test } from 'node:test';
import { call, flat, useServer } from './helpers.mjs';

/*
 * The system's maths and files: the spacing formula, the token set in its formats, and a theme
 * made and measured.
 */

const server = useServer();

test('get_spacing gives a text box its padding as a Tailwind step', async () => {
    const data = await call(server.client, 'get_spacing', {
        box: 'text',
        runs: [{ size: 13, lines: 2 }],
    });
    assert.match(String(data.tailwind), /^p-\d/, `Expected a p- class, got:\n${flat(data)}`);
    assert.equal(typeof data.px, 'number', `Expected the padding in px, got:\n${flat(data)}`);
    assert.equal(data.px % 2, 0, `Expected a padding on the spacing scale, got ${data.px}px`);
});

test('get_tokens as JSON holds the hairline, neutral-200', async () => {
    const data = await call(server.client, 'get_tokens', { format: 'json' });
    assert.match(
        flat(data),
        /neutral-200/,
        `Expected neutral-200 in:\n${flat(data).slice(0, 800)}`,
    );
});

test('get_tokens as DTCG writes $type and $value', async () => {
    // The files come back as JSON text inside the response, so the keys are searched as words.
    const body = flat(await call(server.client, 'get_tokens', { format: 'dtcg' }));
    assert.ok(body.includes('$type'), `Expected $type in:\n${body.slice(0, 800)}`);
    assert.ok(body.includes('$value'), `Expected $value in:\n${body.slice(0, 800)}`);
});

test('create_theme without options lists the choices', async () => {
    const data = await call(server.client, 'create_theme');
    const body = flat(data);
    assert.ok(!('appCss' in data), 'Expected the choices, not a theme, when no options are given');
    for (const option of ['accent', 'font']) {
        assert.match(
            body,
            new RegExp(option),
            `Expected the ${option} option among the choices:\n${body.slice(0, 1200)}`,
        );
    }
});

test('create_theme with an accent writes the app.css and the DESIGN.md', async () => {
    const data = await call(server.client, 'create_theme', { options: { accent: '#d97706' } });
    assert.equal(
        typeof data.appCss,
        'string',
        `Expected appCss, got keys: ${Object.keys(data).join(', ')}`,
    );
    assert.match(data.appCss, /--color-action/, 'Expected --color-action in the app.css');
    assert.equal(
        typeof data.designMd,
        'string',
        `Expected designMd, got keys: ${Object.keys(data).join(', ')}`,
    );
    assert.ok(data.designMd.length > 200, `Expected a DESIGN.md brief, got: "${data.designMd}"`);
});

test('check_theme measures the default theme’s pairs in both modes, each miss with a verdict', async () => {
    const data = await call(server.client, 'check_theme');
    for (const mode of ['light', 'dark']) {
        const result = data[mode];
        assert.ok(result, `Expected a ${mode} result, got keys: ${Object.keys(data).join(', ')}`);
        const counted = (result.pass ?? 0) + (result.fail ?? 0) + (result.advise ?? 0);
        assert.ok(
            counted > 5,
            `Expected the ${mode} pairs counted, got pass ${result.pass}, fail ${result.fail}, advise ${result.advise}`,
        );
        // A miss carries its verdict and reason; a met pair is one line.
        const misses = result.misses ?? result.pairs ?? [];
        const without = misses.filter(miss => !['pass', 'fail', 'advise'].includes(miss.verdict));
        assert.deepEqual(without, [], `Every ${mode} miss should have a verdict of fail or advise`);
        assert.equal(
            misses.length,
            (result.fail ?? 0) + (result.advise ?? 0),
            `Expected one ${mode} miss per fail and advise`,
        );
    }
    // The default theme is the one the system is drawn in: nothing it requires may fail.
    assert.equal(
        data.light.fail,
        0,
        `The default theme fails in light:\n${flat(data.light.misses)}`,
    );
});
