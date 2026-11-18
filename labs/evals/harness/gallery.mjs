// Writes runs/<date>/gallery.html: every build and improve run's screenshots, grouped by screen, with a blind
// mode (labels hidden, order shuffled) and a 1–5 rating per run kept in the browser and exportable as JSON.
// Usage: node labs/evals/harness/gallery.mjs [runs dir]
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(
    process.argv[2] ?? join(import.meta.dirname, '../../../../continuum-evals/runs/2026-11-18'),
);
const runs = readdirSync(dir)
    .filter(
        name => existsSync(join(dir, name, 'result.json')) && existsSync(join(dir, name, 'shots')),
    )
    .map(name => JSON.parse(readFileSync(join(dir, name, 'result.json'), 'utf8')));

const screenOf = run =>
    run.kind === 'improve'
        ? `improve ${run.fixture}`
        : run.id
              .replace(/^(build|conflict)-/, '')
              .replace(
                  /-(bare|pkg|pkg-skill|pkg-mcp|pkg-both|tok-brief|tok-both|html-both)-(haiku|sonnet|opus)$/,
                  '',
              )
              .replace(/-(pkg-both)$/, '');
const groups = {};
for (const run of runs) {
    const key = `${run.group === 'conflict' ? 'conflict · ' : ''}${screenOf(run)}`;
    groups[key] ??= [];
    groups[key].push(run);
}

const data = Object.entries(groups)
    .sort()
    .map(([screen, list]) => ({
        screen,
        runs: list.map(run => ({
            id: run.id,
            model: run.model,
            cell: run.cell,
            engine: run.engine,
            cost: run.costUsd,
        })),
    }));

writeFileSync(
    join(dir, 'gallery.html'),
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Eval gallery</title>
<style>
    :root { --bg: #ededed; --surface: #f8f8f8; --line: #d2d2d2; --text: #0d0d0d; --muted: #676767; color-scheme: light dark; }
    @media (prefers-color-scheme: dark) { :root { --bg: #181818; --surface: #0d0d0d; --line: #2a2a2a; --text: #f8f8f8; --muted: #9a9a9a; } }
    body { margin: 0; background: var(--bg); color: var(--text); font: 13px/1.25 system-ui, sans-serif; }
    header { position: sticky; top: 0; z-index: 1; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 12px 16px; background: var(--surface); border-bottom: 1px solid var(--line); }
    select, button { font: inherit; height: 34px; padding: 0 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--surface); color: var(--text); }
    main { padding: 16px; display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 560px), 1fr)); }
    .run { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .run img { width: 100%; border-radius: 10px; border: 1px solid var(--line); cursor: zoom-in; }
    .shots { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .meta { color: var(--muted); }
    .label { font-weight: 500; }
    .rate { display: flex; gap: 4px; }
    .rate button { width: 34px; padding: 0; }
    .rate button[aria-pressed="true"] { background: var(--text); color: var(--surface); }
    .note { font: inherit; min-height: 60px; padding: 8px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--surface); color: var(--text); resize: vertical; }
    dialog { padding: 0; border: 0; background: transparent; max-width: 96vw; }
    dialog img { max-width: 96vw; max-height: 92vh; }
</style>
</head>
<body>
<header>
    <select id="screen"></select>
    <select id="shot"><option value="1440">1440</option><option value="390">390</option></select>
    <button id="blind" aria-pressed="true">Blind: on</button>
    <button id="export">Export ratings</button>
    <span class="meta" id="count"></span>
</header>
<main id="grid"></main>
<dialog id="zoom"><img alt="" /></dialog>
<script>
const data = ${JSON.stringify(data)};
const store = { get() { try { return JSON.parse(localStorage.getItem('eval-ratings') || '{}'); } catch { return {}; } },
    set(v) { try { localStorage.setItem('eval-ratings', JSON.stringify(v)); } catch {} } };
let ratings = store.get(), blind = true;
const noteStore = { get() { try { return JSON.parse(localStorage.getItem('eval-notes') || '{}'); } catch { return {}; } },
    set(v) { try { localStorage.setItem('eval-notes', JSON.stringify(v)); } catch {} } };
let notes = noteStore.get();
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const screen = document.getElementById('screen'), shot = document.getElementById('shot'), grid = document.getElementById('grid');
for (const g of data) screen.add(new Option(g.screen + ' (' + g.runs.length + ')', g.screen));
const seeded = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return () => ((h = (h * 1103515245 + 12345) | 0) >>> 0) / 2 ** 32; };
function render() {
    const g = data.find(x => x.screen === screen.value); const rand = seeded(g.screen);
    const list = blind ? [...g.runs].map(r => [rand(), r]).sort((a, b) => a[0] - b[0]).map(x => x[1]) : [...g.runs].sort((a, b) => a.id.localeCompare(b.id));
    grid.innerHTML = '';
    list.forEach((r, i) => {
        const el = document.createElement('section'); el.className = 'run';
        const label = blind ? 'Run ' + String.fromCharCode(65 + i) : r.model + ' · ' + r.cell;
        const extra = blind ? '' : ' — engine ' + (r.engine && r.engine.fix !== undefined ? r.engine.fix + ' fix / ' + r.engine.advise + ' advise' : '?') + (r.cost ? ' · $' + r.cost.toFixed(2) : '');
        el.innerHTML = '<div><span class="label">' + label + '</span><span class="meta">' + extra + '</span></div><div class="shots">' +
            ['light', 'dark'].map(m => '<img loading="lazy" alt="' + m + '" src="' + r.id + '/shots/' + m + '-' + shot.value + '.png" />').join('') +
            '</div><div class="rate">' + [1, 2, 3, 4, 5].map(n => '<button aria-pressed="' + (ratings[r.id] === n) + '" data-n="' + n + '">' + n + '</button>').join('') + '</div><textarea class="note" placeholder="Notes: what works, what is off">' + esc(notes[r.id] || '') + '</textarea>';
        el.querySelectorAll('.rate button').forEach(b => b.onclick = () => { ratings[r.id] = Number(b.dataset.n); store.set(ratings); el.querySelectorAll('.rate button').forEach(x => x.setAttribute('aria-pressed', x === b)); document.getElementById('count').textContent = Object.keys(ratings).length + ' rated'; });
        el.querySelector('.note').oninput = e => { const v = e.target.value; if (v.trim()) notes[r.id] = v; else delete notes[r.id]; noteStore.set(notes); };
        el.querySelectorAll('img').forEach(img => img.onclick = () => { const d = document.getElementById('zoom'); d.querySelector('img').src = img.src; d.showModal(); });
        grid.append(el);
    });
    document.getElementById('count').textContent = Object.keys(ratings).length + ' rated';
}
screen.onchange = shot.onchange = render;
document.getElementById('zoom').onclick = e => e.currentTarget.close();
document.getElementById('blind').onclick = e => { blind = !blind; e.currentTarget.textContent = 'Blind: ' + (blind ? 'on' : 'off'); e.currentTarget.setAttribute('aria-pressed', blind); render(); };
document.getElementById('export').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(Object.fromEntries([...new Set([...Object.keys(ratings), ...Object.keys(notes)])].map(id => [id, { rating: ratings[id] ?? null, note: notes[id] ?? '' }])), null, 2)], { type: 'application/json' })); a.download = 'ratings.json'; a.click(); };
render();
</script>
</body>
</html>
`,
);
console.log(`gallery.html: ${runs.length} runs in ${data.length} groups`);
