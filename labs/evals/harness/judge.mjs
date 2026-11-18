// Scores audit and improve runs against the answer keys with a model judge (Opus): which planted defects a
// run found or fixed, its false positives and its wrong fixes. Writes score.json beside each run.
// Usage: node labs/evals/harness/judge.mjs [runs dir] [--concurrency 6]
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const evals = resolve(import.meta.dirname, '..');
const dir = resolve(process.argv[2] ?? join(evals, '../../../continuum-evals/runs/2026-11-18'));
const concurrency = Number(process.argv[process.argv.indexOf('--concurrency') + 1] || 6);
const claude = join(
    homedir(),
    'AppData/Roaming/npm/node_modules/@anthropic-ai/claude-code/bin/claude.exe',
);
const keys = readFileSync(join(evals, 'keys/answer-keys.md'), 'utf8');
const section = id => {
    const start = keys.indexOf(`## ${id.toUpperCase()}:`);
    const end = keys.indexOf('\n## ', start + 1);
    return keys
        .slice(start, end === -1 ? undefined : end)
        .replace(/\nEngine \(`audit_source`[\s\S]*$/, '');
};

const schema = `Answer with JSON only, no prose around it:
{
  "found": ["D1", ...],            // key ids the run correctly identified (place within ±3 lines and the right problem)
  "fixedRight": ["D1", ...],       // of those, the ones whose proposed or applied fix matches the key's (or is equally right)
  "falsePositives": [ "short description", ... ],  // findings that are wrong: a decoy flagged, a correct value called wrong, an invented rule
  "wrongFixes": [ "D4: proposed text-xl, key says text-2xl", ... ],
  "collateral": [ "...", ... ],    // improve runs only: changes nobody asked for that alter content, data, behaviour or break something
  "note": "one sentence on the run"
}`;

const jobFor = run => {
    const fixture = run.fixture.slice(0, 2);
    const base = `You are scoring an AI agent's ${run.kind === 'audit' ? 'review' : 'improvement'} of a UI file against an answer key. Be strict and literal. Here is the answer key for this file:\n\n${section(fixture)}\n\n`;
    if (run.kind === 'audit') {
        return `${base}Here is the agent's review:\n\n<review>\n${readFileSync(join(dir, run.id, 'final.md'), 'utf8')}\n</review>\n\nFor B2, ids are G1–G17 (a category counts as found if any instance is named). For B6 there are no defects: list every finding as a false positive unless it is one the key accepts.\n\n${schema}`;
    }
    const before = readFileSync(join(evals, 'fixtures', `${run.fixture}.tsx`), 'utf8');
    const after = readFileSync(join(dir, run.id, 'files/src/Screen.tsx'), 'utf8');
    return `${base}Here is the file before:\n\n<before>\n${before}\n</before>\n\nAnd after the agent's changes:\n\n<after>\n${after}\n</after>\n\nThe agent's own report:\n\n<report>\n${readFileSync(join(dir, run.id, 'final.md'), 'utf8')}\n</report>\n\n"found" here means the defect is fixed in the after file (or, for a structural one, clearly proposed in the report). "fixedRight" means fixed in the file with the key's fix or an equally right one.\n\n${schema}`;
};

const ask = prompt =>
    new Promise(done => {
        const env = { ...process.env };
        for (const key of Object.keys(env)) if (key.startsWith('CLAUDE')) delete env[key];
        const child = spawn(
            claude,
            [
                '-p',
                '--model',
                'claude-opus-5-5',
                '--tools',
                '',
                '--setting-sources',
                'project',
                '--strict-mcp-config',
                '--no-session-persistence',
            ],
            { env, cwd: homedir() },
        );
        let text = '';
        child.stdout.on('data', chunk => (text += chunk));
        child.on('close', () => done(text));
        child.stdin.end(prompt);
    });

const ids = { b1: 11, b2: 17, b3: 6, b6: 0 };
const runs = readdirSync(dir)
    .filter(name => existsSync(join(dir, name, 'result.json')))
    .map(name => JSON.parse(readFileSync(join(dir, name, 'result.json'), 'utf8')))
    .filter(
        run =>
            (run.kind === 'audit' || run.kind === 'improve') &&
            run.ok &&
            !existsSync(join(dir, run.id, 'score.json')),
    );

console.log(`${runs.length} runs to judge`);
const queue = [...runs];
await Promise.all(
    Array.from({ length: concurrency }, async () => {
        while (queue.length) {
            const run = queue.shift();
            const text = await ask(jobFor(run));
            try {
                const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
                const of = ids[run.fixture.slice(0, 2)];
                const score = {
                    ...json,
                    hits: json.found.length,
                    of,
                    right: json.fixedRight.length,
                    falsePositiveCount: json.falsePositives.length,
                    wrongFixCount: json.wrongFixes.length,
                    summary: `${json.found.length}/${of} found, ${json.fixedRight.length} fixed right, ${json.falsePositives.length} false +`,
                };
                writeFileSync(join(dir, run.id, 'score.json'), JSON.stringify(score, null, 2));
                console.log(`${run.id}: ${score.summary}`);
            } catch {
                writeFileSync(join(dir, run.id, 'score-error.txt'), text);
                console.log(`${run.id}: could not parse the judge's answer`);
            }
        }
    }),
);
