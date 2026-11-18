// Gathers every run's result.json (and score.json, when judged) into one summary: runs/<date>/summary.json and
// summary.md. Usage: node labs/evals/harness/aggregate.mjs [runs dir]
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(
    process.argv[2] ?? join(import.meta.dirname, '../../../../continuum-evals/runs/2026-11-18'),
);
const runs = readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(dir, entry.name, 'result.json')))
    .map(entry => {
        const run = JSON.parse(readFileSync(join(dir, entry.name, 'result.json'), 'utf8'));
        const score = join(dir, entry.name, 'score.json');
        if (existsSync(score)) run.score = JSON.parse(readFileSync(score, 'utf8'));
        return run;
    });

const mcpCalls = tools =>
    Object.entries(tools ?? {})
        .filter(([name]) => name.startsWith('mcp__'))
        .reduce((sum, [, n]) => sum + n, 0);
const skillLoads = tools =>
    Object.keys(tools ?? {})
        .filter(name => name.startsWith('Skill:'))
        .join(' ');
const tsErrors = text => (text ? (text.match(/error TS/g) ?? []).length : '');
const minutes = ms => (ms ? (ms / 60000).toFixed(1) : '');
const money = usd => (usd === undefined ? '' : usd.toFixed(2));
const findings = engine => (engine && !engine.error ? `${engine.fix}/${engine.advise}` : '');
const consoleErrors = shot => (shot ? (shot.includes('No console errors') ? 0 : 'yes') : '');

const table = (rows, columns) => {
    const head = `| ${columns.map(([title]) => title).join(' | ')} |\n| ${columns.map(() => '---').join(' | ')} |`;
    return `${head}\n${rows.map(row => `| ${columns.map(([, get]) => get(row) ?? '').join(' | ')} |`).join('\n')}`;
};
const by = (a, b) => a.id.localeCompare(b.id);
const common = [
    ['run', run => run.id],
    ['ok', run => (run.ok ? 'yes' : 'NO')],
    ['min', run => minutes(run.durationMs ?? run.wallMs)],
    ['turns', run => run.turns],
    ['$', run => money(run.costUsd)],
    ['MCP calls', run => mcpCalls(run.tools)],
    ['skills', run => skillLoads(run.tools)],
];

let md = `# Eval runs (${runs.length})\n\n`;
const builds = runs.filter(run => run.kind === 'build').sort(by);
md += `## Build\n\n${table(builds, [
    ...common,
    ['engine fix/advise', run => findings(run.engine)],
    ['TS errors', run => tsErrors(run.typecheck)],
    ['console errors', run => consoleErrors(run.shot)],
])}\n\n`;
const improves = runs.filter(run => run.kind === 'improve').sort(by);
md += `## Improve\n\n${table(improves, [...common, ['engine after', run => findings(run.engine)], ['TS errors', run => tsErrors(run.typecheck)], ['score', run => run.score?.summary]])}\n\n`;
const audits = runs.filter(run => run.kind === 'audit').sort(by);
md += `## Audit\n\n${table(audits, [...common, ['hits', run => run.score?.hits], ['of', run => run.score?.of], ['false +', run => run.score?.falsePositiveCount], ['wrong fixes', run => run.score?.wrongFixCount]])}\n\n`;
const triggers = runs.filter(run => run.kind === 'trigger').sort(by);
const fired = run => Object.keys(run.tools ?? {}).some(name => name.startsWith('Skill:continuum'));
md += `## Triggering\n\n${table(triggers, [...common, ['expected', run => (run.expected ? 'load' : 'not')], ['loaded', run => (fired(run) ? 'load' : 'not')], ['right', run => (fired(run) === run.expected ? 'yes' : 'NO')]])}\n\n`;
const themes = runs.filter(run => run.kind === 'theme').sort(by);
md += `## Theme\n\n${table(themes, [
    ...common,
    [
        'tools',
        run =>
            Object.keys(run.tools ?? {})
                .filter(n => n.startsWith('mcp__'))
                .join(' '),
    ],
])}\n\n`;

// Per model and cell: mean cost and minutes.
const groups = {};
for (const run of runs) {
    const key = `${run.kind} · ${run.model}`;
    groups[key] ??= { n: 0, cost: 0, ms: 0 };
    groups[key].n++;
    groups[key].cost += run.costUsd ?? 0;
    groups[key].ms += run.durationMs ?? run.wallMs ?? 0;
}
md += `## Cost and time by task and model\n\n| task · model | runs | total $ | mean $ | mean min |\n| --- | --- | --- | --- | --- |\n${Object.entries(
    groups,
)
    .sort()
    .map(
        ([key, g]) =>
            `| ${key} | ${g.n} | ${g.cost.toFixed(2)} | ${(g.cost / g.n).toFixed(2)} | ${(g.ms / g.n / 60000).toFixed(1)} |`,
    )
    .join('\n')}\n`;

writeFileSync(join(dir, 'summary.json'), JSON.stringify(runs, null, 2));
writeFileSync(join(dir, 'summary.md'), md);
console.log(md);
