<img alt="Continuum" height="48" src="brand/continuum-mark-round.svg" width="48">

# Continuum

A design system for quiet, dense tool UI: 13px type in two weights, hairline borders, one action colour, controls
on two heights, light and dark. It comes as a React component library (Base UI, Tailwind CSS v4), a theme
builder, Claude skills and an MCP server that bring the system to other projects.

## Get started

In your project (Node 20 or newer):

```sh
npx contui init
```

It installs `@contui/ui` as a dependency, with the project's own package manager, and wires it in:

- copies the two Claude skills into `.claude/skills` and keeps them out of git;
- registers the MCP server in `.mcp.json`, run from `node_modules`;
- adds `contui sync` to the project's `postinstall`, so every install copies the skills of the version in
  `package.json` again.

The package is the source: the version in `package.json` decides the components, the skills and the server
alike, for everyone on the project. Restart Claude Code and approve the `continuum` server; `claude mcp list`
should say it's connected. To update, update `@contui/ui` like any other dependency.

## Use it with Claude

**Skills.** Ask for UI "in Continuum" and Claude uses the `continuum-taste` skill, or call it by name:
`/continuum-taste build the invoices page`. `/continuum-fix-padding <file>` works out padding and gaps with the
spacing formula.

**MCP server.** Gives any agent the system as tools: a plan for a screen before any code, component specs, page
anatomies, patterns, tokens, the spacing formula, the theme builder, and an audit of the rendered page or the
source that says what to fix, in any stack (React, Angular, Vue, plain CSS, Qt, a Paper or Figma canvas). It
serves the same text as the skill, so the two work together: the skill carries the decisions, the server plans
from them and checks the result. Building a screen runs in that order: load the skill, `plan_screen`, build,
then `audit_ui` on the rendered page. Try it:

- "Using Continuum, what's the spec of a Select?"
- "Audit `src/components/Header.tsx` against Continuum and fix what it finds."
- `/mcp__continuum__improve_ui` runs the audit-and-fix loop.

For Cursor, VS Code or another client, add a server with command `node` and argument
`node_modules/@contui/ui/mcp/server.mjs`, or command `npx` and arguments `contui mcp`.

## Use the library in a React project

`npx contui init` installs it; `pnpm add @contui/ui` (or npm, yarn, bun) does the same without the skills. It
needs React 19, and `lucide-react` for icons.

Then pick one of two ways to load the styles.

**With Tailwind v4** (recommended): in your Tailwind entry CSS,

```css
@import "tailwindcss";
@import "@contui/ui/theme.css";
```

**Without Tailwind**: import the prebuilt stylesheet once.

```ts
import '@contui/ui/styles.css';
```

Load the font and wrap your app in `Theme`:

```tsx
import '@fontsource-variable/geist';
import { Button, Theme } from '@contui/ui';

export const App = () => (
    <Theme mode="light">
        <Button>Save</Button>
    </Theme>
);
```

Everything Continuum styles must sit inside a `Theme`. Charts are a separate entry: `import { ChartCard } from
'@contui/ui/charts'`.

## Give a product its own look

In the playground, open **Projects** and build a theme in five steps: colour, type, controls, sizes, review. The
review checks contrast in light and dark, then **Export** gives you two files:

- `app.css`: the whole theme as a Tailwind v4 entry. Put it at `src/app.css`, in place of `@contui/ui/theme.css`.
- `DESIGN.md`: a brief for Claude. Put it at the project's root and add `@DESIGN.md` to `CLAUDE.md`.

The MCP server's `create_theme` tool writes the same two files from a prompt.

## Work on Continuum itself

```sh
git clone git@github.com:joan-verhulst/continuum.git
cd continuum
pnpm install
pnpm dev
```

`pnpm dev` starts the site and the app: open localhost:3100 (the app is at /app). `pnpm install:skill` installs
this clone's skills to `~/.claude/skills` and registers its MCP server for every project, for trying a change
before it's published.

**Publishing.** Raise `version` in `package.json`, run `pnpm build:package`, then publish both packages:

```sh
npm publish pack/ui
npm publish pack/contui
```

`pack/ui` is `@contui/ui`: the library, the stylesheet, both skills, the MCP server and the CLI. `pack/contui` is
the CLI alone, so `npx contui init` works anywhere.

## Commands

| Command              | What it does                                                          |
| -------------------- | --------------------------------------------------------------------- |
| `pnpm dev`           | Starts the site and the app: open localhost:3100, the app at /app.    |
| `pnpm dev:web`       | Starts the site alone.                                                |
| `pnpm install:skill` | Builds and installs this clone's skills, and registers its MCP server. |
| `pnpm build`         | Builds the stylesheet and the playground.                             |
| `pnpm build:mcp`     | Builds the MCP server.                                                |
| `pnpm build:package` | Builds the two npm packages into `pack/`.                             |
| `pnpm check`         | Type-checks, lints, builds the skills and the server, runs the tests. Run it before a commit. |

## What's where

| Path              | What it is                                                                  |
| ----------------- | --------------------------------------------------------------------------- |
| `src`             | The library: components, charts, helpers and the token sheets.              |
| `dist/styles.css` | The prebuilt stylesheet.                                                    |
| `playground`      | The playground: foundations, components, patterns, projects, install guides. |
| `mcp`             | The MCP server.                                                             |
| `cli`             | `contui`: `init`, `sync` and `mcp`.                                         |
| `.claude/skills`  | The Claude skills. The rules of the system are written in `continuum-taste/references`. |
| `web`             | The public site, every page generated from the sources above; the app at `/app`. |
| `scripts`         | The stylesheet, skill and package builds.                                   |

## Credits

Built on [Base UI](https://base-ui.com/) and [react-day-picker](https://daypicker.dev/) (MIT), Tailwind CSS,
class-variance-authority, clsx and tailwind-merge (MIT), and lucide-react (ISC).

## License

Copyright © 2026 Joan Verhulst. Free to use in your own products and in products you make for others, commercial
or not. Not to be resold or redistributed, on its own or as another component library, design system, theme, skill
or MCP server. See [LICENSE](LICENSE).
