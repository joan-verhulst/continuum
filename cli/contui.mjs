#!/usr/bin/env node
/*
 * contui: sets Continuum up in a project as a dependency, and keeps it there.
 *
 *   npx contui init   installs @contui/ui, copies its skills into .claude/skills, registers its MCP
 *                     server in .mcp.json, and adds `contui sync` to the project's postinstall
 *   contui sync       copies the installed version's skills into .claude/skills (every install runs it)
 *   contui mcp        runs the installed version's MCP server
 *
 * The installed package is the source of truth: the version is the one in package.json, the skills
 * are copies of that version, refreshed on every install and kept out of git, and the MCP server
 * runs from node_modules. The same file ships in both packages: `contui` (this CLI alone, so npx
 * finds it) and `@contui/ui` (the library, the skills and the server, with this as its bin).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const library = '@contui/ui';
const skills = ['continuum-taste', 'continuum-fix-padding'];
const serverName = 'continuum';

/** The package this file is in: `contui` when run through npx, `@contui/ui` once installed. */
const self = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const versionOf = dir => readJson(join(dir, 'package.json')).version;

const fail = message => {
    console.error(`contui: ${message}`);
    process.exit(1);
};

/** The nearest folder at or above `from` that passes `test`. */
const up = (from, test) => {
    let dir = resolve(from);
    while (true) {
        if (test(dir)) return dir;
        const parent = dirname(dir);
        if (parent === dir) return undefined;
        dir = parent;
    }
};

/** The project: the nearest folder with a package.json. */
const projectOf = cwd => up(cwd, dir => existsSync(join(dir, 'package.json')));

/** Where Claude Code runs: the repository's root, or the project when it is not in one. */
const rootOf = project => up(project, dir => existsSync(join(dir, '.git'))) ?? project;

/**
 * The installed library, found the way Node finds it (node_modules at or above the project). The
 * path is kept as found, never resolved through a link, so it holds when the version changes.
 */
const installedFrom = project => {
    const at = up(project, dir => existsSync(join(dir, 'node_modules', library, 'package.json')));
    return at && join(at, 'node_modules', library);
};

/** The project's package manager: its lockfile, then package.json's field, then the one running. */
const packageManagerOf = (project, root) => {
    const locks = [
        ['pnpm-lock.yaml', 'pnpm'],
        ['yarn.lock', 'yarn'],
        ['bun.lock', 'bun'],
        ['bun.lockb', 'bun'],
        ['package-lock.json', 'npm'],
    ];
    for (let dir = project; dir; dir = dir === root ? undefined : dirname(dir)) {
        const lock = locks.find(([file]) => existsSync(join(dir, file)));
        if (lock) return lock[1];
    }
    const field = readJson(join(project, 'package.json')).packageManager;
    const named = (field ?? process.env.npm_config_user_agent ?? '').split(/[@/]/)[0];
    return ['pnpm', 'yarn', 'bun'].includes(named) ? named : 'npm';
};

const run = (command, args, cwd) => {
    const options = { cwd, stdio: 'inherit' };
    // Windows runs package managers through their .cmd shims, which need a shell: one command line.
    const quote = arg => (/[\s"&|<>^]/.test(arg) ? `"${arg.replaceAll('"', '""')}"` : arg);
    const result =
        process.platform === 'win32'
            ? spawnSync([command, ...args].map(quote).join(' '), { ...options, shell: true })
            : spawnSync(command, args, options);
    return result.status === 0;
};

/** Writes JSON the way the file already is: its indent, and a final newline. */
const writeJson = async (path, value, existing) => {
    const indent = existing?.match(/^([ \t]+)"/m)?.[1] ?? '  ';
    await writeFile(path, `${JSON.stringify(value, null, indent)}\n`);
};

/** Copies the skills of the installed version into .claude/skills, replacing older copies. */
const syncSkills = async (source, root) => {
    const copied = [];
    for (const name of skills) {
        const from = join(source, 'skills', name);
        if (!existsSync(from)) continue;
        const to = join(root, '.claude', 'skills', name);
        await rm(to, { recursive: true, force: true });
        await cp(from, to, { recursive: true });
        copied.push(name);
    }
    return copied;
};

/** The copies are built from the package on every install, so git keeps only the version. */
const ignoreSkills = async root => {
    const path = join(root, '.gitignore');
    const existing = existsSync(path) ? await readFile(path, 'utf8') : '';
    const lines = skills.map(name => `.claude/skills/${name}/`);
    const missing = lines.filter(line => !existing.split(/\r?\n/).includes(line));
    if (!missing.length) return false;
    const block = [
        '# Continuum’s skills, copied from @contui/ui on every install (contui sync)',
        ...missing,
    ];
    const gap = existing && !existing.endsWith('\n') ? '\n\n' : existing ? '\n' : '';
    await writeFile(path, `${existing}${gap}${block.join('\n')}\n`);
    return true;
};

/** Runs `contui sync` after every install, so the skills follow the version in package.json. */
const addPostinstall = async project => {
    const path = join(project, 'package.json');
    const text = await readFile(path, 'utf8');
    const manifest = JSON.parse(text);
    const current = manifest.scripts?.postinstall;
    if (current?.includes('contui sync')) return false;
    manifest.scripts = {
        ...manifest.scripts,
        postinstall: current ? `${current} && contui sync` : 'contui sync',
    };
    await writeJson(path, manifest, text);
    return true;
};

/** Registers the server in the project's .mcp.json, run with node from node_modules. */
const registerServer = async (source, root) => {
    const path = join(root, '.mcp.json');
    const text = existsSync(path) ? await readFile(path, 'utf8') : undefined;
    const config = text ? JSON.parse(text) : {};
    const server = relative(root, join(source, 'mcp', 'server.mjs'))
        .split(sep)
        .join('/');
    config.mcpServers = {
        ...config.mcpServers,
        [serverName]: { type: 'stdio', command: 'node', args: [server] },
    };
    await writeJson(path, config, text);
    return server;
};

const option = (args, name) => {
    const at = args.indexOf(name);
    return at === -1 ? undefined : args[at + 1];
};

const init = async args => {
    const project = projectOf(process.cwd());
    if (!project)
        fail('no package.json here or above. Run this inside a project (npm init -y makes one).');
    const root = rootOf(project);
    const manifest = readJson(join(project, 'package.json'));
    const listed = { ...manifest.dependencies, ...manifest.devDependencies }[library];
    // --from installs another spec than the registry's: a tarball, a folder, a git URL.
    const from = option(args, '--from');

    const manager = packageManagerOf(project, root);
    if (!listed || from) {
        const spec = from ?? library;
        console.log(`Installing ${library} with ${manager}…`);
        const verb = manager === 'npm' ? 'install' : 'add';
        if (!run(manager, [verb, spec], project)) fail(`${manager} could not install ${spec}.`);
    }

    const source = installedFrom(project);
    if (!source)
        fail(
            `${library} is not in node_modules. Install it (${manager} install), then run init again.`,
        );

    const copied = await syncSkills(source, root);
    const ignored = await ignoreSkills(root);
    const hooked = await addPostinstall(project);
    const server = await registerServer(source, root);

    const at = path => relative(process.cwd(), path).split(sep).join('/') || '.';
    console.log(`
Continuum ${versionOf(source)} is set up.
  ${library.padEnd(16)} a dependency in ${at(join(project, 'package.json'))}
  ${'skills'.padEnd(16)} ${copied.join(', ')} in ${at(join(root, '.claude/skills'))}${ignored ? ' (ignored by git)' : ''}
  ${'MCP server'.padEnd(16)} '${serverName}' in ${at(join(root, '.mcp.json'))}, running ${server}
  ${'postinstall'.padEnd(16)} ${hooked ? 'runs contui sync, so the skills follow the installed version' : 'already runs contui sync'}

Next:
  - Restart Claude Code and approve the '${serverName}' server.
  - Ask for a screen "in Continuum": the skill sets up the styles and the Theme.
`);
};

const sync = async () => {
    // Runs inside every install: it reports, and never fails the install.
    try {
        const project = projectOf(process.cwd()) ?? process.cwd();
        const source =
            installedFrom(project) ?? (existsSync(join(self, 'skills')) ? self : undefined);
        if (!source) {
            console.warn(`contui: ${library} is not installed, so there are no skills to sync.`);
            return;
        }
        const copied = await syncSkills(source, rootOf(project));
        console.log(`contui: ${copied.join(', ')} synced from ${library} ${versionOf(source)}`);
    } catch (error) {
        console.warn(`contui: could not sync the skills (${error.message})`);
    }
};

const mcp = async () => {
    const own = join(self, 'mcp', 'server.mjs');
    const project = projectOf(process.cwd());
    const installed = project && installedFrom(project);
    const server = existsSync(own) ? own : installed && join(installed, 'mcp', 'server.mjs');
    if (!server || !existsSync(server))
        fail(`${library} is not installed here. Run npx contui init first.`);
    await import(pathToFileURL(server).href);
};

const help = `contui ${versionOf(self)}: Continuum in a project, as a dependency.

  npx contui init   install ${library}, add its skills and MCP server, keep them on its version
  contui sync       copy the installed version's skills into .claude/skills
  contui mcp        run the installed version's MCP server
`;

const [command, ...args] = process.argv.slice(2);

if (command === 'init') await init(args);
else if (command === 'sync') await sync();
else if (command === 'mcp') await mcp();
else if (command === '--version' || command === '-v') console.log(versionOf(self));
else {
    console.log(help);
    if (command && command !== 'help' && command !== '--help' && command !== '-h')
        process.exitCode = 1;
}
