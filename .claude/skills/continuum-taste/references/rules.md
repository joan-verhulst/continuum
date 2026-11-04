# The rules

The one full statement of how Continuum looks and behaves. `designing-new.md` applies these to products the
library never covered; the `DESIGN.md` the theme builder exports is a short form of them for a project, written
in `playground/src/theme-export.ts`, so a change here is made there too.

## Pages

### The shell

`AppShell` (canvas `neutral-100`) → `Sidebar` straight on the canvas, no fill → `AppPanel` (inset 8px,
`rounded-panel`, hairline, surface) → `HeaderBar` (54px, breadcrumb left, at most one or two actions right) → a
centred `PageContent` column sized by density → optional floating `BottomBar`. `AppShell nav="top"` puts a
`TopNav` over the panel instead, for an app with a handful of sections.

- **The sidebar holds places, not a create button**: `SidebarHeader` (logo mark and collapse toggle), the main
  sections as `NavItem`s with a `Kbd` or a count `Badge` trailing, a labelled group of workspaces or collections
  as `NavGroup`s with `inset` children, and `SidebarFooter` with the account. The page that creates owns the
  create action.
- **Every page has its breadcrumb** in the header bar, from home down to the page itself.
- **A page starts 96px below the header bar, 128px on a large screen.** `PageContent` sets it, so never pass a
  smaller `pt-*`. Give the column bottom padding that clears a floating bar when there is one.

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

### Page kinds

- **Overview** (`default`): one period, named in the title row with its picker; the figure that leads as a chart
  card, the `StatCard`s around it never repeating it, then where it comes from and what moved. It reads; it holds
  no create action.
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
- **Detail** (`default`): **one column, never split.** The object and its actions in the title row, `Tabs` for
  facets, then sections stacked: numbers, facts (labels over values in a card grid), the rest. No side column of
  facts beside the main one; history goes in a `Sheet`.
- **Create or edit one object** (`narrow`): its fields stack one per row, in sections headed alike, spaced apart
  (`gap-12`); the save or submit action at the end, or in the title row while editing. Never as wide as a list.
- **Settings** (`default`): the same headed sections over `SettingRow`s, a setting's title and description on the
  left and its control on the right, which needs the wider column.
- **One primary action per view**, in the action colour. Everything else is secondary or ghost.

### Page header and sections

- **Page header**: a title (`font-medium text-2xl`) with a line of description under it (`text-sm
  text-neutral-600`) and the page's own actions or controls at its right; on an overview those are the period
  picker and filters. `PageHead` in the reference `workspace.tsx` is the pattern.
- **Section**: a title (`font-medium text-base`) over one or two sentences (`text-xs text-neutral-600`,
  `max-w-[500px]`), the section's action at the right of the title block, then its content. `SectionHead` in
  `workspace.tsx` is the pattern. Sections are spaced `gap-12`, never divided.

### Secondary surfaces

- **Sheet** (right, 512px, non-modal): history, details, comments — things you read beside the page.
- **Dialog** (480px): confirmations and short forms. Header with title and description, body, footer with
  secondary + primary right-aligned. A destructive confirm is a primary button labelled with the verb
  ("Delete page").
- **Popover**: a small form or detail anchored to its trigger (a date, a share setting, a filter's values).
  Anything with a menu's rows is a `DropdownMenu` instead.
- **DropdownMenu**: row and object actions behind a ghost `icon-sm` `EllipsisVertical`. Destructive items go last,
  after a separator, `variant="danger"`.
- **Floating BottomBar**: the views of a list, or the facets of one object (`Dock`: Content · SEO · Settings),
  with the commit action (`DockAction`: "Publish"). Otherwise the primary action sits in the title row.
- **Floating Toolbar**: bulk actions for a selection, or formatting over a focused block; the dock's shape.

## Colour: semantic by ramp index

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

## Type

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
- **Copy**: sentence case everywhere. Buttons are verb + object ("Add email", "Generate report").

## Surfaces and depth

- **Hairlines over shadows.** Cards share the page colour and are separated by `border border-neutral-200` alone.
- `shadow-float` only on what floats: toolbars, the dock, menus, popovers, a slider knob. Never on buttons, icon
  buttons or a selected segment. `shadow-sheet` only on dialogs and sheets.
- **Space, not dividers.** Separate sections, groups and a header from its body with padding and margin
  (`gap-12` between page sections, `gap-16` between long docs sections, `pt-6` between sidebar groups). If
  things need more than space, put one group in a card or container instead of drawing a line. A divider is
  kept only where nothing else can mark an edge: rows inside a table or list that is itself a bordered
  container, segments inside a toolbar, the header bar the page scrolls under, and the parts of a floating
  container (below). On a page in a column: no `Separator` between page sections, no `border-b` under a page
  header or a tab list.
- **Dividers in floating containers.** Dialogs, sheets, popovers, menus and the like may split their header and
  sections with a divider. It always runs **full width**, from edge to edge of the container, never inset by its
  padding: draw it as a border on a full-width part and pad inside that part (`SheetHeader` and `SheetSection`
  do this), or pull a `Separator` out of the padding with negative margins, as `DropdownMenuSeparator` does.
- Cards and wells are `neutral-50`, the surface. No card for a header, and no card inside a card: a sheet or
  dialog holds its parts with space and full-width rules, not boxes. A `Card` is for a self-contained unit (a KPI,
  a chart, a selectable group).

## Radius: nested and concentric

Radius tokens nest **panel ⊃ card ⊃ item ⊃ chip**, each smaller than what holds it: `rounded-chip` (6) · `item`
(10) · `control` (12) · `card` (16) · `panel` (20) · `dock` (a pill) · `pill` (round at 25px). Never Tailwind's
`rounded-md/lg`. An element inset in a rounded container takes the container's radius minus the inset:
`rounded-[calc(var(--radius-item)-2px)]` inside a `p-0.5` track. Avatars and switch tracks are `rounded-full`.
Chips and delta pills use `rounded-pill`, the rail and dock `rounded-dock`; a `rounded` dock theme tightens
both to 10 and 8px. Never hard-code `rounded-full` on something that should follow the theme.

Every radius token is the raw value (`--continuum-r-*`) times a corner scale: `<Theme radius={0.5}>` halves all
corners, `0` squares them, `2` doubles them. Growing, a corner stops 8px past its own size, so a doubled panel is
28px rather than a 40px pill and the nesting order holds at every scale; the dock and pill scale freely.
Components follow automatically; never multiply radii by hand.

## Padding

Boxes that hold content (cards, panels, sheet and dialog bodies, sections, list rows) and the gaps between
texts are **derived**, not picked, by the spacing formula in `lib/spacing.ts`: padding follows the box's type
size averaged over its lines and how much it holds, a box of boxes steps past its children, and the gap between
two texts follows the text after it, tight for a pair (header and subheader, label and value) and loose between
blocks. Results always land on a Tailwind spacing step, never an arbitrary value. The `fix-padding` skill works it
out for a component and applies it.

A control's side padding is fixed per kind, not derived: `px-3` on a control (a button, an input, a select),
`px-4` on a large button, `px-2` on a row inside a floating container (a menu or select item) and on a chip,
`px-2.5` on a nav row, a segment and a bar-list row, `px-3` on a tab, `px-1.5` on a badge, `px-2` on a tooltip.

## The height scale

Write heights in pixels; a new control takes 34 or 38 so it sits level with what is beside it:

| Height         | What sits on it                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `22px`         | Badge (every variant), count, kbd                                                                   |
| `25px`         | Chip (`sm`), picked value in a combobox                                                             |
| `29px`         | Segmented item, chip `md`, vital row, bar list "show more"                               |
| `32px`         | Dock item, calendar day, range preset                                                               |
| `34px`         | **The control row**: button md and icon, input/select/date picker sm, segmented track, nav item, pagination, rail item, inline toolbar, bar list row, table group row, chat composer line, pill tab |
| `36px`         | Rows inside a popup list (`PopoverItem`): menu, select, combobox, filter menu and command menu items |
| `38px`         | **The field row**: input/select/date picker md, button lg, dock and dock action, floating toolbar, code box md, chat reference, setting row (min) |
| `41px`         | Ruled table row and head                                                                            |
| `44px`         | Line tab                                                                                            |
| `52` · `54` · `56px` | Dialog/sheet header · header bar · sidebar header                                             |
| `4` · `8` · `6` · `8px` | Progress/meter track sm · md · status dot sm · md                                          |
| `48×52px`      | Code box lg                                                                                         |

Spacing is tight: `gap-0.5` between nav items, `gap-1.5`–`2` inside controls, `gap-3`–`4` between blocks, `p-4`/`p-5`
in cards, an 8px gutter around the panel. This is tool UI; density is the point, not big hero whitespace.

## Icons

`lucide-react`, **always `strokeWidth={2}`**. 16px by default, 12px in badges and small chips. Components size
child icons with `[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0`. Icons take the text colour (`neutral-600`
idle, darker on hover). Icon tiles are 32px `rounded-chip` wells with a hairline. Icons lead in navigation and menu
items and trail on action buttons ("Add email +", "Generate report →").

## States

- Focus: `focusRing` (`focus-visible:outline-solid outline-2 outline-focus outline-offset-2`); inside a clipping
  container `focus-visible:-outline-offset-2`. After `outline-none`, the focused state must set `outline-solid`:
  `outline-none` sets `--tw-outline-style: none` and `outline-2` only reads it, so without it no ring is drawn.
- Hover: borders `200 → 300`; ghost text `600 → 800/950`; fills get the 5% wash.
- Disabled: `disabled:pointer-events-none disabled:opacity-50`. Invalid: `border-error-500`, error icons and placeholder.
- Single-choice groups (segmented control, dock) always keep one value.
- Style off ARIA and Base UI state attributes (`aria-current="page"`, `data-open`, `data-checked`, `data-pressed`,
  `data-selected`, `data-highlighted`, `data-disabled`, `data-popup-open`), not extra props.

## Motion

- Colour changes `duration-150` with an explicit property list (`transition-[background-color,border-color,color]`),
  never `transition-all`.
- Entries `duration-200 ease-out-strong` via Base UI's `data-starting-style:` / `data-ending-style:` from
  `opacity-0` plus a small translate (`translate-y-2` dialogs, `translate-x-4` sheets, `scale-95` popups); centre
  with margins so translate is free. Add `motion-reduce:transition-none`.
- Reveal-on-hover only for secondary affordances (a chevron), never for primary actions. Nothing bouncy, nothing
  over 250ms, no animated layout.

## Theming

Components never name a theme. If something must differ per product, add a token under Tailwind's names with
a default in `tokens.css`, register it in `theme.css`, and give `createThemeCss` an option that sets it. Check work
in the default theme, in a theme with `action: 'accent'`, and in dark mode.

## Code idiom

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
badges · full-width content · a detail split into two columns · an item's editor in a pane beside its list · a
create button in the sidebar · `rounded-full` where the theme should decide · `transition-all` · long or bouncy
animation · generous marketing-page whitespace in a tool UI.
