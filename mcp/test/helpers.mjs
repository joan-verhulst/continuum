import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { after, before } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/*
 * The tests talk to the built bundle the way an agent does: a fresh server process over stdio,
 * one per test file. Nothing here imports the source, so what passes is what ships.
 */

export const mcpDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const fixturesDir = join(mcpDir, 'fixtures');
// CONTINUUM_MCP_BUNDLE points the suite at another build (a probe, a published copy).
const bundle = resolve(mcpDir, process.env.CONTINUUM_MCP_BUNDLE ?? 'dist/server.mjs');

/** Connects a client to a new server process; close() ends both. */
export const start = async () => {
    assert.ok(
        existsSync(bundle),
        `No bundle at ${bundle}. Build it first: node build.mjs (in mcp/).`,
    );
    const transport = new StdioClientTransport({
        command: process.execPath,
        args: [bundle],
        cwd: mcpDir,
        stderr: 'pipe',
    });
    let stderr = '';
    transport.stderr?.on('data', chunk => {
        stderr += chunk;
    });
    const client = new Client({ name: 'continuum-tests', version: '0.0.0' });
    try {
        await client.connect(transport);
    } catch (cause) {
        throw new Error(`The server did not start: ${cause.message}\n${stderr}`);
    }
    return { client, close: () => client.close() };
};

/**
 * One server for a test file: started before its tests, closed after them. The returned object
 * is filled in by `before`, so read `server.client` inside a test, not at the top of the file.
 */
export const useServer = () => {
    const server = {};
    before(async () => Object.assign(server, await start()));
    after(async () => server.close?.());
    return server;
};

/** The raw result of a tool call: content, structuredContent, isError. */
export const callRaw = (client, name, args = {}) => client.callTool({ name, arguments: args });

/** The text of a result, all its text parts joined. */
export const textOf = result =>
    (result.content ?? [])
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('\n');

/**
 * A tool's answer: its structured content, else its text parsed as JSON, else the text. A tool
 * error fails the test with the message the tool gave.
 */
export const call = async (client, name, args = {}) => {
    const result = await callRaw(client, name, args);
    const body = textOf(result);
    assert.ok(
        !result.isError,
        `${name}(${JSON.stringify(args).slice(0, 200)}) returned an error:\n${body}`,
    );
    if (result.structuredContent) return result.structuredContent;
    try {
        return JSON.parse(body);
    } catch {
        return body;
    }
};

/** Everything a response says, as one string to search: text as it is, data as JSON. */
export const flat = value => (typeof value === 'string' ? value : JSON.stringify(value));

/** Every `name` in a response's arrays of objects, at any depth. */
export const namesIn = value => {
    const names = [];
    const visit = node => {
        if (Array.isArray(node)) node.forEach(visit);
        else if (node && typeof node === 'object') {
            if (typeof node.name === 'string') names.push(node.name);
            Object.values(node).forEach(visit);
        }
    };
    visit(value);
    return names;
};

/* ---------- Arguments by schema ---------- */

/*
 * The audit tools' argument names are the tools' own business; the tests ask for an argument by
 * what it holds and take whichever of the likely names the schema offers, so a rename does not
 * break the suite but a missing argument says plainly which one was looked for.
 */

const schemas = new WeakMap();

export const schemaOf = async (client, tool) => {
    if (!schemas.has(client)) {
        const { tools } = await client.listTools();
        schemas.set(client, new Map(tools.map(each => [each.name, each.inputSchema])));
    }
    const schema = schemas.get(client).get(tool);
    assert.ok(schema, `The server offers no tool named ${tool}.`);
    return schema;
};

/** The first of `candidates` the schema has, with its property schema; null when it has none. */
export const pickArgument = (schema, candidates) => {
    const properties = schema.properties ?? {};
    const name = candidates.find(candidate => candidate in properties);
    return name ? { name, property: properties[name] } : null;
};

export const requireArgument = (schema, tool, what, candidates) => {
    const picked = pickArgument(schema, candidates);
    assert.ok(
        picked,
        `${tool} has no argument for ${what}: looked for ${candidates.join(', ')}; it takes ${Object.keys(schema.properties ?? {}).join(', ')}.`,
    );
    return picked;
};

const isType = (property, type) =>
    property?.type === type ||
    (Array.isArray(property?.type) && property.type.includes(type)) ||
    (property?.anyOf ?? []).some(option => option.type === type);

/** A value for an argument: as JSON text when the schema wants a string, as it is otherwise. */
export const asArgument = (property, value) =>
    isType(property, 'string') &&
    !isType(property, 'object') &&
    !isType(property, 'array') &&
    typeof value !== 'string'
        ? JSON.stringify(value)
        : value;

/* ---------- Audits ---------- */

/** The findings in a report, wherever the tool put the report. */
export const findingsOf = data => {
    if (Array.isArray(data?.findings)) return data.findings;
    for (const value of Object.values(data ?? {})) {
        if (Array.isArray(value?.findings)) return value.findings;
    }
    assert.fail(`The audit returned no findings array:\n${flat(data).slice(0, 600)}`);
};

/**
 * audit_source over files or a folder, by absolute path. Takes the paths as one array, or calls
 * once per path when the tool takes a single one, and returns every finding.
 */
export const auditSource = async (client, paths, medium) => {
    const schema = await schemaOf(client, 'audit_source');
    const target = requireArgument(schema, 'audit_source', 'the files to read', [
        'paths',
        'files',
        'path',
        'root',
        'directory',
        'dir',
        'glob',
    ]);
    const mediumArgument = pickArgument(schema, ['medium']);
    const withMedium = args => (mediumArgument && medium ? { ...args, medium } : args);
    if (isType(target.property, 'array')) {
        const items = target.property.items ?? {};
        const value = isType(items, 'object')
            ? await Promise.all(
                  paths.map(async path => ({ path, content: await readFile(path, 'utf8') })),
              )
            : paths;
        return findingsOf(await call(client, 'audit_source', withMedium({ [target.name]: value })));
    }
    const findings = [];
    for (const path of paths) {
        findings.push(
            ...findingsOf(await call(client, 'audit_source', withMedium({ [target.name]: path }))),
        );
    }
    return findings;
};

/**
 * audit_ui over a UINode tree (a snapshot), a map of a canvas's computed styles, or facts another
 * tool has already read (Fact[], form 'rendered').
 */
export const auditUi = async (client, { tree, styles, facts, medium }) => {
    const schema = await schemaOf(client, 'audit_ui');
    const args = {};
    if (facts) {
        const target = requireArgument(schema, 'audit_ui', 'facts', ['facts']);
        args[target.name] = asArgument(target.property, facts);
    }
    if (tree) {
        const target = requireArgument(schema, 'audit_ui', 'a box tree', [
            'tree',
            'snapshot',
            'root',
            'nodes',
            'ui',
        ]);
        args[target.name] = asArgument(target.property, tree);
    }
    if (styles) {
        const target =
            pickArgument(schema, ['styles', 'computedStyles', 'computed_styles']) ??
            requireArgument(schema, 'audit_ui', 'computed styles', [
                'tree',
                'snapshot',
                'root',
                'nodes',
            ]);
        args[target.name] = asArgument(target.property, styles);
    }
    if (medium && pickArgument(schema, ['medium'])) args.medium = medium;
    return findingsOf(await call(client, 'audit_ui', args));
};

export const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

/* ---------- Matching planted mistakes ---------- */

const list = value => (Array.isArray(value) ? value : [value]);

/** 'Toolbar.tsx:1' matches 'src/Toolbar.tsx:1' and 'Toolbar.tsx:1:5', never 'Toolbar.tsx:12'. */
const atMatches = (at, wanted) => {
    const index = at.indexOf(wanted);
    if (index < 0) return false;
    const next = at[index + wanted.length];
    return !(/\d/.test(wanted.at(-1)) && next !== undefined && /\d/.test(next));
};

/** What a finding proposes, to search: the wanted value, the fixes and the component, never the found value. */
const proposal = finding =>
    [finding.expected, finding.component, ...Object.values(finding.fix ?? {})]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

/** Where a finding points, with 'file.scss:14,43' spelt out as 'file.scss:14 file.scss:43'. */
const placesOf = finding =>
    `${finding.at ?? ''} ${finding.node ?? ''}`
        .replace(/\\/g, '/')
        .replace(/([^\s,]+):(\d+(?:,\s*\d+)+)/g, (_, file, lines) =>
            lines
                .split(',')
                .map(line => `${file}:${line.trim()}`)
                .join(' '),
        );

/**
 * Whether one finding answers one planted mistake: it sits where the mistake was planted, and it
 * either names the rule or proposes the expected value. The rule is the engine's word for the
 * kind of mistake, never a stack's; the value is the system's.
 */
export const answers = (mistake, finding) => {
    const where = placesOf(finding);
    if (!list(mistake.at).some(at => atMatches(where, at))) return false;
    if (list(mistake.rule ?? []).includes(finding.rule)) return true;
    const text = proposal(finding);
    return list(mistake.expectedIncludes).some(part => text.includes(String(part).toLowerCase()));
};

/**
 * Pairs planted mistakes with findings, one finding per mistake, so a single finding cannot be
 * counted for two mistakes on one line (a border's colour for its width, say). A finding that
 * names several lines ('file.scss:14,43') may answer one mistake on each. Returns, per mistake,
 * the finding that answers it or undefined.
 */
export const matchMistakes = (mistakes, findings) => {
    // A finding's capacity is how many places it names; each place is a slot a mistake can take.
    const slots = findings.flatMap(finding => {
        const lines = /:(\d+(?:,\s*\d+)+)/.exec(finding.at ?? '');
        const count = lines ? lines[1].split(',').length : 1;
        return Array.from({ length: count }, () => finding);
    });
    const taken = new Array(slots.length).fill(-1);
    const candidates = mistakes.map(mistake =>
        slots.flatMap((finding, slot) => (answers(mistake, finding) ? [slot] : [])),
    );
    // Augmenting paths (Kuhn): a mistake takes a free slot, or moves the holder of one elsewhere.
    const place = (index, seen) => {
        for (const slot of candidates[index]) {
            if (seen.has(slot)) continue;
            seen.add(slot);
            if (taken[slot] < 0 || place(taken[slot], seen)) {
                taken[slot] = index;
                return true;
            }
        }
        return false;
    };
    for (let index = 0; index < mistakes.length; index++) place(index, new Set());
    const found = new Array(mistakes.length).fill(undefined);
    taken.forEach((index, slot) => {
        if (index >= 0) found[index] = slots[slot];
    });
    return found;
};

/** The first finding that answers a mistake, regardless of the others. */
export const matchMistake = (mistake, findings) =>
    findings.find(finding => answers(mistake, finding));

const describe = finding =>
    `  [${finding.severity}/${finding.confidence}] ${finding.rule} at ${finding.at}${finding.property ? ` (${finding.property})` : ''}: ${finding.found} → ${finding.expected}`;

/** Fails listing every planted mistake the audit missed, and what it did find. */
export const assertFound = (label, mistakes, findings) => {
    const matched = matchMistakes(mistakes, findings);
    const missing = mistakes.filter((_, index) => !matched[index]);
    if (missing.length === 0) return;
    const lines = missing.map(
        mistake =>
            `  - ${mistake.what} (rule ${list(mistake.rule).join('|')}, at ${list(mistake.at).join(' or ')}, expected to propose ${list(mistake.expectedIncludes).join(' or ')})`,
    );
    assert.fail(
        `${label}: ${missing.length} of ${mistakes.length} planted mistakes not found:\n${lines.join('\n')}\n\nThe audit returned ${findings.length} findings:\n${findings.map(describe).join('\n')}`,
    );
};

export { describe as describeFinding };

/** Asserts a pattern is in a body, with the message alone on failure (not the whole body again). */
export const has = (body, pattern, message) => assert.ok(pattern.test(body), message);
