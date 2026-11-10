# In React with Tailwind v4

The library is the system rendered in React (Base UI primitives, Tailwind v4, cva). In a React project the parts
in `components.md` are real components; compose from them and write utilities only for the layout between
them. Never restyle a component's internals from outside beyond spacing and width.

## Setup

**Route A: React + Tailwind v4** (preferred; required for building new screens)

1. Copy `assets/continuum/` into the project, e.g. `src/components/continuum/`, keeping its inner structure
   (the stylesheet finds the components through `@source "../components"`).
2. Install `@base-ui/react class-variance-authority clsx tailwind-merge lucide-react react-day-picker`, and the
   font: `@fontsource-variable/geist` (and the package of the theme's font if it picks another; import it in the
   entry file). React 19. Charts also need `@visx/curve @visx/event @visx/grid @visx/group @visx/responsive
   @visx/scale @visx/shape d3-array d3-shape motion @number-flow/react`; skip them if the project draws none.
3. In the Tailwind entry CSS:
   ```css
   @import "tailwindcss";
   @import "./components/continuum/styles/theme.css"; /* path to the copied folder */
   ```
   `theme.css` **replaces** Tailwind's colours, font sizes, weights, radii and shadows with Continuum's. If the
   project has a Tailwind theme of its own that must survive, use route B.

   **If the project has an `app.css` and a `DESIGN.md` exported from the theme builder**, that `app.css` is the
   entry instead (the whole theme in Tailwind's names, light in `@theme`, dark under `[data-mode="dark"]`).
   Leave out the copied `styles/` folder; `DESIGN.md` holds the project's theme.
4. Wrap the app in `<Theme mode="light">`; add `theme="name"` once a theme block exists. Everything styled sits
   inside a `Theme`; portalled parts re-open it themselves.
5. Import from the copied folder's `index.ts`, and charts from `charts/index.ts`. The reference screens import
   from `'continuum'`: rewrite that to the local path, or add a `continuum` path alias.

**Route B: React with a host Tailwind theme to keep, or no Tailwind.** Copy `assets/continuum/` and install the
same dependencies, then import its prebuilt `styles.css` instead of `theme.css`. Components render correctly
inside `<Theme>`. The prebuilt file holds only the utilities the components use, so write page layout with the
host's own Tailwind and reach Continuum's values through variables: `bg-(--color-neutral-100)`,
`border-(--color-neutral-200)`, `rounded-(--radius-card)`.

In an empty project, scaffold Vite + React + TypeScript + Tailwind v4 and use route A. If Continuum is already
there (a `continuum` folder or a `.continuum` class), skip setup.

## The values, as Tailwind names

`foundations.md` states every value in units. In code each one has a name; use the name, never the unit:

| Foundation                              | Tailwind                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------ |
| A ramp step, e.g. the hairline          | `border-neutral-200`, `bg-neutral-100`, `text-neutral-600`               |
| The action colour                       | `bg-action text-on-action shadow-action [background-image:var(--action-gradient)]`, hover `hover:bg-action-hover hover:[background-image:none]` |
| Hover wash 5% · table row 3% · canvas-safe fill 4% | `bg-neutral-950/5` · `bg-neutral-950/[0.03]` · `bg-neutral-950/[0.04]` |
| Selected (7%) · tint                     | `bg-selected` · `bg-tint text-tint-fg`                                  |
| Data colours: steps · series            | `bg-chart-1` … `bg-chart-5` (and `text-`, `fill-`, `stroke-`) · the series are variables only, not utilities: `var(--color-chart-series-1)` … `-5`, or `fill-(--color-chart-series-1)`; the chart kit reads them itself |
| A status badge, a toast's or chat token's tone | `bg-success-500/20 text-success-800` (and so for each ramp: the 800, every tone) |
| An icon on that tint                    | `text-primary-600` · `text-error-600`; `text-success-700` · `text-warning-700` (the 600 misses 3:1 on their tints) |
| A delta: rising · falling               | `text-success-800` · `text-error-600`                                    |
| Placeholders, hints, helper text, eyebrows, timestamps | `text-neutral-600`, `placeholder:text-neutral-600`; never `text-neutral-500` or lighter for read text |
| An unchecked checkbox, radio or menu indicator | `border-neutral-500`, `hover:border-neutral-600`                  |
| The focus ring                          | the exported `focusRing` string (`focus-visible:outline-solid outline-2 outline-focus outline-offset-2`; inside a clipping container `-outline-offset-2`) |
| Type sizes 11 · 13 · 14 · 16 · 18 · 20 · 24 · 31 | `text-xxs` · `text-xs` · `text-sm` · `text-base` · `text-lg` · `text-xl` · `text-2xl` · `text-3xl` (line height and tracking come with them) |
| Weights 400 · 500                       | `font-normal` · `font-medium`                                            |
| Tabular figures                         | `tabular-nums`                                                           |
| Corners chip · item · control · card · panel · dock · pill | `rounded-chip` · `rounded-item` · `rounded-control` · `rounded-card` · `rounded-panel` · `rounded-dock` · `rounded-pill`; an inset corner `rounded-[calc(var(--radius-item)-2px)]`; round `rounded-full` only on avatars, dots, switches, radios |
| Shadows                                 | `shadow-float`, `shadow-sheet`, `shadow-composer` (the composer's lift, deeper in dark); none otherwise |
| Heights: the control row 34 · the field row 38 · the large block slider 48 | `h-control` · `h-control-lg` · `h-control-xl` |
| Heights inside a control: small chip 25 · small icon button 28 · segmented item, medium chip, vital row 29 · dock item, calendar day, date-range preset 32 | `h-chip` · `h-control-sm` · `h-segment` · `h-cell` |
| Row heights: a popup list's row 36 · a description row, a popup's search and footer 40 · ruled table row 41 · line tab, a table's toolbar (minimum) 44 | `h-option` · `h-row` · `h-table-row` · `h-tab` |
| Bar heights: dialog and sheet header and footer 52 · header bar 54 · sidebar header, top nav 56 | `h-bar` · `h-header` · `h-nav` |
| Every height above, as a square, a minimum or a width | `size-control`, `min-h-control-lg`, `w-cell` (each name takes `size-`, `min-h-`, `w-`); a height derived from one is a `calc` on its variable, `min-h-[calc(var(--spacing-control)+8px)]` |
| Marks drawn to a glyph: badge 22, kbd, checkbox and radio 20, switch, dots, avatars, icon tiles | pixels or the spacing scale, `h-[22px]`, `size-5`: these keep their size when the theme's item size changes |
| The spacing scale                       | Tailwind's own: `p-4` = 16, `gap-2.5` = 10, `pt-24` = 96. Padding, gaps, margins and offsets follow a theme's unit; `w-*`, `h-*`, `size-*`, `min-*` and `max-*` on the number scale stay on a fixed 4px grid (`size-4` is 16 at any unit), set by the last block of `theme.css` and copied into an exported `app.css` |
| Content widths                          | `max-w-content-narrow` · `max-w-content` · `max-w-content-wide` · `max-w-content-dense`; `PageContent width="…"` sets them |
| Fixed widths: sidebar 256 · rail 52 / 208 · popover 288 · menu minimum 160 / 192 · filter menu 240 · toast 360 · tooltip maximum 256 · chart tooltip minimum 140 · search 256 · presets column 144 · a quiet message's line 480 / 288 · an assistant's conversation 720 · dialog 480 · sheet 512 · command menu 560 | `w-sidebar` · `w-rail` / `w-rail-open` · `w-popover` · `min-w-menu` / `min-w-menu-wide` · `w-filter-menu` · `w-toast` · `max-w-tooltip` · `min-w-chart-tooltip` · `w-search` · `w-presets` · `max-w-measure` / `max-w-measure-narrow` · `max-w-conversation` · `w-dialog` · `w-sheet` · `w-command` (each takes `w-`, `min-w-`, `max-w-`). Fixed pixels, so the theme's spacing unit never reaches them: never write a panel's or popup's width as a spacing step (`w-64`, `w-90`, `max-w-72`). In a narrow viewport a dialog keeps 16 clear each side, `w-[min(var(--spacing-dialog),calc(100vw-32px))]` and so on; a sign-in card's 400 stays an inline value |
| Icons                                   | `lucide-react` with `strokeWidth={2}`; a container sizes them with `[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0` |
| Colour transitions                      | `transition-[background-color,border-color,color] duration-150`; never `transition-all` |
| Entries                                 | `duration-200 ease-out-strong` from Base UI's `data-starting-style:opacity-0 data-starting-style:translate-y-2` (dialogs), `translate-x-4` (sheets), `scale-95` (popups), with `motion-reduce:transition-none` |

Never: hex values, `bg-white`, Tailwind's default palette or radii (`rounded-md`), `dark:` variants (the ramps
flip on their own), a height above in pixels or on the spacing scale (`h-[34px]`, `h-8`: the theme's item size
never reaches it), a height between 34 and 38.

## Code idiom

- Arrow-function components typed with `ComponentProps<'el'>` or the Base UI part's props
  (`WithClassName<…Props>`: Base UI allows a `className` function, Continuum keeps it a string); `className`
  merged last through `cn(...)`; rest props spread.
- Variants with `cva`, exported as `*Variants`; `compoundVariants` for variant × tone colour pairs.
- `data-slot="kebab-name"` on every rendered part; meaningful state mirrored as `data-*`.
- Base UI primitives (`@base-ui/react`) for anything interactive; swap the rendered element with the `render`
  prop (`render={<a href="…" />}`), and give plain components that prop through `useRender`; buttons default to
  `type="button"`. State styling comes off Base UI's data attributes (`data-open`, `data-checked`,
  `data-highlighted`, `data-starting-style` / `data-ending-style`), not extra props.
- Compound families (`Dialog`, `DialogContent`, `DialogHeader` …) instead of config objects.
- Long class lists split into an array by concern (base, states, icon sizing, focus).
- Comments say **why** a value is what it is, in plain British English; one JSDoc line per exported component.

A new part, by the recipe in `method.md`, keeps this shape:

```tsx
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

export const mediaTileVariants = cva(
    [
        'group/tile flex flex-col overflow-hidden rounded-item border border-neutral-200 bg-neutral-50 text-left transition-[border-color] duration-150',
        'hover:border-neutral-300 data-[selected]:outline-2 data-[selected]:outline-action data-[selected]:outline-offset-2',
        focusRing,
    ],
    { variants: { size: { md: 'w-full', sm: 'w-40' } }, defaultVariants: { size: 'md' } },
);

export type MediaTileProps = ComponentProps<'button'> &
    VariantProps<typeof mediaTileVariants> & { selected?: boolean };

/** A file in the media library: thumbnail over its name and size. */
export const MediaTile = ({ size, selected, className, type = 'button', ...props }: MediaTileProps) => (
    <button
        className={cn(mediaTileVariants({ size }), className)}
        data-selected={selected || undefined}
        data-slot="media-tile"
        type={type}
        {...props}
    />
);
```

A theme-dependent look adds a token under Tailwind's names with a default in `tokens.css`, and lets
`createThemeCss` set it from an option; a component never checks which theme it is in. If the project keeps
Continuum as a copied folder, new parts go beside the others and are exported from its `index.ts`; otherwise
they live in the host's components folder, importing `cn` and `focusRing` from Continuum.

## Checking

Run the app, look at the screen at 1440 × 900 in light and dark (switch `<Theme mode>`), and in an accent theme
if the product has one. Take screenshots; do not report a screen done from the code alone.
