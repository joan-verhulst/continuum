import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { test } from 'node:test';
import { fixturesDir, matchMistakes, readJson } from './helpers.mjs';

/*
 * The fixtures checked on their own, without a server: every planted mistake points at a line
 * that is there and names a rule the engine has, so a failing audit test is about the audit and
 * never about a fixture that drifted. And the matcher checked on findings made up for it.
 */

/** The engine's rules: the value rules, then the ones that read the tree. No stack names here. */
const rules = new Set([
    'colour',
    'text-tone',
    'type-size',
    'weight',
    'height',
    'radius',
    'spacing',
    'border-width',
    'shadow',
    'font-family',
    'component',
    'concentric',
    'one-primary',
    'dividers',
    'nested-containers',
    'views-in-dock',
    'page-title',
    'weights',
]);

const list = value => (Array.isArray(value) ? value : [value]);

const expectedDir = join(fixturesDir, 'expected');
const plans = await Promise.all(
    (await readdir(expectedDir))
        .filter(file => file.endsWith('.json'))
        .sort()
        .map(async file => ({ file, ...(await readJson(join(expectedDir, file))) })),
);

for (const plan of plans) {
    test(`fixture ${plan.file} points every mistake at something that is there`, async () => {
        const problems = [];
        assert.ok(
            ['audit_source', 'audit_ui'].includes(plan.tool),
            `${plan.file}: unknown tool ${plan.tool}`,
        );
        assert.ok(plan.mistakes.length >= 3, `${plan.file}: plant at least three mistakes`);
        // The lines of each source file, by its name, to check 'file:line' against.
        const lines = new Map();
        for (const path of plan.paths ?? []) {
            lines.set(
                basename(path),
                (await readFile(join(fixturesDir, path), 'utf8')).split(/\r?\n/),
            );
        }
        const ids = new Set();
        if (plan.facts)
            for (const fact of await readJson(join(fixturesDir, plan.facts))) ids.add(fact.at);
        for (const mistake of plan.mistakes) {
            if (!list(mistake.rule).some(rule => rules.has(rule))) {
                problems.push(
                    `${mistake.what}: no engine rule among ${list(mistake.rule).join(', ')}`,
                );
            }
            if (list(mistake.expectedIncludes ?? []).length === 0)
                problems.push(`${mistake.what}: no expected value`);
            for (const at of list(mistake.at)) {
                const place = /^(.+):(\d+)$/.exec(at);
                if (plan.tool === 'audit_source') {
                    // 'component.scss:14' names the end of a file's name, as findings may carry a longer path.
                    const file = place && [...lines.keys()].find(name => name.endsWith(place[1]));
                    const text = file && lines.get(file)[Number(place[2]) - 1];
                    if (!text?.trim())
                        problems.push(
                            `${mistake.what}: ${at} is not a written line of ${plan.paths.join(', ')}`,
                        );
                } else if (plan.facts && !ids.has(at)) {
                    problems.push(`${mistake.what}: no fact at ${at}`);
                }
            }
        }
        assert.deepEqual(problems, [], `${plan.file}:\n${problems.join('\n')}`);
    });
}

test('the facts fixture is a list of facts in CSS terms, as another tool would hand them', async () => {
    const facts = await readJson(join(fixturesDir, 'facts/figma-export.json'));
    for (const fact of facts) {
        assert.match(
            fact.property,
            /^[a-z]+(-[a-z]+)*$/,
            `Expected a kebab-case CSS property, got ${fact.property}`,
        );
        assert.equal(fact.written?.form, 'rendered', `Expected form 'rendered' at ${fact.at}`);
        assert.equal(typeof fact.value, 'string', `Expected the value as CSS text at ${fact.at}`);
        assert.ok(fact.subject?.kind, `Expected a subject kind at ${fact.at}`);
    }
});

test('the matcher counts one finding for one mistake, unless it names several lines', () => {
    const border = {
        what: '2px border',
        rule: 'border-width',
        at: 'a.css:4',
        expectedIncludes: ['1px'],
    };
    const colour = {
        what: 'border colour',
        rule: 'colour',
        at: 'a.css:4',
        expectedIncludes: ['neutral-200', 'hairline'],
    };
    const colourOnly = [
        { rule: 'colour', at: 'a.css:4', expected: 'neutral-200 (hairline), 1px', severity: 'fix' },
    ];
    // Both mistakes would accept the colour finding (its proposal says 1px), but it answers one.
    assert.equal(matchMistakes([border, colour], colourOnly).filter(Boolean).length, 1);
    const both = [...colourOnly, { rule: 'border-width', at: 'a.css:4', expected: '1px' }];
    assert.equal(matchMistakes([border, colour], both).filter(Boolean).length, 2);
    // The same weight on two lines, reported once: each line's mistake is answered.
    const weights = [14, 43].map(line => ({
        what: '600',
        rule: 'weight',
        at: `b.scss:${line}`,
        expectedIncludes: ['500'],
    }));
    const merged = [{ rule: 'weight', at: 'src/b.scss:14,43', expected: '500' }];
    assert.equal(matchMistakes(weights, merged).filter(Boolean).length, 2);
    // A place is a whole line number: 'b.scss:1' is not 'b.scss:14'.
    const first = { what: 'x', rule: 'weight', at: 'b.scss:1', expectedIncludes: ['500'] };
    assert.equal(
        matchMistakes([first], [{ rule: 'weight', at: 'b.scss:14', expected: '500' }])[0],
        undefined,
    );
});
