import assert from 'node:assert/strict';
import { test } from 'node:test';
import { has, useServer } from './helpers.mjs';

/*
 * What a client sees before it calls anything: the server's name and instructions, the tools in
 * the order an agent should meet them, and the prompts.
 */

const server = useServer();

test('the server introduces itself as Continuum, with instructions', () => {
    assert.equal(server.client.getServerVersion()?.name, 'Continuum');
    const instructions = server.client.getInstructions() ?? '';
    assert.ok(
        instructions.length > 200,
        `Expected the server's instructions, got: "${instructions}"`,
    );
});

test('a client is offered every tool, building first, then improving, then theming', async () => {
    const { tools } = await server.client.listTools();
    assert.deepEqual(
        tools.map(tool => tool.name),
        [
            'list_components',
            'get_component',
            'find_pattern',
            'get_page_kind',
            'get_foundation',
            'get_spacing',
            'get_tokens',
            'get_snapshot_script',
            'audit_ui',
            'audit_source',
            'create_theme',
            'check_theme',
        ],
    );
});

test('every tool reads only, and says what it returns and when to call it', async () => {
    const { tools } = await server.client.listTools();
    const problems = [];
    for (const tool of tools) {
        if (tool.annotations?.readOnlyHint !== true)
            problems.push(`${tool.name}: readOnlyHint is ${tool.annotations?.readOnlyHint}`);
        const length = tool.description?.length ?? 0;
        if (length <= 80)
            problems.push(
                `${tool.name}: description is ${length} characters: "${tool.description}"`,
            );
    }
    assert.deepEqual(problems, []);
});

test('a client is offered the three prompts', async () => {
    const { prompts } = await server.client.listPrompts();
    assert.deepEqual(
        prompts.map(prompt => prompt.name),
        ['build_screen', 'improve_ui', 'review_canvas'],
    );
});

test('each prompt runs to a procedure that names the tools it uses', async () => {
    const { prompts } = await server.client.listPrompts();
    for (const prompt of prompts) {
        // Fill every argument, required or not, so a prompt with required arguments still renders.
        const value = name => ({ medium: 'react', mode: 'light' })[name] ?? 'a settings page';
        const args = Object.fromEntries(
            (prompt.arguments ?? []).map(argument => [argument.name, value(argument.name)]),
        );
        const result = await server.client.getPrompt({ name: prompt.name, arguments: args });
        const body = result.messages.map(message => message.content?.text ?? '').join('\n');
        assert.ok(body.length > 100, `${prompt.name} rendered only: "${body}"`);
        has(
            body,
            /get_|audit_|list_|find_|create_|check_/,
            `${prompt.name} names no tool:\n${body}`,
        );
    }
});
