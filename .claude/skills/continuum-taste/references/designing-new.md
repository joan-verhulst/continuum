# Designing what Continuum doesn't have yet

The library covers the screens it was drawn from. A new product (a CMS, a CRM, a booking tool, an admin) needs
pages, patterns and components that don't exist yet. Build them **from the principles**, so the result looks as if
it came from the same hand. This file is the method plus the patterns the six reference screens use, written as
rules you can apply to a domain they never covered.

## The method

1. **Model the product before drawing anything.** List the objects (pages, entries, media, users), what people do
   to each (browse, edit, publish, review), and which one task matters most. Every screen is one of four kinds:
   **index** (a list of objects), **detail/editor** (one object), **form/flow** (create or configure something),
   **overview** (figures across objects). Pick the kind first; its anatomy is below.
2. **Decide the look.** The baseline (no theme: achromatic greys, near-black action, Geist) suits most tools. If the product
   has a brand colour or a mood of its own, write a theme with `createThemeCss` (an accent, the greys' hue and
   tint, Inter or the system font, a lit or glossy accent action, a raised segment, rounded docks) and open the
   scope with `<Theme theme="name">`. A dark-first product sets `mode="dark"`; every theme works in both.
3. **Compose from existing components** wherever one fits, even loosely: a tree is `NavGroup`s, a status is a
   `Badge`, a choice list is `OptionRow`s, a mode switch is a `SegmentedControl` or `Dock`.
4. **Only then make a new component**, by the recipe at the end: borrow height, radius, padding and states from
   the closest existing one. Never invent a new value when an existing one is near enough.
5. **Review** with the checklist in `SKILL.md`, in light and dark.

## What a Continuum screen is like

- **One primary action per view**, in the action colour. Everything else is secondary (outlined) or ghost.
- **Left-aligned and calm.** Titles, empty states and forms align left; nothing is centred except the content
  column itself.
- **Structure from space**, not from lines or boxes inside boxes. A section is a title + content set apart
  from the next by a gap (`gap-12`), not by a `Separator` and not wrapped in a card. Where space is not enough,
  put a group in a card rather than drawing a divider. Use a `Card` only for a self-contained unit
  (a KPI, a chart, a selectable group); never a card for a header or inside another card.
- **Quiet labels, loud data**: chrome is `neutral-600` 13px; the user's content is `neutral-950`, `font-medium`
  where it is the point.
- **Copy**: sentence case everywhere. Buttons are verb + object ("Add email", "Generate report", "Start campaign").
  Section descriptions are one or two full sentences that say what the section does and its effect.
- **Icons**: leading in navigation and menu items; *trailing* on action buttons ("Add email +", "Generate report →").

## Page anatomy

### The shell (every app screen)

`AppShell` → `Sidebar` → `AppPanel` → `HeaderBar` → scrolling content → optional floating `BottomBar`.

- **Sidebar**, top to bottom: `SidebarHeader` (logo mark in ink, no tile + collapse toggle) · a group
  starting with a `NavItem variant="primary"` for the product's create action ("New page") followed by the
  main sections (with a `Kbd` shortcut or a `Badge variant="count"` as trailing) · a labelled group of
  workspaces/projects/collections as `NavGroup`s with emoji or icons and `inset` children · a last `project` row
  ("All projects", "Archive") · `SidebarFooter` with the account and a ghost bell.
- **HeaderBar** (54px): a `Breadcrumb` (`text-sm`, starting with the home icon) on the left; at most one or two
  actions on the right (secondary + primary).
- **Content column**: a centred `PageContent`, as wide as the content is dense and never the panel's full width,
  with generous top padding and bottom padding that clears the floating bar:

  | Screen kind                                | `PageContent width`        | Padding                    |
  | ------------------------------------------ | -------------------------- | -------------------------- |
  | Overview / dashboard (not dense)           | `default` · 896            | `pt-5 pb-28`               |
  | Form / flow / settings                     | `default` · 896            | `pt-[72px] pb-24`, `gap-12` |
  | Document-like detail                       | `default` · 896, text `max-w-[560px]` | `pt-16 pb-16`   |
  | Index or editor around a several-column table | `wide` · 1080           | `pt-20 pb-32`              |
  | A very dense table                         | `dense` · 1280             | `pt-20 pb-32`              |
  | Several dense tables, lots of data         | `inset` · 64px a side, 128px from `2xl` | `pt-10 pb-24`        |
  | Only when explicitly asked for             | `full` · edge to edge      | as the content needs       |
  | Master–detail                              | split, see below           | `px-6 pt-6`                |

  Pick the narrowest that holds the content. `inset` only with that much data; `full` only when asked for.

### Page header

- Index/editor: one row of `h1` (`font-medium text-lg`) with its context beside it — an `AvatarStack` and a
  status `Badge` with an icon, `gap-3`. The next section starts `mt-12` below; no separator.
- Form/flow: `SectionTitle as="h1" size="lg" lead` (title + 16px description, `max-w-[500px]`), then the first section `gap-12` below.
- Overview: a `PageTitle` (`text-2xl font-medium`) and the controls for the whole page (period select, filter chips).

### Sections

A section is `flex flex-col gap-6`: a title block on the left (`font-medium text-base` title, `text-sm
text-neutral-600` description, `max-w-[500px]`) with the section's action on the right
(`flex items-start justify-between gap-6`), then the content `mt-8` below. Sections in a form are spaced
`gap-12`, with no separators; the submit button ends the form, right-aligned.

### Master–detail

A `w-64` list column (`p-3 gap-3`, no border: the gap and the detail's own title set them apart) with ghost icon buttons on top (hide list,
search), a full-width `SegmentedControl` filter, and `NavItem`s for the entries; the detail on the right with a
`text-base` title and an `text-xs` description (`max-w-[650px]`), `Tabs` for its facets, and a sticky footer
(`sticky bottom-0 bg-neutral-50 px-6 pt-4 pb-6`, right-aligned buttons) for save/next.

### Secondary surfaces

- **Sheet** (right, 512px, non-modal): history, details, comments, properties — things you read beside the page.
- **Dialog** (480px): confirmations and short forms. Header with title, description, body, footer with
  secondary + primary right-aligned, all spaced apart with no hairlines. Destructive confirms use a primary button labelled with the verb ("Delete page").
- **Popover**: a small form or detail anchored to its trigger (a date, a share setting, a filter's values),
  with an optional header (title, description). Anything with a menu's rows is a `DropdownMenu` instead.
- **DropdownMenu**: row and object actions behind a ghost `icon-sm` `EllipsisVertical`. Destructive items go last,
  after a separator, `variant="danger"`.
- **Floating BottomBar**: switches the *modes* of one object (`Dock`: Content · SEO · Settings) and carries its
  commit action (`DockAction`: "Publish", "Start campaign"). Use it when an object has several facets and one big
  commit; otherwise put the primary action in the HeaderBar.
- **Floating Toolbar**: bulk actions for a selection, or formatting over a focused block; the same shape as the dock.

## Patterns for common needs

| Need                    | Build it as                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| List of objects         | Ruled `Table` in its bordered panel; first column the name in `neutral-900`, meta columns `text-neutral-700`, numbers `numeric`; actions column `w-11` with the ellipsis menu. Group rows with `TableGroupRow`. |
| Inline add              | A last table row holding a ghost button ("+ Add phase"), `-ml-2 px-2 text-neutral-950`.        |
| Status / workflow       | `Badge` soft with an icon: draft `neutral`, in review `warning` (it waits on someone), scheduled `primary` (information), published `success`, error `error`. Never colour the whole row. |
| Search                  | `Input size="sm"` with a leading `Search` icon and a trailing `Kbd` (⌘K); in a header or above a list, level with the `Button`s beside it. |
| Filters                 | A `FilterBar`: the `FilterMenu` trigger (grouped checkbox values with counts, "Clear all" at its foot), then one removable `FilterChip` per group ("Status is Paid or Overdue"), then a ghost "Clear all". |
| View switch             | `SegmentedControl` (List · Grid, Draft · Preview); `Tabs` for facets of one object.             |
| Tree / hierarchy        | `NavGroup` + `NavItem variant="inset"` in a list column; deeper levels indent another `pl-8` step. |
| Empty state             | `EmptyState`: a left-aligned dashed panel with an optional icon tile, what goes here, one sentence and one `secondary` button. No illustrations. A filter that matched nothing offers to clear it. |
| Drop zone / upload      | `DropZone`: a dashed `rounded-item` well with a line on what goes here and a secondary "Choose files"; on drag-over the dash darkens and the 3% wash fills it. The files follow in `DropZoneFiles`, each a `DropZoneFile` with its bar while uploading. |
| Long form / wizard      | A horizontal `Stepper` over the form (or vertical beside a long one), the current step's fields under it, Back and Continue at the end; `value` + `onValueChange` on the stepper, so done steps go back; a step with errors is `invalid`, its description saying what is missing. |
| Loading                 | `Skeleton` blocks and `SkeletonText` lines at the real element's size, the region `aria-busy`. No spinners on whole pages; a spinner only inside the button that is busy: `<Button loading>`. |
| Save state              | `HeaderBarNotice` with `useHeaderNotice`: "Saving…" with a small `Spinner`, then "Saved", in a tab that slides out from under the header bar and leaves by itself. The same for other small actions with no undo ("Link copied"). |
| Toast / feedback        | `ToastProvider` once near the root, `useToast().add(…)` after an action: the inverse 34px chip at the foot, with Undo for anything reversible; lift it with `viewportClassName` above a bottom bar. A notice that must stay is an `Alert` in the page instead. |
| Onboarding              | A `Checklist` card on the overview: the count and a bar, done steps ticked, the next one open with its action and a ghost Skip. |
| Properties panel        | A right column `w-72 border-l border-neutral-200 p-4 gap-6` of `Field`s with `size="sm"` controls and `DescriptionList` or `ValueField size="sm"` for read-only facts. |
| Key–value facts         | `DescriptionList` or `MetaRow`; icon-led facts (location, device, joined) as a `MetaList` of `MetaItem`s; a read-only value in a form (an ID, an API key to copy) as `ValueField`; a single reading with its status as `ValueField variant="vital"`. |
| Live state              | `StatusDot` (pulsing for live) beside the thing it describes; a live count as `LiveCount` ("129 Active now"). |
| Usage / credits         | `Meter` with a label and a caption ("Resets in 10 days"); `Progress` for a task that finishes. A tone only when the amount warrants it (near the limit `warning`, over it `error`). |
| Ranked breakdown        | `BarList` of `BarListItem`s (top pages, sources, countries) with a title and value label; it collapses to "Show N more"; rows become filter toggles with `onClick` + `aria-pressed`. |
| Explaining a heading    | `InfoTip` beside the section or card title; never a paragraph of help text under it. |
| Sign-in code            | `CodeInput` (`size="lg"` when the code is the page's only task), with a resend ghost `Button` and the error in a `FieldHelper`. |
| Date / date range       | `DatePicker` in a form; `DateRangePicker` with its presets for filtering a report or overview; `Calendar` inline only when the month itself is the content. |
| Chat / support          | `ChatThread` of `ChatMessage`s (own · other), `ChatEvent` for system lines, `ChatToken`/`ChatReference` for tickets and invoices, `ChatComposer` at the foot. |
| Timeline / history      | `ActivityList` of `ActivityItem`s, in a `Sheet`.                                                 |
| Settings page           | Form anatomy: sections spaced `gap-12`, each a `SettingGroup` of `SettingRow`s (title + description left, `Switch`, `Select indicator="right"` or a `Button` right); no dividers between rows. |
| Choice with explanation | `OptionList` of `OptionRow`s with a `RadioGroupItem`/`Checkbox` in the trailing slot.          |
| Media grid              | `grid grid-cols-4 gap-3` of tiles: `rounded-item border border-neutral-200 overflow-hidden`, a `bg-neutral-950/[0.04]` aspect-[4/3] thumbnail, then name `text-xs font-medium` and meta `text-xxs text-neutral-500` in `p-2.5`. Selected: `outline-2 outline-action outline-offset-2`. |
| Board / kanban          | Columns as `bg-neutral-100 rounded-card p-2 gap-2` with a header (title + count badge); cards are `bg-neutral-50 rounded-item border border-neutral-200 p-3 shadow-float` only while dragging. |
| Document / rich text    | No box around the writing surface: the text sits on the panel at `text-sm`/`text-base` `leading-relaxed text-neutral-900`, `max-w-[680px]`; headings `font-medium` (`text-2xl` / `text-lg` / `text-base`); a floating `Toolbar` over the selection; blocks get a ghost `GripHorizontal` handle on hover in the left margin. |
| Command palette         | `CommandMenu` opened by `useCommandMenuShortcut`: recent records, then places to go, then actions, each with its `Kbd` or a quiet hint; `keywords` for the other words people type. |

## Making a new component

Start from the closest existing file in `assets/continuum/components/` and keep its shape:

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

Choosing its values:

- **Height**: reuse one from the scale. Inline labels 22 and 25; small inline controls 29; rows inside a floating
  container 32; the control row 34 (buttons, small fields, nav rows); the field row 38 (medium fields, large
  buttons, the dock); table rows 41; bars 52/54/56. Don't introduce a height between 34 and 38.
- **Radius** by nesting level: chip (inside an item), item (rows, tiles, menu items), control (buttons, inputs),
  card, panel. Inset parts subtract the inset: `rounded-[calc(var(--radius-item)-2px)]`.
- **Padding** beside a label: `px-3` on a control (`px-4` on a large button), `px-2` on a row inside a floating
  container and on a chip, `px-2.5` on a nav row or a segment, `px-1.5` on a badge.
- **Type**: 13px medium for controls, 13px normal for secondary text, 11px for meta. Two weights.
- **Colour**: surface `neutral-50`, hairline `neutral-200`, hover border `neutral-300`, idle text `neutral-600`,
  hover/selected wash `neutral-950/5`, the action colour only for the one thing that is "on" or primary. A fill
  that may land on the canvas is translucent (`neutral-950/[0.04]`), never a solid `neutral-100`.
- **States**: hover, `focusRing`, disabled at 50%, selected through Base UI's state attributes (`data-checked`,
  `data-selected`, `data-pressed`, `data-highlighted`, `data-open`) or `aria-*`, 150ms colour transitions with an
  explicit property list. Popups enter and leave through `data-starting-style:` / `data-ending-style:`.
- **Shadow**: none, unless it floats (`shadow-float`) or is a sheet/dialog (`shadow-sheet`).
- **Theme-dependent look**: add a token under Tailwind's names with a default in `tokens.css`, and let
  `createThemeCss` set it from an option; never check for a theme.
- **Behaviour**: anything interactive (open/close, selection, keyboard, focus) wraps a Base UI primitive from
  `@base-ui/react`, styled through its parts and typed `WithClassName<Part.Props>`. To let a plain component
  render as another element (a router link), give it the `render` prop through `useRender`, as `Button` does;
  never hand-roll focus management or ARIA that a primitive already provides.

If the project keeps Continuum as a copied folder, put new components beside the others and export them from its
`index.ts`; if it's a host project, keep them in the host's own components folder importing `cn` and `focusRing`
from Continuum.

## Worked example: a CMS

How the method plays out for "build a CMS":

- **Objects**: pages, entries (per collection), media, users. **Most important task**: edit and publish an entry.
- **Look**: the default theme (a writing tool, calm), light, with dark available. A publisher with a house colour
  would get a theme with that accent and `action: 'accent'`.
- **Sidebar**: primary "New entry"; Home `Kbd H`, Pages `Kbd P`, Media `Kbd M`, Review with a count badge;
  a "Collections" group of `NavGroup`s (📰 Articles, 🧑‍🍳 Recipes, 🏷️ Authors) each with Entries · Fields ·
  Settings as `inset` items; "Archive" as the last project row; account footer.
- **Entries index** (index kind, `wide` 1080px column): `h1` "Articles" with a count badge; `mt-12`; a section title
  "All entries" with a description and a primary "New entry +" on the right; a row of `FilterChip`s (Status:
  Draft, Author: 2) and a search `Input size="sm"`; a ruled `Table` — title, status `Badge`, author `Avatar` +
  name, updated (`text-neutral-700`), ellipsis actions; `Pagination` under it; the dashed empty state when a
  filter matches nothing.
- **Entry editor** (detail kind): `HeaderBar` with breadcrumb Articles › title, save state `text-xxs` and a
  secondary "Preview"; the document surface (680px, no box) with title as an `text-2xl` input without border and
  the body as blocks; a floating formatting `Toolbar` on selection; a properties column on the right (`w-72
  border-l`: slug `Input size="sm"`, author `Select`, tags as `FilterChip`s, publish date); a floating
  `BottomBar` with a `Dock` (Content · SEO · Settings) and a `DockAction` "Publish". History in a `Sheet`.
- **Media library**: `SegmentedControl` Grid · List in the section header; the media grid pattern; upload as a
  dashed drop zone at the top; selection shows a floating `Toolbar` with "Download", "Move", "Delete".
- **Settings**: form anatomy at 896px, sections spaced `gap-12`, toggles as `SettingRow`s with `Switch`es,
  "Save changes" at the end.
- **Overview**: the dashboard anatomy — `StatCard`s for drafts, scheduled, published this week; an `AreaChart`
  of publishes; a `rows` table of top entries.
