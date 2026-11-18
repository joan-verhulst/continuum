// Writes runs/<date>/compare.html: each screen and model built without Continuum (bare) beside the same
// screen and model built with it (pkg-both), sides shuffled, to judge which is the better screen with the look
// set aside. A five-step preference and a note per pair, kept in the browser and exported as JSON.
// With --cheap it writes compare-cheap.html instead: a smaller model with Continuum beside Opus without it,
// to see whether the cheaper model with the system gets close to the largest without it.
// Usage: node labs/evals/harness/compare.mjs [runs dir] [--cheap]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(
    process.argv
        .slice(2)
        .find((arg, i, all) => !arg.startsWith('--') && !all[i - 1]?.match(/^--(kit-shots|vs)$/)) ??
        join(import.meta.dirname, '../../../../continuum-evals/runs/2026-11-18'),
);
const screens = [
    't1-orders',
    't2-notifications',
    'x1-music-player',
    'x2-photo-editor',
    'x3-mail-client',
    'x4-landing-page',
];
const cheap = process.argv.includes('--cheap');
// --kit-shots small draws the Continuum side from shots-small/ (its builds re-shot in the compact, small
// theme, so both sides are as dense); --vs tok-only sets it against Opus with only the theme.
const flag = key => {
    const at = process.argv.indexOf(`--${key}`);
    return at === -1 ? undefined : process.argv[at + 1];
};
const kitShots = flag('kit-shots');
const otherCell = flag('vs') ?? 'bare';
const name = ['compare', cheap && 'cheap', kitShots, otherCell !== 'bare' && otherCell]
    .filter(Boolean)
    .join('-');
// Each pair: the run with Continuum (the kit) and the run without it (bare), by model.
const matchups = cheap
    ? [
          { model: 'haiku', kit: 'haiku', bare: 'opus' },
          { model: 'sonnet', kit: 'sonnet', bare: 'opus' },
      ]
    : ['haiku', 'sonnet', 'opus'].map(model => ({ model, kit: model, bare: model }));

const pairs = [];
for (const screen of screens) {
    for (const { model, kit: kitModel, bare: bareModel } of matchups) {
        const bare = `build-${screen}-${otherCell}-${bareModel}`;
        const kit = `build-${screen}-pkg-both-${kitModel}`;
        if (!existsSync(join(dir, bare, 'shots')) || !existsSync(join(dir, kit, 'shots'))) continue;
        // A fixed coin per pair, so the sides stay put across reloads.
        const flip =
            [...`${screen}${model}`].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 2 === 1;
        pairs.push({
            key: `${screen}-${model}`,
            screen,
            model,
            left: flip ? kit : bare,
            right: flip ? bare : kit,
        });
    }
}

// The screenshots go in the page itself, so it opens anywhere, also where files beside it cannot be read.
const shots = {};
for (const id of new Set(pairs.flatMap(pair => [pair.left, pair.right]))) {
    for (const shot of ['light-1440', 'dark-1440', 'light-390', 'dark-390']) {
        const folder = kitShots && id.includes('-pkg-both-') ? `shots-${kitShots}` : 'shots';
        const file = join(dir, id, folder, `${shot}.png`);
        if (existsSync(file))
            shots[`${id}/${shot}`] =
                `data:image/png;base64,${readFileSync(file).toString('base64')}`;
    }
}

writeFileSync(
    join(dir, `${name}.html`),
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${cheap ? 'Cheaper models compare' : 'Quality compare'}</title>
<style>
    :root { --bg: #ededed; --surface: #f8f8f8; --line: #d2d2d2; --text: #0d0d0d; --muted: #676767; color-scheme: light dark; }
    @media (prefers-color-scheme: dark) { :root { --bg: #181818; --surface: #0d0d0d; --line: #2a2a2a; --text: #f8f8f8; --muted: #9a9a9a; } }
    body { margin: 0; background: var(--bg); color: var(--text); font: 13px/1.25 system-ui, sans-serif; }
    header { position: sticky; top: 0; z-index: 1; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 12px 16px; background: var(--surface); border-bottom: 1px solid var(--line); }
    select, button, textarea { font: inherit; color: var(--text); background: var(--surface); border: 1px solid var(--line); border-radius: 12px; }
    select, button { height: 34px; padding: 0 12px; }
    main { padding: 16px; display: flex; flex-direction: column; gap: 12px; max-width: 2200px; margin: 0 auto; }
    .question { color: var(--muted); }
    .sides { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .side { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .side img { width: 100%; border-radius: 10px; border: 1px solid var(--line); cursor: zoom-in; }
    .label { font-weight: 500; }
    .choice { display: flex; flex-wrap: wrap; gap: 4px; }
    .choice button[aria-pressed="true"] { background: var(--text); color: var(--surface); }
    textarea { min-height: 60px; padding: 8px 12px; resize: vertical; }
    dialog { padding: 0; border: 0; background: transparent; max-width: 96vw; }
    dialog img { max-width: 96vw; max-height: 92vh; }
</style>
</head>
<body>
<header>
    <button id="prev">‹</button>
    <select id="pair"></select>
    <button id="next">›</button>
    <select id="shot"><option value="light-1440">Light 1440</option><option value="dark-1440">Dark 1440</option><option value="light-390">Light 390</option><option value="dark-390">Dark 390</option></select>
    <button id="export">Export</button>
    <span class="question" id="count"></span>
</header>
<main>
    <p class="question">Which is the better screen, leaving the look aside? Composition, hierarchy, density, whether it works as the app it is.</p>
    <div class="choice" id="choice"></div>
    <div class="sides" id="sides"></div>
    <textarea id="note" placeholder="Notes: why"></textarea>
</main>
<dialog id="zoom"><img alt="" /></dialog>
<script>
const pairs = ${JSON.stringify(pairs)};
const shots = ${JSON.stringify(shots)};
const options = [['left-much', 'Left, clearly'], ['left', 'Left, a bit'], ['same', 'Same'], ['right', 'Right, a bit'], ['right-much', 'Right, clearly']];
const load = () => { try { return JSON.parse(localStorage.getItem('eval-${name}') || '{}'); } catch { return {}; } };
const save = () => { try { localStorage.setItem('eval-${name}', JSON.stringify(answers)); } catch {} };
let answers = load();
const pick = document.getElementById('pair'), shot = document.getElementById('shot');
pairs.forEach((p, i) => pick.add(new Option((i + 1) + '. ' + p.screen + ' · ' + p.model + '${cheap ? ` with Continuum vs Opus${otherCell === 'tok-only' ? ' with only the theme' : ' alone'}` : ''}', p.key)));
const current = () => pairs.find(p => p.key === pick.value);
const count = () => { document.getElementById('count').textContent = Object.values(answers).filter(a => a.choice).length + ' of ' + pairs.length + ' answered'; };
function render() {
    const p = current(), a = answers[p.key] || {};
    document.getElementById('sides').innerHTML = [['Left', p.left], ['Right', p.right]].map(([name, id]) =>
        '<section class="side"><span class="label">' + name + '</span><img alt="" src="' + shots[id + '/' + shot.value] + '" /></section>').join('');
    document.querySelectorAll('.side img').forEach(img => img.onclick = () => { const d = document.getElementById('zoom'); d.querySelector('img').src = img.src; d.showModal(); });
    const choice = document.getElementById('choice');
    choice.innerHTML = options.map(([v, t]) => '<button data-v="' + v + '" aria-pressed="' + (a.choice === v) + '">' + t + '</button>').join('');
    choice.querySelectorAll('button').forEach(b => b.onclick = () => {
        answers[p.key] = { ...(answers[p.key] || {}), choice: b.dataset.v }; save(); count();
        choice.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    });
    const note = document.getElementById('note');
    note.value = a.note || '';
    note.oninput = () => { answers[p.key] = { ...(answers[p.key] || {}), note: note.value }; save(); };
    count();
}
const step = d => { const i = pairs.findIndex(p => p.key === pick.value); pick.value = pairs[(i + d + pairs.length) % pairs.length].key; render(); scrollTo(0, 0); };
document.getElementById('prev').onclick = () => step(-1);
document.getElementById('next').onclick = () => step(1);
pick.onchange = shot.onchange = render;
document.getElementById('zoom').onclick = e => e.currentTarget.close();
document.getElementById('export').onclick = () => {
    // Resolved to which side was which, so the file says bare or Continuum, not left or right.
    const out = Object.fromEntries(pairs.filter(p => answers[p.key]).map(p => {
        const a = answers[p.key], kitLeft = p.left.includes('-pkg-both-');
        const towardKit = { 'left-much': kitLeft ? 2 : -2, left: kitLeft ? 1 : -1, same: 0, right: kitLeft ? -1 : 1, 'right-much': kitLeft ? -2 : 2 }[a.choice];
        return [p.key, { screen: p.screen, model: p.model, continuumBetter: towardKit ?? null, note: a.note || '' }];
    }));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    link.download = '${name}.json'; link.click();
};
render();
</script>
</body>
</html>
`,
);
console.log(`${name}.html: ${pairs.length} pairs`);
