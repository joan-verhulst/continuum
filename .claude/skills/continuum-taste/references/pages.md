# Pages

How a Continuum screen is put together: the shell around it, the column it sits in, and the anatomy of each
kind of page, top to bottom, in units. A page is one of seven kinds, and the kind decides its width, its parts and
where its actions go. Values here are the system's; `foundations.md` has the colours, type and spacing they are
drawn from.

## The shell

```
canvas (neutral-100)
├── sidebar  256 wide, straight on the canvas, no fill, no border; its own 8–12 of inset keeps items off the panel
└── panel    8 from the canvas at the top, right and bottom, flush with the sidebar · panel corners (20) · hairline · surface
    ├── header bar  54 high · hairline below · breadcrumb left (16 in) · at most two actions right (8 in)
    ├── the page    a centred column (below), starting 96 below the header bar's hairline (128 on a large screen)
    └── floating dock, when the page has views: centred, 24 above the panel's bottom edge
```

**Sidebar.** Header 56 high: the product's mark left (a 26 mark, no name), the collapse toggle right; the
workspace's name lives in the footer account, over its plan. A product with several workspaces or projects
puts a **SidebarSwitcher** under the header (the current one's mark, name over a quiet line, a menu of the
others), or makes the footer account one; the breadcrumb's menu stays for switching siblings deeper in the
trail. Then the main places as nav items:
34 high, 10 side padding, 8 between icon (16) and label, `item` corners (10), 13 regular `neutral-950`, 2 apart;
the current one takes the selected wash (7%); a trailing `Kbd` or count badge sits at the right. Groups are 24
apart, each under a label of 13 regular `neutral-600` with 10 side and 4 vertical padding; a labelled group's
items are plain nav items at 13 with their icons. A **project or collection** (a NavGroup row, 14
`neutral-700`) folds open to its pages as `inset` items (left padding 32, no icon, 14 `neutral-700`,
`neutral-950` when current); the 14 and the indent belong to that pair only. A place with a long index of its
own (a docs site's components, a settings tree) drills down into a level of its own, under a back row with its
name, rather than lengthening the top level. The footer holds the account
(avatar, name over plan) at the very bottom with 16 above, 24 below. **The sidebar holds places, not a create
button**: the page that creates owns its create action.

**Top nav**, instead of a sidebar for an app of a handful of sections: a 56 bar on the canvas above the panel,
16 side padding, the brand (14 medium) left, links 34 high with 12 side padding, 13 `neutral-600` (`neutral-950`
when current), the account right. Links that overflow scroll, with chevrons.

**Rail**, for an app that wants the navigation out of the way: a floating pill 52 wide (208 expanded), 8 padding,
icon-only items of 34 named in tooltips; the current item sits on one action-coloured pill that slides between
items.

**Header bar.** 54 high, hairline below, the breadcrumb at the left (home icon › … › the page, 13, the page in
`neutral-950`, the rest `neutral-600`), and at the right at most one or two actions that belong to the page as a
whole (a history toggle, a notice). **Every page has its breadcrumb**, from home down to itself. A back and
forward pair, when there is no router, sits at the far left, ruled off full height.

**The floating dock.** Centred over the page's foot, 24 above the panel's bottom edge: 38 high outside, a
hairline, the surface colour, `dock` corners (a pill), the `float` shadow. Inside, items of 32 high sitting 3
from the outer edge (the hairline plus 2), 12 side padding, 13 medium `neutral-600`, 2 apart; the selected one
is filled with the action colour and `on-action` text (a theme may make it a raised chip instead). A count may
trail a label in the same size, `neutral-600` (`on-action` at 70% on the selected item). Beside the dock, the page's one
primary action as a **dock action**: a 38 pill in the action colour. The page's column gets 96 of bottom
padding so the last row scrolls clear of the dock. When rows are selected, a floating toolbar of the bulk actions
takes the dock's place.

## The column

Content sits in a centred column and never runs to the panel's edges. Width follows density, not the screen;
pick the narrowest that fits:

| Kind of page                                                    | Width     |
| --------------------------------------------------------------- | --------- |
| Create or edit one object, its fields stacked; settings          | `narrow` 640 |
| Overview, detail, document                                       | `default` 896 |
| An index: a list or table with several columns                   | `wide` 1080 |
| A very dense table                                               | `dense` 1280 |
| Several dense tables side by side (`inset`: the panel less 64 a side, 128 on a large screen) | `inset` |
| Only when explicitly asked for: the panel edge to edge           | `full`    |

Below its width the column takes the panel less 16 a side (24 from a 640 viewport). A form is never wider than
640 whatever the screen; an overview with cards and charts is not dense and stays 896.

## The page head

The title row every page starts with:

- **Title** 24 medium `neutral-950`; under it one **description line** 14 regular `neutral-600`, 6 below.
- The page's own **actions** at the right, bottom-aligned with the description, 8 apart: on an index a
  secondary and the primary (when there are no views; otherwise the primary is in the dock); on an overview
  the period picker and filters; on a detail the object's actions.
- **40** between the head and the first section.

## A section

- **Title** 16 medium `neutral-950`; under it one or two sentences 13 regular `neutral-600`, no wider than
  500, 4 below the title.
- The section's own action (a secondary button, or a ghost link) at the right of the title block.
- **20** between the section head and its content.
- Sections are **40** apart and never divided by a line. A long document's sections are 64 apart.

## The page kinds

### Overview (`default`, 896)

Reads how things are going over one period; it holds no create action.

1. Page head: the title, a line, and at the right the **period** picker (a 34 select or date-range picker) and
   any filters.
2. **The figure that leads**, as a chart card: 20 padding (48 at the bottom under the x labels), 32 between
   its header and the chart; the header is a 13 regular `neutral-600` label, a 24 medium headline figure, and a
   delta beside it on the same baseline.
3. **Stat cards** in a row, 16 apart, four across (three on a detail): 16 padding; a 13 regular `neutral-600`
   label, the value 18 medium `neutral-950` 4 below, a delta pill (22 high, success or error, neutral when
   flat) 12 below. **A stat card never repeats the chart's figure.**
4. Then where it comes from and what moved: two list cards side by side, 16 apart (20 padding, a 13
   `neutral-600` title, a ranked bar list or a short `rows` table), or an activity list.

### Index (`wide`, 1080; `dense` only for a very dense table)

Finds one thing among many and opens it. **A row opens the item's own page**, with the breadcrumb back; never
a pane beside the list, and never the item's editor in a sheet.

1. Page head: the title, a line on what the list holds ("The companies on a plan or a trial, and the ones that
   have left"; a count in the dock is not also in the head), at the right a secondary action (Export) and, when
   the list has no views, the primary (New customer).
2. **The toolbar**, 16 below the head: a search input (34 high, 256 wide, a leading search icon) and the
   filters, 12 apart: a segmented control for a one-of-few choice, a 34 select per value, or a **Filter** button
   (secondary, 34, a filter icon, a count once filters apply) that opens grouped checkbox values with "Clear
   all" at its foot. The toolbar never moves as filters change.
3. **Applied filters**, only when there are any, 8 below the toolbar: one soft chip per group (25 high, 8 side,
   13, `pill` corners, the `neutral-100` fill and no border, `neutral-600` text, a 12 × at its end: "Channel is
   Online store or Wholesale"), wrapping to more lines if needed, and a ghost "Clear all" at the end.
4. **The table**, 16 below: ruled, in its frame (`control` corners, the hairline, the surface). Head 41 high,
   `neutral-100` fill, 13 regular `neutral-600`, 12 padding. Rows 41 high, 12 padding, a hairline between
   rows, the first column (the name) 13 medium `neutral-900`, meta columns `neutral-700`, numbers tabular and
   right-aligned, status as a badge, people as a 24 avatar with the name; the last column (44 wide) a ghost
   ellipsis button that opens the row's menu. Hover 3% wash; a selected row the 7% wash. A row with a second
   line of meta (an address, a domain) is 54 high. A checkbox column (20 boxes) only when rows can be selected.
5. **Pagination** 16 below the table: "Showing 1–10 of 48" (13/500 `neutral-800`) left, the pages centred
   (previous, numbers with an ellipsis, next: 34 × 34 hairline buttons, 8 apart, the row never changing
   width), an optional slot right.
6. **The views** (All · Active · Trial · Past due, with counts) in the **floating dock**, beside the page's one
   primary action as a dock action. Views in the dock, not above the table as tabs.
7. Empty: a left-aligned dashed panel with what goes here, one sentence and one secondary button; a filter that
   matched nothing offers to clear it.

### Detail (`default`, 896): one column, never split

Everything about one object, stacked. **No side column of facts** beside the main one; history and comments
go in a sheet.

1. **Title row**: the object's avatar or icon tile (36) left, 16 from the text; the name 24 medium with its
   status badge beside it (8 apart); a meta line 14 `neutral-600` 4 below ("northwind.com · A customer since
   March 2023"). At the right, top-aligned, 8 apart: a secondary action, the primary, and a ghost icon button
   (ellipsis) with the rest.
2. **Tabs** for the object's facets (Overview · Invoices · Contacts), 40 below: line tabs on their
   own hairline, the active one underlined (the spec is in `components.md`); a count may trail a label. Pill
   tabs are for a tight spot inside a card or a dialog.
3. **Numbers**: three stat cards, 16 apart.
4. **Facts**: a list card (20 padding) titled "Details" (13 regular `neutral-600`), holding a grid of
   label-over-value pairs, three across, 24 between columns and 20 between rows: the label 13 regular
   `neutral-600`, the value 13 medium `neutral-950` 6 below.
5. The rest, each a list card or a section: usage meters, recent activity (with "Full history" opening the
   sheet), related tables.

### Create or edit one object (`narrow`, 640)

1. Page head: "New customer", one line on what gets made.
2. **Sections**, 40 apart, each a section head (title; description only when it helps) with its fields 20
   below.
3. **Fields** stack one per row, 20 apart: a label 13 medium `neutral-900`, the control 8 below (a medium input
   or select, 38 high; a textarea; a date picker), a helper line 13 `neutral-600` 8 below when the field needs
   one. Two short fields (city and postcode) may share a row, 12 apart; otherwise one per row.
4. **Actions** at the end, right-aligned, 8 apart: a secondary "Cancel" and the one primary, verb plus object
   ("Create customer"). While editing an existing object, the commit action moves up: into the floating dock
   as a dock action when the editor has facets to switch (they are views in the dock), otherwise into the
   title row. Either way the save state shows as a notice in the header bar.
5. A long form is a stepper over its sections (horizontal above, or vertical beside), Back and Continue at the
   end.

### Settings (`narrow`, 640): as small as it goes

1. Page head: the area's name ("Workspace", "Notifications"), one line.
2. **One list card per group**, the cards stacked 24 apart: 20 padding, a quiet group title (13 regular
   `neutral-600`) and the rows 16 apart under it, **each divided from the next by a hairline** at the card's
   content width (the one place on a page where rows are ruled: the card is a bordered list).
3. **A setting row**: the title 13 medium `neutral-950` over its description 13 regular `neutral-600` (2
   between), the control at the right, the row at least 38 high. **One control per setting**: a **switch**
   (48 × 25, round, `neutral-300` off, the action colour on, a 21 knob) turns a thing on; a **picker** (a 34
   select with the value and a right chevron: "Select ›", "After a day ›") sets a value; a **secondary button**
   does a thing ("Add seats"). Never a row of checkboxes per channel, never a group of radios in a row.
4. **A dependent setting** shares the space between two hairlines with the setting it depends on: the same 16
   below it, no hairline between them, dimmed (50%) while that one is off. Closeness alone never carries the
   relationship: the hairlines around the pair do, or, when a parent has several dependents, a small eyebrow
   over them (13 regular `neutral-600`, like the group title) names what they belong to.
5. **Plain values** (a name, an address, a language) are fields stacked in the card, as in a form.
6. The settings areas (General · Members · Notifications · Billing · Integrations) are **views in the floating
   dock**, not tabs over the page; the breadcrumb reads Settings › Notifications.
7. Toggles and pickers save as they change; there is no save button unless the card is a form (then its
   primary sits at the card's foot, right-aligned).
8. A plan in force, inside the billing group: a card inside the group card (16 padding) with the plan's name
   14 medium and a status badge, its terms 13 `neutral-600` below, and "Change plan" secondary at the right; a
   meter for what is used of what there is; a row for buying more.

### Assistant (`conversation`, 720)

Asks the product a question. Empty, the page is the **prompt**, large (104), 160 below the header bar's
hairline, with the recent chats under it 24 below as a plain list at its width; no title, no illustration.
Once asked, the page is the conversation: the thread in the same centred column, 40 from the top, and the
prompt docked at the panel's foot (72, 16 from the edges). The chat is the trail's last crumb ("Agent › New
chat ⌄"), a breadcrumb menu with "New chat" and the recent ones.

### Sign in

Not in the shell. The canvas colour fills the screen; a card of 400 wide sits centred, 32 padding, 24 between
its parts: the logo mark, then the title 20 medium with a line 14 `neutral-600` 6 below; the fields 20 apart; a
full-width large (38) primary "Sign in", "or" between hairlines, a full-width secondary alternative ("Continue
with Google"), and a 13 `neutral-600` line with a link under the card. A one-time code is a code input, large
when it is the page's only task.

## Secondary surfaces

| Surface            | Size and place                                                 | For                                                             |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------- |
| **Sheet**          | 512 wide at the right, 16 from the top, right and bottom edges, `panel` corners, the `sheet` shadow, non-modal; header 52 (title 14 medium, an icon, a close button), sections split by full-width hairlines | history, details, comments: things read beside the page. Never an item's editor |
| **Dialog**         | 480 wide, centred, `card` corners, the `sheet` shadow, a 40% black scrim; header 52 (title 14 medium, description 13 `neutral-600`), body 20 padding, footer 52 with a secondary and the primary right-aligned, 8 apart | confirmations and short forms. A destructive confirm is a primary button labelled with the verb ("Delete page") |
| **Popover**        | anchored to its trigger, the surface, a hairline, `float` shadow, `card` corners | a small form or detail: a date, a share setting, a filter's values |
| **Dropdown menu**  | anchored, `item` corners, 4 padding, rows 36 high with 12 side, 13; destructive items last after a full-width hairline, in `error-600` | row and object actions, behind a ghost ellipsis |
| **Floating toolbar** | 38 high, `control` corners (12), centred at the foot         | bulk actions on a selection; formatting over a focused block     |
| **Toast**          | a 360 card at the bottom right, 24 from the edges, with Undo for anything reversible (the spec is in `components.md`) | feedback after an action; a notice that must stay is an alert in the page |
| **Notice**         | a tab that slides out from under the header bar and leaves by itself | "Saving…", "Saved", "Link copied"                             |

## Standing decisions

- **One primary action per view**, in the action colour; everything else is secondary or ghost.
- **An item opens on its own page**, never in a pane beside its list.
- **The sidebar holds places**; the page that creates owns the create action.
- **Every page has a breadcrumb.**
- **Views go in the dock.** The views of a list, the facets of an editor that has a commit action, and sibling
  settings pages all live in the floating dock. Tabs only for the facets of one object on its detail page,
  where there is nothing to commit.
- **One column.** A detail, a form and a settings page never split into two columns.
- **Space, not lines**, between sections and groups; a container only for a self-contained unit or a divided
  list.
- **A group is marked, never implied**: a hairline, a container (never inside another), or an eyebrow. Not a
  tighter gap.
- **Nothing repeats**: a chart's headline is not also a stat card; a count in the dock is not also in the title.
- **Titles, empty states and forms align left**; nothing is centred except the column itself and the sign-in
  card.
- **Check at 1440 × 900, in light and dark**, and in an accent theme when the product has one.
