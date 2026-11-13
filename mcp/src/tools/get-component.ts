import { z } from 'zod';
import {
    type ComponentMatch,
    closestNames,
    findComponent,
    inUseOf,
    knobsOf,
    renderKnobs,
    sections,
} from '../knowledge';
import { mediumArgument } from '../support/arguments';
import { defineTool, readOnly, ToolError, text } from '../support/tool';
import type { Medium } from '../types';

/*
 * A part's spec from components.md as written, then how to write it in the medium asked for: the
 * import and the variants in React, the traps on a canvas, the variables and values in units
 * everywhere else.
 */

/** The words the prose uses for a part: 'stat card', and 'radio' for RadioGroup. */
const partWords = (part: ComponentMatch) =>
    part.names.flatMap(name => {
        const phrase = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
        const first = phrase.split(' ')[0] ?? phrase;
        return phrase.includes(' ') && first.length > 3 ? [phrase, first] : [phrase];
    });

const mentions = (sentence: string, wordsOfPart: string[]) => {
    const plain = ` ${sentence.toLowerCase().replace(/[^a-z0-9-]+/g, ' ')} `;
    return wordsOfPart.some(
        word => new RegExp(` ${word}(?:s|es)? `).test(plain) || plain.includes(`-${word} `),
    );
};

const react = (part: ComponentMatch) => {
    const out = [`## In React\n\n\`import { ${part.exports.join(', ')} } from '${part.from}';\``];
    if (part.entry) {
        const knobs = knobsOf(part.entry);
        if (knobs.length > 0)
            out.push(`Variants and states (the playground's knobs):\n${renderKnobs(knobs)}`);
        const inUse = inUseOf(part.entry);
        if (inUse?.title) {
            const head = `In use: ${inUse.title}${inUse.note ? `. ${inUse.note}` : ''}`;
            // Only code that shows the part itself; a wrapper round another component says nothing.
            const code =
                inUse.code && part.exports.some(name => inUse.code?.includes(`<${name}`))
                    ? inUse.code
                    : undefined;
            const frame =
                code && /<App(Window|Scene)\b/.test(code)
                    ? " (AppWindow is the playground's page frame: the shell, header bar and column)"
                    : '';
            out.push(code ? `${head}${frame}\n\n\`\`\`tsx\n${code}\n\`\`\`` : head);
        }
    }
    out.push(
        'The values as Tailwind names come with get_tokens; the screen around the part from get_page_kind.',
    );
    return out.join('\n\n');
};

const canvas = (part: ComponentMatch) => {
    const file = sections('media/canvas.md');
    const drawing =
        file.find(section => section.heading === 'Drawing a part from its spec')?.body ?? '';
    const [order = '', rest = ''] = drawing.split(/\n\n(?=Common traps)/);
    const traps = rest
        .replace(/^Common traps:\s*/, '')
        .split(/;\s*|\.\s+(?=[A-Z])/)
        .map(trap => trap.replace(/\s+/g, ' ').trim())
        .filter(trap => trap && mentions(trap, partWords(part)));
    const out = [`## On a canvas\n\n${order.replace(/\s+/g, ' ').trim()}`];
    if (traps.length > 0)
        out.push(
            `Traps for this part:\n${traps.map(trap => `- ${trap.replace(/\.$/, '')}.`).join('\n')}`,
        );
    out.push(
        'Values are in px; colours and corners by their token names (`neutral-200`, `radius-control`). The file setup and the checks are in media/canvas.md; the screen comes from get_page_kind.',
    );
    return out.join('\n\n');
};

const mediumNames: Record<Medium, string> = {
    react: 'React',
    angular: 'Angular',
    vue: 'Vue',
    svelte: 'Svelte',
    html: 'HTML',
    css: 'CSS',
    canvas: 'a canvas',
    qt: 'Qt',
    other: 'your stack',
};

const css = (part: ComponentMatch, medium: Medium) => {
    const building =
        sections('media/css.md').find(section => section.heading === 'Building a part')?.body ?? '';
    const example = /```css[\s\S]*?```/.exec(building)?.[0] ?? '';
    const [intro = '', after = ''] = building.split(example || /$^/);
    const sentences = after
        .replace(/\s+/g, ' ')
        .split(/(?<=[.)])\s+(?=[A-Z])/)
        .filter(sentence => mentions(sentence, partWords(part)));
    const lead =
        medium === 'qt'
            ? "In Qt the spec above is the source of truth: write its values as QSS (or QML properties) in px, every colour from the theme's token values, never a literal picked by eye."
            : `In ${mediumNames[medium]} the spec above is the source of truth: write it as your own markup and styles, its values in units, every colour and radius read from the token variables (\`var(--color-neutral-200)\`, \`var(--radius-control)\`, \`var(--spacing-control)\`), never a hex value.`;
    const out = [`## In ${mediumNames[medium]}\n\n${lead}`];
    // The worked example is CSS; Qt's stylesheet reads the same properties.
    if (example) out.push(`${intro.replace(/\s+/g, ' ').trim()}\n\n${example}`);
    if (sentences.length > 0) out.push(sentences.map(sentence => `- ${sentence}`).join('\n'));
    out.push(
        "Behaviour (focus, keyboard, menus) comes from the framework's own primitives; keep the ARIA roles and data-state attributes the spec names. The token stylesheet comes from get_tokens.",
    );
    return out.join('\n\n');
};

export const getComponentTool = defineTool({
    name: 'get_component',
    title: 'Get component',
    description:
        "Get one part's spec from Continuum: what it is for and not for, what it sits with, its anatomy, its values in units (heights, padding, corners, type, colour roles) and its states, then how to write it in your medium (React: the import, its variants and an example in use; canvas: the drawing order and traps; CSS and other stacks: the token variables to read). Call this for each part you use, after list_components; find_pattern says which parts a need is built from. Accepts the library's names ('DropdownMenu', 'dropdown-menu') and common ones ('modal', 'drawer', 'toggle', 'kpi').",
    input: {
        name: z
            .string()
            .describe(
                "The part's name: 'Button', 'StatCard', 'dropdown-menu', or a common name such as 'modal'.",
            ),
        medium: mediumArgument
            .optional()
            .describe(`${mediumArgument.description} Defaults to 'react'.`),
    },
    annotations: readOnly,
    handle: ({ name, medium = 'react' }) => {
        const part = findComponent(name);
        if (!part) {
            throw new ToolError(
                `No component named "${name}". Closest: ${closestNames(name).join(', ')}. Call list_components to see the names, or find_pattern to find the parts for a need.`,
            );
        }
        const how =
            medium === 'react'
                ? react(part)
                : medium === 'canvas'
                  ? canvas(part)
                  : css(part, medium);
        return text(`${part.spec}\n\n${how}`);
    },
});
