import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import {
    assertFound,
    auditSource,
    auditUi,
    describeFinding,
    fixturesDir,
    mcpDir,
    readJson,
    useServer,
} from './helpers.mjs';

/*
 * The audits against planted mistakes. Each fixture is a screen in some stack with realistic
 * mistakes in it, and fixtures/expected/<name>.json lists them: where each sits, the kind of
 * mistake (the engine's rule) and what Continuum wants there. The stacks are examples, not
 * targets: React, Angular, HTML and QSS were the first ones; Svelte, styled-components, QML,
 * Compose, Dear ImGui and Vue are here to prove the standard holds for stacks no code names, and a
 * list of facts stands for any tool that reads its own UI. Every fixture runs the same way; a
 * failure lists the mistakes missed beside everything the audit did report. Then the other side:
 * a tree in Continuum's own values must come back with nothing to fix, and the reference screens
 * with almost nothing.
 */

const server = useServer();

const expectedDir = join(fixturesDir, 'expected');
const plans = await Promise.all(
    (await readdir(expectedDir))
        .filter(file => file.endsWith('.json'))
        .sort()
        .map(async file => ({ file, ...(await readJson(join(expectedDir, file))) })),
);

const fixture = path => path && readJson(join(fixturesDir, path));

/** Runs the audit a plan names over its fixture, and returns the findings. */
const auditPlan = async plan => {
    if (plan.tool === 'audit_source') {
        return auditSource(
            server.client,
            plan.paths.map(path => join(fixturesDir, path)),
            plan.medium,
        );
    }
    return auditUi(server.client, {
        tree: await fixture(plan.tree),
        styles: await fixture(plan.styles),
        facts: await fixture(plan.facts),
        medium: plan.medium,
    });
};

const placeOf = plan => plan.paths?.join(', ') ?? plan.tree ?? plan.styles ?? plan.facts;

for (const plan of plans) {
    test(`${plan.tool} finds what was planted in ${plan.title ?? plan.file}`, async t => {
        // What the fixture says the audit is not expected to read: said, not asserted.
        for (const limit of plan.knownLimits ?? []) t.diagnostic(`known limit: ${limit}`);
        const findings = await auditPlan(plan);
        assertFound(`${plan.tool} on ${placeOf(plan)}`, plan.mistakes, findings);
        // Values planted right beside the mistakes, in the system's own values: nothing to fix there.
        const alarms = (plan.clean ?? []).flatMap(clean =>
            findings.filter(
                finding =>
                    finding.severity === 'fix' &&
                    String(finding.at ?? '') === clean.at &&
                    finding.property === clean.property,
            ),
        );
        assert.equal(
            alarms.length,
            0,
            `${plan.tool} on ${placeOf(plan)} flagged values already in the system:\n${alarms.map(describeFinding).join('\n')}`,
        );
    });
}

test('audit_ui has nothing to fix in a tree drawn in Continuum’s own values', async () => {
    const tree = await readJson(join(fixturesDir, 'snapshot/clean.json'));
    const findings = await auditUi(server.client, { tree, medium: 'html' });
    const fixes = findings.filter(finding => finding.severity === 'fix');
    assert.equal(
        fixes.length,
        0,
        `Expected no 'fix' findings on the clean tree, got ${fixes.length}:\n${fixes.map(describeFinding).join('\n')}`,
    );
});

test('audit_source raises few false alarms on the reference screens', async () => {
    const screens = join(mcpDir, '../playground/src/screens');
    const findings = await auditSource(server.client, [screens], 'react');
    const sure = findings.filter(
        finding => finding.severity === 'fix' && finding.confidence === 'high',
    );
    // Printed whatever the outcome, so a person can judge each one: a real slip in a screen, or a
    // rule that reads too much.
    console.log(
        `audit_source on the reference screens: ${findings.length} findings, ${sure.length} high-confidence fixes\n${sure.map(describeFinding).join('\n')}`,
    );
    assert.ok(
        sure.length <= 5,
        `Expected at most 5 high-confidence fixes on the reference screens, got ${sure.length}:\n${sure.map(describeFinding).join('\n')}`,
    );
});
