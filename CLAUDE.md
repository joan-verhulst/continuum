# Continuum

A React design system for quiet, dense tool UI (Base UI, Tailwind v4, cva), its playground, and the skills that
carry it into other projects. For any UI work here, the system is described in
`.claude/skills/continuum-taste/references/`: `foundations.md` (the values), `pages.md` (the composition),
`components.md` (the parts) and `patterns.md` (need → build it as).

## Where things live

| Path                                  | What it is                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `src/components`, `src/lib`           | The library and its helpers (theme builder maths, the spacing formula). The source of truth. |
| `src/charts`                          | The chart kit, a separate entry (`continuum/charts`).                      |
| `src/styles`                          | `tokens.css` (the default theme), `theme.css` (the Tailwind entry).        |
| `dist/styles.css`                     | The prebuilt, scoped stylesheet. Built, but tracked: git installs need it. |
| `playground/src/showcase`             | The Components view: `kit.tsx` is shared, `entries/<id>.tsx` is one component's preview, knobs and in-use piece. |
| `playground/src/screens`, `examples`  | The Patterns view: screens of one generic app, then blocks from earlier products. |
| `playground/src/theme-editor`        | Projects: a product's theme, edited in tabs beside a preview, with its accessibility checks. |
| `playground/src/theme-export.ts`      | The theme builder's export: `app.css` and the `DESIGN.md` brief.           |
| `.claude/skills/continuum-taste`      | The skill. `SKILL.md` and `references/*.md` are written by hand; `assets/` and `references/screens/` are built. |
| `.claude/skills/continuum-fix-padding` | The spacing skill. `scripts/spacing.ts` is built from `src/lib/spacing.ts`. |

## Conventions

- Components read tokens by Tailwind's names (`var(--color-chart-grid)`, `var(--radius-control)`), never
  `--continuum-*`: that prefix is the engine's alone (the raw ramps, the raw radii and the corner scale), so a
  project's exported `app.css` drives every component.
- A new component goes in `src/components/`, is exported from `src/index.ts`, gets a file in
  `playground/src/showcase/entries/` (its entry with knobs and one in-use piece) listed in `entries/index.ts`, and a
  line in the skill's `references/components.md`.
- Each rule has one home, and it is stated in units, never as a class string: values in
  `references/foundations.md`, composition in `pages.md`, a part's spec in `components.md`, a recipe in
  `patterns.md`; the Tailwind names for the values live only in `references/media/react.md`. The `DESIGN.md`
  brief in `theme-export.ts` is the short form of foundations and pages for projects, so change both together.
  The README describes the package for people and points at the skill for the rest.
- A design mistake an agent makes is fixed in the skill's text, then checked by re-running the same prompt with
  only the skill's markdown to read; a component changes only on a judgement of the component itself.
- Experiments that are not part of the package live outside `src/`: `labs/` for their code (the raster lab), and
  `playground/src/lab` or `playground/src/raster` for their pages. They stay out of the skill.
- Never edit the built copies under `.claude/skills/*/assets`, `references/screens` or `continuum-fix-padding/scripts/spacing.ts`;
  they are gitignored and rebuilt.

## Before finishing

Run `pnpm check`: it type-checks, lints and rebuilds the skills from `src/`. Look at UI changes in the running
playground (`pnpm dev`) in light and dark before reporting them done. `pnpm install:skill` also installs both
skills to `~/.claude/skills`, for other projects.

## Tencil pins

A prompt that says it came from Tencil ("pinned … on an element of their running app (via Tencil)") is a quick visual fix on the running playground. Make the change in the source and report back briefly. Skip visual verification: no screenshots or browser checks, since the dev server hot-reloads and the person is looking at the page. This replaces the usual screenshot check for these prompts only.
