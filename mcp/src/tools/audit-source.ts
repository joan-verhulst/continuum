import { z } from 'zod';
import { auditSource } from '../audit/source';
import { fileCap, findTheme, readSources } from '../audit/source/disk';
import { modeArgument, themeArgument } from '../support/arguments';
import { defineTool, readsDisk, structured, ToolError } from '../support/tool';
import { loadSystem, systemFromCss } from '../system/values';

export const auditSourceTool = defineTool({
    name: 'audit_source',
    title: 'Audit source files',
    description: `Reads UI source in any stack and returns what to fix to bring it to Continuum, line by line: { medium, theme, mode, summary, findings[], notes[] }. Each finding has rule, severity ('fix' to apply, 'advise' to propose first), confidence, at ('path:line,line'), what was found and what Continuum wants in units, why (with the reference section) and the fix, written in the form the file uses (a utility class, a declaration in the file's syntax, a value in code, or an import).

It reads every file the same way, whatever the framework: style declarations in any syntax (CSS, SCSS, Less, Sass, Qt stylesheets, QML properties, <style> blocks and style attributes in any markup, CSS in template literals, style objects and named style arguments in code), utility classes in any class string, colour literals in any language (hex, rgb(), Color(0xFF…), QColor, ImVec4, UIColor …) and raw elements in any markup (a hand-built <button>, <input>, <table>, badge). Sizes are read where they are written as property: value or as a utility; colours wherever they are written. A value whose subject it cannot tell (a hex in a constant) is judged less surely.

Call this first when improving an existing codebase, before editing; apply the findings, then call it again until it is clean. For what renders (spacing between parts, contrast on real surfaces) use audit_ui on the running page.`,
    input: {
        paths: z
            .array(z.string())
            .optional()
            .describe(
                `Files or folders to read, relative to the working directory or absolute. Folders are walked for every text file a UI is written in, past node_modules, dist, build, .git, .next and coverage; at most ${fileCap} files.`,
            ),
        files: z
            .array(z.object({ path: z.string(), content: z.string() }))
            .optional()
            .describe(
                'Files given inline, for a client that cannot share its disk: each its path (the extension says how its comments are written) and its full text.',
            ),
        theme: themeArgument
            .optional()
            .describe(
                "The project's theme: a path to the app.css the theme builder exported, or its contents. Left empty, an app.css with @theme among the paths or under src/ is used, else Continuum's default theme.",
            ),
        mode: modeArgument.optional(),
    },
    annotations: readsDisk,
    handle: async ({ paths = [], files = [], theme, mode = 'light' }) => {
        if (!paths.length && !files.length) {
            throw new ToolError(
                'Nothing to read. Pass paths (files or folders, e.g. ["src"]) or files ([{ path, content }]).',
            );
        }
        const read = await readSources(paths);
        const all = [...read.files, ...files];
        if (!all.length) {
            throw new ToolError(
                `No source files found in ${paths.map(path => `'${path}'`).join(', ')}${read.missing.length ? ` (not found: ${read.missing.join(', ')})` : ''}. Pass a folder that holds the UI, or the files inline with files.`,
            );
        }
        const notes: string[] = [];
        let system: Awaited<ReturnType<typeof loadSystem>>;
        if (theme?.trim()) {
            system = await loadSystem(theme).catch(() => {
                throw new ToolError(
                    `Could not read the theme '${theme}'. Pass the path to the project's app.css, its contents, or leave theme empty for Continuum's default.`,
                );
            });
        } else {
            const found = await findTheme(all);
            system = found ? systemFromCss(found.css, found.path) : await loadSystem();
            if (found) notes.push(`Checked against the project's theme in ${found.path}.`);
        }
        if (read.missing.length) notes.push(`Not found: ${read.missing.join(', ')}.`);
        if (read.capped) {
            notes.push(`Stopped at ${fileCap} files; call again with narrower paths for the rest.`);
        }
        return structured(auditSource(all, { system, mode, notes }));
    },
});
