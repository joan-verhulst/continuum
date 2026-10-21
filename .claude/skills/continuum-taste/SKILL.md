---
name: continuum-taste
description: Designs and builds product UI in Continuum, Joan's design system and visual taste — quiet, dense tool UI with hairline borders, one action colour, 13px type, nested radii and measured heights, in six themes with light and dark modes. Ships the full React component library (Radix + Tailwind v4 + cva), tokens, a prebuilt stylesheet, reference screens and a method for designing products the library never covered, so it can set up and build a whole app (a CMS, CRM, admin, editor, dashboard…) from scratch in any project. Use when asked to build, design, restyle or review an app, page, dashboard, form, editor or component "in Continuum", "in my style" or "like my design system", or when working inside the Continuum repo itself.
---

# Continuum

Continuum is a design system distilled from real product screens (2024–2026). The look is **quiet, dense and
precise**: 13px type, hairline borders, one action colour, almost no shadow, and measurements taken from the
drawings rather than rounded to a scale. Everything needed to build with it is in this skill folder:

| Path (relative to this file)    | What it is                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `assets/continuum/`             | The whole library: `components/`, `lib/`, `styles/`, `index.ts`. Copy it in. |
| `assets/continuum/styles/tokens.css` | Raw tokens and the six themes, scoped under `.pds`. Readable as a spec.  |
| `assets/continuum/styles/theme.css`  | Tailwind v4 entry: maps tokens to utilities, defines `px-curve`.         |
| `assets/continuum/styles.css`   | Prebuilt stylesheet (preflight + every utility the components use, scoped). |
| `references/screens/*.tsx`      | Six full screens rebuilt with the system. **Read one before composing a page.** |
| `references/designing-new.md`   | **The method for products the library doesn't cover**: screen kinds, page anatomy with exact widths and spacing, patterns for common needs (media grid, rich text, kanban, uploads, empty and loading states …), a recipe for new components, and a worked CMS. |

When in doubt, do less, and copy what an existing component or reference screen already does.

## Workflow

1. **Pick the route** (below) from the project's stack. Check `package.json` and the CSS entry first. In an
   empty project, scaffold Vite + React + TypeScript + Tailwind v4 and use route A.
2. **Install the library** into the project, unless it is already there (look for a `continuum` folder or a
   `.pds` class).
3. **Design before building.** For anything beyond a single component — a new app, a product area, a page type
   not in the references — read `references/designing-new.md` and follow its method: model the objects and the
   main task, classify each screen (index, detail/editor, form, overview), pick the theme, then lay screens out
   with its anatomy and patterns. A product the references never covered (a CMS, a CRM, a booking tool) is
   expected; derive it from the principles rather than from generic SaaS habits.
4. **Read a reference screen** close to each screen kind: `analytics-overview` / `checkout-funnel` (overviews,
   charts, rail + floating bottom bar), `sequence-editor` (index table in the sidebar shell), `invoice-editor`
   (dark document-like detail with a side sheet), `report-generator` (form/flow), `risk-report` (master–detail
   editor, inline AI toolbar). `shared.tsx` holds their page frames; `index.tsx` lists each one's theme.
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
   `radix-ui class-variance-authority clsx tailwind-merge lucide-react` and, for fonts,
   `@fontsource-variable/geist @fontsource-variable/inter` (import both in the entry file). React 19.
3. In the Tailwind entry CSS:
   ```css
   @import "tailwindcss";
   @import "./components/continuum/styles/theme.css"; /* path to the copied folder */
   ```
   `theme.css` **replaces** Tailwind's colours, font sizes, weights, radii and shadows with Continuum's. That is
   right for a new project or one that should fully adopt the look. If the project already has its own Tailwind
   theme that must survive, use route B instead.
4. Wrap the app (or the part that uses the system) in `<Theme theme="eyes" mode="light">`. Everything styled must
   sit inside a `Theme`; portalled parts already re-open it.
5. Import components from the copied folder's `index.ts`. The reference screens import from `'continuum'`;
   rewrite that to the local path (or add a `continuum` path alias in `tsconfig` / the bundler).

### Route B — React, with a host Tailwind theme to keep, or no Tailwind

Copy `assets/continuum/` as above, install the same dependencies, and import `continuum/styles.css` (the
prebuilt file) instead of `theme.css`. All components render correctly inside `<Theme>`. The prebuilt file only
contains the utilities the components use, so for page layout write classes with the host's own Tailwind (spacing,
flex, grid are shared) and reach Continuum colours through variables: `bg-(--pds-neutral-100)`,
`border-(--pds-neutral-200)`, `text-(--pds-neutral-600)`, `rounded-(--pds-radius-card)`. Without any Tailwind,
write plain CSS with the same `var(--pds-*)` tokens.

### Route C — not React (Vue, Svelte, plain HTML, native)

Copy `styles/tokens.css` and put `class="pds" data-theme="eyes" data-mode="light"` on the root. Rebuild each
needed component from its `.tsx` file in `assets/continuum/components/`: the class strings in its `cva` call are
the exact spec (heights, padding, radius, colour per state). Translate the rules below into the target's styling.

## Themes

A theme swaps the raw ramps, the font, the radii and a few semantic values. Pick by mood; default to `eyes`.

| Theme      | Character                                                                         |
| ---------- | --------------------------------------------------------------------------------- |
| `eyes`     | Default. Warm green-greys, Geist, near-black action, rounder corners, pill dock.  |
| `indigo`   | Eyes neutrals, Inter, indigo action and tint, smaller radii, raised segments.     |
| `electric` | Cool greys on white, one pure blue, a blue wash, tight 8px corners.               |
| `lime`     | Cool greys on white, a lit lime button with a top highlight and ring.             |
| `stone`    | Warm stone greys and a glossy blue gradient button; drawn in dark mode.           |
| `violet`   | Pure greys and one purple; drawn in dark mode.                                    |

Every theme works in both `mode="light"` and `mode="dark"`; dark mode reverses each ramp.

## Components

Exported from `index.ts`. Compound parts (`DialogContent`, `SelectItem`, `TableRow` …) and the `*Variants`
functions come with each family; read the file for props.

- **Foundations:** `Theme`, `ThemeScope`, `useTheme`, `themes`, `cn`, `focusRing`
- **Actions:** `Button` (primary · secondary · ghost; md · lg · icon · icon-sm; pill), `Toolbar` (inline ·
  floating) + `ToolbarButton`/`ToolbarChip`, `BottomBar` + `Dock`/`DockItem`/`DockAction`, `FilterChip`,
  `SuggestionChip`, `Kbd`
- **Forms:** `Field`/`FieldLabel`/`FieldHelper`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`,
  `Slider`, `SegmentedControl`, `OptionRow`/`OptionList`
- **Navigation:** `AppShell`, `AppPanel`, `HeaderBar`, `Sidebar` (+ header, logo, toggle, group, footer, account),
  `NavItem`, `NavGroup`, `Rail`, `Tabs`, `Breadcrumb`, `Pagination`
- **Overlays:** `Dialog`, `Sheet` (non-modal side sheet), `DropdownMenu`, `Tooltip`
- **Data:** `Card` (+ `CardTitle`, `CardValue`, `CardDelta`, `CardFigure`), `StatCard`, `MetaRow`, `Table`
  (ruled · rows), `DescriptionList`, `ActivityList`, `Badge` (soft · pill · dot · count), `Avatar`, `AvatarStack`,
  `IconTile`, `Separator`
- **Charts:** `AreaChart`, `DonutChart`, `FunnelChart`

If something is missing, build it with the recipe in `references/designing-new.md`.

## Page patterns (short version; full anatomy in `references/designing-new.md`)

- **Shell:** `AppShell` (canvas `neutral-100`) → `Sidebar` sitting straight on the canvas, no fill → `AppPanel`
  (inset 8px, `rounded-panel`, hairline, surface) → `HeaderBar` (54px, breadcrumb left, actions right) → a
  centred content column (896 overview · 960 form · 1024 index/editor) → optional floating `BottomBar`.
- **Overview:** rail over the left edge, sticky fading top bar, `StatCard` row, chart cards, dock at the bottom.
- **Index:** title row with status and context, separator, section title + primary action, ruled `Table`.
- **Detail/editor:** master–detail split or a document surface, `Tabs` for facets, `Sheet` for history, a dock
  with the commit action.
- **Form:** sections of title + description over `Field`s and `OptionRow`s, split by separators, submit at the end.

## The rules

### Colour: semantic by ramp index

Ramps: `neutral`, `primary`, `success`, `warning`, `error`, steps 50–950. Use them by what the index means:

| Step            | Role                                                                    |
| --------------- | ----------------------------------------------------------------------- |
| `neutral-50`    | Surface: panels, cards, dialogs, floating bars                          |
| `neutral-100`   | Canvas behind panels; muted fills (table header, group rows, chips)     |
| `neutral-200`   | The hairline. Every border, divider and rule                            |
| `neutral-300`   | Hover border; faint icons                                               |
| `neutral-500`   | Placeholder, muted labels, hints                                        |
| `neutral-600`   | Secondary text, card titles, idle controls, default icons               |
| `neutral-700`–`900` | Body text steps; `900` is an input value and a table cell           |
| `neutral-950`   | Primary text                                                            |

- **One action colour**: `bg-action text-on-action shadow-action [background-image:var(--pds-action-gradient)]`,
  hover `bg-action-hover hover:[background-image:none]`. For the primary button, checked controls, the active rail
  item, the logo mark. Nothing decorative; one primary action per view.
- **Selection is a wash, not a colour**: hover and selected rows `bg-neutral-950/5`, table row hover
  `bg-neutral-950/[0.03]`. Coloured selection uses `bg-tint text-tint-fg`; active segments use the `segment` tokens.
- **Status colours** only in badges, deltas, icon tiles and invalid states. Soft badge
  `border-*-200 bg-*-100 text-*-700`; pill `bg-*-500/20 text-*-700`; delta text `text-success-600` / `text-error-500`.
- **Never** hex values, `bg-white`, Tailwind's default palette, or `dark:` variants: dark mode flips every ramp, so
  `neutral-50` is always the surface. The one exception is a scrim, `bg-black/40`, because it must not flip.
- Charts use `chart-1`…`chart-5` (forest, lime, mustard, orange, teal); shades of one series by opacity
  (`bg-chart-5/80`, `/33`). Curves are monotone, so a peak stays the peak.

### Type

- Base **13px** (`text-xs`), line-height 1.25, tracking `0.32px`. Most UI is `text-xs`; `text-xxs` (11px) for
  badges, counts, tooltips and hints; `text-sm` (14px) for input values, dialog titles, option labels. Larger sizes
  only for headline numbers (`text-lg` KPI, `text-2xl`/`3xl` chart headers) and page titles.
- **Two weights**: `font-normal` and `font-medium`. Never semibold or bold. No all-caps labels.
- Hierarchy through colour and weight, not size: a card title is `font-normal text-neutral-600 text-xs`, its value
  `font-medium text-neutral-950`. Labels quiet, data loud.
- Numbers `tabular-nums`, right-aligned in tables. Value and delta share a baseline.
- A control has one label size at every height; size changes only padding and radius.
- Overflowing text truncates (`min-w-0 truncate`); it does not wrap or grow the control.

### Surfaces and depth

- **Hairlines over shadows.** Cards share the page colour and are separated by `border border-neutral-200` alone.
- `shadow-float` only on what floats or is raised: secondary buttons, toolbars, the dock, a raised segment, a slider
  knob. `shadow-sheet` only on dialogs and sheets.
- Dividers are borders on a section (`border-b border-neutral-200`), not separate elements.

### Radius: nested and concentric

Radius tokens nest **panel ⊃ card ⊃ item ⊃ chip**: `rounded-chip` (6) · `item` (10) · `control` (12) ·
`control-lg` (14) · `card` (16) · `panel` (12) · `dock` (full) in `eyes`; other themes shrink them. Never Tailwind's
`rounded-md/lg`. An element inset in a rounded container takes the container's radius minus the inset:
`rounded-[calc(var(--pds-radius-item)-2px)]` inside a `p-0.5` track. Pills (`rounded-full`) for filter chips,
delta pills, avatars and the rail.

### Padding follows the corner

A rounder corner eats into the space beside a label, so side padding grows with the radius: the `px-curve`
utility computes `base + min(radius, height/2) / 4`. Controls set `[--curve-base:9px] [--curve-radius:var(--pds-radius-control)] [--curve-height:33px]`.
Use it on any new labelled control with rounded corners, so it stays balanced across themes.

### Measured heights

Write heights literally; do not round them to Tailwind's scale:

| Thing                                           | Height               |
| ----------------------------------------------- | -------------------- |
| Button md / icon · lg                           | `33px` · `41px`      |
| Input / select sm · md                          | `34px` · `38px`      |
| Segmented track · item; tab                     | `34px` · `29px`      |
| Badge soft/pill · count · dot                   | `22` · `21` · `25px` |
| Filter chip · suggestion chip                   | `25px` · `29px`      |
| Nav item · project row · menu item              | `33` · `34` · `32px` |
| Dock · dock item                                | `40px` · `32px`      |
| Ruled table row/head · group row                | `41px` · `33px`      |
| Dialog/sheet header · header bar · sidebar header | `52` · `54` · `56px` |

Spacing is tight: `gap-0.5` between nav items, `gap-1.5`–`2` inside controls, `gap-3`–`4` between blocks, `p-4`/`p-5`
in cards, an 8px gutter around the panel. This is tool UI; density is the point, not big hero whitespace.

### Icons

`lucide-react`, **always `strokeWidth={1.5}`**. 16px by default, 12px in badges and filter chips. Components size
child icons with `[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0`. Icons take the text colour (`neutral-600`
idle, darker on hover). Icon tiles are 32px `rounded-chip` wells with a hairline.

### States

- Focus: `focusRing` (`focus-visible:outline-2 outline-focus outline-offset-2`); inside a clipping container
  `focus-visible:-outline-offset-2`.
- Hover: borders `200 → 300`; ghost text `600 → 800/950`; fills get the 5% wash.
- Disabled: `disabled:pointer-events-none disabled:opacity-50`. Invalid: `border-error-500`, error icons and placeholder.
- Single-choice groups (segmented control, dock) always keep one value.
- Style off ARIA and Radix state (`aria-current="page"`, `data-[state=on|open|checked]`), not extra props.

### Motion

- Colour changes `duration-150` with an explicit property list (`transition-[background-color,border-color,color]`),
  never `transition-all`.
- Entries `duration-200 ease-out-strong` via `starting:` from `opacity-0` plus a small translate (`translate-y-2`
  dialogs, `translate-x-4` sheets); centre with margins so translate is free. Add `motion-reduce:transition-none`.
- Reveal-on-hover only for secondary affordances (a chevron), never for primary actions. Nothing bouncy, nothing
  over 250ms, no animated layout.

### Theming

Components never name a theme. If something must differ per product, add a semantic `--pds-*` token in
`tokens.css`, set it per theme, and alias it in `theme.css`. Check work in `eyes`, a cool theme
(`electric`/`lime`) and dark mode.

### Code idiom

- Arrow-function components typed with `ComponentProps<'el'>` or the Radix part's props; `className` merged last
  through `cn(...)`; rest props spread.
- Variants with `cva`, exported as `*Variants`; `compoundVariants` for variant × tone colour pairs.
- `data-slot="kebab-name"` on every rendered part; meaningful state mirrored as `data-*`.
- Radix primitives for anything interactive; `asChild` through `Slot.Root`; buttons default to `type="button"`.
- Compound families (`Dialog`, `DialogContent`, `DialogHeader` …) instead of config objects.
- Long class lists split into an array by concern (base, states, icon sizing, focus).
- Comments say **why** a value is what it is, in plain British English ("colour", "centred"); one JSDoc line per
  exported component. No comments that restate the code.

## Anti-patterns

Shadows on cards · decorative gradients · coloured section backgrounds · bold or semibold · all caps · hex values ·
`dark:` variants · Tailwind default palette or radii · status colour used for emphasis · a second accent colour ·
rounding `33px` to `h-8` · non-concentric inner corners · `transition-all` · long or bouncy animation · generous
marketing-page whitespace in a tool UI.

## Review checklist

Only tokens · hairline, not shadow · radii nested and concentric · heights from the table · two weights · 13px base ·
icons at stroke 1.5 · one action colour · visible focus ring · inside a `Theme` · works in `eyes`, a cool theme and
dark · `data-slot` on every new part.

## Inside the Continuum repo

When working in the Continuum repository itself, the source of truth is `src/`; this skill's `assets/` and
`references/` are generated copies. After changing components or tokens, run `pnpm build:skill` to refresh them
(`pnpm install:skill` also installs the skill to `~/.claude/skills`). New components go in `src/components/`, are
exported from `src/index.ts` and get a gallery entry in `playground/src/gallery/`; run `pnpm type-check` and
`pnpm lint` before finishing.
