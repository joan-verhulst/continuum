// Screenshots the screen in light and dark, at 1440 × 900 and 390 × 844, into shots/.
// Prints console errors and failed requests. Usage: npm run shot
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const port = 20000 + Math.floor(Math.random() * 30000);
const server = await createServer({ logLevel: 'error', server: { port, strictPort: false } });
await server.listen();
const base = server.resolvedUrls.local[0];
mkdirSync('shots', { recursive: true });
const browser = await chromium.launch();
const problems = [];
for (const [width, height] of [
    [1440, 900],
    [390, 844],
]) {
    for (const mode of ['light', 'dark']) {
        // The harness's own shots are 2x for the gallery; an agent's stay 1x, to keep its images small.
        const page = await browser.newPage({
            viewport: { width, height },
            colorScheme: mode,
            deviceScaleFactor: Number(process.env.SHOT_SCALE ?? 1),
        });
        page.on('console', message => {
            if (message.type() === 'error') problems.push(`${mode} ${width}: ${message.text()}`);
        });
        page.on('pageerror', error => problems.push(`${mode} ${width}: ${error.message}`));
        await page.goto(`${base}?mode=${mode}`, { waitUntil: 'networkidle' });
        // A first load can race Vite's dependency pre-bundling; one reload settles it.
        if (problems.some(problem => problem.includes('Outdated Optimize Dep'))) {
            problems.length = 0;
            await page.reload({ waitUntil: 'networkidle' });
        }
        await page.waitForTimeout(400);
        await page.screenshot({ path: `shots/${mode}-${width}.png`, fullPage: true });
        await page.close();
    }
}
await browser.close();
await server.close();
writeFileSync('shots/errors.txt', problems.join('\n'));
console.log(
    'Saved shots/light-1440.png, shots/dark-1440.png, shots/light-390.png, shots/dark-390.png',
);
console.log(problems.length ? `Console errors:\n${problems.join('\n')}` : 'No console errors.');
