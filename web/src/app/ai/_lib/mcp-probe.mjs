/*
 * Run by mcp-live.ts at build time, in a node process of its own: imports the MCP server's built
 * bundle (importing it does not start the server), reads each tool's arguments from its input
 * schema, calls each tool once with the example the site shows, and prints it all as JSON. The
 * site's tool pages then show the arguments the server declares and an answer it really gives,
 * never a copy that falls behind.
 *
 *     node mcp-probe.mjs <path to mcp/dist/server.mjs> <examples as JSON>
 */
import { pathToFileURL } from 'node:url';

const [bundle, examplesJson] = process.argv.slice(2);
const server = await import(pathToFileURL(bundle).href);
const examples = JSON.parse(examplesJson);

/** A zod schema's description, looking through the optional and default wrappers. */
const describe = schema => {
    let current = schema;
    while (current) {
        if (current.description) return current.description;
        current = current._zod?.def?.innerType;
    }
    return '';
};

/** A schema's shape as a person reads it: 'string', 'one of: a, b', 'array of object' … */
const typeOf = schema => {
    const def = schema?._zod?.def;
    if (!def) return 'unknown';
    switch (def.type) {
        case 'optional':
        case 'default':
        case 'nullable':
            return typeOf(def.innerType);
        case 'enum':
            return `one of ${Object.values(def.entries)
                .map(value => `'${value}'`)
                .join(', ')}`;
        case 'array':
            return `array of ${typeOf(def.element)}`;
        case 'union':
            return def.options.map(typeOf).join(' or ');
        case 'record':
            return 'object';
        case 'number':
            return (def.checks ?? []).some(check => check._zod?.def?.format === 'safeint')
                ? 'integer'
                : 'number';
        default:
            return def.type;
    }
};

const optional = schema => {
    const type = schema?._zod?.def?.type;
    return type === 'optional' || type === 'default';
};

const text = result =>
    (result.content ?? [])
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('\n');

const tools = [];
for (const tool of server.tools) {
    const args = Object.entries(tool.input ?? {}).map(([name, schema]) => ({
        name,
        type: typeOf(schema),
        required: !optional(schema),
        description: describe(schema),
    }));
    const example = examples[tool.name];
    let output = '';
    if (example) {
        try {
            output = text(await tool.handle(example));
        } catch (cause) {
            output = `Error: ${cause instanceof Error ? cause.message : String(cause)}`;
        }
    }
    tools.push({ name: tool.name, args, example: example ?? null, output });
}

const prompts = server.prompts.map(prompt => ({ name: prompt.name }));

// The default theme's DESIGN.md: create_theme with an option the default already has.
const createTheme = server.tools.find(tool => tool.name === 'create_theme');
const theme = createTheme
    ? (await createTheme.handle({ options: { font: 'geist' }, label: 'Continuum' }))
          .structuredContent
    : undefined;

process.stdout.write(
    JSON.stringify({
        tools,
        prompts,
        designMd: theme?.designMd ?? '',
        appCss: theme?.appCss ?? '',
    }),
);
