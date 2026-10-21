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
2. **Pick a theme from the mood.** Calm writing tool → `eyes` or `stone`; structured business data → `indigo` or
   `electric`; a brighter creative product → `lime`; dark-first → `stone` or `violet` with `mode="dark"`.
3. **Compose from existing components** wherever one fits, even loosely: a tree is `NavGroup`s, a status is a
   `Badge`, a choice list is `OptionRow`s, a mode switch is a `SegmentedControl` or `Dock`.
4. **Only then make a new component**, by the recipe at the end: borrow height, radius, padding and states from
   the closest existing one. Never invent a new value when an existing one is near enough.
5. **Review** with the checklist in `SKILL.md`, in light and dark.

## What a Continuum screen is like

- **One primary action per view**, in the action colour. Everything else is secondary (outlined) or ghost.
- **Left-aligned and calm.** Titles, empty states and forms align left; nothing is centred except the content
  column itself.
- **Structure from hairlines and space**, not from boxes inside boxes. A section is a title + content separated
  from the next by a `Separator` or a gap, not wrapped in a card. Use a `Card` only for a self-contained unit
  (a KPI, a chart, a selectable group).
- **Quiet labels, loud data**: chrome is `neutral-600` 13px; the user's content is `neutral-950`, `font-medium`
  where it is the point.
- **Copy**: sentence case everywhere. Buttons are verb + object ("Add email", "Generate report", "Start campaign").
  Section descriptions are one or two full sentences that say what the section does and its effect.
- **Icons**: leading in navigation and menu items; *trailing* on action buttons ("Add email +", "Generate report →").

## Page anatomy

### The shell (every app screen)

`AppShell` → `Sidebar` → `AppPanel` → `HeaderBar` → scrolling content → optional floating `BottomBar`.

- **Sidebar**, top to bottom: `SidebarHeader` (logo mark in the action colour + collapse toggle) · a `divided`
  group starting with a `NavItem variant="primary"` for the product's create action ("New page") followed by the
  main sections (with a `Kbd` shortcut or a `Badge variant="count"` as trailing) · a labelled group of
  workspaces/projects/collections as `NavGroup`s with emoji or icons and `inset` children · a last `project` row
  ("All projects", "Archive") · `SidebarFooter` with the account and a ghost bell.
- **HeaderBar** (54px): a `Breadcrumb` (`text-sm`, starting with the home icon) on the left; at most one or two
  actions on the right (secondary + primary).
- **Content column**: a centred fixed width, with generous top padding and bottom padding that clears the floating
  bar:

  | Screen kind               | Column            | Padding                   |
  | ------------------------- | ----------------- | ------------------------- |
  | Overview / dashboard      | `w-[896px]`       | `pt-5 pb-28`              |
  | Form / flow               | `w-[960px]`       | `pt-[72px] pb-24`, `gap-8` |
  | Index table / editor      | `w-[1024px]`      | `pt-20 pb-32`             |
  | Document-like detail      | full width        | `px-32 pt-16 pb-16`, text `max-w-[560px]` |
  | Master–detail             | split, see below  | `px-6 pt-6`               |

### Page header

- Index/editor: one row of `h1` (`font-medium text-lg`) with its context beside it — an `AvatarStack`, a
  vertical `Separator className="h-4"`, a status `Badge` with an icon. Then a `Separator className="mt-8 mb-12"`.
- Form/flow: `SectionTitle as="h1" size="lg" lead` (title + 16px description, `max-w-[500px]`), then a `Separator`.
- Overview: a `PageTitle` (`text-2xl font-medium`) and the controls for the whole page (period select, filter chips).

### Sections

A section is `flex flex-col gap-6`: a title block on the left (`font-medium text-base` title, `text-sm
text-neutral-600` description, `max-w-[500px]`) with the section's action on the right
(`flex items-start justify-between gap-6`), then the content `mt-8` below. Sections in a form are split by
`Separator`s and spaced `gap-8`; the submit button ends the form, right-aligned.

### Master–detail

A `w-64` list column (`border-r border-neutral-200 p-3 gap-3`) with ghost icon buttons on top (hide list,
search), a full-width `SegmentedControl` filter, and `NavItem`s for the entries; the detail on the right with a
`text-base` title and an `text-xs` description (`max-w-[650px]`), `Tabs` for its facets, and a sticky footer
(`sticky bottom-0 bg-neutral-50 px-6 pt-4 pb-6`, right-aligned buttons) for save/next.

### Secondary surfaces

- **Sheet** (right, 512px, non-modal): history, details, comments, properties — things you read beside the page.
- **Dialog** (480px): confirmations and short forms. Header with title, description, body, footer with
  secondary + primary right-aligned. Destructive confirms use a primary button labelled with the verb ("Delete page").
- **DropdownMenu**: row and object actions behind a ghost `icon-sm` `EllipsisVertical`. Destructive items go last,
  after a separator, `variant="danger"`.
- **Floating BottomBar**: switches the *modes* of one object (`Dock`: Content · SEO · Settings) and carries its
  commit action (`DockAction`: "Publish", "Start campaign"). Use it when an object has several facets and one big
  commit; otherwise put the primary action in the HeaderBar.
- **Floating Toolbar**: bulk actions for a selection, or formatting over a focused block.

## Patterns for common needs

| Need                    | Build it as                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| List of objects         | Ruled `Table` in its bordered panel; first column the name in `neutral-900`, meta columns `text-neutral-700`, numbers `numeric`; actions column `w-11` with the ellipsis menu. Group rows with `TableGroupRow`. |
| Inline add              | A last table row holding a ghost button ("+ Add phase"), `-ml-2 px-2 text-neutral-950`.        |
| Status / workflow       | `Badge` soft with an icon: draft `neutral`, scheduled `warning`, published `success`, error `error`, in review `primary`. Never colour the whole row. |
| Search                  | `Input size="sm"` with a leading `Search` icon and a trailing `Kbd` (⌘K); in a header or above a list. |
| Filters                 | `FilterChip`s in a row after the title, removable; a `DropdownMenu` with checkbox items to add more. |
| View switch             | `SegmentedControl` (List · Grid, Draft · Preview); `Tabs` for facets of one object.             |
| Tree / hierarchy        | `NavGroup` + `NavItem variant="inset"` in a list column; deeper levels indent another `pl-8` step. |
| Empty state             | Left-aligned dashed panel: `rounded-panel border border-dashed border-neutral-200 p-6 text-xs text-neutral-600`, one sentence on what goes here, one `secondary` button. No illustrations. |
| Drop zone / upload      | The empty-state panel, made the drop target; on drag-over the border turns `neutral-400` and the fill `bg-neutral-950/[0.03]`. |
| Loading                 | Quiet placeholders: `bg-neutral-100 rounded-item` blocks at the real element's size, optional `animate-pulse`. No spinners on whole pages; a spinner only inside the button that is busy. |
| Save state              | `text-xxs text-neutral-500` beside the title or in the header: "Saved", "Saving…", "Unsaved changes". |
| Toast / feedback        | A floating chip like the tooltip, centred above the bottom bar: `rounded-item bg-neutral-950 text-neutral-50 text-xs px-3 h-[33px] shadow-float`, 200ms entry. |
| Properties panel        | A right column `w-72 border-l border-neutral-200 p-4 gap-6` of `Field`s with `size="sm"` controls and `DescriptionList` for read-only facts. |
| Key–value facts         | `DescriptionList` or `MetaRow`.                                                                 |
| Timeline / history      | `ActivityList` of `ActivityItem`s, in a `Sheet`.                                                 |
| Settings page           | Form anatomy: sections with title + description left, controls below, `Switch` rows as `OptionRow`s. |
| Choice with explanation | `OptionList` of `OptionRow`s with a `RadioGroupItem`/`Checkbox` in the trailing slot.          |
| Media grid              | `grid grid-cols-4 gap-3` of tiles: `rounded-item border border-neutral-200 overflow-hidden`, a `bg-neutral-100` aspect-[4/3] thumbnail, then name `text-xs font-medium` and meta `text-xxs text-neutral-500` in `p-2.5`. Selected: `outline-2 outline-action outline-offset-2`. |
| Board / kanban          | Columns as `bg-neutral-100 rounded-card p-2 gap-2` with a header (title + count badge); cards are `bg-neutral-50 rounded-item border border-neutral-200 p-3 shadow-float` only while dragging. |
| Document / rich text    | No box around the writing surface: the text sits on the panel at `text-sm`/`text-base` `leading-relaxed text-neutral-900`, `max-w-[680px]`; headings `font-medium` (`text-2xl` / `text-lg` / `text-base`); a floating `Toolbar` over the selection; blocks get a ghost `GripHorizontal` handle on hover in the left margin. |
| Command palette         | A `Dialog` at 560px pinned near the top: an `Input` without border at the top, then menu-item rows (32px, `rounded-item`, highlighted with the 5% wash) and `Kbd`s on the right. |

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

- **Height**: reuse a family height. Inline labels 22/25; small controls 29; buttons and rows 33/34; inputs 38;
  large buttons and table rows 41; bars 52/54/56. Don't introduce 36 or 40 for a control unless it matches the dock.
- **Radius** by nesting level: chip (inside an item), item (rows, tiles, menu items), control (buttons, inputs),
  card, panel. Inset parts subtract the inset: `rounded-[calc(var(--pds-radius-item)-2px)]`.
- **Padding** beside a label with rounded corners: `px-curve` with `--curve-base` near the drawn padding minus a
  quarter of the radius, `--curve-radius` the radius used, `--curve-height` the height.
- **Type**: 13px medium for controls, 13px normal for secondary text, 11px for meta. Two weights.
- **Colour**: surface `neutral-50`, hairline `neutral-200`, hover border `neutral-300`, idle text `neutral-600`,
  hover/selected wash `neutral-950/5`, the action colour only for the one thing that is "on" or primary.
- **States**: hover, `focusRing`, disabled at 50%, selected through `data-[state=…]`/`aria-*`, 150ms colour
  transitions with an explicit property list.
- **Shadow**: none, unless it floats (`shadow-float`) or is a sheet/dialog (`shadow-sheet`).
- **Theme-dependent look**: add a semantic `--pds-*` token, not a theme check.

If the project keeps Continuum as a copied folder, put new components beside the others and export them from its
`index.ts`; if it's a host project, keep them in the host's own components folder importing `cn` and `focusRing`
from Continuum.

## Worked example: a CMS

How the method plays out for "build a CMS":

- **Objects**: pages, entries (per collection), media, users. **Most important task**: edit and publish an entry.
- **Theme**: `eyes` (writing tool, calm), Geist, light, with dark available.
- **Sidebar**: primary "New entry"; Home `Kbd H`, Pages `Kbd P`, Media `Kbd M`, Review with a count badge;
  a "Collections" group of `NavGroup`s (📰 Articles, 🧑‍🍳 Recipes, 🏷️ Authors) each with Entries · Fields ·
  Settings as `inset` items; "Archive" as the last project row; account footer.
- **Entries index** (index kind, 1024px column): `h1` "Articles" with a count badge; `Separator`; a section title
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
- **Settings**: form anatomy at 960px, sections split by separators, toggles as `OptionRow`s with `Switch`es,
  "Save changes" at the end.
- **Overview**: the dashboard anatomy — `StatCard`s for drafts, scheduled, published this week; an `AreaChart`
  of publishes; a `rows` table of top entries.
