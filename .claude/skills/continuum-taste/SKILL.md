---
name: continuum-taste
description: Designs and builds product UI in Continuum, Joan's design system and visual taste — quiet, dense tool UI with hairline borders, one action colour, 13px type, nested radii and two rows of controls, in light and dark modes, with a theme builder for a product's own accent, greys, font and corners. Ships the full React component library (Base UI + Tailwind v4 + cva), a chart kit (visx + motion), tokens, a prebuilt stylesheet, reference screens and a method for designing products the library never covered, so it can set up and build a whole app (a CMS, CRM, admin, editor, dashboard…) from scratch in any project. Use when asked to build, design, restyle or review an app, page, dashboard, form, editor or component "in Continuum", "in my style" or "like my design system", or when working inside the Continuum repo itself.
---

# Continuum

Continuum is a design system for tool UI, distilled from real product screens. The look is **quiet, dense and
precise**: 13px type, hairline borders, one action colour, almost no shadow, and two rows of controls (34 and
38px) so anything beside anything lines up. It has one default theme and a builder for others. Everything needed
to build with it is in this skill folder:

| Path (relative to this file)         | What it is                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `assets/continuum/`                  | The whole library: `components/`, `lib/` (helpers and the theme builder), `charts/`, `styles/`, `index.ts`. Copy it in. |
| `assets/continuum/styles/tokens.css` | The default theme, scoped under `.continuum`: raw ramps, then every token under Tailwind's names (`--color-*`, `--radius-*`, `--shadow-*` …). Readable as a spec. |
| `assets/continuum/styles/theme.css`  | Tailwind v4 entry: registers those names, so the utilities read them.       |
| `assets/continuum/styles.css`        | Prebuilt stylesheet (preflight + every utility the components use, scoped).  |
| `references/screens/*.tsx`           | Generic screens of one app, then older product screens, all built with the system. **Read one before composing a page.** |
| `references/designing-new.md`        | **The method for products the library doesn't cover**: screen kinds, page anatomy with exact widths and spacing, patterns for common needs (media grid, rich text, kanban, uploads, empty and loading states …), a recipe for new components, and a worked CMS. |

When in doubt, do less, and copy what an existing component or reference screen already does.

## Workflow

1. **Pick the route** (below) from the project's stack. Check `package.json` and the CSS entry first. In an
   empty project, scaffold Vite + React + TypeScript + Tailwind v4 and use route A.
2. **Install the library** into the project, unless it is already there (look for a `continuum` folder or a
   `.continuum` class).
3. **Design before building.** For anything beyond a single component — a new app, a product area, a page type
   not in the references — read `references/designing-new.md` and follow its method: model the objects and the
   main task, classify each screen (index, detail/editor, form, overview), decide the look (the default theme, or
   one written with `createThemeCss`), then lay screens out with its anatomy and patterns. A product the
   references never covered (a CMS, a CRM, a booking tool) is expected; derive it from the principles rather
   than from generic SaaS habits.
4. **Read a reference screen** close to each screen kind. The generic app comes first: `overview` (stat cards, a
   chart, a breakdown), `customers` (an index: search, filters, a ruled table, pagination), `customer` (a detail:
   tabs, facts beside activity), `new-customer` (a form), `settings` and `sign-in`, all in the shell of
   `workspace.tsx`. Older product screens show denser layouts: `analytics-overview` / `checkout-funnel` (rail and
   floating bottom bar), `sequence-editor`, `invoice-editor` (a dark document with a side sheet),
   `report-generator` and `risk-report` (master–detail, inline AI toolbar), with their frames in `shared.tsx`.
5. **Compose from components first**; write layout with utilities only between them. Never restyle a component's
   internals from outside beyond spacing and width. Where nothing fits, make a new component with the recipe in
   `designing-new.md`.
6. **Make it work, not just look right**: real state for the main task (create, edit, select, delete), realistic
   sample data in the product's domain, and empty states.
7. **Check** against the review checklist at the end, in light and dark.

## Setup

### Route A — React + Tailwind v4 (preferred; required for building new screens)

1. Copy `assets/continuum/` into the project, e.g. `src/components/continuum/` (keep its inner structure: the
   stylesheet finds the components through `@source "../components"`).
2. Install the dependencies:
   `@base-ui/react class-variance-authority clsx tailwind-merge lucide-react react-day-picker` and, for fonts,
   `@fontsource-variable/geist @fontsource-variable/inter` (import both in the entry file). React 19.
   The charts (`charts/`) also need `@visx/curve @visx/event @visx/grid @visx/group @visx/responsive @visx/scale
   @visx/shape d3-array d3-shape motion @number-flow/react`; skip them if the project draws no charts.
3. In the Tailwind entry CSS:
   ```css
   @import "tailwindcss";
   @import "./components/continuum/styles/theme.css"; /* path to the copied folder */
   ```
   `theme.css` **replaces** Tailwind's colours, font sizes, weights, radii and shadows with Continuum's. That is
   right for a new project or one that should fully adopt the look. If the project already has its own Tailwind
   theme that must survive, use route B instead.

   **If the project has an `app.css` and a `DESIGN.md` exported from the playground's theme builder**, that
   `app.css` is the entry instead: the whole theme in Tailwind's names with its values resolved, light in
   `@theme` and dark under `[data-mode="dark"]`. Leave out the copied `styles/` folder; the components read the
   same names. `DESIGN.md` then holds the project's theme and rules.
4. Wrap the app (or the part that uses the system) in `<Theme mode="light">`; add `theme="name"` once a theme
   block exists (see Theming). Everything styled must sit inside a `Theme`; portalled parts already re-open it.
5. Import components from the copied folder's `index.ts`. The reference screens import from `'continuum'`;
   rewrite that to the local path (or add a `continuum` path alias in `tsconfig` / the bundler).

### Route B — React, with a host Tailwind theme to keep, or no Tailwind

Copy `assets/continuum/` as above, install the same dependencies, and import `continuum/styles.css` (the
prebuilt file) instead of `theme.css`. All components render correctly inside `<Theme>`. The prebuilt file only
contains the utilities the components use, so for page layout write classes with the host's own Tailwind (spacing,
flex, grid are shared) and reach Continuum colours through variables: `bg-(--color-neutral-100)`,
`border-(--color-neutral-200)`, `text-(--color-neutral-600)`, `rounded-(--radius-card)`. Without
any Tailwind, write plain CSS with the same variables: `var(--color-neutral-200)`, `var(--radius-card)`.

### Route C — not React (Vue, Svelte, plain HTML, native)

Copy `styles/tokens.css` and put `class="continuum" data-mode="light"` on the root. Rebuild each needed component
from its `.tsx` file in `assets/continuum/components/`: the class strings in its `cva` call are the exact spec
(heights, padding, radius, colour per state). Translate the rules below into the target's styling.

## Theming

With no theme applied, `tokens.css` is the baseline: achromatic greys, a near-black action, Geist, pill docks,
filled segments. It suits most tools; use it unless the product has a colour or a mood of its own (the playground's
presets, Eyes among them, show what a theme adds). Then write a theme: `createThemeCss`
(in `lib/create-theme.ts`, also behind the playground's Theme builder) turns a few options into a
`.continuum[data-theme="name"]` block. Put it after the tokens import and open the scope with the name.

| Option        | Values                              | Sets                                                                 |
| ------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `accent`      | a hex colour                        | the primary ramp's 500; the rest is built on Tailwind's curve in oklch, as the status ramps are; the data colours follow |
| `neutral`     | `{ hue, tint }`                     | the greys' hue and faint chroma (0 pure grey, 0.012 clearly tinted)  |
| `font`        | `geist` · `inter` · `system` · a family | `--font-sans`                                               |
| `action`      | `neutral` · `accent`                | what the primary button, checked controls and the active rail item fill with |
| `actionStyle` | `flat` · `lit` · `glossy`           | a top highlight and ring, or a gradient as well                      |
| `tint`        | `neutral` · `accent`                | the selection wash: translucent grey, or the accent's palest step    |
| `segment`     | `filled` · `raised`                 | the active segment: the action fill, or a chip with a hairline       |
| `dock`        | `pill` · `rounded`                  | the dock, rail and chips: pills, or 10px corners                     |
| `radius`      | a number                            | the corner scale (`<Theme radius>` does the same at runtime)         |
| `charts`      | `{ steps, dark?, series? }`         | data colours of the theme's own, in place of the set the accent leads |

```ts
import { createThemeCss } from './components/continuum';

const css = createThemeCss({ name: 'brand', accent: '#2c52e8', font: 'inter', action: 'accent', segment: 'raised' });
```

```tsx
<Theme theme="brand" mode="light">…</Theme>
```

Every theme works in both `mode="light"` and `mode="dark"`; dark mode reverses each ramp. Components never name
a theme: anything that should differ per product is a token under Tailwind's names with a default in
`tokens.css` and an option in `createThemeCss`. The playground's Theme builder also exports a theme for a project
as an `app.css` (the route A entry above) and a `DESIGN.md` for Claude.

## Components

Exported from `index.ts`. Compound parts (`DialogContent`, `SelectItem`, `TableRow` …) and the `*Variants`
functions come with each family; read the file for props.

- **Foundations:** `Theme` (mode · `theme` id · `radius` corner scale), `ThemeScope`, `useTheme`, `cn`, `focusRing`,
  `createThemeCss`, `createThemeVariables`, `isDefaultTheme`, `defaultThemeOptions`, `themeAccentRamp`,
  `themeNeutralRamp`, `hexToOklch`, `oklchToHex`
- **Actions:** `Button` (primary · secondary · ghost · tint, the theme's wash for AI actions beside the primary
  one; md 34px · lg 38px · icon · icon-sm; pill), `Toolbar` (inline · floating, the dock's height with the control corner) +
  `ToolbarButton`/`ToolbarChip`, `BottomBar` + `Dock`/`DockItem`/`DockAction` (a large primary button with the
  dock's corners), `FilterChip`, `SuggestionChip`, `Kbd`
- **Forms:** `Field`/`FieldLabel`/`FieldHelper`, `Input` (sm 34 · md 38), `Textarea`, `Select` (the same two
  heights; trigger `indicator="right"` for the "Select ›" picker in a settings row), `Combobox` (+ input, chips,
  content, list, item, empty; `useComboboxFilter`), `Checkbox`, `RadioGroup`, `Switch`, `Slider`,
  `SegmentedControl`, `OptionRow`/`OptionList`, `SettingRow`/`SettingGroup` (title and description left, control
  right; groups spaced, not ruled), `CodeInput` (one-time code, md · lg boxes), `ValueField` (read-only fact: a
  filled well with optional copy, or a `vital` pill row with a status dot), `Calendar`, `DatePicker`,
  `DateRangePicker` (with `defaultDateRangePresets`, `formatDate`, `formatDateRange`; these need `react-day-picker`),
  `DropZone` + `DropZoneFiles`/`DropZoneFile` (a dashed drop target with a secondary "Choose files", files under
  it with progress, done and error; `formatFileSize`), `Stepper` + `StepperItem` (the steps of a long form,
  horizontal over it or vertical beside it with the step's fields inside; `value` sets the current step and
  `onValueChange` lets done steps go back; an item can be `invalid`; a narrow row keeps only the current label),
  `FilterMenu` (+ trigger with a count, content, group, item with a count, clear) and `FilterBar` (the trigger,
  a `FilterChip` per group and "Clear all"), with `toggleFilter` and `countFilters` over a `FilterValues` map
- **Navigation:** `AppShell`, `AppPanel`, `HeaderBar` (+ `HeaderBarStart`, `HeaderBarNav` (back and forward, ruled off full height;
  `usePageHistory` where there is no router), `HeaderBarActions`, and
  `HeaderBarNotice` with `useHeaderNotice`: the quiet toast, a tab that slides out from under the bar's hairline
  for small actions such as "Saved" or "Link copied"), `PageContent` (default · wide · dense · inset · full),
  `Sidebar` (+ header, logo, toggle, group, footer, account), `NavItem`, `NavGroup`, `Rail`, `Tabs`, `Breadcrumb` (one line, the page truncating
  first; `BreadcrumbMenu` folds a long middle into "…" or, with a `label`, switches workspace or project),
  `Pagination`, `CommandMenu` (⌘K: a dialog pinned near the top with a borderless search, groups of 32px
  rows that hide when they don't match, arrows and Enter; + content, input, list, group, item, empty, footer,
  `useCommandMenuShortcut`)
- **Overlays:** `Dialog`, `Sheet` (non-modal side sheet), `Popover` (+ trigger, content, header, title,
  description, close; `createPopoverHandle`), `DropdownMenu`, `Tooltip`, `InfoTip` (a 16px info icon beside a
  title that explains it on hover, focus and tap)
- **Feedback:** `Progress`/`Meter` (task progress and a measured amount such as usage or credits; label, caption,
  value; tones), `StatusDot` (+ `LiveCount`, the pulsing "129 Active now"),
  `Alert` (an inline notice: a hairline card whose icon carries the tone, with an action and dismiss),
  `ToastProvider` + `useToast` (the inverse chip at the foot, with Undo; `add({ title, type, actionProps })`;
  a description longer than a phrase stacks under the title with the action below, or set `data: { layout }`),
  `EmptyState` (dashed, left-aligned, one action), `Skeleton`/`SkeletonText` (4% placeholders while loading),
  `Spinner` (only inside a busy button: `<Button loading>`), `Checklist` + `ChecklistItem` (onboarding steps
  with progress, the next one open with its action)
- **Data:** `Card` (+ `CardTitle`, `CardValue`, `CardDelta`, `CardFigure`), `StatCard`, `MetaRow`, `MetaList` +
  `MetaItem` (icon-led facts in a row or two-column grid, optionally dot-separated), `Table` (ruled · rows),
  `DescriptionList`, `ActivityList`, `Badge` (soft · pill · dot · count), `BarList` + `BarListItem` (ranked
  breakdown with bars, show more, rows as filter toggles), `Avatar`, `AvatarStack`, `IconTile`, `Separator`
  (rarely; see Surfaces), `ContinuumMark`/`ContinuumLogo`
- **Chat:** `ChatThread`, `ChatMessage` (own on the tint · other as a card; status), `ChatEvent` (centred system
  line), `ChatToken` (mono identifier chip), `ChatReference` (a linked record row), `ChatComposer`
- **Charts** (a separate entry, `continuum/charts`, i.e. the copied `charts/index.ts`; on visx, d3 and motion):
  compose a chart from parts. A root (`AreaChart`, `PieChart`, `FunnelChart`) sets up scales and context; its
  children read from it: `Area`, `PatternArea`, `SeriesMarkers`, `HighlightSegment`, `Grid`, `XAxis`, `YAxis`,
  `ChartTooltip` (with `TooltipBox`/`TooltipContent`/`DateTicker`), `PieSlice` + `PieCenter`. Also
  `AreaChartLoading`, `ChartStatFlow` (animated headline number), `ChartLoadingLabel`, `ShimmeringText`,
  `ChartConfigProvider` (springs) and the `useChart`/`usePie` hooks. Colours come from the `--color-chart-*`
  tokens.

If something is missing, build it with the recipe in `references/designing-new.md`.

## Page patterns (short version; full anatomy in `references/designing-new.md`)

- **Shell:** `AppShell` (canvas `neutral-100`) → `Sidebar` sitting straight on the canvas, no fill → `AppPanel`
  (inset 8px, `rounded-panel`, hairline, surface) → `HeaderBar` (54px, breadcrumb left, actions right) → a
  centred `PageContent` column sized by density (see Content width) → optional floating `BottomBar`. A page starts
  96px below the header bar, 128px on a large screen: `PageContent` sets it, so never pass a smaller `pt-*`.
- **Overview** (`default`, 896): one period, named in the title row with its picker; the figure that leads as a
  chart card, the `StatCard`s around it never repeating it, then where it comes from and what moved. It reads;
  it holds no create action.
- **Index** (`wide`; `dense` only for a very dense table): the title row, the filters, then a ruled `Table` in its
  frame and pagination, each set apart by space so the head never clusters. When the list has views (status
  tabs: all, drafts, published…), they and the page's one primary action go in the **floating dock** at the
  panel's foot: a `Dock` of the views with their counts and a `DockAction` for the primary, rendered in the
  `AppPanel` after the scroller, with bottom padding so the last rows scroll clear of it. Without views the
  primary action stays in the title row. Selecting rows swaps the dock for a floating bar of what can be done to
  them all.
- **An item opens on its own page**: a row leads to the item's detail page, with the breadcrumb back to the list.
  Never a pane docked beside the list. A `Sheet` is for a quick look or a history that keeps the list in view,
  never the item's editor.
- **Every page has its breadcrumb** in the header bar, from home down to the page itself.
- **Detail** (`default`, 896): **one column, never split.** The object and its actions in the title row, `Tabs`
  for facets, then sections stacked: numbers, facts (labels over values in a card grid), the rest. No side
  column of facts beside the main one; history goes in a `Sheet`.
- **Create or edit one object** (`narrow`, 640): a new post, a new customer, editing either. Its fields stack one
  per row, in sections headed alike (a title and a line of description), spaced apart (`gap-12`); the save or
  submit action at the end, or in the title row while editing. It is never as wide as a list.
- **Settings** (`default`, 896): the same headed sections over `SettingRow`s, a setting's title and description
  on the left and its control on the right, which needs the wider column.
- **One primary action per view.** The sidebar holds places, not a create button: the page that creates owns it.
- **Look at it.** Every page is checked at a real desktop size (1440×900), in light and dark, before it is done.

## The rules

### Colour: semantic by ramp index

Ramps: `neutral`, `primary`, `success`, `warning`, `error`, steps 50–950. Use them by what the index means:

| Step            | Role                                                                    |
| --------------- | ----------------------------------------------------------------------- |
| `neutral-50`    | Surface: panels, cards, dialogs, floating bars                          |
| `neutral-100`   | Canvas behind panels; muted fills inside a bordered container (a table header, a group row) |
| `neutral-200`   | The hairline: borders of cards, inputs and tables, and every divider    |
| `neutral-300`   | Hover border; faint icons                                               |
| `neutral-500`   | Placeholder, muted labels, hints                                        |
| `neutral-600`   | Secondary text, card titles, idle controls, default icons               |
| `neutral-700`–`900` | Body text steps; `900` is an input value and a table cell           |
| `neutral-950`   | Primary text                                                            |

- **One action colour**: `bg-action text-on-action shadow-action [background-image:var(--action-gradient)]`,
  hover `bg-action-hover hover:[background-image:none]`. For the primary button, checked controls, the active rail
  item, the logo mark. Nothing decorative; one primary action per view.
- **Selection is a wash, not a colour**: hover `bg-neutral-950/5` (a table row `/[0.03]`); what is current,
  selected or open (the page in the nav, a chosen row or option, a menu whose trigger is open) `bg-selected`,
  one step stronger, so the two never read alike. Coloured selection uses `bg-tint text-tint-fg`; active
  segments use the `segment` tokens.
- **Fills that may land on the canvas are translucent** (`bg-neutral-950/[0.04]`, the tint): a solid `neutral-100`
  vanishes on the canvas, so it is only for fills inside a bordered container.
- **Status colours** only in badges, deltas, icon tiles and invalid states. The `primary` ramp is for information
  and the assistant (a scheduled badge, the AI chip), never for emphasis.
- **Two colours from one ramp**: a coloured component (badge, tinted chip, status label) takes its text at step
  `700` and its fill from step `500` of the same ramp at 20%: `bg-*-500/20 text-*-700`. The translucent fill
  adapts to whatever it sits on, in light and dark. Dots and solid fills take `500`; icons and delta text take
  `600` (`text-success-600` / `text-error-600`). Never pair a solid `-100` fill, and never add an outline: badges
  are filled, not bordered.
- **Never** hex values, `bg-white`, Tailwind's default palette, or `dark:` variants: dark mode flips every ramp, so
  `neutral-50` is always the surface. The one exception is a scrim, `bg-black/40`, because it must not flip.
- Charts use `chart-1`…`chart-5` for steps in order and the `chart-series-*` set for independent series; shades
  of one series by opacity (`bg-chart-1/80`, `/33`). Curves are monotone, so a peak stays the peak.

### Type

- Base **13px** (`text-xs`), line-height 1.25, tracking `0.32px`. Most UI is `text-xs`; `text-xxs` (11px) for
  badges, counts, tooltips and hints; `text-sm` (14px) for dialog titles and option labels. Input values are
  `text-xs` like the rest: a field reads as part of the page, not louder than it. Larger sizes
  only for headline numbers (`text-lg` KPI, `text-2xl`/`3xl` chart headers) and page titles.
- **Two weights**: `font-normal` and `font-medium`. Never semibold or bold. No all-caps labels.
- Hierarchy through colour and weight, not size: a card title is `font-normal text-neutral-600 text-xs`, its value
  `font-medium text-neutral-950`. Labels quiet, data loud.
- Numbers `tabular-nums`, right-aligned in tables. Value and delta share a baseline.
- A control has one label size at every height; size changes only padding.
- Overflowing text truncates (`min-w-0 truncate`); it does not wrap or grow the control.

### Surfaces and depth

- **Hairlines over shadows.** Cards share the page colour and are separated by `border border-neutral-200` alone.
- `shadow-float` only on what floats: toolbars, the dock, menus, popovers, a slider knob. Never on buttons, icon
  buttons or a selected segment. `shadow-sheet` only on dialogs and sheets.
- **Space, not dividers.** Separate sections, groups and a header from its body with padding and margin
  (`gap-12` between page sections, `gap-16` between long docs sections, `pt-6` between sidebar groups). If
  things need more than space, put one group in a card or container instead of drawing a line. A divider is
  kept only where nothing else can mark an edge: rows inside a table or list that is itself a bordered
  container, segments inside a toolbar, the header bar the page scrolls under, and the parts of a floating
  container (below). On a page in a column: no `Separator` between page
  sections, no `border-b` under a page header or a tab list.
- **Dividers in floating containers.** Dialogs, sheets, popovers, menus and the like may split their header and
  sections with a divider. It always runs **full width**, from edge to edge of the container, never inset by its
  padding: draw it as a border on a full-width part and pad inside that part (`SheetHeader` and `SheetSection`
  do this), or pull a `Separator` out of the padding with negative margins, as `DropdownMenuSeparator` does.
- Cards and wells are `neutral-50`, the surface. No card for a header, and no card inside a card: a sheet or
  dialog holds its parts with space and full-width rules, not boxes.

### Content width

Content sits in a centred `PageContent` column and never runs to the panel's edges. Width follows density, not
the screen; pick the narrowest that fits:

| Content                                                       | `width`   | Column                                   |
| ------------------------------------------------------------- | --------- | ---------------------------------------- |
| One object made or edited, its fields stacked: a new post, a new customer | `narrow`  | 640px, `max-w-content-narrow` |
| Settings, an overview, a detail, a document                   | `default` | 896px, `max-w-content`                   |
| Content that needs the room: a list or table with several columns | `wide`    | 1080px, `max-w-content-wide`             |
| A very dense table                                            | `dense`   | 1280px, `max-w-content-dense`            |
| Lots of information, e.g. several dense tables side by side    | `inset`   | the panel, less 64px a side from `lg` and 128px from `2xl` (`px-content-inset`) |
| Only when explicitly asked for                                  | `full`    | the panel edge to edge, no side padding  |

A form is never wider than it needs to be: a stack of fields for one thing is `narrow`, whatever the screen.
An overview with stat cards and charts is not dense: it stays 896. Below each width the column takes the panel
less 16/24px a side, so it is responsive by default. `inset` only with that much data; `full` only when asked for.

### Radius: nested and concentric

Radius tokens nest **panel ⊃ card ⊃ item ⊃ chip**, each smaller than what holds it: `rounded-chip` (6) · `item` (10) · `control` (12) · `card`
(16) · `panel` (20) · `dock` (a pill) · `pill` (round at 25px). Never Tailwind's `rounded-md/lg`. An element
inset in a rounded container takes the container's radius minus the inset:
`rounded-[calc(var(--radius-item)-2px)]` inside a `p-0.5` track. Avatars and switch tracks are
`rounded-full`. Filter chips and delta pills use `rounded-pill`, the rail and dock `rounded-dock`; a `rounded`
dock theme tightens both to 10 and 8px. Never hard-code `rounded-full` on something that should follow the theme.

Every radius token is the raw value (`--continuum-r-*`) times a corner scale: `<Theme radius={0.5}>` halves all
corners, `0` squares them, `2` doubles them. Growing, a corner stops 8px past its own size, so a doubled panel is 28px
rather than a 40px pill and the nesting order holds at every scale; the dock and pill scale freely. Components follow
automatically; never multiply radii by hand.

### Padding

Side padding is fixed per kind, not derived: `px-3` on a control (a button, an input, a select), `px-4` on a
large button, `px-2` on a row inside a floating container (a menu or select item) and on a chip, `px-2.5` on a
nav row, a segment and a bar-list row, `px-1.5` on a badge, `px-2` on a tooltip.

### The height scale

Write heights in pixels; a new control takes 34 or 38 so it sits level with what is beside it:

| Height         | What sits on it                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `22px`         | Badge (every variant), count, kbd                                                                   |
| `25px`         | Filter chip, picked value in a combobox                                                             |
| `29px`         | Tab, segmented item, suggestion chip, vital row, bar list "show more"                               |
| `32px`         | Rows inside a floating container: menu item, select item, dock item, calendar day, range preset     |
| `34px`         | **The control row**: button md and icon, input/select/date picker sm, segmented track, nav item, pagination, rail item, inline toolbar, bar list row, table group row, chat composer line |
| `38px`         | **The field row**: input/select/date picker md, button lg, dock and dock action, floating toolbar, code box md, chat reference, setting row (min) |
| `41px`         | Ruled table row and head                                                                            |
| `52` · `54` · `56px` | Dialog/sheet header · header bar · sidebar header                                             |
| `4` · `8` · `6` · `8px` | Progress/meter track sm · md · status dot sm · md                                          |
| `48×52px`      | Code box lg                                                                                         |

Spacing is tight: `gap-0.5` between nav items, `gap-1.5`–`2` inside controls, `gap-3`–`4` between blocks, `p-4`/`p-5`
in cards, an 8px gutter around the panel. This is tool UI; density is the point, not big hero whitespace.

### Icons

`lucide-react`, **always `strokeWidth={2}`**. 16px by default, 12px in badges and filter chips. Components size
child icons with `[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0`. Icons take the text colour (`neutral-600`
idle, darker on hover). Icon tiles are 32px `rounded-chip` wells with a hairline.

### States

- Focus: `focusRing` (`focus-visible:outline-solid outline-2 outline-focus outline-offset-2`); inside a clipping
  container `focus-visible:-outline-offset-2`. After `outline-none`, the focused state must set `outline-solid`:
  `outline-none` sets `--tw-outline-style: none` and `outline-2` only reads it, so without it no ring is drawn.
- Hover: borders `200 → 300`; ghost text `600 → 800/950`; fills get the 5% wash.
- Disabled: `disabled:pointer-events-none disabled:opacity-50`. Invalid: `border-error-500`, error icons and placeholder.
- Single-choice groups (segmented control, dock) always keep one value.
- Style off ARIA and Base UI state attributes (`aria-current="page"`, `data-open`, `data-checked`, `data-pressed`,
  `data-selected`, `data-highlighted`, `data-disabled`, `data-popup-open`), not extra props.

### Motion

- Colour changes `duration-150` with an explicit property list (`transition-[background-color,border-color,color]`),
  never `transition-all`.
- Entries `duration-200 ease-out-strong` via Base UI's `data-starting-style:` / `data-ending-style:` from
  `opacity-0` plus a small translate (`translate-y-2` dialogs, `translate-x-4` sheets, `scale-95` popups); centre with margins so translate is free. Add `motion-reduce:transition-none`.
- Reveal-on-hover only for secondary affordances (a chevron), never for primary actions. Nothing bouncy, nothing
  over 250ms, no animated layout.

### Theming

Components never name a theme. If something must differ per product, add a token under Tailwind's names with
a default in `tokens.css`, register it in `theme.css`, and give `createThemeCss` an option that sets it. Check work
in the default theme, in a theme with `action: 'accent'`, and in dark mode.

### Code idiom

- Arrow-function components typed with `ComponentProps<'el'>` or the Base UI part's props (`WithClassName<…Props>`:
  Base UI allows a `className` function, Continuum keeps it a string); `className` merged last through `cn(...)`;
  rest props spread.
- Variants with `cva`, exported as `*Variants`; `compoundVariants` for variant × tone colour pairs.
- `data-slot="kebab-name"` on every rendered part; meaningful state mirrored as `data-*`.
- Base UI primitives (`@base-ui/react`) for anything interactive; swap the rendered element with the `render` prop
  (`render={<a href="…" />}`), and give plain components that prop through `useRender`; buttons default to
  `type="button"`. State styling comes off Base UI's data attributes (`data-open`, `data-checked`,
  `data-highlighted`, `data-starting-style`/`data-ending-style` for motion).
- Compound families (`Dialog`, `DialogContent`, `DialogHeader` …) instead of config objects.
- Long class lists split into an array by concern (base, states, icon sizing, focus).
- Comments say **why** a value is what it is, in plain British English ("colour", "centred"); one JSDoc line per
  exported component. No comments that restate the code.

## Anti-patterns

Shadows on cards · decorative gradients · coloured section backgrounds · bold or semibold · all caps · hex values ·
`dark:` variants · Tailwind default palette or radii · status colour used for emphasis · a second accent colour ·
rounding `34px` to `h-8` · a control height between 34 and 38 · a button that does not sit level with the field
beside it · a solid `neutral-100` fill on something that may sit on the canvas · non-concentric inner corners ·
dividers between page sections · an inset divider in a dialog, sheet or popover · a card inside a card · outlined
badges · full-width content · `rounded-full` where the theme should decide · `transition-all` · long or bouncy
animation · generous marketing-page whitespace in a tool UI.

## Review checklist

Only tokens · hairline, not shadow · space, not dividers (full-width ones in floating containers) · content width
by density · radii nested and concentric · heights from the scale, controls on 34 or 38 · two weights · 13px base ·
icons at stroke 2 · one action colour · visible focus ring · inside a `Theme` · works in the default theme, with an
accent theme and in dark · `data-slot` on every new part.

## Inside the Continuum repo

When working in the Continuum repository itself, the source of truth is `src/`; this skill's `assets/` and
`references/` are generated copies. Components read tokens by Tailwind's names (`var(--color-chart-grid)`,
`var(--radius-control)`), never `--continuum-*`: that prefix is the engine's alone (the raw ramps, the raw radii
and the corner scale), so a project's exported `app.css` drives every component. After changing components or tokens, run `pnpm build:skill` to refresh them
(`pnpm install:skill` also installs the skill to `~/.claude/skills`). New components go in `src/components/`, are
exported from `src/index.ts`, get an entry with knobs in `playground/src/showcase/previews.tsx` and appear in one or
two pieces in `playground/src/showcase/in-use.tsx`; `labs/` holds experiments that are not part of the package. Run
`pnpm type-check` and `pnpm lint` before finishing.
