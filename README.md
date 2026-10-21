<picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/continuum-mark-dark.svg">
    <img alt="" height="48" src="assets/continuum-mark.svg" width="48">
</picture>

# Continuum

A React design system distilled from my product screens of 2024–2026: one set of components and tokens that
reproduces the look of several products I designed in Figma. Built on [Radix](https://www.radix-ui.com/)
primitives (the unified `radix-ui` package), Tailwind CSS v4, class-variance-authority and lucide-react.

## The idea

- **One token architecture.** Every product uses the same components and the same token names. Only the values
  behind the tokens change.
- **Semantic by index.** Colour ramps are used the way the Figma screens use them: `neutral-50` is the surface,
  `neutral-100` the canvas and hover fill, `neutral-200` the hairline, `neutral-600` secondary text, `neutral-950`
  primary text. Dark mode reads every ramp back to front, so components never need `dark:` variants or raw hex.
- **Themes per product.** A theme swaps the ramps, the font, the radii and a few semantic values (action colour,
  tint, active segment). Components never name a theme.

| Theme      | Comes from                                                                     |
| ---------- | ------------------------------------------------------------------------------ |
| `eyes`     | The Eyes component library; the default look. Warm green-greys, Geist.         |
| `indigo`   | 2024 email sequencing editor. Eyes neutrals, Inter, smaller radii.             |
| `electric` | 2025 risk-assessment report editor. Cool greys, one pure blue and a blue wash. |
| `lime`     | 2025 social report generator. Cool greys, lit button with highlight and ring.  |
| `stone`    | 2025 dark invoicing app. Warm stone greys and a glossy blue button.            |
| `violet`   | 2024 dark sign-in flow. Pure greys and one purple.                             |

Everything is scoped under `.pds`, so the system can sit inside another site without touching its variables.

## Usage

Peer dependencies: `react` and `react-dom` 19.

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

`dist/styles.css` contains preflight, tokens and every utility the components use, all scoped to `.pds`. No
Tailwind setup is needed:

```tsx
import 'continuum/styles.css';
import { Button, Theme } from 'continuum';

export const App = () => (
    <Theme theme="eyes" mode="light">
        <Button>Save</Button>
    </Theme>
);
```

### Theme and fonts

- Everything the system styles has to sit inside a `<Theme>` (it renders a `.pds` element with `data-theme` and
  `data-mode`). Themes nest; `useTheme()` reads the current one. Portalled content (menus, tooltips, dialogs)
  re-opens the theme with `<ThemeScope>`, which the components already do.
- Fonts are not bundled. The tokens read `--font-geist` (Eyes) and `--font-inter` (the other themes) and fall back
  to the families `Geist Variable` / `Geist` and `Inter Variable` / `Inter`. Load them yourself, for example with
  `@fontsource-variable/geist` and `@fontsource-variable/inter`, or set the variables from `next/font`.

## Components

- **Foundations:** `Theme`, `ThemeScope`, `useTheme`, `themes`, `cn`
- **Actions:** `Button`, `Toolbar`, `ToolbarButton`, `ToolbarChip`, `Dock`, `DockItem`, `DockAction`,
  `FilterChip`, `SuggestionChip`, `Kbd`
- **Forms:** `Field`, `FieldLabel`, `FieldHelper`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`,
  `Switch`, `SegmentedControl`, `OptionRow`, `OptionList`
- **Navigation:** `AppShell`, `AppPanel`, `HeaderBar`, `Sidebar`, `SidebarNav`, `NavItem`, `NavSection`,
  `WorkspaceSwitcher`, `Rail`, `Tabs`, `Breadcrumb`, `Pagination`
- **Overlays:** `Dialog`, `Sheet`, `DropdownMenu`, `Tooltip`
- **Data display:** `Card`, `StatCard`, `MetaRow`, `Table`, `DescriptionList`, `ActivityList`, `ActivityItem`,
  `Badge`, `Avatar`, `AvatarStack`, `IconTile`, `Separator`
- **Charts:** `AreaChart`, `DonutChart`, `FunnelChart`

Compound parts (`DialogContent`, `SelectItem`, `TableRow`, ...) and the cva `*Variants` functions are exported
alongside each family.

## Playground

The `playground` workspace shows the foundations, a gallery of every component and the reference screens rebuilt
with the system, switchable by theme and mode.

```sh
pnpm install
pnpm dev
```

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

## License

MIT
