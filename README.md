<img alt="Continuum" height="48" src="brand/continuum-mark-round.svg" width="48">

# Continuum

A design system for quiet, dense tool UI: 13px type in two weights, hairline borders, one action colour, controls
on two heights, light and dark. It comes as a React component library (Base UI, Tailwind CSS v4), a theme
builder, Claude skills and an MCP server that bring the system to other projects.

## Get started

You need Node 20 or newer and pnpm.

```sh
git clone git@github.com:joan-verhulst/continuum.git
cd continuum
pnpm install
pnpm install:skill
```

`pnpm install:skill` sets up everything an agent needs, once per machine:

- copies the two Claude skills to `~/.claude/skills`, so every project can use them;
- registers the MCP server with Claude Code for every project (it runs from this clone).

Check it worked with `claude mcp list`: `continuum` should say connected.

To look around, start the playground:

```sh
pnpm dev
```

## Use it with Claude

**Skills.** Ask for UI "in Continuum" and Claude uses the `continuum-taste` skill, or call it by name:
`/continuum-taste build the invoices page`. `/continuum-fix-padding <file>` works out padding and gaps with the
spacing formula.

**MCP server.** Gives any agent the system as tools: component specs, page anatomies, patterns, tokens, the
spacing formula, the theme builder, and an audit that says what to fix in UI that already exists, in any stack
(React, Angular, Vue, plain CSS, Qt, a Paper or Figma canvas). Try it in another project:

- "Using Continuum, what's the spec of a Select?"
- "Audit `src/components/Header.tsx` against Continuum and fix what it finds."
- `/mcp__continuum__improve_ui` runs the audit-and-fix loop.

For Cursor, VS Code or another client, add a server with command `node` and argument
`/path/to/continuum/mcp/dist/server.mjs` (`pnpm install:skill` prints the exact path). The playground's **MCP
server** page lists every tool and has the config for each editor.

**Keeping it current.** `git pull` updates the server. Run `pnpm install:skill` again when the skills change, since
those are copies.

## Use the library in a React project

Continuum isn't on npm. Add it from GitHub:

```sh
pnpm add github:joan-verhulst/continuum @fontsource-variable/geist
```

It needs React 19. In Next.js, add `transpilePackages: ['continuum']` to the config.

Then pick one of two ways to load the styles.

**With Tailwind v4** (recommended): in your Tailwind entry CSS,

```css
@import "tailwindcss";
@import "continuum/theme.css";

@source "../node_modules/continuum/src";
```

**Without Tailwind**: import the prebuilt stylesheet once.

```ts
import 'continuum/styles.css';
```

Load the font and wrap your app in `Theme`:

```tsx
import '@fontsource-variable/geist';
import { Button, Theme } from 'continuum';

export const App = () => (
    <Theme mode="light">
        <Button>Save</Button>
    </Theme>
);
```

Everything Continuum styles must sit inside a `Theme`. Charts are a separate entry: `import { ChartCard } from
'continuum/charts'`.

## Give a product its own look

In the playground, open **Projects** and build a theme in five steps: colour, type, controls, sizes, review. The
review checks contrast in light and dark, then **Export** gives you two files:

- `app.css`: the whole theme as a Tailwind v4 entry. Use it in place of `continuum/theme.css`.
- `DESIGN.md`: a brief for Claude. Put it at the project's root and add `@DESIGN.md` to `CLAUDE.md`.

The MCP server's `create_theme` tool writes the same two files from a prompt.

## Commands

| Command              | What it does                                                          |
| -------------------- | --------------------------------------------------------------------- |
| `pnpm dev`           | Starts the playground.                                                |
| `pnpm dev:site`      | Starts the marketing site.                                            |
| `pnpm install:skill` | Builds and installs the skills, and registers the MCP server.         |
| `pnpm build`         | Builds the stylesheet and the playground.                             |
| `pnpm build:mcp`     | Builds the MCP server.                                                |
| `pnpm check`         | Type-checks, lints, builds the skills and the server, runs the tests. Run it before a commit. |

## What's where

| Path              | What it is                                                                  |
| ----------------- | --------------------------------------------------------------------------- |
| `src`             | The library: components, charts, helpers and the token sheets.              |
| `dist/styles.css` | The prebuilt stylesheet.                                                    |
| `playground`      | The playground: foundations, components, patterns, projects, install guides. |
| `mcp`             | The MCP server.                                                             |
| `.claude/skills`  | The Claude skills. The rules of the system are written in `continuum-taste/references`. |
| `site`            | The marketing site.                                                         |
| `scripts`         | The stylesheet and skill builds.                                            |

## Credits

Built on [Base UI](https://base-ui.com/) and [react-day-picker](https://daypicker.dev/) (MIT), Tailwind CSS,
class-variance-authority, clsx and tailwind-merge (MIT), and lucide-react (ISC).

## License

Copyright © 2026 Joan Verhulst. All rights reserved. The code is public to read, not licensed for use, copying or
redistribution. See [LICENSE](LICENSE).
