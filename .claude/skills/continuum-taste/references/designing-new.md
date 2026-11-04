# Designing what Continuum doesn't have yet

The library covers the screens it was drawn from. A new product (a CMS, a CRM, a booking tool, an admin) needs
pages, patterns and components that don't exist yet. Build them **from the rules** in `rules.md`, so the result
looks as if it came from the same hand. This file is the method, the patterns for common needs, a recipe for new
components and a worked example.

## The method

1. **Model the product before drawing anything.** List the objects (pages, entries, media, users), what people do
   to each (browse, edit, publish, review), and which one task matters most.
2. **Name each screen's kind**: overview, index, detail, create or edit, settings. Its width and anatomy follow
   from the kind (`rules.md`, Pages). Think each page through for what it is for: nothing repeats (a chart
   headline that repeats a stat card), and every element has a purpose (a selection needs bulk actions).
3. **Decide the look.** The baseline (no theme: achromatic greys, near-black action, Geist) suits most tools. If
   the product has a brand colour or a mood of its own, write a theme with `createThemeCss` and open the scope
   with `<Theme theme="name">`. A dark-first product sets `mode="dark"`; every theme works in both.
4. **Compose from existing components** wherever one fits, even loosely: a tree is `NavGroup`s, a status is a
   `Badge`, a choice list is `OptionRow`s, a mode switch is a `SegmentedControl` or `Dock`.
5. **Only then make a new component**, by the recipe below: borrow height, radius, padding and states from the
   closest existing one. Never invent a new value when an existing one is near enough.
6. **Review** with the checklist in `SKILL.md`, in light and dark, at 1440×900.

Never copy another product's layout into a Continuum version of it: keep its content and let the rules decide
the structure. Titles, empty states and forms align left; nothing is centred except the content column itself.

## Patterns for common needs

| Need                    | Build it as                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| List of objects         | Ruled `Table` in its bordered panel; first column the name in `neutral-900`, meta columns `text-neutral-700`, numbers `numeric`; actions column `w-11` with the ellipsis menu. Group rows with `TableGroupRow`. A row opens the object's own page. |
| Inline add              | A last table row holding a ghost button ("+ Add phase"), `-ml-2 px-2 text-neutral-950`.        |
| Status / workflow       | `Badge` soft with an icon: draft `neutral`, in review `warning` (it waits on someone), scheduled `primary` (information), published `success`, error `error`. Never colour the whole row. |
| Search                  | `Input size="sm"` with a leading `Search` icon and a trailing `Kbd` (⌘K); in a header or above a list, level with the `Button`s beside it. |
| Filters                 | A `FilterBar`: the `FilterMenu` trigger (grouped checkbox values with counts, "Clear all" at its foot), then one removable `Chip` per group ("Status is Paid or Overdue"), then a ghost "Clear all". |
| Views of a list         | Status views (All, Drafts, Published) as a `Dock` in the floating `BottomBar` with their counts, beside a `DockAction` for the page's primary action. |
| View switch             | `SegmentedControl` (List · Grid, Draft · Preview); `Tabs` for facets of one object.             |
| Tree / hierarchy        | `NavGroup` + `NavItem variant="inset"`; deeper levels indent another `pl-8` step.               |
| Empty state             | `EmptyState`: a left-aligned dashed panel with an optional icon tile, what goes here, one sentence and one `secondary` button. No illustrations. A filter that matched nothing offers to clear it. |
| Drop zone / upload      | `DropZone`: a dashed `rounded-item` well with a line on what goes here and a secondary "Choose files"; on drag-over the dash darkens and the 3% wash fills it. The files follow in `DropZoneFiles`, each a `DropZoneFile` with its bar while uploading. |
| Long form / wizard      | A horizontal `Stepper` over the form (or vertical beside a long one), the current step's fields under it, Back and Continue at the end; `value` + `onValueChange` on the stepper, so done steps go back; a step with errors is `invalid`, its description saying what is missing. |
| Loading                 | `Skeleton` blocks and `SkeletonText` lines at the real element's size, the region `aria-busy`. No spinners on whole pages; a spinner only inside the button that is busy: `<Button loading>`. |
| Save state              | `Notice` with `useNotice`, in the header bar: "Saving…" with a small `Spinner`, then "Saved", in a tab that slides out from under the header bar and leaves by itself. The same for other small actions with no undo ("Link copied"). |
| Toast / feedback        | `ToastProvider` once near the root, `useToast().add(…)` after an action: the inverse 34px chip at the foot, with Undo for anything reversible; lift it with `viewportClassName` above a bottom bar. A notice that must stay is an `Alert` in the page instead. |
| Onboarding              | A `Checklist` card on the overview: the count and a bar, done steps ticked, the next one open with its action and a ghost Skip. |
| An object's properties  | A facet of its own: the Settings view in the object's dock or tabs, its fields stacked as in a form. Never a fixed column beside the object. |
| Key–value facts         | `DescriptionList`; icon-led facts (location, device, joined) as a plain wrapping row of 16px icons and text; a read-only value in a form (an ID, an API key to copy) as `ValueField`; a single reading with its status as `ValueField variant="vital"`. |
| Live state              | `StatusDot` (pulsing for live) beside the thing it describes; a live count as `LiveCount` ("129 Active now"). |
| Usage / credits         | `Meter` with a label and a caption ("Resets in 10 days"); `Progress` for a task that finishes. A tone only when the amount warrants it (near the limit `warning`, over it `error`). |
| Ranked breakdown        | `BarList` of `BarListItem`s (top pages, sources, countries) with a title and value label; it collapses to "Show N more"; rows become filter toggles with `onClick` + `aria-pressed`. |
| Explaining a heading    | `InfoTip` beside the section or card title; never a paragraph of help text under it. |
| Sign-in code            | `CodeInput` (`size="lg"` when the code is the page's only task), with a resend ghost `Button` and the error in a `FieldHelper`. |
| Date / date range       | `DatePicker` in a form; `DateRangePicker` with its presets for filtering a report or overview; `Calendar` inline only when the month itself is the content. |
| Chat / support          | `ChatThread` of `ChatMessage`s (own · other), `ChatEvent` for system lines, `ChatToken`/`ChatReference` for tickets and invoices, `ChatComposer` at the foot. |
| Timeline / history      | `ActivityList` of `ActivityItem`s, in a `Sheet`.                                                 |
| Settings page           | Sections spaced `gap-12`, each a `SettingGroup` of `SettingRow`s (title + description left, `Switch`, `Select indicator="right"` or a `Button` right); no dividers between rows. |
| Choice with explanation | `OptionList` of `OptionRow`s with a `RadioGroupItem`/`Checkbox` in the trailing slot.          |
| Media grid              | `grid grid-cols-4 gap-3` of tiles: `rounded-item border border-neutral-200 overflow-hidden`, a `bg-neutral-950/[0.04]` aspect-[4/3] thumbnail, then name `text-xs font-medium` and meta `text-xxs text-neutral-500` in `p-2.5`. Selected: `outline-2 outline-action outline-offset-2`. |
| Board / kanban          | Columns as `bg-neutral-100 rounded-card p-2 gap-2` with a header (title + count badge); cards are `bg-neutral-50 rounded-item border border-neutral-200 p-3`, `shadow-float` only while dragging. |
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

Take every value from `rules.md`: the height from the height scale (never between 34 and 38), the radius by
nesting level, the side padding fixed per kind and content padding from the spacing formula, 13px medium for
controls and 11px for meta, the colour roles, the states and motion. Shadow only if it floats.

- **Theme-dependent look**: add a token under Tailwind's names with a default in `tokens.css`, and let
  `createThemeCss` set it from an option; never check for a theme.
- **Behaviour**: anything interactive (open/close, selection, keyboard, focus) wraps a Base UI primitive from
  `@base-ui/react`, styled through its parts and typed `WithClassName<Part.Props>`. To let a plain component
  render as another element (a router link), give it the `render` prop through `useRender`, as `Button` does;
  never hand-roll focus management or ARIA that a primitive already provides.

If the project keeps Continuum as a copied folder, put new components beside the others and export them from its
`index.ts`; otherwise keep them in the host's own components folder, importing `cn` and `focusRing` from Continuum.

## Worked example: a CMS

How the method plays out for "build a CMS":

- **Objects**: pages, entries (per collection), media, users. **Most important task**: edit and publish an entry.
- **Look**: the default theme (a writing tool, calm), light, with dark available. A publisher with a house colour
  would get a theme with that accent and `action: 'accent'`.
- **Sidebar**: Home `Kbd H`, Pages `Kbd P`, Media `Kbd M`, Review with a count badge; a "Collections" group of
  `NavGroup`s (Articles, Recipes, Authors) each with Entries · Fields · Settings as `inset` items; the account in
  the footer. No create button: each index owns its own.
- **Entries index** (index, `wide`): the breadcrumb Home › Articles; the title "Articles" with a line on what the
  collection holds; a `FilterBar` (Author, Tag) and a search `Input size="sm"`; a ruled `Table` (title, status
  `Badge`, author `Avatar` + name, updated, ellipsis actions) and `Pagination`; the views All · Drafts · In review
  · Published in the floating dock with their counts, beside a `DockAction` "New entry". The dashed empty state
  when a filter matches nothing. A row opens the entry's own page.
- **Entry editor** (edit one object): the breadcrumb Articles › the entry's title, the save state as a `Notice`
  and a secondary "Preview" in the header bar; the document surface (680px, no box) with the title as a
  borderless `text-2xl` input and the body as blocks; a floating formatting `Toolbar` on selection; a floating
  `BottomBar` with a `Dock` (Content · SEO · Settings) and a `DockAction` "Publish". Slug, author, tags and
  publish date are the Settings facet, stacked at `narrow`. History in a `Sheet`.
- **Media library**: `SegmentedControl` Grid · List in the title row; the media grid pattern; upload as a dashed
  drop zone at the top; a selection shows a floating `Toolbar` with "Download", "Move", "Delete".
- **Settings** (`default`): headed sections spaced `gap-12`, toggles as `SettingRow`s with `Switch`es, "Save
  changes" at the end.
- **Overview** (`default`): `StatCard`s for drafts, scheduled and published this week; an `AreaChart` of publishes
  that does not repeat them; a `rows` table of top entries.
