<img alt="Continuum" height="48" src="brand/continuum-mark-round.svg" width="48">

# Continuum

A React design system for quiet, dense tool UI: 13px type, hairline borders, one action colour, two control
heights, and a theme builder so the same components fit any product. Built on [Base UI](https://base-ui.com/)
primitives (`@base-ui/react`), Tailwind CSS v4, class-variance-authority and lucide-react.

## The idea

- **One token sheet.** Components read semantic tokens by Tailwind's own names (`--color-*`, `--radius-*`,
  `--shadow-*`); nothing in a component names a colour, a font or a theme. `src/styles/tokens.css` is the default
  theme.
- **Semantic by index.** Colour ramps are used by what the step means: `neutral-50` is the surface, `neutral-100`
  the canvas, `neutral-200` the hairline, `neutral-600` secondary text (hints and placeholders too),
  `neutral-950` primary text. Each role sits on the lightest whole step that passes WCAG contrast: 4.5:1 for read
  text, 3:1 for the focus ring and the border of an unchecked checkbox or radio (`neutral-500`). Dark mode reads
  every ramp back to front, so components never need `dark:` variants or raw hex.
- **Themed by choice, not by product.** A theme is a handful of choices (an accent, how grey the greys are, a
  font, how the action and the selection draw, the corners) turned into a block of CSS that overrides the default
  tokens. The playground's Projects view builds it; so does `createThemeCss()`. For a project, the builder
  exports the theme as an `app.css` in Tailwind's names and a `DESIGN.md` for Claude.
- **Two control heights.** Everything that sits in a row is 34px (buttons, small inputs and selects, segmented
  controls, nav items, pagination) or 38px (medium inputs and selects, large buttons, the dock), so a field and a
  button beside it line up without adjustment. Widths of panels and popups (the sidebar, a toast, a popover, a
  menu) are fixed pixel tokens too, so a theme's spacing unit changes the room inside them, never their size.
- **Pages by density.** A page sits in a centred column as wide as its content needs: 640px to make or edit one
  thing and for settings, 896 for overviews, details and documents, 1080 for a table, 1280 for a very dense one. An item opens on its
  own page with a breadcrumb back, never in a pane beside its list.

Everything is scoped under `.continuum`, so the system can sit inside another site without touching its variables.

## Using it in a project

This is a private workspace package, not on npm (see the licence). Two ways in:

- **As a git dependency**, in your own projects: `pnpm add github:joan-verhulst/continuum`. The package ships its
  TypeScript source, which Vite compiles as a dependency; Next.js needs `transpilePackages: ['continuum']`.
- **Copied in**: copy `src/` into the project (the bundled Claude skill does exactly this) and import from the
  copied folder.

Peer dependencies: `react` and `react-dom` 19. The date picker needs `react-day-picker`; the charts need nothing
more.

### (a) In a Tailwind v4 app

Import the theme into your Tailwind entry and point Tailwind at the package so it generates the classes the
components use:

```css
@import "tailwindcss";
@import "continuum/theme.css";

@source "../node_modules/continuum/src";
```

`theme.css` resets Tailwind's default colour, font and weight scales to the system's tokens, so inside this
stylesheet only the system's palette exists.

### (b) In any React app, with the prebuilt stylesheet

`dist/styles.css` contains preflight, tokens and every utility the components use, all scoped to `.continuum`. No
Tailwind setup is needed:

```tsx
import 'continuum/styles.css';
import { Button, Theme } from 'continuum';

export const App = () => (
    <Theme mode="light">
        <Button>Save</Button>
    </Theme>
);
```

### Theme and fonts

- Everything the system styles has to sit inside a `<Theme>` (it renders a `.continuum` element with `data-mode`
  and, for a custom theme, `data-theme`). Themes nest; `useTheme()` reads the current one. Portalled content (menus,
  tooltips, dialogs) re-opens the theme with `<ThemeScope>`, which the components already do. Every overlay's
  content (`DialogContent`, `SheetContent`, `PopoverContent`, `DropdownMenuContent`, `TooltipContent`,
  `SelectContent`, `ComboboxContent`, `InfoTip`) takes a `container` to portal into instead of the body, so a
  dialog or menu can be shown open inside a box of its own, as the playground does.
- The corners follow one corner scale, a theme choice (`radius`: `0.5` halves every corner, `0` squares them off).
  Set it in the playground's builder or in `createThemeCss()`; the exported `app.css` carries the corners already
  worked out.
- Fonts are not bundled. A theme picks one of Geist (the default), Inter, Instrument Sans, IBM Plex Sans and
  Figtree, or names a family of its own. Each is read from `--font-<name>` (`--font-geist`,
  `--font-ibm-plex-sans` …), then its Fontsource variable family, then the installed one. Load the one you use,
  for example with `@fontsource-variable/geist`, or set the variable from `next/font`.

## Theming

With no theme applied, `tokens.css` is the baseline: achromatic greys, a near-black action, Geist, pill docks.
It is not a theme of its own; a theme is what a product adds on top. In the playground, **Projects** holds one per
product, switched between at the top of the sidebar. A new one starts clear and is built in six steps: the primary
colour and the step it is, the neutral colour, the chart colours (auto or a harmony, adjusted on a wheel), the font,
the action and the corners, the type, padding and heights, then a review. A preview beside the steps takes the
theme, and its check layer measures it in light and dark, with a contrast grid. **Use this theme** makes it the
theme the whole playground wears while the project is current; anything that misses its contrast is put first.

**Export**, on the review, hands a project two files:

- `app.css`, the whole theme as a Tailwind v4 entry in Tailwind's own names (colours, type, radii, shadows,
  spacing, widths), light in `@theme` and dark under `[data-mode="dark"]`. It takes the place of `theme.css`, and
  the components read the same names.
- `DESIGN.md`, a brief for Claude: how the project is set up, the theme in words and the system's rules. Put it at
  the root and add `@DESIGN.md` to `CLAUDE.md`.

To change the look in a project, change the values in `app.css` by their Tailwind names (and their dark
counterparts with them), or build the theme again and export it. The `--continuum-*` names are the engine's own;
`app.css` leaves them out, and a project never writes them.

To switch themes at runtime instead, while using the library's own stylesheet, let `createThemeCss()` write the
theme as a scoped `.continuum[data-theme="custom"]` block, load it after the tokens, and open the scope with its
name:

```ts
import { createThemeCss } from 'continuum';

createThemeCss({
    name: 'custom',
    accent: '#2c52e8',
    neutral: { hue: 80, tint: 0.006 },
    font: 'inter',
    action: 'accent',
    actionStyle: 'glossy',
    dock: 'rounded',
    radius: 0.5,
});
```

```tsx
<Theme theme="custom" mode="dark">…</Theme>
```

An accent leads the data colours; a theme with a palette of its own passes `charts` (the steps, their dark-mode
changes and the independent series) instead.

Ramps are built in oklch on Tailwind's curve (`themeAccentRamp`, `themeNeutralRamp`): one lightness curve for
every hue, chroma on a bell that peaks at 600, and your colour exactly at 500. The default status ramps are built
the same way, so an accent sits beside them without a seam. Every theme works in both modes.

## Components

The components come in families: the app frame (shell, sidebar, top nav, header bar, dock), navigation,
actions, inputs, forms and settings, filtering, overlays, content, labels, status, messages and chat. The full
list, with what each is for, is in
[the skill's component reference](.claude/skills/continuum-taste/references/components.md), and every one has a
page in the playground. Compound parts (`DialogContent`, `SelectItem`, `TableRow` …) and the cva `*Variants`
functions are exported alongside each family.

### Charts

A separate entry point, `continuum/charts`, written for Continuum with no dependencies of its own: it draws every
mark itself.

```tsx
import { ChartCard } from 'continuum/charts';

<ChartCard title="Visitors" value="12,480" delta="+10.7%" comparison="on last week"
    data={rows} x="date" series={[{ key: 'visitors' }]} />
```

A chart takes its rows and series as props: area, line and bar charts (and the bar chart on its side), donut,
treemap, funnel, radar, rose, bullet, uptime strip, bubble and candlestick, each in the same card (`ChartFrame`,
or `ChartCard` for the plotted ones). Colours and chrome come from the `--color-chart-*` tokens, so the charts
follow the theme and mode like every component. Which chart for which need, and how each is drawn, is in
[the skill's chart reference](.claude/skills/continuum-taste/references/charts.md).

## Playground

The `playground` workspace is built from the system itself:

- **Foundations:** colour, type, surfaces and radii, layout, padding, states and motion, one article each, read
  live from the tokens.
- **Components:** every component on its own page, with knobs to try its variants and the pieces it is used in.
- **Patterns:** six screens of one generic app (a dashboard, a list, a detail, a form, settings and sign-in) and
  eight blocks from earlier products. Every screen opens full screen at the window's own size.
- **Projects:** a theme per product, edited beside a preview, measured for contrast and exported for the project.
- **Lab:** a raster lab.

```sh
pnpm install
pnpm dev
```

## Repository

| Path                             | What it is                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `src/components`, `src/lib`      | The library and its helpers, including the theme builder's maths.             |
| `src/charts`                     | The chart kit (`continuum/charts`).                                           |
| `src/styles`                     | `tokens.css` (the default theme), `theme.css` (the Tailwind entry).           |
| `dist/styles.css`                | The prebuilt, scoped stylesheet.                                              |
| `playground`                     | The playground app.                                                           |
| `site`                           | The marketing site, a Vite app beside the playground.                         |
| `labs/raster`                    | An experiment: screens on a Swiss raster. Not part of the package.            |
| `scripts`                        | The stylesheet build, its scoping plugin and the skill build.                 |
| `.claude/skills/continuum-taste` | A Claude skill that carries the library, its rules and its method into other projects. |
| `.claude/skills/continuum-fix-padding` | A Claude skill that works out padding and gaps with the spacing formula. |
| `brand`                          | The Continuum mark and the social preview.                                    |

The skills' copies of the library (`assets/`, `references/screens/`, `continuum-fix-padding/scripts/spacing.ts`) are built by
`pnpm build:skill` and not tracked.

## Scripts

| Script               | Does                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `pnpm dev`           | Starts the playground (Vite).                                         |
| `pnpm dev:site`      | Starts the marketing site (Vite).                                     |
| `pnpm build`         | Builds `dist/styles.css`, then the playground.                        |
| `pnpm build:css`     | Builds the scoped `dist/styles.css` (`scripts/build-css.mjs`).        |
| `pnpm build:skill`   | Builds the stylesheet, then the skills' copies of the library.        |
| `pnpm install:skill` | Builds the skills and installs both to `~/.claude/skills`.            |
| `pnpm type-check`    | Type-checks the package, the playground and the site.                 |
| `pnpm lint`          | Runs Biome.                                                           |
| `pnpm lint:fix`      | Runs Biome and applies fixes.                                         |
| `pnpm check`         | Type-checks, lints and builds the skills: the one command before a commit. |

## Credits

Continuum is built on open-source work, used under its own licences:

- [Base UI](https://base-ui.com/) (`@base-ui/react`, MIT): the primitives behind every interactive component.
- [react-day-picker](https://daypicker.dev/) (MIT): the calendar behind the date pickers.
- Tailwind CSS, class-variance-authority, clsx and tailwind-merge (MIT), and lucide-react (ISC) for the icons.

## License

Copyright © 2026 Joan Verhulst. All rights reserved. The code is public to read, not licensed for use, copying or
redistribution. See [LICENSE](LICENSE).
