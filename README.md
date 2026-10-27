<img alt="Continuum" height="48" src="assets/continuum-mark-round.svg" width="48">

# Continuum

A React design system for quiet, dense tool UI: 13px type, hairline borders, one action colour, two control
heights, and a theme builder so the same components fit any product. Built on [Base UI](https://base-ui.com/)
primitives (`@base-ui/react`), Tailwind CSS v4, class-variance-authority and lucide-react.

## The idea

- **One token sheet.** Components read semantic tokens by Tailwind's own names (`--color-*`, `--radius-*`,
  `--shadow-*`); nothing in a component names a colour, a font or a theme. `src/styles/tokens.css` is the default
  theme.
- **Semantic by index.** Colour ramps are used by what the step means: `neutral-50` is the surface, `neutral-100`
  the canvas, `neutral-200` the hairline, `neutral-600` secondary text, `neutral-950` primary text. Dark mode reads
  every ramp back to front, so components never need `dark:` variants or raw hex.
- **Themed by choice, not by product.** A theme is a handful of choices (an accent, how grey the greys are, a
  font, how the action and the selection draw, the corners) turned into a block of CSS that overrides the default
  tokens. The playground's theme builder writes it; so does `createThemeCss()`. For a project, the builder
  exports the theme as an `app.css` in Tailwind's names and a `DESIGN.md` for Claude.
- **Two control heights.** Everything that sits in a row is 34px (buttons, small inputs and selects, segmented
  controls, nav items, pagination) or 38px (medium inputs and selects, large buttons, the dock), so a field and a
  button beside it line up without adjustment.
- **Pages by density.** A page sits in a centred column as wide as its content needs: 640px to make or edit one
  thing, 896 for settings, overviews and details, 1080 for a table, 1280 for a very dense one. An item opens on its
  own page with a breadcrumb back, never in a pane beside its list.

Everything is scoped under `.continuum`, so the system can sit inside another site without touching its variables.

## Using it in a project

This is a private workspace package, not on npm (see the licence). Two ways in:

- **As a git dependency**, in your own projects: `pnpm add github:joan-verhulst/continuum`. The package ships its
  TypeScript source, which Vite compiles as a dependency; Next.js needs `transpilePackages: ['continuum']`.
- **Copied in**: copy `src/` into the project (the bundled Claude skill does exactly this) and import from the
  copied folder.

Peer dependencies: `react` and `react-dom` 19. The date picker needs `react-day-picker`; the charts need visx,
d3 and motion (listed under Charts).

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
- `<Theme radius={0.5}>` halves every corner; `0` squares them off.
- Fonts are not bundled. The tokens read `--font-geist` (the default) and `--font-inter` and fall back to the
  families `Geist Variable` / `Geist` and `Inter Variable` / `Inter`. Load them yourself, for example with
  `@fontsource-variable/geist` and `@fontsource-variable/inter`, or set the variables from `next/font`.

## Theming

With no theme applied, `tokens.css` is the baseline: achromatic greys, a near-black action, Geist, pill docks.
It is not a theme of its own; a theme is what a product adds on top. In the playground, the theme pill at the
foot of Foundations, Components and Patterns opens the **Theme builder**: start from a preset (Eyes, the product
the system was distilled from, among them), then pick an accent, the greys, the font, how the action draws (flat,
lit or glossy) and the corners, and every page previews it.

**Use this theme** hands a project two files:

- `app.css`, the whole theme as a Tailwind v4 entry in Tailwind's own names (colours, type, radii, shadows,
  spacing, widths), light in `@theme` and dark under `[data-mode="dark"]`. It takes the place of `theme.css`, and
  the components read the same names.
- `DESIGN.md`, a brief for Claude: how the project is set up, the theme in words and the system's rules. Put it at
  the root and add `@DESIGN.md` to `CLAUDE.md`.

To switch themes at runtime instead, write the theme as a scoped block after the tokens import and open the scope
with its name:

```css
@import "continuum/theme.css";

.continuum[data-theme="custom"] {
    --continuum-p-500: #2c52e8;
    --color-action: var(--color-primary-500);
    /* … */
}
```

```tsx
<Theme theme="custom" mode="dark">…</Theme>
```

The same options go into `createThemeCss()` at build time:

```ts
import { createThemeCss } from 'continuum';

createThemeCss({
    name: 'custom',
    accent: '#2c52e8',
    neutral: { hue: 80, tint: 0.006 },
    font: 'inter',
    action: 'accent',
    actionStyle: 'glossy',
    segment: 'raised',
    dock: 'rounded',
});
```

An accent leads the data colours; a theme with a palette of its own passes `charts` (the steps, their dark-mode
changes and the independent series) instead.

Ramps are built in oklch on Tailwind's curve (`themeAccentRamp`, `themeNeutralRamp`): one lightness curve for
every hue, chroma on a bell that peaks at 600, and your colour exactly at 500. The default status ramps are built
the same way, so an accent sits beside them without a seam. Every theme works in both modes.

## Components

- **Foundations:** `Theme`, `ThemeScope`, `useTheme`, `cn`, `focusRing`, `createThemeCss`, `createThemeVariables`,
  `isDefaultTheme`, `defaultThemeOptions`
- **Actions:** `Button`, `Toolbar`, `ToolbarButton`, `ToolbarChip`, `BottomBar`, `Dock`, `DockItem`, `DockAction`,
  `FilterChip`, `SuggestionChip`, `Kbd`
- **Forms:** `Field`, `FieldLabel`, `FieldHelper`, `Input`, `Textarea`, `Select`, `Combobox`, `Checkbox`,
  `RadioGroup`, `Switch`, `Slider`, `SegmentedControl`, `OptionRow`, `OptionList`, `SettingRow`, `SettingGroup`,
  `CodeInput`, `ValueField`, `Calendar`, `DatePicker`, `DateRangePicker`, `DropZone`, `DropZoneFiles`,
  `DropZoneFile`, `Stepper`, `StepperItem`, `FilterMenu` (trigger, content, group, item, clear), `FilterBar`
- **Navigation:** `AppShell`, `AppPanel`, `HeaderBar` (start, `HeaderBarNav` + `usePageHistory`, actions, `HeaderBarNotice` +
  `useHeaderNotice`),
  `PageContent`, `Sidebar` (header, logo, toggle, group,
  footer, account), `NavItem`, `NavGroup`, `Rail`, `Tabs`, `Breadcrumb` (+ `BreadcrumbMenu`), `Pagination`, `CommandMenu`
  (content, input, list, group, item, empty, footer; `useCommandMenuShortcut`)
- **Overlays:** `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tooltip`, `InfoTip`
- **Feedback:** `Progress`, `Meter`, `StatusDot`, `LiveCount`, `Alert`, `ToastProvider` + `useToast`,
  `EmptyState`, `Skeleton`, `SkeletonText`, `Spinner` (and `Button loading`), `Checklist`, `ChecklistItem`
- **Data display:** `Card`, `StatCard`, `MetaRow`, `MetaList`, `MetaItem`, `Table`, `DescriptionList`,
  `ActivityList`, `ActivityItem`, `BarList`, `BarListItem`, `Badge`, `Avatar`, `AvatarStack`, `IconTile`,
  `Separator`, `ContinuumMark`, `ContinuumLogo`
- **Chat:** `ChatThread`, `ChatMessage`, `ChatEvent`, `ChatToken`, `ChatReference`, `ChatComposer`

Compound parts (`DialogContent`, `SelectItem`, `TableRow`, ...) and the cva `*Variants` functions are exported
alongside each family.

### Charts

A separate entry point, `continuum/charts`, so apps without charts do not pull in its libraries: visx
(`@visx/curve`, `event`, `grid`, `group`, `responsive`, `scale`, `shape`), `d3-array`, `d3-shape`, `motion` and
`@number-flow/react`.

```tsx
import { Area, AreaChart, ChartTooltip, Grid, XAxis, YAxis } from 'continuum/charts';
```

A chart is composed from parts: `AreaChart` + `Area`, `PieChart` + `PieSlice` + `PieCenter`, and `FunnelChart`, with
`Grid`, `XAxis`, `YAxis` and `ChartTooltip` as children. Colours come from the `--color-chart-*` tokens, so the
charts follow the theme and mode like every component.

## Playground

The `playground` workspace is built from the system itself:

- **Foundations:** colour, type, surfaces and radii, layout, states and motion, one article each, read live from
  the tokens.
- **Components:** every component on its own page, with knobs to try its variants and the pieces it is used in.
- **Patterns:** six screens of one generic app (a dashboard, a list, a detail, a form, settings and sign-in) and
  eight blocks from earlier products. Every screen opens full screen at the window's own size.
- **Theme builder:** previews a theme on all of the above and exports it for a project.
- **Lab:** a raster lab, and a CMS test: the same brief drawn freehand and with Continuum.

```sh
pnpm install
pnpm dev
```

## Repository

| Path                             | What it is                                                                  |
| -------------------------------- | --------------------------------------------------------------------------- |
| `src/components`, `src/lib`      | The library and its helpers, including the theme builder's maths.           |
| `src/charts`                     | The chart kit (`continuum/charts`).                                         |
| `src/styles`                     | `tokens.css` (the default theme), `theme.css` (the Tailwind entry).         |
| `dist/styles.css`                | The prebuilt, scoped stylesheet.                                            |
| `playground`                     | The playground app.                                                         |
| `labs/raster`                    | An experiment: screens on a Swiss raster. Not part of the package.          |
| `.claude/skills/continuum-taste` | A Claude skill that carries the library and its method into other projects. |
| `reference`                      | The original Figma screens the system was distilled from.                   |

## Scripts

| Script               | Does                                                           |
| -------------------- | -------------------------------------------------------------- |
| `pnpm dev`           | Starts the playground (Vite).                                  |
| `pnpm build`         | Builds `dist/styles.css`, then the playground.                 |
| `pnpm build:css`     | Builds the scoped `dist/styles.css` (`scripts/build-css.mjs`). |
| `pnpm build:skill`   | Bundles the system into the `continuum-taste` Claude skill.    |
| `pnpm install:skill` | Bundles the skill and installs it to `~/.claude/skills`.       |
| `pnpm type-check`    | Type-checks the package and the playground.                    |
| `pnpm lint`          | Runs Biome.                                                    |
| `pnpm lint:fix`      | Runs Biome and applies fixes.                                  |

## Credits

Continuum is built on open-source work, used under its own licences:

- [Base UI](https://base-ui.com/) (`@base-ui/react`, MIT): the primitives behind every interactive component.
- [react-day-picker](https://daypicker.dev/) (MIT): the calendar behind the date pickers.
- [visx](https://airbnb.io/visx/) (MIT): scales, shapes and layout for the charts.
- [d3-array](https://github.com/d3/d3-array) and [d3-shape](https://github.com/d3/d3-shape) (ISC): data helpers
  and curves for the charts.
- [Motion](https://motion.dev/) (MIT) and [NumberFlow](https://number-flow.barvian.me/) (`@number-flow/react`,
  MIT): chart animation and animated numbers.
- Tailwind CSS, class-variance-authority, clsx and tailwind-merge (MIT), and lucide-react (ISC) for the icons.

## License

Copyright © 2026 Joan Verhulst. All rights reserved. The code is public to read, not licensed for use, copying or
redistribution. See [LICENSE](LICENSE).
