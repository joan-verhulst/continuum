// Applies exact, counted replacements to a file: node plant.mjs <file> <replacements.json>
import { readFileSync, writeFileSync } from 'node:fs';

const [file, list] = process.argv.slice(2);
let text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
for (const [from, to] of JSON.parse(readFileSync(list, 'utf8'))) {
    const count = text.split(from).length - 1;
    if (count !== 1) throw new Error(`${count}× ${from.slice(0, 70)}`);
    text = text.replace(from, to);
}
writeFileSync(file, text);
console.log('planted', file);
