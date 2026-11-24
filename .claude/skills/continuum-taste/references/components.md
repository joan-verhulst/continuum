# Components

Every part of the system, grouped by what it does, in the playground's fifteen categories. Each entry says what the part is **for**, what it is **not
for** (and what to use instead), what it sits **with**, its parts, its values in units, and its states. The
values are the React library's, read from its source; a canvas or a stylesheet draws the same numbers. The
shared values (the hairline, the washes, the focus ring, the corners, the motion) are in `foundations.md` and
are not repeated here; "hairline" means 1px `neutral-200`, "5% wash" means `neutral-950` at 5%, "focus ring"
means the 2px ring, "action" means the action colour, and "13/500" means 13px at weight 500. The width of a
panel, a popup or a fixed column (the sidebar's 256, a toast's 360, a popover's 288, a menu's minimum) is fixed
pixels and does not follow the theme's spacing unit; the full list is under Fixed widths in `foundations.md`.

How to read a lookup: find the family, read the entry, draw or compose what it says. Where two parts could
fit, the **not for** line decides. Where an entry offers variants, sizes or optional pieces, it says when each
is the one; an optional piece with no reason on this screen is left out.

The words a part draws or announces on its own ("Clear all", "Back", "Previous", "Copy", "Search values",
"Expand sidebar") each have an optional prop to change them (`clearLabel`, `backLabel`, `previousLabel`,
`copyLabel`, `searchPlaceholder`, `expandLabel` and so on), for another language or a better name.

## App frame

**AppShell → Sidebar (or TopNav) + AppPanel.** The shell is the canvas (`neutral-100`, min 100vh); the sidebar
sits straight on it; the panel is `main`, inset 8 on every side but the navigation's, `panel` corners (20),
hairline, surface, clipped. Under a TopNav there is no canvas: the shell is the surface and the panel lies flat
under the bar's hairline, no gutter, corners or frame. Everything styled sits inside a `Theme`
(the `.continuum` scope with `data-mode` and `data-theme`; 13px Geist, line height 1.25, tracking 0.32px, text
`neutral-950`; `radius` sets the corner scale); `ThemeScope` re-opens it inside a portal (menus, tooltips,
dialogs render at the end of the body). `PortalContainer` points every overlay inside it at another element
than the body, a box that holds fixed descendants and stands for the screen (a phone drawn in a preview): its
sheets, dialogs and menus then keep to that box and size by it.

**Narrow:** the shell is the width the page answers to, not the screen. Under 1024 of it the sidebar (under
640, a top nav's sections) goes into a drawer the shell holds open or shut (open by the header bar's toggle; Esc, the scrim, a
chosen place or the drawer's own toggle shut it, focus going back to the toggle), and the panel is inset 8 on
every side. The panel keeps its gutter, corners and hairline at every width: a phone shows the same shell.

### Sidebar · SidebarHeader · SidebarSwitcher · SidebarGroup · SidebarItem · SidebarSection · SidebarLevel · SidebarLevelHead · SidebarBack · SidebarFooter · SidebarAccount
**For** the main navigation of an app with several places and groups. **Not for** an app whose sections fit
along one bar (TopNav) or one that wants the navigation out of the way (NavRail). Its rows
are sidebar items (`SidebarItem`), a section that folds open to its pages is a `SidebarSection`, a place with a
long index drills into a `SidebarLevel`; all of them, with the header, the switcher and the footer, make one
sidebar. (The old names `NavItem`, `NavGroup` and `navItemClasses` still work, as aliases.)
- 256 wide, no fill, no border; a column: header, the switcher, groups, footer at the bottom.
- **Bordered** (`bordered`), **when** the canvas behind is busy enough (a tint, an image, a pattern) that a
  borderless sidebar's edge gets lost, or the product wants the navigation to read as a panel of its own
  beside the page: a 1px `neutral-200` hairline on `panel` corners (20), with the AppPanel's 8 gutter round it,
  still no fill. Otherwise leave it off: on a plain canvas the sidebar shares it, and one framed panel (the
  page) is quieter than two.
- **One row for every part.** A sidebar item, a section's row and the back row are the same row: 34 high,
  padding 8 vertical, 10 left and 8 right, gap 8, `item` corners (10), full width; a 14 icon (or an emoji in a 14 box)
  leading; the label 13/400, truncating. A chevron in a row is 14 too. Hover 5% wash; focus ring.
- **Counts, by what they say.** An item's count is what waits for the reader there (new mail, invoices
  to send): the primary count `Badge` (22 high, 11/500, `chip` corners, min 32 wide), so it stands out from
  the rows around it. A group's or a section's count is how many it holds, a fact and not a call: a plain figure
  in `neutral-500`, in the type of its row, tabular. Both sit at the row's end (a section's after its
  chevron), so the counts of a sidebar line up in one column. A shortcut `Kbd` sits at the item's end too,
  after a count if both.
- **SidebarHeader**: 56 high; padding 12 top, 14 right, 8 bottom, 8 left; the logo left (`SidebarLogo`: a 26
  mark in `neutral-950` centred in a 36 box), the collapse toggle right (`SidebarToggle`: 28 × 28, chip corners,
  a 16 panel icon in `neutral-300`, `neutral-600` on hover; give it `expanded` and `aria-controls` so its state
  is announced and its name turns between "Collapse sidebar" and "Expand sidebar").
- **SidebarSwitcher**, **for** the current workspace, project or account of a product that has several, a click
  from the others: under the SidebarHeader, or in the SidebarFooter in the account's place. **Not for** switching
  views inside a page (Tabs, SegmentedControl) or siblings deeper in the trail (BreadcrumbMenu); not for a product
  with one workspace (SidebarAccount). **With** SidebarSwitcherMark, DropdownMenuItem, DropdownMenuSeparator.
  - A button on the item corners: padding 6 top and bottom, 10 left (an item's, so its mark lines up with the
    item icons and the logo), 8 right; gap 10. A 28 mark (a `SidebarSwitcherMark`, an avatar or a logo) with chip
    corners; the name 13/500 `neutral-950` over a detail line 11/400 `neutral-600` (plan, role, "Pick one to
    work on"), both truncating; a 16 up-down chevron in `neutral-500` at the right. Hover 5% wash, the selected
    wash while open, focus ring.
  - Under the header it sits in a group's insets (8 top, 12 right, 4 bottom, 8 left) and opens below; in the
    footer it takes the account's place, pulled 10 left so its wash and mark line up with the items', and opens
    above.
  - **SidebarSwitcherMark**: the workspace's initial 13/500 on its own colour, white by default, or an `ink` for
    a pale colour or one that flips with the mode (`on-action` when the colour is the action); chip corners, a 1px
    inset ring of `neutral-950` at 10%; 28 in the button, 20 (11/500) in a menu row; with no colour, a
    `neutral-200` square with its initial in `neutral-700`.
  - The menu: aligned to the start, 4 from the button, as wide as the button and never under the wide menu
    minimum (192). Each workspace a row with its 20 mark and a check on the current one; then a separator,
    "All …" and "New …".
- **SidebarGroup**: a `nav` with padding 8 top, 12 right, 8 left; a group after another starts 24 down; an
  optional label (13/400 `neutral-600`, 10 left, 8 right and 4 vertical padding) 4 above the items; items 2 apart. A
  label may carry a `count` at its end (how many items the group holds, or what a search leaves of them), the
  name truncating before it.
- **SidebarItem**, **for** one place in the sidebar. **Not for** an action (Button) or a view of the current
  page (Dock). Trailing, a `Kbd` only when the place has a shortcut, a `count` only when things wait for the
  reader there. `default` is a place; `project` a project or collection that folds open, and `inset` its pages
  (the 14 belongs to that pair, and to the section's row, only).

  | variant | text                 | fill                    |
  | ------- | -------------------- | ----------------------- |
  | default | 13/400 `neutral-950` | none                    |
  | project | 14/400 `neutral-950` | none                    |
  | inset   | 14/400 `neutral-700` | none                    |
  | primary | 13/400 `on-action`   | action; 14 margin below |

  States: hover 5% wash (primary: `action-hover`); current (`aria-current="page"`) the selected wash, inset text
  `neutral-950`; focus ring.
- **SidebarSection**, **for** a section that folds open to its pages (inset SidebarItems), as deep as it needs:
  a section's rows may be sections. **Not for** flat sections (a SidebarGroup) or a long index (a SidebarLevel).
  - Its row: the item row at 14/400 `neutral-700` (`neutral-950` open), a 14 icon box, an optional `count`, a
    chevron that shows on hover (always on touch) and turns from −90° to 0° when open. Open is never a
    background: a background means "you are here".
  - Its rows: on a 1px `neutral-200` guide line down the middle of the icon above (16 in), the rows 5 off it, so
    a page's label starts 32 in, where its section's does (10 + 14 + 8); each level one icon's width further in.
    4 above and below, rows 2 apart; opens over 200ms.
  - The page you are on takes the theme's active look, and its piece of the guide line turns `neutral-950`;
    every section that holds it (found among its rows, open or closed, or set with `current`) stays plain, its
    label at full strength, and darkens its own piece of the line, so the path down to the page can be followed.
- **SidebarLevel · SidebarLevelHead · SidebarBack**, **for** a sidebar place with a long index of its own (a docs
  site's components, a settings tree): the sidebar drills down into it as a level of its own. **Not for** a short
  list under a place (a SidebarSection that folds open instead) or views of the current page (Tabs, the Dock).
  **With** SidebarGroup, SidebarItem, a search Input.
  - **SidebarLevel**: one level, the top level's places or a place's index; only the open one renders. It
    enters 8 from its side (from the end going down, from the start coming back) while fading in, 200ms
    `ease-out-strong`; under reduced motion it only fades. A drilled level keeps the sidebar's header and
    switcher above it and takes the rest of the height, scrolling, so a long index shows whole; the footer stays
    at the bottom.
  - **SidebarLevelHead**: the head of a drilled level, holding its SidebarBack and anything that works on the
    whole level (a search). It stays at the top while the level's list scrolls under it, filled with the
    sidebar's canvas (`neutral-100`) and a hairline (`neutral-200`) at its foot; padding 12 top, 12 right, 12
    bottom, 8 left (a group's insets, so its rows sit where the items do), its rows 8 apart. A search in it has
    9 left padding, which with the hairline makes an item's 10, so its icon sits over the item icons.
  - **SidebarBack**: the drilled level's back row, first in its SidebarLevelHead: the item row, a 14
    chevron-left, the level's name 13/400 `neutral-950`. It is announced as "Back: Components" (`backLabel`
    changes the first word) and takes the reader to the level above; the open page stays.
  - On the top level, the place that drills shows a 14 chevron-right in `neutral-500` at its end. In the head,
    under the back row, an optional search narrows the index; the index's groups take a `count` at their labels'
    ends.
- **SidebarFooter**: pushed to the bottom; padding 16 top, 14 right, 24 bottom, 18 left (a group's 8 and an
  item's 10, so the avatar lines up with the logo, the switcher's mark and the item icons; 14 on the right, so a
  28 icon button's icon centres on the column the toggle and the switcher's chevron share); gap 12; holds
  `SidebarAccount`, the switcher's row again (a 28 avatar with chip corners, 10 from the name, so the account's
  name starts on the switcher's line: the name 13/500 `neutral-600` over a detail line 11/400 `neutral-600`: whatever says more
  about who is signed in, an email, a plan, a role or a place) and, only when the product has notifications, a
  bell.
- **Narrow:** under 1024 of shell it is a drawer: 256 wide (at most the shell less 48), on the canvas colour,
  sliding in from the left over the panel in 200ms with the `sheet` shadow and a 40% black scrim, still under
  reduced motion; shut, it is neither seen nor focusable. Its SidebarToggle then shuts the drawer, and choosing
  an item shuts it too.

### TopNav · TopNavBrand · TopNavSwitcher · TopNavLinks · TopNavLink · TopNavMenu · TopNavMenuGroup · TopNavMenuItem · TopNavActions
**For** an app whose sections fit along one bar, the sidebar on its side: it holds what a sidebar holds, a
switcher, places with counts, and sections with pages of their own. **Not for** a long index or navigation
deeper than one level of pages (Sidebar, which drills into a level).
- The top of the page: a bar across the shell on the surface (`neutral-50`), a 1px `neutral-200` hairline under
  it, sticky at the top; the page straight under it. Its row is 56 high, gap 24, and keeps to the page's column
  (`width`, the PageContent widths, with their side padding), so the brand starts where the page's title does.
  In order: brand, switcher, links, the account. Search and a bell only when the product has them; the account
  alone is the usual end.
- **TopNavBrand**: a 26 mark and the name 14/500, gap 8 (the name hides under 640).
- **TopNavSwitcher**, **when** the product has several workspaces, as the SidebarSwitcher: on the link's row (34
  high, 8 side, gap 8, `item` corners), a 20 mark, the name 13/500 `neutral-950`, a 14 up-down chevron in
  `neutral-500`; one line, the detail only in the drawer. Hover 5% wash, the selected wash while open. Its menu
  is the SidebarSwitcher's, opening below.
- **TopNavLinks**: 2 apart; links that overflow scroll with a chevron (34 × 34) at the end that has more.
  **TopNavLink**: 34 high, 12 side, 8 vertical, gap 8, `item` corners, 13/400 `neutral-600`; hover 5% wash and
  `neutral-950`; current the selected wash and `neutral-950`. A `count`, what waits there, is the sidebar
  item's primary count Badge, after the label.
- **TopNavMenu**, **for** a section with pages of its own (the SidebarSection on the bar): the link's row with a
  14 chevron-down in `neutral-500` after the label, gap 6, turning 180° while open; open the 5% wash. Holding the
  page you are on (found among its items, or set with `current`) it takes the current link's look, since the
  page is not on the bar. Its menu opens below, aligned to the start, at least the wide menu minimum (192): the
  pages as menu rows, the current one on the selected wash; **TopNavMenuGroup** heads a group of them (11/500
  `neutral-600`), a group after another ruled off by a hairline.
- **TopNavActions**: pushed right, gap 8.
- **Narrow:** the links scroll down to 640 of shell, so the bar keeps its sections where a sidebar would
  already be a drawer. Under 640 the switcher, the links and the actions hide, and a toggle before the brand
  opens the shell's drawer: the switcher under its header as the SidebarSwitcher, the links as sidebar items, a
  menu as a SidebarSection folding open to its pages (open when it holds the current one), a group's heading
  over its rows.

### NavRail
**For** the main navigation as a floating island: icons only, labels on demand. **Not for** an app whose places
need to be read at a glance (Sidebar). **With** NavRailToggle, NavRailItem, NavRailSeparator.
- A pill (`dock` corners) 52 wide closed, 208 expanded; padding 8; rows 2 apart; hairline; surface. The current
  item sits on one action-coloured pill (34 high, `item` corners) that slides between items over 200ms; width
  changes over 300ms.
- **NavRailItem**: 34 high, 9 side, gap 10, `item` corners; a 16 icon on a 16 column, the label 13/500
  `neutral-600` (opacity 0 closed, 1 open), a tooltip on the right while closed; hover 5% wash and
  `neutral-800`; current `on-action` text on the pill. **NavRailSeparator**: a hairline with 6 vertical margin.
  **NavRailToggle** is named "Collapse navigation" or "Expand navigation" (`collapseLabel`, `expandLabel`).
- **Narrow:** none; the rail is a choice for a wide screen. An app that must work on a phone takes the Sidebar
  or the TopNav, whose places go into the drawer.

### HeaderBar
**For** the top of the panel: the breadcrumb and at most two page-wide actions. **Not for** the page's title
(the page head under it, in `pages.md`) or its filters. **With** HeaderBarStart, HeaderBarNav, Breadcrumb,
HeaderBarActions, Notice; `usePageHistory`.
- 54 high, padding 8 vertical, 16 left, 8 right, gap 16, hairline below, no fill of its own. **HeaderBarNav**:
  back and forward as ghost 28 buttons (chip corners, `neutral-600`, icons 16), 2 apart, pulled through the
  padding and ruled off by a hairline the bar's full height, 12 left and 16 right padding; an arrow with nowhere
  to go (or nothing to call) dims; leave out forward for a back button alone (a detail page returning to its
  list); `backLabel` and `forwardLabel` rename them for screen readers.
  **usePageHistory**`(pages, start)` keeps that history for an app that holds its own pages, not the browser's:
  it gives the page, `canGoBack`, `canGoForward`, `back`, `forward` and `go` (which drops anything forward, as a
  browser does); use the router's history where there is one. **HeaderBarActions**: gap 8, secondary before
  primary.
- **Narrow:** under 1024 of shell, in an app with a sidebar, a **HeaderBarSidebarToggle** takes the far left,
  where back and forward sit (a ghost square with the panel icon, opening the drawer); back and forward and the
  actions hide; the breadcrumb and a notice stay. A bar of your own places the toggle itself.

### PageContent
**For** the centred column every page's content sits in. **Not for** a container inside the page.
- Content-box, centred, min width 0. Width `narrow` 640 · `default` 896 · `wide` 1080 · `dense` 1280 · `inset`
  (the panel less 64 a side from 1024, 128 from 1536) · `full` (0). Side padding 16, 24 from 640. Top padding 64.
- **Narrow:** in a compact shell (under 640) side padding 16 and top padding 40. Outside a shell, as above.

### BottomBar · Dock · DockItem · DockAction
**For** the views of a list, the facets of an editor beside its commit action, or sibling settings pages, at the
panel's foot. **Not for** the facets of one object on its detail page (Tabs), a one-of-few choice inside content
(SegmentedControl), or a page with nothing to switch (then the primary stays in the title row).
- **BottomBar**: `floating` pins it 24 above the panel's bottom, centred, width fits, z 10; gap 8 between the
  dock and its action.
- **Dock**: 38 high outside, items 32 high sitting 3 from the dock's outer edge (the hairline plus 2), 2
  apart, `dock` corners (a pill; `rounded` shape: `item` 10), hairline, surface, `float` shadow; always one item
  selected; more items than fit scroll sideways with a chevron (32 × 32) at the end that has more, the selected
  one kept in view.
- **DockItem**: 32 high, 12 side, gap 8, corners `dock − 3` (23), 13/500 `neutral-600`, icon 16; hover
  `neutral-950`; pressed: the action fill and `on-action` text; a count may trail a view that is a set of
  things to count.
- **DockAction**, only when the page has a primary action: a large primary button (38) with the dock's
  corners; 16 side padding, 13/500 `on-action`, or 38 × 38 with an icon only.
- **Narrow:** in a compact shell the floating BottomBar is never wider than its parent less 32, so the dock's
  own scroll and chevrons start; the dock's counts (DockCount) hide; a DockAction with an icon shows the icon only, 38 × 38,
  its label kept for screen readers.

## Navigation

### Breadcrumb
**For** the trail on every page, in the header bar. **Not for** tabs or steps. **With** BreadcrumbHome,
BreadcrumbLink, BreadcrumbMenu, BreadcrumbPage, BreadcrumbSeparator.
- One line, never wraps; the page truncates first. List gap 8; `md` 13/400 `neutral-600`, `lg` 14/500. Home: a
  16 house icon in `neutral-400`. Separator: a 16 chevron in `neutral-400`. Link: `neutral-600`, `neutral-950` on
  hover, chip corners for the ring. Page: `neutral-950`, truncates. **BreadcrumbMenu**: a crumb that opens a
  menu, 28 high, 6 side padding pulled out by 6, gap 4, chip corners; with a `label` and an up-down chevron it
  switches siblings deeper in the trail (a report among reports; the workspace itself only in an app without a
  SidebarSwitcher); without, it is the "…" standing in for a long middle; hover 5% wash;
  open the selected wash; menu min width 192.
- **Narrow:** in a compact shell only the last two crumbs show, parent › page; home and the earlier crumbs
  hide.
- A page that is a file or a record ID cuts in the middle (a Truncate inside BreadcrumbPage); a named page at
  the end.

### Tabs
**For** the facets of one object, each with content of its own: line tabs under a page's, a section's or a
panel's title, pill tabs in a tight spot inside a card or a dialog. **Not for** the views of a
list, settings areas, or an editor with a commit action (the Dock); not for switching how one thing is shown
(SegmentedControl). **With** TabsList, TabsTrigger, TabsCount, TabsContent.
- Root gap 16 between the list and its panel.

| variant | list                        | trigger                                                                    | active                               |
| ------- | --------------------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| line (the default) | gap 0, hairline below (**a page's, a section's or a panel's facets, under its title**) | 44 high, 12 side, gap 8, 13/500 `neutral-600`, hanging 1 over the line | text `neutral-950`, a 2px underline in `neutral-950` (fading in over 150ms) |
| pill    | gap 2, no line (a tight spot inside a card or a dialog) | 34 high, 12 side, gap 8, `control` corners, 13/500 `neutral-600` | the tint wash, text `tint-fg` |

Hover `neutral-950` (pill: also the 5% wash); disabled 50%; arrow keys select as they move. A pill list nested
in a line list keeps its own look. **TabsCount**: 16 high, min 16 wide, 4 side, round, the tab's
colour at 10% behind 11/500 in the tab's colour, only on a tab whose content is a list to count. A trailing
piece may also be a `Kbd`, a `StatusDot` or an icon. **Narrow:** a list longer than its width scrolls sideways under an edge fade, with a chevron at the end
that has more (the dock's), the active tab kept in view; line tabs keep their hairline full width.

### Pagination
**For** paging a table that runs past one page; a list on one page has none. **Not for** steps (Stepper).
**With** PaginationPrevious, PaginationButton, PaginationNext.
- A grid: the results text (13/500 `neutral-800`) left, the pages centred, an optional slot right; column gap 48.
  Buttons 34 × 34, `control` corners, hairline, 14/500 `neutral-600` tabular, 8 apart; hover border
  `neutral-300` and `neutral-950`; the current page only darkens its label; disabled 50%. An ellipsis
  is a 34 slot; the slot count is constant (siblings × 2 + 5), so the row never changes width.
  **getPageItems**`(page, pageCount, siblings = 1)` returns those slots (page numbers and `start-ellipsis` /
  `end-ellipsis`), for a pager drawn by hand.
- **Narrow:** it measures its own width. Under 720 the results text (one line, never wrapping) hides and the pages become previous, "3 of
  25" (13/500 `neutral-800`, tabular) and next, on the same 34 buttons.

### CommandMenu
**For** search-and-run from the keyboard (⌘K). **Not for** a search box in a page (Input) or a long menu
(DropdownMenuSearch). **With** CommandMenuContent, CommandMenuInput, CommandMenuList, CommandMenuGroup,
CommandMenuItem, CommandMenuEmpty, CommandMenuFooter; `useCommandMenuShortcut`.
- A dialog 560 wide (never wider than the viewport − 32) pinned 16vh from the top, `card` corners, hairline,
  surface, `sheet` shadow, a 40% scrim; opens over 200ms from 8 below.
- Input row 52 high, 16 side, gap 10, hairline below: a 16 search icon in `neutral-500`, the text 14/400 with
  no box. List max 360 (or half the viewport), padding 6, groups 4 apart; a group label 11/500 `neutral-600`
  with 10 side, 8 top, 4 bottom; a group hides once nothing in it matches. Item: 36 high, 10 side, gap 10, `item`
  corners, 13/500 `neutral-700`, icon 16 `neutral-600`, a hint 11/400 `neutral-600` at the end; highlighted the
  5% wash and `neutral-800`. Empty: 13 `neutral-600`, 10 side, 12 vertical. Footer 40 high, 16 side, gap 16,
  hairline above, 11 `neutral-600` key hints. On a touch screen the input row ends in a secondary close button
  (`closeLabel`), since a finger has no Esc, and the footer hides, its hints being keys. The footer's hints
  never wrap; what does not fit is cut off.

### Stepper
**For** the steps of a long form: horizontal over it, or vertical beside a long one, each step holding its
fields. **Not for** a form that fits one page of sections, a page's facets (Tabs) or progress of a task
(Progress). **With** StepperItem.
- Markers: `number` and `dot` 22 round; `icon` 32 with `control` corners; `line` a 4 bar (`pill` corners). Done:
  action fill, `on-action` (a 14 check); current: a 1px action border on the surface, a 3px ring of the tint,
  the numeral or icon `neutral-950` (the dot stays the action); upcoming: `neutral-300` border, `neutral-600` text; invalid: `error-500` border, `error-600` text. The
  connector between steps is 1px, action behind a done step, else `neutral-200`.
- Horizontal `inline`: items in a row 4 apart, head padding 10 side 6 vertical with `item` corners, text beside
  the marker; `centered`: marker over centred text. Vertical: 24 between steps, text 12 from the marker, the
  step's fields inside it (padding left marker + 12). Label 13 (upcoming 400 `neutral-600`, else 500
  `neutral-950`); description 11 horizontal, 13 vertical, `neutral-600`. A narrow row keeps only the current
  step's description (under 576) or label (under 448).
- Done steps become buttons when `onValueChange` is given (hover 5% wash); a step with errors is `invalid` and
  its description says what is missing.

## Actions

### Button
**For** an action. **Not for** going somewhere (a link or SidebarItem), turning a thing on (Switch), choosing a view
(SegmentedControl, Dock). **With** an Input beside it (md level with a small input, lg with a medium one),
Toolbar, a dialog's footer, a DockAction.

| size    | height | width | side padding                      | corners      | when                                                        |
| ------- | ------ | ----- | --------------------------------- | ------------ | ----------------------------------------------------------- |
| md      | 34     | hugs  | 16; 12 at an end that holds an icon | `control` 12 | the default: a title row, a toolbar, a form's end, a dialog's footer, beside a small input |
| lg      | 38     | hugs  | 16                                | `control` 12 | only level with a medium input (a sign-in card), and as the dock's action |
| icon    | 34     | 34    | 0                                 | `control` 12 | an action its icon alone names, standing on its own (a title row, a toolbar), with a tooltip |
| icon-sm | 28     | 28    | 0                                 | `chip` 6     | an icon button inside another part: a table row's ellipsis, a field's copy, a remove ×, the header bar's back and forward |

| variant   | fill        | border   | text          | hover                                   | when                                                   |
| --------- | ----------- | -------- | ------------- | --------------------------------------- | ------------------------------------------------------ |
| primary   | action      | none     | `on-action`   | `action-hover`, gradient off            | the view's one primary action, and nothing else        |
| secondary | none | hairline | `neutral-950` | border `neutral-300`, the 5% wash | every other action that stands on its own: Cancel, Export, "Change plan" |
| ghost     | none        | none     | `neutral-600` | 5% wash, text `neutral-800`             | an action that stays quiet inside a row or a part: the ellipsis, a close, "Clear all", "Add line", "Full history" |
| tint      | the 7% wash | none     | `tint-fg`     | the wash 8% stronger                    | an AI action beside the primary one                    |

Label 13/500, no wrap, gap 8 (the icon-to-label gap of every 34 and 38 control), icons 14 at 34 and 16 at 38 (leading in navigation, trailing on an action: "Add email +"). Press
scales to 97%; disabled 50%; `loading` puts a 16 spinner before the label (in place of an icon button's icon),
holds off clicks, Enter and Space (a submit button sends nothing) and keeps focus, at full strength rather than
dimmed, since it is working; `pill` rounds it.

### HoldButton
**For** a destructive action repeated in place, where a dialog each time would be clicked through (removing
members one by one, cancelling queued runs). **Not for** a rare, grave action (a confirmation dialog) or one that
can be undone (do it, then Undo in a toast). A Button, secondary or ghost at its sizes, labelled to hold
("Hold to remove"): holding fills it from the start edge with the `error` 500 at 20% over 1000ms, linear, the
label turning `error-700`, and the action runs when it is full; letting go, leaving it or losing focus sooner
drains the fill in 200ms and nothing happens. Space or Enter held does the same; a screen reader's activation,
which cannot hold, runs it at once. The recipe is Press and hold to confirm in `patterns.md`.

### Toolbar
**For** actions on a selection (floating, at the foot) or over a focused block (inline). **Not for** a page's
standing actions (the title row) or the views of a list (Dock). **With** ToolbarButton, ToolbarChip.

| variant  | height | padding | gap | corners      | items                                                      |
| -------- | ------ | ------- | --- | ------------ | ---------------------------------------------------------- |
| inline   | 34     | 0       | 0   | `control` 12 | 32 high, 12 side, split by hairlines; hover a wash inset 2 (corner 9) |
| floating | 38     | 3       | 2   | `control` 12 | 30 high, 12 side, corner 8; hover the 5% wash              |

Hairline, surface, `float` shadow. Items 13/500 `neutral-600`, `neutral-950` on hover, icons 14 on the inline bar and 16 on the floating one, 8 from their label. **ToolbarChip**
leads it ("AI suggestions"): `primary-500` at 20% behind 11/500 `primary-800`, a 16 sparkle, 8–10 side padding.
**Narrow:** a bar longer than its room scrolls sideways under an edge fade, no scrollbar, rather than clipping;
in a compact shell a ToolbarButton with an icon drops its label (kept for screen readers), one without keeps it.

### DropdownMenu
**For** a row's or an object's actions behind a ghost ellipsis, or an account menu. **Not for** picking a value
(Select), filtering (FilterMenu) or a small form (Popover). **With** DropdownMenuTrigger, DropdownMenuContent,
DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuGroup,
DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
DropdownMenuSearch, DropdownMenuEmpty, DropdownMenuShortcut.
- Panel: min width 160, padding 4, rows 4 apart, `card` corners (16), so the rows inside keep `item` corners (10) and nest; hairline, surface, `float` shadow, 4 from
  its trigger; opens over 200ms from 95% and transparent.
- Row (a MenuItem): 36 high, 12 side, 8 vertical, gap 8, `item` corners (10, nested inside the 16 panel), 13/500
  `neutral-700`, icons 14 `neutral-600`; highlighted the 5% wash and `neutral-800`; `danger` rows in `error-600`,
  **last, after a separator**. A checkbox or radio item shows a 16 check at its end when checked; radio items
  sit in a **DropdownMenuRadioGroup** (one value), and a checked one takes the selected wash. A
  **DropdownMenuGroup** holds rows a label names. Label 11/500 `neutral-600` (12 side, 6 top, 4 bottom).
  A submenu is a **DropdownMenuSub**: its **DropdownMenuSubTrigger** is a row with a 16 chevron right at its end
  (its own 16 icon goes in `icon`, as on the checkbox and radio rows, never in the children),
  on the selected wash while its submenu is open, and its **DropdownMenuSubContent** is the same panel opening
  beside the row. Separator a hairline bleeding 4 to the panel's edges. Shortcut 11/500
  `neutral-600` at the row's end.
- A long menu (assign to, move to) takes a **DropdownMenuSearch** on top: 40 high, 16 side, gap 12, a 16 icon
  in `neutral-500`, the text 13 with no box, ruled off full width; Enter runs the first item that matches; and a
  **DropdownMenuEmpty** (13 `neutral-600`, 12 side, 10 vertical) when nothing matches.
- **DropdownMenuRadioItem** and **DropdownMenuCheckboxItem** take an `icon`: a 16 icon in the row's leading
  slot, like a plain item's, with the check still at the end.

### Kbd
A shortcut key: 22 high, min 22 wide, 4 side, chip corners, a 1px `neutral-300` border, no fill, 11/500
`neutral-700`. Trails a SidebarItem, a CommandMenuItem, a search input, only where the key does what it says;
never inside a button, whose key goes in its tooltip or in a hint line under the actions. Hidden on a touch screen, which has no keys
to hint at.

## Inputs

### Field · FieldLabel · FieldHelper
**For** a labelled control in a form: label, control, helper stacked. **Not for** a setting (SettingRow is the
label there) or a read-only value (ReadonlyField).
- A column, gap 8. Label 13/500 `neutral-900`. Helper 13/400 `neutral-600` (the secondary step: a hint is told apart by its place, not a paler grey),
  `neutral-700` while the control's box (an Input, a Select, a Combobox, a DatePicker, a CodeInput) is hovered,
  `neutral-900` while it is focused, `error-600` when invalid, `neutral-400` when disabled. The field
  passes `invalid` and `disabled` to its control.

### Input
**For** a line of text. **Not for** a value from a list (Select), a search of a list (Combobox), several lines
(Textarea), a date (DatePicker). **With** a leading icon (a search), a trailing piece (a Kbd, a unit).

| size | height | side padding | gap | corners      | text                                    |
| ---- | ------ | ------------ | --- | ------------ | --------------------------------------- |
| sm   | 34     | 12           | 8   | `control` 12 | 13/500 `neutral-900`, placeholder `neutral-600` (`neutral-700` on hover) |
| md   | 38     | 12           | 8   | `control` 12 | same                                    |

Hairline, no fill, full width, icons 14 at 34 and 16 at 38, `neutral-600`. Hover border `neutral-300`; focus border `neutral-300`
plus the ring; invalid border `error-500`, icon `error-500` and placeholder `error-300`; disabled the whole box
at 50%, its colours and hairline kept, as every disabled control. `sm` in a toolbar beside buttons; `md` in a
form. The `plain` variant drops the box (no border, no side padding) for a search inside a container that
already frames it (a table's bar, a menu); it keeps the ring. **On touch** the text is 16, so the phone does not
zoom the page on focus; the box keeps its height. The same holds for every field that takes typing: Textarea,
the Combobox's input, a menu's search, the command menu's, a filter's typed value, the message composer and prompt.

### Textarea
A medium Input for several lines: min height 96, 12 side, 10 vertical, `control` corners, hairline, 13/500
`neutral-900`; grows downwards only. Same states as Input; 16 on touch, as Input.

### Select
**For** one value from a list of many; in a setting row with `indicator="right"` as the "Select ›" picker.
**Not for** a one-of-few choice that should stay visible (SegmentedControl, RadioGroup), a list to search
(Combobox), a row of actions (DropdownMenu). **With** SelectTrigger, SelectValue, SelectContent, SelectItem,
SelectGroup, SelectLabel, SelectSeparator.
- Trigger: as Input (sm 34 in a toolbar, a page head or a setting row · md 38 in a form; 12 side, gap 8,
  `control` corners, hairline), hugs its content, 13/500
  `neutral-950`, a 16 chevron (down, or right for a picker) in `neutral-600`; placeholder `neutral-600`
  (`neutral-700` on hover); hover and open border `neutral-300`; invalid border and icon `error-500`; disabled 50%.
- Panel: at least the trigger's width, `card` corners (16), as every floating panel, hairline, surface, `float` shadow, 4 below; the list
  padded 4 with rows 4 apart; rows as a menu's (36 high, 12 side, corner 5, 13/500 `neutral-700`), the picked
  one on the selected wash with a 16 check at its end; a group label 11/500 `neutral-600`. Never wider than the
  room the screen leaves beside its trigger, as the Combobox's.

### Combobox
**For** a value, or several, found by typing. **Not for** a short list (Select) or free text (Input). **With**
ComboboxInput (one value: an Input box with a clear × and a chevron, each 24 × 24) or ComboboxChips (several:
the Input box wrapping chips and a borderless input, growing a row at a time, 3.5–5.5 vertical padding), and
ComboboxContent / ComboboxList / ComboboxItem / ComboboxGroup / ComboboxGroupLabel / ComboboxEmpty /
ComboboxSeparator / ComboboxCollection; ComboboxValue renders the picked value (in multiple mode, a function
mapping the values to chips); `useComboboxFilter` filters by label with the locale's collation (pass its
`contains` to `filter`).
- The clear × shows in place of the chevron once there is a value, so one trailing control shows at a time.
  Disabled (on the Combobox, or from a disabled Field) the box sits at 50% with its hairline kept, and the clear
  button, the chevron and each chip's × stop working with it.
- **ComboboxChip**, a picked value inside ComboboxChips, is a soft chip: 24 high, 8 side, `pill` corners,
  `neutral-100`, 13/400 `neutral-600`, an optional 12 icon, a 12 × at the end (a 20 target; hide it for a value
  that cannot be dropped); Backspace and the arrow keys move between chips, and the focused one takes the ring.
  **ComboboxChipsInput** is the borderless input after them: 24 high, at least 64 wide, taking the rest of the
  row. The panel and rows are the Select's; "No results" is a 36 row in `neutral-600`.
- Options that are files, paths or IDs cut in the middle (a Truncate as the item's label); named options at the
  end.

### Checkbox
**For** selecting rows in a table, agreeing to a thing in a form, several choices from a short list. **Not for**
a setting that is on or off (Switch).
- 20 × 20, `chip` corners (6), a 1px `neutral-300` border (one step over the hairline), no
  fill; checked or mixed: the action fill, the border kept, a 14 check or minus in `on-action`. Hover border
  `neutral-400`; invalid `error-500`; disabled 50%. Inside a
  menu row the indicator is 16 with a 12 mark.

### RadioGroup · RadioGroupItem
**For** one of a few options read together, each with a label (an OptionRow when it needs a description).
**Not for** five or more options (Select) or a yes/no (Switch).
- Items 8 apart in a column. Item 20 × 20 round, a 1px `neutral-300` border (as the checkbox's), no fill; checked:
  a 14 round dot in the action colour. Hover border `neutral-400`; invalid `error-500`; disabled 50%.

### Switch
**For** a setting that is on or off and takes effect as it changes. **Not for** a choice submitted with a form
(Checkbox) or a one-of-few (SegmentedControl).
- Track 48 × 24, round, 2 padding, `neutral-300` off, the action colour on; knob 20 round, the surface colour off,
  `on-action` on, travelling 24 over 200ms. Disabled 50%; focus ring on the track.

### SegmentedControl · SegmentedControlItem
**For** one of a few values that reshapes the same content: a view (List · Grid), a range (7d · 30d), a filter
on an index. **Not for** going to another place (Dock, Tabs), a yes/no (Switch), or more than five values
(Select). Always holds one value: without one given, it starts on its first item.
- Track 34 high, 2 padding, `control` corners (12), hairline, the surface (`segment-track`); `fill` makes it full
  width with equal items. Items 29 high, 10 side, gap 8, corner 9, 13/500 `neutral-600`, icon 14; hover the 5%
  wash and `neutral-800`. The pressed item sits on one thumb (29 high, corner 9, the action fill, `on-action`
  text; a theme may raise it as a chip with a hairline) that slides between items over 200ms. Inside a Field it
  is named by the FieldLabel, described by the helper and disabled with the field; elsewhere give it an
  `aria-label`.
- **Narrow:** items keep their labels' width and never collide; a track wider than its room scrolls.

### Slider
A range: a 4 track in `neutral-200` filled with the action colour up to a 16 round knob on the surface with a
1px `neutral-300` border and the `float` shadow; one knob per value; 20 of height for the pointer. **BlockSlider**
is the same as a box: 34 / 38 / 48 high, `control` corners, hairline, 2 padding, a `neutral-200` fill growing
inside with corner 10, the label left and the value right (13, `neutral-600` / `neutral-950`), a 2px grip line
on hover.

### CodeInput
**For** a one-time code. **Not for** a password (Input).
- N boxes driven by one input: `md` 38 × 38 (gap 8, text 14/500), `lg` 48 × 52 (gap 10, text 18/500, for a page
  whose only task it is); `control` corners, hairline, the surface, tabular; the active box takes the ring;
  invalid `error-500` with a 240ms shake.

### ColorPicker · ColorField
**For** choosing one colour: a label's, a series', a theme's own. **Not for** a choice from a fixed set (swatches as radios).
- **ColorPicker** is a well: Input's box at the control height (34 square, the same border, shadow and `control` corners) with the colour inset 3px inside it, its corner the box's less that inset and no edge of its own. It reads as a control holding a colour rather than a slab of it, so it carries no more weight in a row than the field beside it. It opens a popover holding, 12 apart: a plane 176 high at one hue with a 14 round handle (2 white border), a hue BlockSlider (48) with its band along the foot, then a ColorField.
- **ColorField** is the value by hand: a notation Select (Hex · RGB · HSL · OKLCH, 96 wide, 28 high) 8 from the value it names. Hex is one mono Input of the same height; a notation that is three numbers is three boxes instead, 4 apart, each centred and tabular, since a colour is read and corrected a channel at a time. The arrows step a channel (Shift, ten).
- A value is taken once it reads as a whole colour, in the notation picked or the one it names itself, and a whole colour pasted over a single channel is taken as the colour; it is kept as hex. The text stays as typed while it is being typed, and is written out in full (the hex expanded, the number rounded) only once the field is let go.
- The plane follows the notation: saturation over brightness for Hex and RGB, saturation over lightness for HSL, chroma over lightness for OKLCH.
- Given the light and the dark surface the colour sits on (`contrast`), two readings lead the popover ("On light 2.63:1", a dot in `success` or `error`), each a toggle for its own check, and the colours that miss 3:1 as a fill are dotted over on the plane up to a 1px white line.
- Put the well and the field side by side, 12 apart, when the value matters as much as the look; the well alone in a dense row.

### DatePicker · DateRangePicker · Calendar
**For** a date in a form (DatePicker, 38 like a medium input), a period for a report or overview
(DateRangePicker, with presets), the month itself as content (Calendar inline). **Not for** a time or a
free-text date.
- The trigger is an Input box (sm 34 in a page head or a toolbar · md 38 in a form; 12 side, gap 8) with a 16
  calendar icon in `neutral-600` and the
  value 13/500 `neutral-900` (placeholder "Select date" in `neutral-600`, `neutral-700` on hover); open: border `neutral-300`.
- The panel is a popover (`card` corners, hairline, surface, `float` shadow, 12 padding, 4 below, opening over
  150ms). A range panel has no padding: presets in a 144 column at the left (rows 32 high, 8 side, `item`
  corners, 13/500 `neutral-700`; the active one on the selected wash) ruled off by a hairline, the calendar well
  padded 12 with two months from 640, and a footer (min 42, hairline above) with the status 11 `neutral-600`
  ("Pick the last day", "14 days") and a ghost Clear once there is a range or a pick under way. Each pick starts
  a new range rather than stretching the one set.
- A single date commits and closes on the day picked; picking the chosen day again keeps it. A date that is not
  `required` has a footer under the calendar (min 42, hairline above) with a ghost Clear, as the range picker.
  `name` posts the date as a hidden input (a range posts `<name>From` and `<name>To`); `locale` writes the value
  in the reader's language and `labels` renames the words the pickers say.
- Calendar: months 24 apart; a caption 14/500 centred with 28 ghost chevrons; weekdays 11 `neutral-600`, 28 high
  on 32 columns; days 32 × 32 with `item` corners, 13/400 `neutral-900` tabular; today 500 with a 3 dot; outside
  days `neutral-400`; hover the 5% wash; the chosen day (or either end of a range) on the action fill in
  `on-action`; the days between on the tint wash, the strip rounded at a row's ends.

### DropZone · DropZoneFiles · DropZoneFile
**For** uploading files. **Not for** an empty list (EmptyState) though it looks like one.
- A well with `item` corners and a 1px dashed `neutral-300` border, 16 padding, left-aligned, wrapping: a 32
  icon tile (chip corners, hairline, `neutral-100`, a 16 upload icon), the title 13/500 and a line 13
  `neutral-600` (2 apart), a secondary "Choose files". Dragging over: border `neutral-500` and the 3% wash;
  invalid `error-500`; disabled 50%.
- Files follow under it, 16 apart, each a row (gap 12): a 32 icon tile (filled while uploading, outlined in
  the success tone when done, `error-600` on error), the name 13/500 over a meter (4 high) while uploading or the
  size 13 tabular `neutral-600` (the error in `error-600`), a ghost 28 × to cancel or remove.
- A long file name cuts in the middle (Truncate); `end` only for names read from the start.

## Forms and settings

### SettingRow · SettingGroup
**For** one setting: its title and description left, its one control right. **Not for** a value typed in (a
Field in the card), a choice with explanation (OptionRow), or several controls in one row. **With** a Switch (on
or off), a Select with a right chevron (a value), a secondary Button (an action); inside a `Card layout="list"`
per group on a settings page.
- Row: at least 38 high, the text left and the control right 16 apart, no padding, border or fill of its own.
  Title 13/500 `neutral-950` (it labels the control; clicking it toggles or opens it), description 13/400
  `neutral-600` 2 below. Disabled (`disabled`, or the whole group): the text at 50% and the control disabled
  with it. For an action button turn `labelControl` off, so the button keeps its own text as its name.
- Group: a fieldset; a quiet title 13/400 `neutral-600` 12 above the rows; settings 24, a hairline at the
  content's width and 24 apart. A `dependent` row sits with the row above it, 12 below and with no hairline
  between, stepped in behind a 1px `neutral-200` guide line (4 in, its text 16 past the line), the line
  running unbroken through consecutive dependents, so the pair reads as one setting; disabling it while the
  parent is off is the caller's (`disabled`). Several dependents get an eyebrow (13/400 `neutral-600`) naming
  what they belong to, marked `data-dependent` so it stays with the parent, behind the same line.
  `layout="boxed"`, when the settings carry dependents that must hold together: each setting with its
  dependents a bordered box (16 padding, `control` corners, the hairline), the boxes 8 apart and no hairlines;
  inside a box the dependents are plain rows 20 under the setting and 12 apart.

### OptionRow · OptionList
**For** a choice that needs a sentence of explanation: a plan, a mode, a permission; in a dialog or a form.
**Not for** a plain yes/no (Checkbox) or a setting (SettingRow).
- A label-element row (a click anywhere toggles the control): `item` corners (10), hairline, 12 padding (8
  vertical, 8 left with an icon tile); an optional 32 icon tile 12 from the text; the label 14/400 `neutral-950`
  over the description 13/400 `neutral-600`; the control (a Checkbox when several may be chosen, a
  RadioGroupItem when one) at the right, 12 from the text; about 48 high with a tile, 44 without. Hover border `neutral-300`; disabled 50%. Rows 8 apart in a list.

### ReadonlyField
**For** a read-only fact in a form (an ID, an API key to copy) or a reading with its status (`vital`). **Not
for** an editable value (Input) or an object's facts (DescriptionList).
- `well`: the label 13/400 `neutral-600` 6 above a well (sm 34 · md 38, 12 side, `control` corners, the 4% wash,
  no border) holding the value 13/400 `neutral-900` tabular and, when copyable, a ghost 28 copy button sitting
  concentric at the right ("—" in `neutral-600` when empty).
- `vital`: a 29 pill (hairline, 12 side, gap 12): the label 13/400 `neutral-600`, then a 6 status dot and the
  value 13/500 `neutral-950` tabular at the right.
- A key, an ID, a hash or a URL in the well cuts in the middle (`truncate`, Truncate); the copy button still copies the
  whole. Other values cut at the end.

## Filtering

### FilterMenu · FilterMenuTrigger · FilterMenuContent · FilterMenuGroup · FilterMenuItem · FilterMenuClear · FilterBar
**For** filtering an index by several groups of values. **Not for** one visible choice (SegmentedControl) or
one value (Select).
- **Trigger**: a secondary 34 button with a 16 filter icon and "Filter"; once filters apply, a count badge (20,
  `neutral-500` at 20% behind 11/500 `neutral-800`; on a primary trigger `on-action` at 20% behind `on-action`)
  pulled to its edge.
- **Content**: a menu panel 240 wide; groups each under a label 11/500 `neutral-600`; items are checkbox rows
  (36 high, a 16 indicator with a 12 check, the value 13/500 `neutral-700`, a count 11 `neutral-600` at the end)
  that keep the menu open while ticked; "Clear all" (**FilterMenuClear**) at the foot under a full-width
  hairline; pass it the trigger's `count` and it is disabled while nothing is picked.
- **FilterBar**: the Filter trigger and the applied filters in one row, wrapping, gap 8: the trigger first, then
  one soft Chip per group ("Status is Paid or Overdue", with an × that removes it) and a ghost "Clear all" once
  there is something to clear. The chips wrap to more lines rather than push the trigger along.

### Chip · ChipAction
**For** an applied filter ("Status is Paid"), a picked value, a tag, or a prompt offered (`outline`). **Not
for** a status (Badge) or an action (Button).
- `sm` 24 high, 8 side, a 12 icon; `md` 28 high, 10 side, a 16 icon. `pill` corners, 13/400, no wrap. `soft`,
  for what has been picked or applied (a filter, a value, a tag): `neutral-100` fill, `neutral-600` text
  (hover `neutral-200` and `neutral-950` when clickable); `outline`, for what is offered and not yet taken (a
  prompt for the assistant): a hairline, `neutral-950` text (hover border `neutral-300`). An × at the end (a
  20 target with a 12 icon, 12 from the label) removes it, only on a chip the reader can take away.

### FilterConditions · FilterCondition · FilterConditionField · FilterConditionOperator · FilterConditionValue · FilterConditionRemove · FilterConditionAdd
**For** a table whose filtering is the work: each applied filter is a sentence, field · operator · value, and
every part of the sentence is the control that changes it, so the applied filters are the controls and need
no second display. **Not for** one or two filters a table keeps permanently visible (a select, a segmented
control) or a quick tick-list (FilterMenu); the three coexist in a table's bar. **With** the table's `toolbar`
slot, a search, selects; `filterOperators` for the operator sets.
- A condition is the **inline Toolbar** without its shadow: 34 high, `control` corners, a hairline, the
  surface, segments split by hairlines. Segments: the **field** (a 16 icon and the name, 13/500
  `neutral-950`, 10 side, not a control), the **operator** (13/400 `neutral-600`, a radio menu of what the
  field can do), the **value** (13/500 `neutral-950`; "Maya Chen +1" when several; a checkbox menu for a
  many-valued field, radios for one), and a **×** (a 14 icon in `neutral-500`, 8 side). Hover on a segment the
  5% wash inset 2. A segment that opens a menu of your own is a **FilterConditionSegment** (a toolbar button, 10
  side, 13/500 `neutral-950`; `muted` gives the operator's 13/400 `neutral-600`); `filterValueSummary` writes
  the "Maya Chen +1" a value segment shows.
- Operators by kind: many-valued *has any of · has all of · has none of · is empty · is not empty*; one-valued
  *is · is not*; boolean *is on · is off*; number *is · is not · is more than · is less than*; date *is · is
  before · is after · is in the last*; text *contains · does not contain · is · starts with*. The first is the
  default when a condition is added (`defaultFilterOperator(kind)`). *is empty*, *is not empty*, *is on* and
  *is off* take no value: given the condition's `operator`, the value segment leaves itself out and the
  sentence ends at the operator (`filterOperatorTakesValue` says which).
- A value typed rather than picked (a number, a date, a piece of text: "is more than 500") is a
  **FilterConditionInput**: a borderless input in the segment, 13/500 `neutral-950`, 10 side, growing with what
  is typed from 64 to 192 wide, placeholder `neutral-600`; 16 on touch, as an Input.
- **Narrow:** the value segment truncates with an ellipsis before the condition clips; conditions still wrap as
  whole chips.
- **Add** is a 34 secondary square with the filter icon opening the fields not yet applied (with a search when
  long); picking one adds the condition with its default operator and no value. The conditions, a ghost
  "Clear all" (once anything applies) and the add button sit in one wrapping row, in that order, 8 apart.

## Overlays

### Dialog
**For** a confirmation of what cannot be undone, or a short form (two or three fields). **Not for** an action
that can be undone (do it, and offer Undo in a Toast), reading beside the page (Sheet), an item's editor (its
own page), a long form (its own page). **With** DialogTrigger, DialogContent, DialogHeader,
DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose.
- Centred, 480 wide (never wider than the viewport − 32), `card` corners (16), hairline, surface, `sheet`
  shadow, a scrim of black at 40%; enters over 200ms from 8 below. Three parts, only the body scrolls:
  - **Header** 52 high, 20 left, 11 right, hairline below: the title 14/500 `neutral-950` (one line), a secondary
    30 close button (corner 12, a 14 ×) at the right.
  - **Body**: 20 side, 16 vertical, parts 16 apart; the description 13 `neutral-600` first.
  - **Footer** 52 high, 11 side, hairline above: a secondary and the primary right-aligned, 8 apart; a
    destructive confirm is a primary button labelled with the verb.

### Sheet
**For** history, details, comments: things read beside the page, non-modal, the page still usable. **Not for**
an item's editor or a form that commits (its own page or a dialog). **With** SheetTrigger, SheetContent,
SheetHeader, SheetTitle, SheetBody, SheetSection, SheetClose, SheetArea.
- At the right, 512 wide, 16 from the top, right and bottom of the viewport (or of its `SheetArea`: the content
  area below the header bar and beside the sidebar), `panel` corners (20), hairline, surface, `sheet` shadow;
  enters over 200ms from 16 to the right; z 40, below dialogs. A scrim only when fully modal.
- **Header** 52 high, 16 left, 6 right, gap 8, hairline below: a 16 icon in `neutral-950`, the title 14/500, a
  ghost 36 close at the right. **Body** scrolls, no padding. **Section**: 20 padding; every section after the
  first ruled off by a **full-width** hairline above it.

### Popover
**For** a small form or detail anchored to its trigger: a date, a share setting, a filter's values, column
settings. **Not for** a list of actions (DropdownMenu) or a label (Tooltip). **With** PopoverTrigger,
PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverClose.
- 288 wide, 12 padding, parts 12 apart, `card` corners (16), hairline, surface, `float` shadow, 13
  `neutral-700`; 4 below its trigger, centred; grows from 95% over 150ms, leaves in 100ms. Header: the title
  14/500 `neutral-950` over the description 13 `neutral-600`, 2 apart.

### MenuItem · MenuItemIndicator · MenuItemShortcut
**For** the row every popup list is made of: a select's options, a combobox's, a menu's actions, a filter menu's
values, the command menu's commands; each list renders its own item through it, so its keyboard and state stay
the list's. **Not for** a row on a page (a table row, a setting row, a bar list row).
- 36 high, 12 side, 8 vertical, gap 8, `item` corners (10, nested inside the panel's 16), 13/500 `neutral-700`,
  icons 14 `neutral-600`; highlighted the 5% wash and `neutral-800`; selected the selected wash and
  `neutral-950`; `danger` in `error-600`; disabled 50%.
- In order: the **leading** piece (a 16 icon, an avatar, an indicator, a chip), the name (truncating), **meta**
  inline after it (400 `neutral-600`, 6 from the name: a badge, "you"), an optional **description** under the
  name (11/400 `neutral-600`; the row grows, 10 vertical), and the **trailing** pieces at the far end (11
  `neutral-600`, 8 apart: a check, a shortcut, a count, a chevron to a submenu). What leads sets the rhythm: a 24
  avatar or a chip pads the row 10 vertical, a 32 or 36 avatar 12, and beside either one line of text sits 10
  from it.
- **MenuItemIndicator**: a 16 checkbox (corner `chip` − 2) or radio (round) at the row's head, a 1px
  `neutral-300` border (as a checkbox's); checked or selected, the action fill with a 12 check or a 6 dot in `on-action`.
  **MenuItemShortcut**: 11/500 `neutral-600`, slightly tracked ("⌘D", "G I"); hidden on a touch screen, as a
  Kbd.

### Tooltip
**For** naming an icon-only control. **Not for** explanation (InfoTip) or anything that must stay. **With**
TooltipTrigger, TooltipContent, TooltipProvider.
- A dark chip: `neutral-950` behind 11/500 `neutral-50`, 8 side, 4 vertical, chip corners, max 256 wide, 6 above
  its trigger (another side when given), after a 300ms hover; fades over 200ms. A lone Tooltip brings its own
  provider; a **TooltipProvider** round a rail or a toolbar groups the tooltips inside it, so once one has shown
  the next opens at once, without the wait or the fade.

### InfoTip
**For** explaining a heading, beside a section or card title. **Not for** help text under a title (never a
paragraph of help).
- A 16 info icon in `neutral-500` (`neutral-800` on hover and open, a 24 target), opening a small popover on
  hover, focus and tap: 10 side, 6 vertical, `item` corners, max 256, 13 `neutral-700`, 6 above.

## Tables

### Table
**For** a list of objects (`ruled`, in its own frame on the page), or a short ranked breakdown inside a card
(`rows`, frameless, since the card already frames it; when each row has one figure, a BarList). **Not for**
key–value facts (DescriptionList) or a settings list. **With** TableHeader, TableBody, TableFooter, TableRow,
TableHead, TableCell, TableGroupRow, TableCaption; Pagination under it; Checkbox for selection; a ghost
`icon-sm` ellipsis (28) in the last column for the row's DropdownMenu, which the row's 41 holds without growing; TableHead, TableCell, TableDragCell, EditableCell and the fold parts in the sections below. Values worked on cell by cell are a DataGrid.

| variant | frame                                           | head                                            | row / cell                                                      |
| ------- | ----------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| ruled   | `control` corners (12), hairline, surface, scrolls sideways | 41 high, 12 padding, `neutral-100` fill, 13/400 `neutral-600`, hairline below | 41 high, 12 padding, hairline below (the last row drops it), 13/500 `neutral-900` |
| rows    | none                                            | 12 side, 2 vertical, 13/400 `neutral-700`        | 34 high, 12 side, 8 vertical, the 4% wash with `control` corners at the row's ends, 13/400 `neutral-600` (first cell `neutral-800`), rows 8 apart |

Numbers tabular and right-aligned; the first column is the name; meta columns `neutral-700`; a status is a badge;
a person a 24 avatar and name; a row with a second line of meta is 54 high. A `ruled` body row hovers the 3%
wash; a selected row (`data-selected`) takes the selected wash, which hover leaves as it is. **TableGroupRow**, only when the list falls into sections: a 34 muted row across all columns (`neutral-100`, 13/400 `neutral-700`, a hint 11
`neutral-600` in parentheses). **TableFooter**, only when the amounts add up to sums the reader needs: an optional head row of the columns the sums sit in (the head's
fill, 8 vertical padding), then a row per sum with no rules, the first cell `neutral-700`; the total's cells get a
hairline above, 12 top and 16 bottom padding. **TableCaption** under the table, 13 `neutral-600`. A `toolbar`
stays put in the frame while a table wider than it scrolls sideways under it.

**Narrow:** a head or cell keeps to one line (a second line of meta still stacks under the first), and the frame
scrolls sideways under an edge fade at the side that has more, so it reads as scrollable. A column marked
`optional` on its head and cells (an owner, a last seen: what the reader can do without) hides while the frame is
under 640; the name and the row's menu are never optional.

### TableHead
**For** a column's name over its values, 13/400 `neutral-600` on the head's fill. **Sorting**, only on the columns
a reader orders by (a name, a date, an amount), never every column: the label is a button with a 14 mark 4 after
it (before it on a right-aligned column, so the label stays flush with the figures). Unsorted, the mark is an
up-down chevron in `neutral-500` shown only under the pointer or focus (always on touch), so a sortable head row
reads as plain as any other; sorted, an arrow in `neutral-900` (up ascending, turned down descending) and the label
`neutral-900`. A click steps off → first order → the other → off; numbers and dates start descending (the largest
or latest first, which is why they are sorted), text ascending. One column sorts at a time; the head carries
`aria-sort`.

**Resizing** (`width`, `onWidthChange`), only on a table the reader works in for long, where columns hold values
of very different lengths: an 8 target inside the head's right edge. Under the pointer the head shows its edge as a
hairline (`neutral-300`, 12 in from top and bottom); on the target, or dragging, the edge is the accent at 2 down
the head's full height, and while dragging down every cell of the column, so the reader sees what is cut. The arrow
keys move a focused edge 8 (32 with Shift); a double click fits the column to its widest value. A column never goes
under its own label (or `minWidth`, 48). The table then lays out by its widths: every column given one but the
name, which takes what is left until it is resized itself; once every column has a width the table is as wide as
they add up to, scrolling sideways past its frame, or leaving room at its right with the head's band running on to
the frame's edge. A value wider than its column ends in an ellipsis. **Moving** (`movable`, with `onColumnMove` on
the TableHeader), only where readers arrange the columns to their own work: under the pointer a 14 grip in
`neutral-500` shows in the head's left padding, 5 clear of the label (always on touch), the same grip a row's
TableDragCell has. The head or its grip is picked up (the grab cursor; a press on a sortable label that does not
move still sorts) and the column lifts as one strip on the surface, its sides ruled, the columns it passes stepping
aside (150, ease-out); let go, it settles into its place the same way, and Escape puts it back. ← → on the focused
grip move it a place. The selection, grip and menu columns never move. While a column or row is dragged or
resized the cursor holds for the whole page, and nothing under the pointer hovers or gets its text selected.

### TableCell
**For** one value in a row. Numbers tabular and right-aligned (`numeric`); the name 13/500 `neutral-900`, meta
13/400 `neutral-700`. A long value that is told apart by its end (a key, a path, a hash) is cut in the middle with
a Truncate, the whole on hover and in a copy; a name is cut at its end. **Copy** (`copy`), only for a value the
reader pastes elsewhere: an ID, an email, a key, a hash: a 24 ghost button (14 icon, `chip` corners, the 5% wash
under the pointer) 8 after the value, so it reads as a control of its own beside it; on a right-aligned cell it
goes before the value. It shows while the cell is under the pointer or the button has focus (always on touch) and
keeps its room while hidden, so nothing moves; a copy turns the icon to a tick for 1.5 s and is announced. Not on
names or amounts, which nobody copies on their own. A box alone in a cell (`TableSelectCell` for the selection
column) sits on the row's middle and never grows the row.

### TableDragCell
**For** a row whose place in the list is set by hand, where the order means something (a backlog's priority, the
lines of an invoice as they print), with `onRowMove` on the TableBody. **Not for** an order that follows a value:
that is sorting (TableHead). The first column (44, before the selection's box), its head empty: a 14 grip in
`neutral-500` on a 20 × 28 target (`chip` corners, the 5% wash under the pointer), lending the row's padding like
the ellipsis so the row stays 41, shown only under the pointer or focus (always on touch), so a list that can be
reordered reads as plain as one that cannot. Moved 3 from where it was pressed, the row lifts (the surface, a
hairline ring and the `float` shadow) and follows the pointer, held within the list; the rows it passes step aside
by its height (150, ease-out), so the gap it will drop into is always open; let go, it settles into the gap the same
way, and Escape puts it back. ↑ ↓ with the grip focused move the row a place, focus staying on
it. A row nested under a fold has no grip: it moves with its parent.

### EditableCell
**For** a value worked on where it sits, only where the table is where the values are worked on (`patterns.md`).
The cell reads as its value. Under the pointer or on focus a 14 mark in `neutral-500` shows at the cell's end: a
pencil for a typed value, a chevron for a pick, the one hint that it can change (before the value on a
right-aligned cell, so the figures stay flush), with the pointer cursor, since a click is what starts the edit
(the text cursor belongs to the field once it is open). A click, or Enter on it, turns it into a borderless input
on the tint wash with the text exactly where it was, so the row keeps its height, and rings the cell inside its
edges in the accent (`primary-500`, 2), so the cell being edited is plain to see among the values. A 20 ghost
check at the field's end saves (before the figures on a right-aligned cell): the save is an action you can see and
tap, not only a key; Enter or a click away saves too, Escape puts the value back, and focus returns to the cell. A value from a set (a VAT rate) opens a list under the cell, its
left edge on the cell's; the pick saves. Focus on a cell rings the whole cell, inside its edges. A sum the table
works out stays a plain cell and follows the edit.

### TableTree · TableTreeCell · TableTreeRows · TableTreeHead · TableTreePanel
**For** a row with more rows of the same kind under it, opened now and then: an invoice's instalments, a folder's
files and folders. The rows a fold shows (`TableTreeRows`) are real rows of the table: the same columns filled
the same way, the same height, each with its own box when rows are selected, and a nested row can fold in turn.
Rows of the same kind (instalments under an invoice, files under a folder) **align with the columns**, because
each value is a value of that column. Rows that are a **breakdown** of the row above (a payout by source, a
source by plan: `TableTreeRows shift`) **step in a level (a step) in every column**: left-aligned values step right,
right-aligned figures step left, in from the column's edge, and a column the breakdown has no value for (the
date) stays empty. So no part sits under its parent's value and reads as a peer of it, while it stays in the
column it belongs to; each level deeper steps again. Ticking a parent ticks all its children; with some ticked
it shows mixed.

Rows of **another kind** (an invoice's lines under the invoice) take a head of their own (`TableTreeHead`): the
table's head row again, the same fill, height and type, as the first row the fold shows, naming what each column
holds for the rows under it (Item, Qty, Rate where the table says Invoice, Client, Status); its first label steps in
with the rows, and a column they leave empty keeps an empty head. The rows then sit on the table's columns and
read against those labels, so a quantity under the table's Status reads as a quantity, not a status.

**Anything that is not rows** (a diff, a history, a form, a preview) goes in a panel (`TableTreePanel`): one row,
its action cells empty and the parent's line running down beside it to 16 over its foot. It **splits on a
column's edge, the way the table does**: what the content is (a title in 13/500 `neutral-900`, who and when in
`neutral-600`, an action) in the leading columns (`aside`, `asideSpan`), starting a step in where a child's name
would, and the content itself in the columns after, its left edge on theirs. So the panel follows the table's own
columns rather than sitting as a block centred in a row. Without an aside the content takes every data column, a
step in. It grows to what it holds, 16 above and below, both sides from the top, and its text wraps. Inside,
Continuum's own parts at their own sizes; one primary action at most, and usually none, since the page has its
own.

**Layout.** The fold's control is an action of the row, so it has its own **fold column** after the selection
column (44, 12 padding, an empty head). A top-level row that folds shows a 20 ghost chevron there, `chip` corners (6) (right closed,
turned down open, 150 ms); one that does not keeps the slot empty. A **nested row's box moves into the fold
column**, centred under its parent's chevron (its cell in the selection column stays empty); a nested row that
folds puts its chevron a **step** after its box, and its children's boxes sit under that chevron, so every level
repeats the top level's box-and-chevron pair, the same distance apart, one step further in. The step is the
distance from a box to its chevron: 44 with a selection column (its width), 28 without (a 20 chevron and the 8
after it). Keep the selection and fold columns at 44 by leaving one data column without a width to take the
rest; when every column has a width, the table spreads the spare room over all of them and the pairs no longer
match. The fold column grows a step a level and fits the deepest level shown. Box and chevron share the row's
middle. The nested row's first data cell steps in a step a level, its name 13/400 `neutral-700` (and a column
repeating the parent's value the same), so it is set back from its parent's.

The **guide line** (a `neutral-200` hairline) hangs from the open chevron at its centre x, from 4 under it, and
threads between the children's boxes (4 clear of each) to the last child. Without selection it runs straight
through to the middle of the last child. It can be left off (`guides={false}`) when the moved boxes are enough to
show the level; it is on by default, since it ties each box to the chevron it hangs from. Nested rows fade in over
200 ms. The footer's label cell spans the action columns too.

### TableToolbar · TableSearch · TableToolbarEnd · TableConditions
**For** what finds and narrows one table, on that table: passed to `Table`'s `toolbar`, drawn inside its frame
above the column head. **Not for** page-wide controls (the period, Export: the page head) or the list's views
(the dock).
- **TableToolbar**, the bar: min 44 high, 6 padding all round, a hairline below; it wraps when
  its contents outgrow one line, so the head never moves. **TableSearch** at its left: a small outlined `Input`
  (the hairline box, a leading 16 search icon, 34 high, 256 wide, giving way before the filters).
  **TableToolbarEnd** at its right, items 8 apart: the selects a table keeps visible, a FilterMenu, and, while
  no condition applies, the **add button** of the conditions (a 34 secondary square with the filter icon).
- **TableConditions**, under the bar, **only while a condition applies**: the same 44 row, same padding, with a
  hairline below, holding the conditions (each field · operator · value · ×) and a ghost "Clear all", 8 apart,
  wrapping, and the add button at its right end (a TableToolbarEnd). The conditions never share the search's
  bar, so narrowing reads apart from finding.
- **Narrow:** the search gives up its 256 and takes the rest of the bar, the end group beside it.

### DataGrid
**For** values worked on cell by cell, as in a spreadsheet: a budget, a plan, a price list, where the reader
selects a block of cells, types over them, pastes them in from elsewhere and fills them down, and every cell is a
value of its own. **Not for** a list of objects (Table: a row is a thing, read and opened a row at a time) or a few
values of a list edited where they sit (EditableCell).
- **Frame:** the ruled table's frame (`control` corners, a hairline, the surface). Heads on the `neutral-100` fill,
  13/400 `neutral-600`: a column head 32 over each column (its name, or a letter, centred, when the columns have
  no names), a 44 row head with the row's number, centred and tabular; both stay in view as the grid scrolls.
- **Width:** each column keeps its own width (112 by default, resized by the reader); when they end short of the
  frame the last column takes the room that is left, so the grid always fills its frame and never stops short
  of its right edge. Wider than the frame, it scrolls.
- **Toolbar** (`toolbar`): what works on this grid (a scenario, a view, where it stands) on a TableToolbar inside
  the frame over the column heads, as a table's; it stays put while the grid scrolls. The page's own actions
  (Share, Publish) are the header bar's, never on it.
- **Summary rows** (`summaryRows`): **when** the sheet sums itself (a total, a target, a gap), its last rows: a
  `neutral-400` rule over the first of them and their cells in 13/500 `neutral-950`, as a spreadsheet writes its
  totals, a negative one in `error-600` (a shortfall is the sheet's problem). Worked out from the rows above, so
  what is typed over a total is put back.
- **Cells:** 32 high, 8 side padding, hairlines on both axes (`neutral-200`, the one grid that rules both ways
  with the schedule), 13/400 `neutral-900`; a number right-aligned and tabular, text left; one line, ending in an
  ellipsis. The cell cursor over cells.
- **Selection,** the grid's one accent: the cell it starts from is ringed 2 on its lines, a block dragged or
  Shift-extended from it is outlined 1 on its lines and washed in the accent at 10%, the start cell left clear
  inside its ring. Ctrl or ⌘ held, a click, a drag or a head adds another block and keeps the ones before, each
  outlined and washed the same, the newest one's start cell ringed; a plain click starts over. The heads over the
  selection darken (`neutral-200`, `neutral-900` text) and take the accent on their edge facing the cells, so the
  blocks read from the heads as well. An 8 square on a lone block's corner (the
  accent, a 1 surface rim) drags a fill: the cells it will write outlined dashed, then a run of numbers a constant
  step apart carries on as a series and anything else repeats. While the grid does not have focus the accent turns
  `neutral-500` and the wash neutral, so only the grid being worked in is in colour.
- **Editing:** typing over a cell replaces its value; Enter, F2 or a double click opens it with its value. The open
  cell is a borderless 13 input on the tint wash, the text where it was, ringed in the accent; Enter saves and moves
  down, Tab right (Shift back), Escape puts the value back. Delete clears every selected block; Ctrl or ⌘ + C, X and V copy,
  cut and paste it as tab-separated rows (one value pasted fills the whole block), Z undoes and Y redoes.
- **Keyboard:** the arrows move the start cell (Shift extends the block, Ctrl or ⌘ runs to the edge), Home and End
  to the row's ends, Ctrl or ⌘ + A everything, Escape back to one cell. A column head selects its column and a row
  head its row (dragged along the heads, the ones it passes); the corner selects all. The footer sums every
  selected block, a cell in two counted once.
- **Sizing:** a column's edge and a row's foot are dragged from the heads (an 8 target, the accent at 2 under the
  pointer); a double click returns it to its own size. A row never goes under 32.
- **Footer** (`footer`), only when the reader needs what a selection adds up to: a 32 band under the grid on the
  head's fill, ruled off, 13 `neutral-600` with the figures `neutral-900` 500: Sum, Average and Count of the
  numbers selected, 16 apart.

## Cards and lists

### Card · CardHeader · CardTitle · CardValue
**For** a self-contained unit: a chart drawn by hand, a group of settings, a list, a block of facts. **Not for** a
key figure (StatCard: the one card a figure is drawn in), a page
section (space), a header (never in a card), a form (sections), or inside another card (the one exception is in
`foundations.md`, Surfaces and depth).

| layout  | padding                 | gap | for                                   |
| ------- | ----------------------- | --- | ------------------------------------- |
| default | 16                      | 16  | a stat card, a small unit              |
| list    | 20                      | 16  | a list, a group of settings, facts     |
| chart   | 20, 48 at the bottom    | 32  | a chart drawn by hand, with room under its x labels; the kit's charts bring their own card (`charts.md`) |

`card` corners (16), hairline, surface, no shadow. Header: the title 13/400 `neutral-600` over the value (2
apart); value `md` 18/500 in a stat card (20/500 once it grows a chart or facts), `lg` 24/500 or `xl` 31/500 in a chart card's head, tabular; a figure
row puts the value and its delta (13,
`success-800` for good news, `error-600` for bad) on one baseline, 8 apart. The colour follows what the change
means, not its direction: pass `trend` (`up` good, `down` bad) whenever a fall is good news (churn, costs,
refunds). Without a `trend`, a delta whose text starts with a minus (a hyphen, the minus sign or an en dash)
reads as bad, anything else as good.
- **A card with a head puts the rest in `CardContent`**, and what closes it in `CardFooter`: plain they add
  nothing, but a theme that frames its cards (`theming.md`, `cards`) stands the head and the foot on the frame
  and stages the content. A card's padding and gap are its values, set on it, never a padding class, which would
  also override the framed values. The library's titled parts (StatCard, the chart cards, a BarList with a
  title, Checklist, a SettingGroup with a title) do it themselves; a table stays plain, its toolbar being part of
  what it holds.

### StatCard
**For** one key figure with its change, one of the two to four a reader comes to a page for. **Not for** the
figure a chart already leads with, a lone figure (a line of text, or its chart card's head), a fact that
happens to be a number (with the facts), or filling a row.
- A default Card with gap 12: the label 13/400 `neutral-600`, the value 18/500 `neutral-950` 4 below, a pill
  badge (22, success for good news, error for bad, neutral flat) 12 below, aligned left, only when the figure
  has a change to show. A secondary figure that belongs to the value ("1 invoice, due 30 Nov", "of 418") is its
  `note`: 13 `neutral-600`, 4 under the value; nothing sits inline after the value or is folded into the label.
  `trend` as on a Card (above); `neutral` for a change that is neither good nor bad.
- It grows by parts, each **only when the reader needs that much more of the figure**, never to make a plain
  row look full: `comparison`, what the change is measured against ("on last month"), 13 `neutral-600` 8
  after the pill, **when the period is not named once for the whole row** (the page head's line or its range
  control names it, and then no card repeats it); `chart`, a Sparkline (`charts.md`), **when which way the
  figure has been going is part of the answer**; `facts`, two or three figures that stand beside the key one
  (a plan, a target, the period before, a figure it is made of), each a 13 `neutral-600` label and a 13/500
  `neutral-950` tabular value 6 after it, 20 apart; `icon` (16 `neutral-600`, 8 before the label) and
  `actions` (a ghost `icon-sm` ⋯ on the label's line, pulled into the padding so the line keeps its height),
  **on a dashboard of many cards**, where the icon finds a card and the menu holds what is done with that
  figure (open its report, set a target). A fact is never the figure again in other words, and never a fourth:
  past three it is a table.
- **A card with a chart or facts reads in four zones, each parted from the next**, or it is a stack of grey
  lines with nothing to land on: the label line; 14 under it the figure, now 20/500 (a step under the page title's 24, so the cards never read as loud as the head),
  with the pill 8 beside it on its centre line and the comparison after that, the note 4 under; 14 under that
  the sparkline; then the facts under a hairline across the card's full width, 16 above it and 16 under it.
  The figure is the one large thing; every other line is 13 or 11 and stands back.
- **Each zone keeps its height whatever it holds**, so cards side by side stay level line for line: the figure
  is one line (the comparison truncates first), the note's line is held open in a card without one, the facts
  are one line (a label truncates first) and stand at the card's foot.
- **It pads by what it holds**: 24 for a card with a chart and facts (the formula, `foundations.md`), 16 at
  the foot under the facts; the plain card stays at its drawn 16.
- A row is all one kind of card, and every card in it holds the same parts, so the row ends level.

### DescriptionList · DescriptionItem
**For** an object's key–value facts, term left and value right in two equal columns, in a bordered box (in the
side panel the same rows go without the box). **Not for** settings.
- `panel` corners (20), hairline, surface; rows 41 (40 cells over a hairline, the last without), 12 side, 8
  vertical, content centred; the term 13/500 `neutral-900`, the value 13/500 `neutral-950` (a badge, an avatar,
  a link); a wrapping value grows the row.

### Accordion · AccordionItem · AccordionTrigger · AccordionPanel
**For** a list of questions, terms or notes read one at a time and skipped otherwise, each opening its answer
under it: the questions under a product or a plan, the notes on a step. **When:** there are three or more, each
answer is a few lines of prose, and most readers want one of them. **Not for** the facets of one object (Tabs),
a page's settings (SettingRow, each area its own page), steps to finish (Checklist), one or two questions (a
heading and a paragraph each), or anything a reader must see to go on.
- A divided list: a hairline between items; `plain` (the default) with one above and below, on the page, in a
  reading column; `outline` in a hairline box on the `card` corner on the surface, rows 16 side, for a list
  standing among other boxes.
- The question is the whole row, a button: min 40 high, 12 vertical, 13/500 `neutral-950`, wrapping when long; a
  16 chevron `neutral-600` at the right end, centred on the row, gap 16, `neutral-950` on hover, turning half round
  as it opens. The answer below: 13/400 `neutral-600`, at most 576 wide, 16 under it.
- One open at a time; `multiple` only where answers are compared. The first may start open. Opening moves the
  height and the opacity over 200ms on the system's ease; none under reduced motion. The focus ring on the row
  (drawn inward in `outline`); a disabled item 50%.

### ActivityList · ActivityItem
**For** a history or timeline, in a sheet or at the foot of a detail. **Not for** steps of a run (the step row
pattern) or a chat.
- Items 24 apart; an item a row with gap 16: a 32 outline icon tile in the tone (`neutral-600` / `success-700` /
  `warning-700` / `error-600` / `primary-700` glyph, as IconTile), the title 13 `neutral-950` over the time 13/400
  `neutral-600` (2 apart), an optional badge at the end.

### BranchGraph
**For** a version history where how the work branched and merged matters: a repository's commits, a document's
or a model's versions with forks. It is a list of rows first, so it lives with the lists and not the charts: it
measures nothing, and each row is a thing to pick. **Not for** a straight history with nothing to branch (an
ActivityList, or a Table when the rows carry several facts), or a run's steps.
- Takes commits newest first, each with its parents; it works the lanes out itself. One row per commit, 34
  (`compact`, a long log) or 41 (`default`, a short log read closely), no rules between rows so the lanes run
  unbroken; in a frame like the ruled table's (`control` corners, hairline, surface) unless a card already frames it.
- The gutter: lanes 16 apart, the first 16 from the frame's edge, lines 1.5, a commit an 8 dot in its lane's
  colour; a merge a hollow ring of the same size, and its message `neutral-600`, since a merge says less than
  the work it brings in. Lines run only down a lane or along a dot's row, turning on a 6 corner: a branch
  leaves the commit it was made from along that row, a merge reaches along its own row to the branch it takes
  in, and a line along a row breaks 3 either side of a lane it passes, so it reads as passing under. A lane
  whose parent is not in the list runs off the foot.
- Colour: the trunk (`main` or `master` unless named) keeps the leftmost lane in `neutral-400`, so the line
  everything comes from stays quiet; the lanes beside it take `chart-series-1` to `-4` in turn. Never the
  status colours: a lane's colour says which line, not how it went.
- A row: the refs, then the message 13/400 `neutral-900` truncating, then author 13/400 `neutral-700`, the
  short hash 11 mono `neutral-600` and the time 13/400 `neutral-600` tabular, right aligned, 16 apart. A ref is
  a 20 label, `chip` corners, the 5% wash, 11/500 truncating at 160: a branch with a 6 dot in its lane's colour,
  a tag with a 12 tag glyph, the checked-out branch in `neutral-950` with a hairline ring, a remote's copy in
  `neutral-600`. Two refs at most, the rest a "+N" with the names in its tooltip. Under 560 wide the author and
  hash go and a row keeps one ref, so the message keeps its line.
- When rows are picked: a listbox, one row in the tab order, arrows and Home/End move, Enter or a click picks;
  hover the 3% wash, picked the selected wash with a soft disc round its dot, the focus ring inside the row.

### BarList · BarListItem
**For** a ranked breakdown (top pages, sources, countries) in a list card. **Not for** a comparison across
categories (a chart) or a data table.
- Header, rows and footer 8 apart. Header: the title 13/400 `neutral-600` and a value label 13 `neutral-600`,
  10 side padding; items 6 apart; the footer "Show N more" (29 high, 8 side, `item` corners, 13/500
  `neutral-600`, hover the 5% wash). A row: 34 high, 10 side, gap 8, `item`
  corners, the 3% wash, with a bar behind the label sized to its value (the 7% wash; min 4 wide). The bar is
  neutral: it shows a rank, and a colour there would compete with the page's one action colour and its
  status colours. The `chart` tone (`chart-1` at 20%) only **when the list sits inside a chart card and its
  rows are that chart's own series**. Then an optional 16 icon, the label 13/400 `neutral-950` truncating, the value 13/400
  `neutral-600` tabular. Interactive rows hover the 5% wash; pressed (a filter toggle) the tint with the label at
  500. Empty: a 34 row "No data yet" in `neutral-600`. Narrow, the header's value label truncates rather than
  push the title out.
- Labels that are paths or URLs cut in the middle (`truncate`, Truncate); names and places at the end.

## Text and layout

### Truncate
**For** one line of text that must fit the width it is given. **Not for** text that may wrap (a description,
a message) or a value that must always show whole (an amount).
- Cut **at the end** by default, for names and labels read from the start ("Northwind Traders"). Cut **in the
  middle** when the end tells one item from the next: a file name keeps its extension and the word before it
  (`invoice-2026-11-…-final.pdf`), a path its last part (`/docs/…/invoice-paid`), a hash or an ID its last 4
  (`0x3f2a…9c1b`), so a column of names that share a start still reads apart. The kept end is a fixed number of
  characters, chosen by the kind of string, and the start fills whatever width is left; it never cuts by a
  character count alone.
- The ellipsis is the font's own `…`, set tight against both halves, never a space beside it. The type is the
  surrounding text's; a hash or an ID is mono.
- While cut, the whole text shows in a Tooltip on hover (11/500, start-aligned, breaking anywhere). The cut is
  only drawn: a screen reader, find-in-page and a copy all get the whole text.

### Separator
A 1px `neutral-200` line, horizontal or vertical. Rarely: between the rows of a bordered list, segments of a
toolbar, the parts of a floating container (full width); never between page sections.

## Labels and identity

### Badge
**For** a status, a count, a delta. **Not for** emphasis, a tag someone removes (Chip), or a button.

| variant | corners      | side padding | for                                            |
| ------- | ------------ | ------------ | ---------------------------------------------- |
| soft    | `chip` 6     | 6            | a status, with an optional 12 icon             |
| pill    | `chip` (6)   | 8            | a delta in a stat card                         |
| dot     | `chip` 6     | 6            | a status with a 6 dot of the tone's 500 in front |
| count   | `chip` 6     | 6            | a count in the sidebar or a nav, min 32 wide, centred |

22 high, 11/500, no wrap. Tones: the ramp's **500 at 20% behind its 800** (`neutral`, `success`, `warning`,
`error`, `primary`), one rule for every tone (the 700 misses 4.5:1 on the success and warning tints). Filled,
never outlined, never a solid 100. The tone follows what the state is, not how the row should look: draft
`neutral`, waiting on someone `warning`, scheduled or informational `primary`, done or live `success`, failed
`error`; a state that is no call for attention stays `neutral`. A badge only where the object has a state, a
count or a change to show: never one per row for the look of it. It names a state in a word; a quantity (stock
left, seats free) stays a figure beside it.

### Avatar · AvatarStack
**For** a person (round) or a workspace (square). **Not for** an icon (IconTile).
- 24 (11 text, 14 icon; in a table row, a message, a stack) · 32 (13, 16) · 36 (13, 16; a detail's title row,
  the sidebar account); `chip` corners square, round for people; a 1px border;
  initials in 500 on a tone (six hues: blue 250°, violet 295°, rose 10°, amber 75°, teal 190°, green 145°; a pale
  fill with a deep ink of the same hue, swapped in dark; chosen from the initials so the same person always gets
  the same tone), or a person icon on `neutral-100` with `neutral-600`.
- A stack: 24 avatars overlapping by a fixed 8 (the spacing unit never changes it), each ringed 2 in the surface colour, three at most, the rest as a "+N"
  tile (24 round, `neutral-100`, 11/500 `neutral-600`) on top.

### IconTile
A 32 well with `chip` corners (6) and a hairline, `neutral-100` filled or outlined, a 16 icon that reaches 3:1 on it: `neutral-600` by default, the 600 for
`error`, the 700 for `primary`, `success` and `warning`. In empty states, option rows, activity items, drop zones, alerts (32 / 24).

### StatusDot · LiveCount
A 6 (`sm`) or 8 (`md`) round dot in the tone's 500; `pulse` adds a halo at 60% expanding over 2s for a live state.
**LiveCount**: the pulsing dot 8 from "129 Active now" (the number 13/500 `neutral-950` tabular, the label 13/400
`neutral-600`); still and grey at zero. The pulse and the LiveCount only for something that is live now, beside
the thing it describes.

## Status

### Progress · Meter
**For** a task that finishes (Progress) or a value within a known range: credits used, seats taken (Meter).
**Not for** a step list (Stepper, Checklist).
- A label row (the label 13/500 `neutral-900`, a caption 13/400 `neutral-600` or the value 13 `neutral-600`
  tabular at the right, gap 12) 8 above a track 4 (`sm`) or 8 (`md`) high, round, `neutral-200`, filled in the
  action colour (`success-500` / `warning-500` / `error-500` / `chart-1` by tone) over 200ms. A tone only when the
  amount warrants it: near the limit `warning`, over it `error`, `success` once a task is complete; otherwise
  none. Indeterminate progress, only while a task has no amount to show yet, fills the track at 30% and holds
  still.
- **Narrow:** the caption or value truncates with an ellipsis rather than push the label out.

### Checklist · ChecklistItem
**For** the set-up steps a new workspace works through. **Not for** a form's steps (Stepper) or tasks to tick (that is data,
a table).
- A card (16 padding, `card` corners): the title 14/500 with the count 13 `neutral-600` ("3 of 5") and an
  action, a 4 meter under them 12 below (action fill; success when complete), then the steps 2 apart. A step:
  8 padding (12 vertical when current), `item` corners, the current one on the 4% wash; a 22 round marker (a
  `neutral-300` ring; the action ring when current; the action fill with a 14 tick when done), the title 13/500
  (`neutral-600` at 400 when done), and for the current step its line 13 `neutral-600` and its action 10 below.

### Skeleton · SkeletonText · Spinner
- **Skeleton**: a block at the real element's size on the 5% wash with `item` corners, and a band of light
  flowing across it: one band for every skeleton on the page at once (pinned to the viewport), left to right in
  2.4s, without a pause, so the blocks read as one surface loading; still under reduced motion. The region is
  marked busy. **SkeletonText**: 10 bars at 13px type (they follow the type size) on its rhythm, chip corners,
  the last one at 62%.
- **Spinner**: a quarter arc on a faint ring in the text colour, 16 (12 small), turning; only inside the button
  that is busy. A page that loads shows skeletons.

## Messages

### Toast · ToastProvider · useToast
**For** feedback after an action, with Undo for anything reversible (which then needs no confirmation first).
**Not for** a message that must stay (Alert) or a small action's confirmation (Notice).
- Bottom right, 24 from the edges, 360 wide (16 from the sides and foot on a phone), drawn in the mode opposite
  the page's, above dialogs and their scrim. A card: hairline, surface, `card` corners (16), 8 padding, gap 6: a
  36 icon well (corner 10), the title 14/500 (two lines at most) over the description 13 `neutral-600` (three at
  most; 2 apart, 6 once either wraps), then a 36 action square and a 36 close square touching (`neutral-600`,
  hover the 5% wash). The `type` sets the well as an Alert's tone would: `primary` an info glyph, `success` a
  tick, `warning` a triangle, `error` an alert circle, each on its 500 at 20% with a 700 glyph (3:1 on the tint for every tone); with no type, a
  `data.icon` sits on `neutral`, and with neither there is no well (16 left padding instead). A type only
  when the tone says what the words do not: `error` when the action failed, `warning` when it went through
  with a catch, `success` when something that could have failed is done, `primary` for news; plain feedback
  ("Moved to Archive") has none. The action is an
  icon named by a tooltip: an undo arrow for an undo (`data.undo`, or a label "Undo"), else an arrow. An
  optional tab above the card (`data.tab`; 16 side, `neutral-600` text, 10 top corners) says what is going on
  and takes the action beside its words. Toasts pile, three at most, the newest in front and the older peeking
  8 above it; pointing fans them 12 apart. Enters from 24 below over 400ms; leaves after 5s; swipe down or
  right.
- `useOptimisticUndo` runs the recipe Optimistic update with Undo (`patterns.md`) on this toast: the change
  shows at once, the toast offers Undo, the request runs behind it, and a failed request puts the thing back
  with an `error` toast.

### Notice · useNotice
**For** a small action's state in the header bar: "Saving…", "Saved", "Link copied". **Not for** anything that
needs an action.
- A tab 32 high hanging from the bar's hairline, centred: 12 side, gap 6, 10 bottom corners with 8 fillets
  bending the hairline round it, the surface, a 14 icon (a tick in `success-700` by default; a small spinner
  while saving; `neutral-500` for a custom icon) and the message 13 `neutral-700`; slides out and back over
  200ms; leaves by itself after 1.8s.

### Alert
**For** an inline notice on a page or in a form that must stay: info, success, warning, error. **Not for** feedback that passes (Toast), an empty
list (EmptyState), or problems that are what the page is about (failing checks, open incidents): those are the
page's content, rows in a list (`patterns.md`, Problems to act on).
- A row: `item` corners (10), hairline, surface, 16 side, 12 vertical (8 with a title only), gap 12: a 32 icon
  well (24 when slim; chip corners; neutral the 5% wash with a `neutral-600` glyph, else the tone's 500 at 20%
  with a glyph that reaches 3:1 on it: the 600 for `error`, the 700 for `primary`, `success` and `warning`), the title 13/500 over the body 13 `neutral-600` (2 apart), the action buttons at the
  right (8 apart; on a narrow box, under the words), a ghost 28 × to dismiss. Enters from 4 above over 200ms.

### EmptyState
**For** where a list or section would be before it has anything. **Not for** a loading state (Skeleton) or an
error (Alert).
- A left-aligned panel with `panel` corners (20) and a 1px **dashed** `neutral-200` border, 24 padding, parts 16
  apart: an optional 32 icon tile, the title 13/500 over one sentence 13 `neutral-600` (4 apart, max 480 wide),
  one secondary button. No illustrations. A filter that matched nothing offers to clear it.

## Charts

The chart kit, `continuum/charts`, has a reference of its own: `charts.md`. It holds which chart answers which
need, the card every chart sits in (ChartFrame, ChartCard, ChartKey), the plot, the marks, colour, hover, motion,
and an entry per chart: AreaChart, LineChart, BarChart, HorizontalBarChart, DonutChart, Treemap, FunnelChart,
RadarChart, RoseChart, BulletChart, UptimeStrip, BubbleChart and CandlestickChart.

## Chat

A conversation between people, and the bots and AI agents that take part in it as people do: support, a help
widget, comments, a team's chat. Built from the parts below, each with its own entry. An AI here is one more
author: its message is the other side's card, told apart by an "AI" badge and, when the reader needs them, its
stats, never by a shape of its own. **For** a conversation. **Not for** asking the product a question (the
Assistant parts below), a history (ActivityList) or a log (the step row pattern).

### ChatThread · ChatUnreadDivider
- **Thread**: a scrolling column, 16 padding, 24 between messages, so each reads as its own turn; a system line
  keeps 16 to its neighbours (its own 12 of padding sets it apart). Opens at the latest and follows new ones
  while the reader is at the end. Empty: 13 `neutral-600` centred, max 288 wide.
- **Thread, own messages**: the thread tells one's own messages (for following the end and the reader's own
  send) by `variant="own"` or a `data-own` marker on each child; a wrapper round ChatMessage forwards both the
  `variant` and the `data-enter` the thread gives it, or a new message will not rise in.
- **Thread, loading**: while its first messages load, a skeleton of three message rows stands in, sitting at the
  foot, each with the message's own padding so it is as tall as the message that replaces it. Others' rows are the bordered card with a 24 round block, a 10 name bar 80 wide and two or three 10
  lines; one's own rows are the tint with one or two lines at 3/4 width. The blocks are Skeletons; the thread is busy (`aria-busy`).
- **Thread, earlier messages**: while earlier messages load, a row heads the thread: a 12 spinner in
  `neutral-500`, gap 8, "Loading earlier messages" 13 `neutral-600`, 4 vertical padding, announced once as a
  status. It is asked for when the reader comes within 48 of the top; the message being read keeps its place
  when the history goes in above it.
- **Thread, new messages**: a message added after the thread has loaded rises 8 while fading in, 200
  `ease-out-strong`; reduced motion turns it off. The history it opened with, and earlier history added at the
  top, never animate. Sending one's own message always takes the reader to the end.
- **Jump to latest**: when the reader has scrolled back and messages arrive, a secondary pill button (34, a 16
  arrow-down, "N new messages") floats 12 above the foot of the thread, centred, with the `float` shadow. It
  fades in while rising 4 (fade only under reduced motion), is not announced itself (the messages are), and
  takes the reader back to the end, smoothly unless reduced motion is on.
- **Unread divider**: a 1 `neutral-200` hairline either side of a centred 11 label in `neutral-600` ("New
  messages"), gap 12, 20 from the messages, above the first unseen message. Quiet, as a place in the thread
  and not news itself; neutral, never the action colour.

### ChatMessage · ChatEvent
- **Message**: `card` corners (16), 16 round the content, the body 13 keeping line breaks and wrapping anywhere
  (a run of emoji or a long id breaks inside, never widens it). Both variants share one layout: a header row
  across the top when there is one (24 round avatar, the author 13/500, a badge, gap 8, and its stats at the right), then two columns side
  by side, the words and the meta 8 apart, the meta at the foot of its column 12 from the right and 10 from the
  bottom, so the words never run under it however long they get; rows 8 apart. Only the time and its tick sit
  beside the words: a failed message's meta ("Not sent · Retry · time") takes its own row under the words, at
  the right, still 12 from the right and 10 from the bottom. `own`: the tint wash, no border, at the right, as
  wide as its words up to 2/3 of the thread. `other`: the surface with a hairline, at the left, the thread's
  width. The meta: 11 `neutral-600` tabular, gap 4, a 12 status icon before the time (sending, sent,
  delivered, read in `neutral-950`, failed in `error-500`).
- **Message delivery**: the tick crossfades between states: the outgoing glyph fades out and the incoming one
  fades in from 80% scale, 200 `ease-out-strong`, while read darkens from `neutral-500` to `neutral-950` over
  150; reduced motion swaps them at once. A failed message says "Not sent" in `error-600` after its error icon,
  then " · Retry" as an 11/500 text button in `neutral-950` (underlined on hover), then " · " and the time.
- **Stats** (`stats`, `ChatMessageStat`): **when** the reader should know what a message drew on, mostly an AI
  participant's reply (how sure it is, how many files it read, whose profile it looked at): at the header's
  right, each a 12 icon in `neutral-500` and a figure 11 `neutral-600` tabular, gap 4, a `neutral-400` "·" 6
  either side between them; a figure needs a name, so each is named in its tooltip and read before it. Never
  on one's own messages.
- **Pending reply**: a reply still being written (a person or a bot in the chat) shows three 6 dots 4 apart in `neutral-600` in
  place of its words, or 6 after the words while they stream, and is busy (`aria-busy`).
- `status` on a message is its delivery (sending, sent, delivered, read, failed); on ChatAttachment and
  ChatReference it is a node, usually a badge, at the end.
- **Attached** (`attached`): what goes with a message (its files, a record it links, or both, files first) hangs
  under it, 6 apart, and the two are one group: the same side, the same width (the wider of the words and what is
  attached, up to 2/3 for one's own), a linked record taking the message's `card` corners. Never the thread's
  next item, which would sit 24 away at the thread's width and read as a message of its own.
- **Event**: a centred quiet line 13 `neutral-600` with 12 vertical padding ("Joan closed the ticket · 09:14").

### ChatTyping
- **Typing**: a row above the composer, in its `typing` slot: 24 high, 6 above it and 8 clear of the box, at
  the box's left edge, held whether anyone types or not, so the box never moves; never inside the thread. Up to
  three 24 round avatars, each over the last by 10, ringed 1 in `neutral-950` at 10% (no border); gap 8; then
  who is typing, 13 `neutral-600`, truncated ("Maya is typing"); gap 8; then the pill: 24 high, fully round,
  the surface with a hairline, 8 side, holding three 4 dots 2 apart in `neutral-600` (16 wide). Other wording
  goes in `text` (`label` is the old name). A product that wants the faces alone turns the words off; they are still read out. The dots pulse in turn (1.2s, 160 apart) and stay still under reduced
  motion. The row fades in while settling 4, 200 `ease-out-strong` (at once under reduced motion), and fades out
  the same way. Only its words are announced (polite, atomic), once per change of people. The line: one name "Maya
  is typing"; two "Maya and Liam are typing"; three "Maya, Liam and Noor are typing"; four "Maya, Liam and 2 others
  are typing"; five or more "5 people are typing".

### ChatToken · ChatReference
- **Token**: a mono 11 chip with `chip` corners, 6 side, 2 vertical, `neutral-500` at 20% behind `neutral-800`
  by default (a reference is not a state), `primary` only to mark one the reader must act on, inline in a message. **Reference**: a record dropped in: min 48 high, `control` corners (`card` under its message), hairline,
  surface, 12 side, gap 12: the token, a fact 13 tabular, a status at the end; hover border `neutral-300` when it
  opens the record.

### ChatAttachment · ChatAttachments
- **Attachment** (`ChatAttachment` · `ChatAttachments`): a file going with a message. `file`: 48 high, `item`
  corners, hairline, surface, 4 inset: a 40 well with `chip` corners and a 20 file icon, tinted by kind (a PDF the
  error tone, others neutral: the ramp's 500 at 20%, its 800), gap 10, the name 13/500 over its extension 11
  `neutral-600`, both truncated, max 288 wide (sized to sit with 13 messages); the name cuts in the middle (Truncate). `image`: a 48 square thumbnail, `item` corners, hairline. Both are
  48 high round a row (40) well. While waiting in the composer each is removable: a ghost 28 × at the
  file's end, a 20 round chip (surface, hairline, 12 ×) on the image's top right corner; each named "Remove
  <name>". `record`, a linked record (an application, an invoice), drawn in ChatReference's shape so it keeps one
  shape waiting and in the thread: a line of its own at the row's full width, min 48 high, `control` corners,
  hairline, surface, 12 left, gap 12: a 16 icon in `neutral-600`, its kind 13/500 ("Application"), its token, the
  status badge at the end, then the ghost 28 × (4 right). The row (`ChatAttachments`): 8 apart, wrapping; above
  the composer's box while it waits, under a sent message in its `attached`, on the message's side, `variant` `own` (at
  the right) or `other` (`align` end / start is the same).

### MessageComposer · MessageComposerAttachItem
- **Composer**: a box `control-xl` (48) high at one line, a cell row in 8 of room: corners `item` + 4 (14), not
  the padding's full 8, so box and button read as one shape and square off together at corner scale 0; a
  hairline in `neutral-100` (`neutral-200` on hover and focus, the focus ring round the box), the surface, the
  `composer` shadow (a soft lift, deeper in dark), 8 left and vertical, 10 right. In it: the attach button, a cell
  (32) square with `item` corners filled in the action colour with a 16 plus, named "Attach" (`attachLabel`;
  `addLabel` is the old name), which opens the file picker (`onAttach(files)`, `accept`), calls `onAdd`, or, when
  more than files can go, opens a menu (`attachMenu`, below); `attach` replaces the button outright (`start` is
  the old name); gap 12; a borderless textarea (min 32, max 160 then scrolls, 13 `neutral-900`, placeholder
  `neutral-600` for contrast, "Write a message"); the send, named "Send", a quiet cell (32) ghost button with a 20
  arrow-up in `neutral-600`, dimmed until there is text or a file. The two emphases are on purpose: in a
  person's chat, adding something is the box's one filled control and the send stays quiet beside it; an
  assistant's question (AssistantPrompt) is the page's one action, so there the send is the filled one. A press
  anywhere on the box that is not a button lands in the text. The box only ever holds the line of text:
  what waits to go (files, images, linked records) sits in a row 8 above it, never inside. From the top: who else
  is typing, then what waits, then the box, so the box never moves when someone starts typing. Enter sends,
  Shift+Enter breaks a line. The box keeps 12 above it without a typing row and 24 under it at the page's foot.
- **Composer menu**: the "+" opens a menu above it, its left edge on the button's, 8 clear, at least 192 wide, of
  the menu's rows, each a 16 icon and a label ("Add attachments", "Link invoice", "Link application", "Ask the
  assistant"); "Add attachments" opens the file picker. The button keeps its name "Attach"; Enter, Space and the
  arrows open it, picking a row puts the caret back in the text, and Escape closes it back onto the "+".

### ChatSuggestions · ChatSuggestion
- **Suggestions**: while a reference is typed after "#" (or "@"), a panel
  floats 8 above the box, over what is there, at the box's full width: the box's corners (14), hairline, surface,
  the `float` shadow, 4 inset; a title 11/500 `neutral-600` ("Recent applications"), then popup rows (36, a 16
  icon, the label, the meta in `neutral-600`; corners `item` − 1, concentric inside the panel), at most 240 then scrolling. It rises 4 as it fades in, 150
  `ease-out-strong`. The caret stays in the text: the arrows move the active row (the 5% wash), Enter or Tab picks
  it (the typed "#a" becomes the record's token and a space), Escape or leaving the text closes it until a new "#"
  is typed. The text points at the list and its active row (a listbox of options). Sent, the token is a chip.

## Assistant

Asking the product a question, and its answers: the assistant page kind (`pages.md`), a sheet that asks about
the record it opens over. The thread is ChatThread, as it scrolls and follows the same way; the question is
one's own ChatMessage; the answer and the prompt are the assistant's own. **For** an assistant the reader asks.
**Not for** a conversation with people, an AI agent among them (the Chat parts above).

### AssistantAnswer · AssistantAnswerStep · AssistantAnswerAction
- **Answer**: the assistant's answer to one question, never a message: no card, avatar, author or time, open
  in the conversation column at its full width, starting on its text edge. So it can hold what the product
  draws elsewhere (stat cards, a chart card, a table, a list) as well as words, each a block 16 apart; the
  words 13 `neutral-950`, lists with their markers inside the text edge (20 indent, items 4 apart). From the
  top: what it did, the answer, what can be done with it. The question before it is one's own ChatMessage.
- **Work** (`work`): above the answer, 16 over it, lines 8 apart. While it works, Thinking (named for what it
  is doing); once done, what it did as steps: a 16 icon in `neutral-500`, gap 8, the words 13 `neutral-600`,
  truncated ("Read bounce rate by page", "12 sources used"). A step that opens what it names (the sources) is a
  button: it darkens to `neutral-950`, icon and words, on hover. **When** the reader would ask how it knows;
  a reply that only talks (a greeting) has none.
- **Actions** (`actions`): 8 under the answer, the first icon on the text edge: 24 square ghost buttons with a
  14 icon, 2 apart, each named in a tooltip: CopyButton, "Try again" (the last answer only), "Good answer" and
  "Bad answer", toggles that stay `neutral-950` while pressed (one turns the other off). Held back while the
  answer is pending, and on a greeting.
- **Writing**: while the words arrive, the answer is busy and ThinkingCaret follows the last word.

### Thinking · ThinkingCaret · ThinkingRun · ThinkingMark · ThinkingText
Which one goes by how long the wait is and what is already on screen. A person typing is ChatTyping; a button
that is busy is the Spinner; a page loading is skeletons.
- **Thinking**: the mark in `neutral-950`, gap 8, a few words lit (`ThinkingText`), truncated ("Thinking",
  "Searching the docs").
  **When** an assistant has started but nothing of its answer exists yet and the wait is seconds: in a reply's
  place in the thread, beside a field it is filling, in a table cell it is working out. Name what it is doing
  when it knows ("Reading 3 invoices"), because a step named is a wait that feels shorter. The small size: the
  8 mark, gap 6, 11 type. A status: its words are read once, and again when they change.
- **Mark** (`ThinkingMark`): nine 3 squares 1 apart in a 3 by 3 grid (11 across; the small one 2 squares, 8
  across), in the text colour, with a wave rolling across them from the top left corner to the bottom right:
  each swells from 60% size and 20% opacity to full and back as the wave passes, a diagonal an eighth of the wave
  apart, 1.4s a wave, ease-in-out. Scale and opacity only, so it never shifts the line. Under reduced motion it
  rolls at 2.8s rather than stopping: a still mark reads as stuck. Decorative; the words beside it are read.
- **Lit words** (`ThinkingText`): words being worked on, with a band of light crossing them letter by letter
  every 2s, from `neutral-600` to `neutral-950` and back, so the words themselves say the work goes on. Still, in
  `neutral-600`, under reduced motion. **When** the words name what is being done now (the thinking line, a
  run's current step); never on words that are finished.
- **Caret** (`ThinkingCaret`): a 6 square, 1 corners, `neutral-950`, on the baseline 4 after the last word,
  swelling between full and 25% opacity, 1.2s each way, ease-in-out (2.4s under reduced motion). **When** the
  answer's words are arriving: it moves on with the text and goes when the last word is in. A square and not a
  bar, so it never reads as a caret the reader could type at. The message is busy while it shows; the caret is
  read once ("Writing") unless the message says so itself.
- **Run** (`ThinkingRun`): **when** the work takes tens of seconds or more (an agent working through steps), so
  the reader needs to see it is still going, how long it has taken and how to stop it. `card` corners, the
  surface with a hairline, 12 vertical, 16 left, 12 right, gap 12: the mark on the title's line, then the title
  13/500 `neutral-950` over the current step, lit, both truncated; the time since it began, 11
  `neutral-600` tabular ("42s", "3m 05s", "1h 12m"), counting each second; a secondary Stop button at the end.
  A light runs along the bottom hairline: a segment a quarter of the width, soft at both ends, `neutral-950`,
  crossing in 2.4s on a strong ease-in-out (`cubic-bezier(0.77, 0, 0.175, 1)`), so it moves while the step
  stays the same and rests off the edges between passes. Under reduced motion it stops crossing and the whole
  hairline swells in `neutral-400` instead. The title and step are a status (read as the step changes); the clock
  is not, or it would be read every second. When the run ends, the answer takes its place. **Steps**: when the
  run knows its steps, they list under the title on its text edge, 8 apart, in place of the step line: a done
  one with a 12 check in `neutral-500` and its words in `neutral-600`; the one it is on with the small mark and
  its words lit; the ones to come with a 4 square in `neutral-300` and words in `neutral-400`. **When** the run
  has three to six known steps; an open-ended one keeps the step line.

### AssistantPrompt
- **Prompt**: where a question to an assistant is written. A box whose corner nests round the buttons
  (`chip` + the padding: 14 at `lg`, 12 at `md`), hairline, surface: the textarea on top (borderless, `neutral-900`, placeholder `neutral-600`, "Ask anything…"),
  a foot under it: an optional menu at the left (a mode or model, a ghost 28 button), at the right a ghost 28
  attach (a 16 plus) and send, a 28 button in the action colour with a 16 arrow-up, all three on the `chip` corner so they read as one set (never a round send beside a square attach), 4 apart; the text 2
  above the foot. Attaching takes the composer's props with the same meaning: `onAttach(files)` and `accept` open
  the file picker, `onAdd` is called instead, `attachMenu` opens a menu, `attach` replaces the button. What waits
  to go (`attachments`, a ChatAttachments row) sits inside the box, above the text; a question can be sent with
  only an attachment. `lg`, an empty page's prompt: 8 padding, 14 text, 104 high empty, the text growing to 240 then
  scrolling. `md`, docked under a conversation: 6 padding, 13 text, 72 high. Send is dimmed while the box is empty; while a reply streams it
  becomes Stop (the same button with a filled 10 square) and Enter waits; pressing Stop puts the caret
  back in the text. Hover and focus take the border to
  `neutral-300`, with the focus ring round the box; a press anywhere on it that is not a button lands in the text.
