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
the current one takes the selected wash (7%); at the right, a trailing `Kbd` only when the place has a shortcut,
a count badge only when things wait for the reader there (a review queue). Groups are 24
apart, each under a label of 13 regular `neutral-600` with 10 side and 4 vertical padding; a labelled group's
items are plain nav items at 13 with their icons. A **project or collection** (a NavGroup row, 14
`neutral-700`) folds open to its pages as `inset` items (left padding 32, no icon, 14 `neutral-700`,
`neutral-950` when current); the 14 and the indent belong to that pair only. A place with a long index of its
own (a docs site's components, a settings tree) drills down into a level of its own, under a back row with its
name, rather than lengthening the top level. The footer holds the account
(avatar, name over plan) at the very bottom with 16 above, 24 below. **The sidebar holds places, not a create
button**: the page that creates owns its create action.

The sidebar is the shell unless one of the two below fits better.

**Top nav**, instead of a sidebar **when the app has a handful of sections and no groups or depth**: a 56 bar
on the canvas above the panel,
16 side padding, the brand (14 medium) left, links 34 high with 12 side padding, 13 `neutral-600` (`neutral-950`
when current), the account right. Links that overflow scroll, with chevrons.

**Rail**, **when the app wants the navigation out of the way and its places need not be read at a glance**: a
floating pill 52 wide (208 expanded), 8 padding, icon-only items of 34 named in tooltips; the current item sits
on one action-coloured pill that slides between items. Not for an app that must work on a phone.

**Header bar.** 54 high, hairline below, the breadcrumb at the left (home icon › … › the page, 13, the page in
`neutral-950`, the rest `neutral-600`), and at the right, **only when an action belongs to the page as a
whole** (a history toggle, a notice), one or two of them at most; otherwise the right stays empty. **Every page
has its breadcrumb**, from home down to itself. A back and
forward pair, when there is no router, sits at the far left, ruled off full height.

**The floating dock**, **only when the page has views to switch** (a list's views, an editor's facets, sibling
settings pages); a page with nothing to switch has no dock, and its primary stays in the title row. Centred
over the page's foot, 24 above the panel's bottom edge: 38 high outside, a
hairline, the surface colour, `dock` corners (a pill), the `float` shadow. Inside, items of 32 high sitting 3
from the outer edge (the hairline plus 2), 12 side padding, 13 medium `neutral-600`, 2 apart; the selected one
is filled with the action colour and `on-action` text. A count
trails a label only when the view is a set of things to count (a list's Drafts, not a Settings facet), in the
same size, `neutral-600` (`on-action` at 70% on the selected item). Beside the dock, **when the page has a
primary action**, that action as a **dock action**: a 38 pill in the action colour; a page without one (sibling
settings pages) has the dock alone. The page's column gets 96 of bottom
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

Below its width the column takes the panel less 16 a side (24 from a 640 screen; 16 again in a compact shell). A
form is never wider than 640 whatever the screen; an overview with cards and charts is not dense and stays 896.

## The page head

The title row every page starts with:

- **Title** 24 medium `neutral-950`; under it one **description line** 14 regular `neutral-600`, 6 below.
- At the right, **only what acts on the whole page**, bottom-aligned with the description, 8 apart: on an
  index a secondary the list has (Export) and the primary (when there are no views; otherwise the primary is
  in the dock); on an overview a period picker or filter that changes everything below; on a detail the
  actions the object has. A page with none has a title and a line, and that is the head.
- Between the head and what follows, the **block gap** of the spacing formula (`foundations.md`, worked out by
  `/continuum-fix-padding` or `get_spacing`): each side claims room by what it holds and the gap is the sum,
  so a bare title over a short settings card gets about 32 and a head with its line over a dense table about
  64. Never a fixed number.

## A section

- **Title** 16 medium `neutral-950`; under it, **only when it says something the title does not**, one or two
  sentences 13 regular `neutral-600`, no wider than 500, 4 below the title.
- At the right of the title block, **only when the section has an action of its own**: a secondary button
  when it does something to the section ("Add seats"), a ghost link when it leads to the rest of it ("Full
  history").
- **20** between the section head and its content.
- Sections are apart by the **block gap** (each claims room by what it holds, about 32 to 64) and never
  divided by a line. A long document's sections are 64 apart.

## The page kinds

A kind's parts are listed in the order they sit, top to bottom. **An anatomy is what the page may hold, not a
list to fill.** A part marked *always* is what makes the page that kind; every other part says **when** it
earns its place. When that is not the case on this page, leave the part out and close the gap: a page with
fewer parts, each doing something, is the better page.

Before placing a part, say what the reader does with it here. A control must change something the reader can
see. A number must be one the reader came for. A part whose only reason is "the anatomy has one" does not
belong, and neither does one copied from a reference screen whose product needed it.

### Overview (`default`, 896)

Reads how things are going over one period; it holds no create action.

1. **The page head**, always: the title and a line. At its right, a control only **when it changes everything
   below it**: the period picker (a 34 select or date-range picker) when the reader can pick the period the
   figures are measured over, a filter when the whole page can be narrowed. A page on one fixed period says so
   in its line ("The last 30 days") and has no picker. A live state (people online now, a sync running) is not
   the head's: it belongs to the card of the figure it describes.
2. **The figure that leads**, always, as a chart card full width (its anatomy in `charts.md`): the measure the
   page is about over the period, its figure and change in the card's head, the chart under it.
3. **Stat cards**, **when the page has other figures the reader comes for**, two to four of them: in a row, 16
   apart; 16 padding; a 13 regular `neutral-600` label, the value 18 medium `neutral-950` 4 below, a delta pill
   (22 high, success or error, neutral when flat) 12 below. Never added to fill the row: three that matter beat
   four. **A stat card never repeats the chart's figure.**
4. **Breakdowns**, **when the reader's next question is "from where" or "what moved"**: two list cards side by
   side, 16 apart (20 padding, a 13 `neutral-600` title, a ranked bar list or a short `rows` table), or an
   activity list. A page whose leading figure has no parts to break into ends at the stat cards.

### Index (`wide`, 1080; `dense` only for a very dense table)

Finds one thing among many and opens it. **A row opens the item's own page**, with the breadcrumb back; never
a pane beside the list, and never the item's editor in a sheet.

1. **The page head**, always: the title and a line on what the list holds ("The companies on a plan or a trial,
   and the ones that have left"; a count in the dock is not also in the head). At its right, only what acts on
   the whole list: a secondary action **when the list has one** (Export), and the primary (New customer)
   **when items are made here and the list has no views**; with views it is the dock action. A list nobody
   adds to by hand has no primary.
2. **The toolbar**, **when the list is too long to read whole**: the table's own top bar, inside its frame
   (`TableToolbar`), holding only what the reader finds and narrows by, 12 apart. It never moves as filters
   change. A list that fits on a screen has
   no toolbar.
   - **Search** (a 34 input, 256 wide, a leading search icon), always in a toolbar: readers type a name, a
     number or a word they remember. Left out only when the items have nothing to type (a list of dates, of
     colours).
   - **A filter per attribute the reader narrows by**, and none for a column that is only there to be read:
     a segmented control for one of a few values that should stay visible; a 34 select for the one or two
     attributes of many values that are always at hand; a **Filter** button (secondary, 34, a filter icon, a
     count once filters apply) for several groups of values, opening them as grouped checkbox values with
     "Clear all" at its foot.
3. **Applied filters**, only when there are any, in a row under the toolbar, still inside the table's frame: one soft chip per group (25 high, 8 side,
   13, `pill` corners, the `neutral-100` fill and no border, `neutral-600` text, a 12 × at its end: "Channel is
   Online store or Wholesale"), wrapping to more lines if needed, and a ghost "Clear all" at the end.
4. **The table**, always, the block gap below the head (a dense table claims a lot of room: about 64 under a head with its line; the toolbar is inside its frame, not a step between them): ruled, in its frame (`control` corners, the hairline, the surface). Head 41
   high, `neutral-100` fill, 13 regular `neutral-600`, 12 padding. Rows 41 high, 12 padding, a hairline
   between rows, the first column (the name) 13 medium `neutral-900`, meta columns `neutral-700`, numbers
   tabular and right-aligned, status as a badge, people as a 24 avatar with the name. Hover 3% wash; a
   selected row the 7% wash. A row with a second line of meta (an address, a domain) is 54 high. Its columns
   are the product's; two more are choices:
   - **a last column** (44 wide) with a ghost ellipsis button that opens the row's menu, only when a row has
     actions of its own;
   - **a checkbox column** (20 boxes), only when rows can be acted on together: a selection needs its bulk
     actions.
5. **Pagination**, **when the list runs past one page**, 16 below the table: "Showing 1–10 of 48" (13/500
   `neutral-800`) left, the pages centred (previous, numbers with an ellipsis, next: 34 × 34 hairline buttons,
   8 apart, the row never changing width), an optional slot right. A list on one page has none.
6. **The views**, **when the same list is cut into a few standing sets the reader moves between** (All ·
   Active · Trial · Past due, with counts): in the **floating dock**, beside the page's one primary action as
   a dock action. Views in the dock, not above the table as tabs. A list with one view has no dock, and its
   primary stays in the head.
7. **Empty**, in the table's place: a left-aligned dashed panel with what goes here, one sentence and one
   secondary button; a filter that matched nothing offers to clear it.

### Detail (`default`, 896): one column, never split

Everything about one object, stacked. **No side column of facts** beside the main one; history and comments
go in a sheet.

1. **Title row**, always: the object's avatar or icon tile (36) left, 16 from the text; the name 24 medium with
   its status badge beside it (8 apart); a meta line 14 `neutral-600` 4 below ("northwind.com · A customer
   since March 2023"). At the right, top-aligned, 8 apart: the actions the object has, a secondary, the
   primary, and a ghost icon button (ellipsis) with the rest; none where the object has none.
2. **Facets**, **when the object has two or more views of itself, each with content of its own** (Overview ·
   Invoices · Contacts); an object with one view has none. Where they sit follows how the page is used:
   - **line tabs**, 40 below the title row, on their own hairline, the active one underlined (the spec is in
     `components.md`; a count may trail a label), when the page is short enough that they stay in sight;
   - **the floating dock**, when the page is long or is worked in like an editor, so the facets stay within
     reach while it scrolls. The object's primary action then sits beside them as the dock action, and not
     also in the title row.

   Pill tabs are for a tight spot inside a card or a dialog.
3. **Numbers**, **when the object's figures are what the reader opens it for** (an account's revenue, a
   cycle's progress): up to three stat cards, 16 apart. A fact that happens to be a number (a seat count, a
   plan's price) goes in the facts grid instead.
4. **Facts**, when the object has attributes to look up: a list card (20 padding) titled "Details" (13 regular
   `neutral-600`), holding a grid of label-over-value pairs, three across, 24 between columns and 20 between
   rows: the label 13 regular `neutral-600`, the value 13 medium `neutral-950` 6 below.
5. The rest, each a list card or a section, each only when the object has it: usage meters, recent activity
   (with "Full history" opening the sheet), related tables.

### Create or edit one object (`narrow`, 640)

Makes or changes one thing, its fields stacked. A form of two or three fields is not a page: it is a 480
dialog over the page it came from.

1. **The page head**, always: "New customer", one line on what gets made.
2. **Sections**, **when the fields fall into more than one group**: 40 apart, each a section head (title;
   description only when it helps) with its fields 20 below. One group of fields needs no section head: the
   page head names it.
3. **Fields**, always, one per row, 20 apart: a label 13 medium `neutral-900`, the control 8 below (the one
   that fits the value, by `components.md`: a medium input or select, 38 high; a textarea; a date picker), a
   helper line 13 `neutral-600` 8 below when the field needs one. Two short fields that belong together (city
   and postcode) may share a row, 12 apart; otherwise one per row.
4. **Actions**, always, at the end, right-aligned, 8 apart: a secondary "Cancel" and the one primary, verb
   plus object ("Create customer"). While editing an existing object, the commit action moves up: into the
   floating dock as a dock action when the editor has facets to switch (they are views in the dock),
   otherwise into the title row. Either way the save state shows as a notice in the header bar.
5. **A stepper**, **only when the form is long**: over its sections (horizontal above, or vertical beside a
   long one), Back and Continue at the end. A form that fits one page of sections has none.

### Settings (`narrow`, 640): as small as it goes

1. **The page head**, always: the area's name ("Workspace", "Notifications"), one line.
2. **One list card per group**, always, the cards stacked 24 apart: 20 padding, a quiet group title (13 regular
   `neutral-600`) and the rows 16 apart under it, **each divided from the next by a hairline** at the card's
   content width (the one place on a page where rows are ruled: the card is a bordered list).
3. **A setting row**, for each thing that is switched, picked or done: the title 13 medium `neutral-950` over
   its description 13 regular `neutral-600` (2 between), the control at the right, the row at least 38 high.
   **One control per setting**, chosen by what the setting is: a **switch** (48 × 25, round, `neutral-300`
   off, the action colour on, a 21 knob) when it turns a thing on; a **picker** (a 34 select with the value
   and a right chevron: "Select ›", "After a day ›") when it sets a value; a **secondary button** when it
   does a thing ("Add seats"). Never a row of checkboxes per channel, never a group of radios in a row.
4. **A dependent setting**, one that only means something while another is on, shares the space between two
   hairlines with the setting it depends on: the same 16 below it, no hairline between them, dimmed (50%)
   while that one is off. Closeness alone never carries the relationship: the hairlines around
   the pair do, or, when a parent has several dependents, a small eyebrow over them (13 regular
   `neutral-600`, like the group title) names what they belong to.
5. **Plain values** (a name, an address, a language), when the group holds things typed in rather than
   switched: fields stacked in the card, as in a form.
6. **The settings areas**, **when there is more than one** (General · Members · Notifications · Billing ·
   Integrations): **views in the floating dock**, not tabs over the page; the breadcrumb reads Settings ›
   Notifications. A product with one page of settings has no dock.
7. Toggles and pickers save as they change; there is no save button unless the card is a form (then its
   primary sits at the card's foot, right-aligned).
8. **A plan in force**, when the product is paid for by plan, inside the billing group: a card inside the
   group card (16 padding) with the plan's name 14 medium and a status badge, its terms 13 `neutral-600`
   below, and "Change plan" secondary at the right; a meter only when the plan has an allowance that gets
   used (seats, credits); a row for buying more only when more can be bought.

### Assistant (`conversation`, 720)

Asks the product a question. The prompt, the thread and the chat as the trail's last crumb are what make it
this kind, always.

- **Empty**, the page is the **prompt**, large (104), 160 below the header bar's hairline; no title, no
  illustration. Under it, 24 below, **only when the reader has chats to return to**, the recent ones as a
  plain list at its width.
- **Once asked**, the page is the conversation: the thread in the same centred column, 40 from the top, and
  the prompt docked at the panel's foot (72, 16 from the edges).
- The chat is the trail's last crumb ("Agent › New chat ⌄"), a breadcrumb menu with "New chat" and the recent
  ones.
- In the prompt's foot, a menu at the left only when the product has a mode or a model to pick.

### Sign in

Not in the shell. The canvas colour fills the screen; a card of 400 wide sits centred, 32 padding, 24 between
its parts. Always: the logo mark, then the title 20 medium with a line 14 `neutral-600` 6 below; the fields the
product signs in with, 20 apart; a full-width large (38) primary "Sign in". Then, **only when the product has
another way in**, "or" between hairlines and a full-width secondary alternative ("Continue with Google"); and,
**only when there is somewhere else to send the reader** (no account yet, a lost password), a 13 `neutral-600`
line with a link under the card. A one-time code is a code input, large when it is the page's only task.

## On a narrow screen

The same pages, narrowed by the shell's own width (the two widths, and scroll, hide or stack, are in
`foundations.md` under Narrow screens). At 1024 and up nothing on this page changes.

**Below 1024: a top bar and a drawer.** The sidebar leaves the canvas and the panel takes the shell's width, 8
in on every side. At the header bar's far left, in the place of back and forward, a sidebar toggle (a ghost
square with the panel icon) opens the sidebar as a **drawer**: the same anatomy, 256 wide (never more than the
shell less 48), on the canvas colour, sliding in from the left over the panel in 200ms, the `sheet` shadow, a
40% black scrim over the rest. Esc, the scrim, the toggle in the drawer's header or choosing a place closes it,
and focus goes back to the toggle. The header bar keeps the breadcrumb; its back and forward and its actions
hide, and a notice still hangs from it. A **top nav** does the same: its links and actions hide, and a toggle
before the brand opens the drawer with the links as nav items. One narrow shell for both. **No rail**: the rail
is a choice for a wide screen, and an app that must work on a phone takes the sidebar or the top nav.

**Below 640: compact.** The panel stays the panel, 8 from the canvas on every side with its corners and
hairline, so a phone shows the same shell as a desktop. The column starts 40 below the header bar, 16 in from each side. The breadcrumb
shortens to its last two crumbs, parent › page. The floating dock keeps its place but is never wider than the
panel less 32: its views scroll, their counts hide, and the dock action shows its icon only.

**The page head stacks**: the title, its line, then the actions under them, left-aligned. A page's secondary
actions hide; its primary stays.

Each line below narrows a part the page has; it never adds one.

| Kind                | Narrow                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Overview            | The head's control, when it has one, under the title; the chart card full width; stat cards two across; a pair of list cards one column. |
| Index               | The search takes the toolbar's row; the selects fold into the one Filter button (the page decides, not the table); a table's optional columns hide and the rest scroll sideways, each cell on one line; pagination becomes ‹ 3 of 25 ›; the dock scrolls and its action is its icon. |
| Detail              | The title row stacks: the avatar and name, the meta line, then the actions; the tabs scroll; the numbers one column; the facts two across. |
| Create or edit, settings, assistant | Unchanged: they are one column already. A segmented control of more than four options becomes a select. |
| Sign in             | The card takes the screen less 16 a side.                                                        |

## Secondary surfaces

Which surface follows what the reader does there: reads beside the page (sheet), answers before going on
(dialog), sets one thing where it is shown (popover), picks an action (menu), or is told what happened (toast,
notice).

| Surface            | Size and place                                                 | When                                                            |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------- |
| **Sheet**          | 512 wide at the right, 16 from the top, right and bottom edges, `panel` corners, the `sheet` shadow, non-modal; header 52 (title 14 medium, an icon, a close button), sections split by full-width hairlines | history, details, comments: things read beside the page, which stays usable. Never an item's editor, never a form that commits |
| **Dialog**         | 480 wide, centred, `card` corners, the `sheet` shadow, a 40% black scrim; header 52 (title 14 medium, description 13 `neutral-600`), body 20 padding, footer 52 with a secondary and the primary right-aligned, 8 apart | a confirmation, only for what cannot be undone (what can is done at once and offers Undo in a toast); a short form of two or three fields (more is a page). A destructive confirm is a primary button labelled with the verb ("Delete page") |
| **Popover**        | anchored to its trigger, the surface, a hairline, `float` shadow, `card` corners | a small form or detail that belongs to the control that opens it: a date, a share setting, a filter's values. Not a list of actions (menu), not a name for an icon (tooltip) |
| **Dropdown menu**  | anchored, `item` corners, 4 padding, rows 36 high with 12 side, 13; destructive items last after a full-width hairline, in `error-600` | a row's actions, and the actions of an object past its secondary and primary, behind a ghost ellipsis; none where there are none |
| **Floating toolbar** | 38 high, `control` corners (12), centred at the foot         | bulk actions on a selection; formatting over a focused block     |
| **Toast**          | a 360 card at the bottom right, 24 from the edges, with Undo for anything reversible (the spec is in `components.md`) | feedback after an action, with Undo when it can be reversed; a small action with nothing to undo gets a notice, and a message that must stay is an alert in the page |
| **Notice**         | a tab that slides out from under the header bar and leaves by itself | a small action's state, with nothing to undo or act on: "Saving…", "Saved", "Link copied" |

## Standing decisions

- **One primary action per view**, in the action colour; everything else is secondary or ghost.
- **An item opens on its own page**, never in a pane beside its list.
- **The sidebar holds places**; the page that creates owns the create action.
- **Every page has a breadcrumb.**
- **Views go in the dock.** The views of a list, the facets of an editor that has a commit action, and sibling
  settings pages all live in the floating dock. Tabs only for the facets of one object on a detail page short
  enough to keep them in sight; a long one, or one worked in like an editor, takes the dock too.
- **A part earns its place.** An anatomy says what a page may hold and when; a control that changes nothing
  the reader sees, or a card for a number nobody came for, is left out.
- **One column.** A detail, a form and a settings page never split into two columns.
- **Space, not lines**, between sections and groups; a container only for a self-contained unit or a divided
  list.
- **A group is marked, never implied**: a hairline, a container (never inside another), or an eyebrow. Not a
  tighter gap.
- **Nothing repeats**: a chart's headline is not also a stat card; a count in the dock is not also in the title.
- **Titles, empty states and forms align left**; nothing is centred except the column itself and the sign-in
  card.
- **Narrow, a row scrolls, hides or stacks**, never wraps; actions hide rather than fold into a "⋯" menu; the
  navigation becomes a top bar and a drawer, never a rail.
- **Design at 1920 × 1080, then check it holds at 1440 × 900 and at 390, in light and dark**, and in an accent
  theme when the product has one.
