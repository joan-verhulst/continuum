---
name: continuum-taste
description: Designs and builds product UI in Continuum, Joan's design system — quiet, dense tool UI with hairline borders, one action colour, 13px type and controls on two heights, in light and dark, with a theme builder for a product's own accent, greys, font and corners. Ships the React component library (Base UI + Tailwind v4 + cva), a chart kit, tokens, a prebuilt stylesheet, reference screens and a method for products the library never covered. Use when asked to build, design, restyle or review an app, page, dashboard, form or component "in Continuum", "in my style" or "like my design system", in any project.
---

# Continuum

Continuum is a design system for tool UI, distilled from real product screens. The look is **quiet, dense and
precise**: 13px type, hairline borders, one action colour, almost no shadow, and controls on two heights (34 and
38px) so anything beside anything lines up. It has one default theme and a builder for others.

| Path (relative to this file)  | What it is                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `references/rules.md`         | **The rules**: page kinds and widths, colour, type, surfaces, radius, padding, heights, states, motion, code idiom, anti-patterns. Read before writing UI. |
| `references/components.md`    | Every component, grouped, with what it is for. Read the `.tsx` file for props.                      |
| `references/designing-new.md` | The method for products the library doesn't cover: screen character, patterns for common needs, a recipe for new components, a worked CMS. |
| `references/screens/*.tsx`    | Screens built with the system. **Read one close to the page you are making.**                       |
| `assets/continuum/`           | The library: `components/`, `lib/`, `charts/`, `styles/`, `index.ts`, and the prebuilt `styles.css`. Copy it in. |

When in doubt, do less, and copy what an existing component or reference screen already does.

## Workflow

1. **Pick the setup route** below from the project's stack: check `package.json` and the CSS entry. In an empty
   project, scaffold Vite + React + TypeScript + Tailwind v4 and use route A.
2. **Install the library**, unless it is already there (a `continuum` folder or a `.continuum` class).
3. **Design before building.** For anything beyond one component, read `references/designing-new.md`: model the
   objects and the main task, name each screen's kind (index, detail, form, settings, overview), and decide the
   look. A product the references never covered is expected; derive it from the rules, not from SaaS habits.
4. **Read a reference screen** of the same kind. The generic app comes first, all in the frame of
   `workspace.tsx`: `overview`, `customers` (an index), `customer` (a detail), `new-customer` (a form),
   `settings` and `sign-in`. The older product screens (`analytics-overview`, `checkout-funnel`,
   `sequence-editor`, `invoice-editor`, `report-generator`, `risk-report`, with their frames in `shared.tsx`)
   show denser layouts; where they split a list and its item side by side, that is their history, not a pattern.
5. **Compose from components first**; write utilities only for layout between them. Never restyle a component's
   internals from outside beyond spacing and width. Where nothing fits, follow the recipe in `designing-new.md`.
6. **Make it work**: real state for the main task, realistic sample data in the product's domain, empty states.
7. **Look at it** at 1440×900, in light and dark, and go through the checklist below.

## Setup

### Route A: React + Tailwind v4 (preferred; required for building new screens)

1. Copy `assets/continuum/` into the project, e.g. `src/components/continuum/`, keeping its inner structure (the
   stylesheet finds the components through `@source "../components"`).
2. Install `@base-ui/react class-variance-authority clsx tailwind-merge lucide-react react-day-picker`, and for
   fonts `@fontsource-variable/geist @fontsource-variable/inter` (import both in the entry file). React 19.
   Charts also need `@visx/curve @visx/event @visx/grid @visx/group @visx/responsive @visx/scale @visx/shape
   d3-array d3-shape motion @number-flow/react`; skip them if the project draws no charts.
3. In the Tailwind entry CSS:
   ```css
   @import "tailwindcss";
   @import "./components/continuum/styles/theme.css"; /* path to the copied folder */
   ```
   `theme.css` **replaces** Tailwind's colours, font sizes, weights, radii and shadows with Continuum's. If the
   project has its own Tailwind theme that must survive, use route B.

   **If the project has an `app.css` and a `DESIGN.md` exported from the playground's theme builder**, that
   `app.css` is the entry instead (the whole theme in Tailwind's names, light in `@theme`, dark under
   `[data-mode="dark"]`). Leave out the copied `styles/` folder; `DESIGN.md` holds the project's theme.
4. Wrap the app in `<Theme mode="light">`; add `theme="name"` once a theme block exists. Everything styled sits
   inside a `Theme`; portalled parts re-open it themselves.
5. Import from the copied folder's `index.ts`, and charts from `charts/index.ts`. The reference screens import
   from `'continuum'`: rewrite that to the local path, or add a `continuum` path alias.

### Route B: React, with a host Tailwind theme to keep, or no Tailwind

Copy `assets/continuum/` and install the same dependencies, then import its prebuilt `styles.css` instead of
`theme.css`. Components render correctly inside `<Theme>`. The prebuilt file holds only the utilities the
components use, so write page layout with the host's own Tailwind and reach Continuum's values through variables:
`bg-(--color-neutral-100)`, `border-(--color-neutral-200)`, `rounded-(--radius-card)`. Without Tailwind, use
`var(--color-neutral-200)` in plain CSS.

### Route C: not React (Vue, Svelte, plain HTML, native)

Copy `styles/tokens.css` and put `class="continuum" data-mode="light"` on the root. Rebuild each component from
its `.tsx` file: the class strings in its `cva` call are the exact spec (heights, padding, radius, colour per
state).

## Theming

With no theme, `tokens.css` is the baseline: achromatic greys, a near-black action, Geist, pill docks, filled
segments. Use it unless the product has a colour or mood of its own. Then `createThemeCss` (in
`lib/create-theme.ts`, also behind the playground's theme builder) turns a few options into a
`.continuum[data-theme="name"]` block; put it after the tokens import and open the scope with the name.

| Option        | Values                                  | Sets                                                              |
| ------------- | --------------------------------------- | ----------------------------------------------------------------- |
| `accent`      | a hex colour                            | the primary ramp's 500, the rest built in oklch on Tailwind's curve; the data colours follow |
| `neutral`     | `{ hue, tint }`                         | the greys' hue and faint chroma (0 pure grey, 0.012 clearly tinted) |
| `font`        | `geist` · `inter` · `system` · a family | `--font-sans`                                                     |
| `action`      | `neutral` · `accent`                    | what the primary button, checked controls and the active rail item fill with |
| `actionStyle` | `flat` · `lit` · `glossy`               | a top highlight and ring, or a gradient as well                   |
| `tint`        | `neutral` · `accent`                    | the selection wash: translucent grey, or the accent's palest step |
| `segment`     | `filled` · `raised`                     | the active segment: the action fill, or a chip with a hairline    |
| `dock`        | `pill` · `rounded`                      | the dock, rail and chips: pills, or 10px corners                  |
| `radius`      | a number                                | the corner scale (`<Theme radius>` does the same at runtime)      |
| `charts`      | `{ steps, dark?, series? }`             | data colours of the theme's own, in place of the accent-led set   |

```ts
const css = createThemeCss({ name: 'brand', accent: '#2c52e8', font: 'inter', action: 'accent', segment: 'raised' });
```

```tsx
<Theme theme="brand" mode="light">…</Theme>
```

Every theme works in `mode="light"` and `mode="dark"`; dark mode reverses each ramp.

## Review checklist

Components first · only tokens · hairline, not shadow · space, not dividers (full-width ones in floating
containers) · content width by density · one column on a detail · radii nested and concentric · controls on 34 or
38 · two weights · 13px base · icons at stroke 2 · one action colour, one primary action per view · a breadcrumb on
every page · visible focus ring · inside a `Theme` · works in the default theme, an accent theme and dark ·
`data-slot` on every new part · looked at in light and dark at 1440×900.
