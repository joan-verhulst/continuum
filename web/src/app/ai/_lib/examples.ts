/*
 * The call each MCP tool's page shows, one per tool: short, the kind an agent makes on a real
 * screen. The answer under it is not written here: mcp-live.ts runs each call against the built
 * server at build time and shows what it returns.
 */

/** The toolbar the audit examples read: a hand-built button, as a codebase before Continuum has it. */
export const auditedFile = {
    path: 'src/toolbar.tsx',
    content: [
        'export const Toolbar = () => (',
        '    <div className="flex gap-3 p-3 shadow-md">',
        '        <button className="h-9 rounded-md bg-blue-600 px-4 font-semibold text-white">',
        '            New invoice',
        '        </button>',
        '    </div>',
        ');',
        '',
    ].join('\n'),
};

export const examples: Record<string, Record<string, unknown>> = {
    list_components: { group: 'Actions' },
    get_component: { name: 'Badge' },
    find_pattern: { need: 'filter bar', limit: 1 },
    get_page_kind: { kind: 'settings' },
    get_foundation: { topic: 'radius' },
    get_spacing: { box: 'text', runs: [{ size: 13, lines: 2 }] },
    get_tokens: { format: 'json', mode: 'light' },
    get_snapshot_script: { root: 'main' },
    audit_ui: {
        medium: 'react',
        facts: [
            {
                at: 'toolbar',
                property: 'height',
                value: '36px',
                subject: { kind: 'control', tag: 'button', name: 'New invoice' },
                written: { form: 'rendered', text: '36px' },
            },
        ],
    },
    audit_source: { files: [auditedFile] },
    create_theme: { options: { accent: '#4f46e5' }, label: 'Ledger' },
    check_theme: { options: { accent: '#4f46e5' }, mode: 'light' },
};
