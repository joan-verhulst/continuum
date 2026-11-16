# Design

The UI is built with Continuum, a design system for tool UI, in the ContinuumUI theme. The look is quiet, dense and precise: 13px type, hairline borders, one action colour, almost no shadow, and controls on two heights, 34 and 38px, so anything beside anything lines up.

Use the `continuum-taste` skill for any UI work when it is installed: it holds the parts, the full values and page anatomy, and reference screens. This file holds what is particular to this project and the rules in brief, so they hold without it.

The values live in `src/app.css`; this file is how to use them. Write the utility (`bg-neutral-50`, `rounded-card`), never the value behind it.

## Setup

- `src/app.css` is the Tailwind entry and the whole theme, in Tailwind's own names: the colour ramps and roles, the font, the type scale, the radii, the shadows, the 4px spacing grid, the content widths and the fixed widths of panels and popups. It puts these in place of Tailwind's palette, type, radii and shadows, so Tailwind's defaults (`bg-gray-100`, `rounded-lg`) do not exist here.
- The components live in `src/components/continuum/`, copied from the skill's `assets/continuum/` with its folders as they are. They read the names `app.css` sets, so leave out the copied `styles/` folder: `app.css` takes its place. Import components from its `index.ts` and charts from `charts/index.ts`. In a new project, scaffold Vite, React 19, TypeScript and Tailwind v4 first.
- The app sits inside `<Theme mode="dark">`. Dark mode is `mode="dark"`: the same theme with every ramp reversed, from the `[data-mode="dark"]` block in `app.css`. Everything styled sits inside the `Theme`; portalled parts open it again on their own.
- Dependencies: `@base-ui/react class-variance-authority clsx tailwind-merge lucide-react react-day-picker`, and `@fontsource-variable/geist`, imported in the entry script. The charts need nothing more.

## The theme

| | |
| --- | --- |
| Accent | `#ffa31a`, the primary ramp's 500; its other ten steps are built from it the way Tailwind builds its palette |
| Gamut | Display P3, as Tailwind's palette: the ramps are `oklch()` values, and a screen that cannot show one shows the nearest it can |
| Action | the accent: it fills the primary button, checked controls and the active rail item |
| Shine | flat |
| Font | Geist |
| Corners | 150% of the drawn radii |
| Type | default: 13px base, every size on the scale following it, rounded to whole pixels |
| Padding | default: a 4px spacing unit, so p-3 is 12px; every padding, gap and margin is a multiple of it, rounded to whole pixels. Pick the classes with the padding formula as ever |
| Heights | default: controls 34 and 38px, table rows 41px |
| Greys | tinted: hue 232, chroma 0.004 at the 500 |
| Selection | a translucent grey wash |
| Sidebar | the page you are on on the grey wash; the foldouts that hold it stay plain, their guide line darkened to it |
| Shadows | flat: only what floats casts a shadow |
| Dock | full pills |
| Data colours | the primary leads; square hues complete the set, each at the step that keeps neighbours apart for every reader, in light and in dark |

To change the look, change the values in `app.css`, and their dark counterparts in the `[data-mode="dark"]` block with them, or build the theme again in the Continuum playground and export it. Components never name a theme: anything that should differ per product is a token, never a one-off class.

## Rules

The short form. The full statement, in units, is the skill's `references/foundations.md` (the values) and `references/pages.md` (the composition); `components.md` and `patterns.md` say which part does what.

### Colour

- Only roles: the `neutral`, `primary`, `success`, `warning` and `error` ramps, steps 50 to 950. Never hex values, `bg-white` or `dark:` variants: dark mode flips every ramp, so `neutral-50` is the surface in both.
- By step: `neutral-50` the surface (panels, cards, dialogs, inputs), `neutral-100` the canvas behind the panel and muted fills inside a bordered container, `neutral-200` every hairline, `neutral-300` an unchecked box's border, `neutral-500` quiet icons and the focus ring, `neutral-600` secondary text, placeholders, hints and icons, `neutral-950` primary text. Text that is read never sits on `neutral-500`: it misses 4.5:1.
- One action colour, `bg-action text-on-action`, for the primary button, checked controls, the active rail item and the selected dock item. One primary action per view, and nothing decorative.
- Selection is a wash, not a colour: `bg-neutral-950/5` on hover (a table row `/3`), `bg-selected` (7%) on what is current, selected or open, `bg-tint text-tint-fg` where it should be coloured.
- Status colours only in badges, deltas, dots, icon tiles and invalid states, as two colours from one ramp: `bg-success-500/20 text-success-800`, the 800 for every tone. A rising delta is `text-success-800`, a falling one `text-error-600`. Never a solid `-100` fill, never an outline, never a coloured row.
- Data takes `chart-1` to `chart-5` for steps in order, the `chart-series-*` set for independent series. Label what a colour marks: never colour alone.

### Type

- `text-xs` (13px) is the base, for body, controls, input values, labels and cells; `text-xxs` (11) for badges, counts and meta; `text-sm` (14) for overlay titles and a page's description line; `text-base` (16) section titles; `text-lg` (18) KPI values; `text-2xl` (24) page titles. Line height 1.25 times the size and letter spacing 0.33px come with the classes.
- Two weights, `font-normal` and `font-medium`. No semibold or bold, no all caps. Sentence case; buttons are verb + object.
- Hierarchy through colour and weight, not size: labels quiet in `neutral-600`, data loud in `neutral-950` at medium.
- Numbers `tabular-nums`, right-aligned in tables. Text that overflows truncates; it does not wrap or grow the control.

### Surfaces

- Hairlines over shadows: a card is `border border-neutral-200` on the page's own colour. `shadow-float` only on what floats (menus, popovers, the dock, toolbars), `shadow-sheet` on dialogs and sheets.
- Space, not dividers, between sections and groups. A divider only between the rows of a bordered list or table, and full width in dialogs, sheets and menus. No card inside a card (except a highlighted item inside a group), no card round a header.
- The radii nest, each smaller than what holds it: `rounded-panel` (28), `rounded-card` (24), `rounded-control` (18), `rounded-item` (15), `rounded-chip` (9); dock and pills round. Something inset in a rounded container takes its radius less the inset: `rounded-[calc(var(--radius-item)-2px)]` in a `p-0.5` track. Never `rounded-md` or `rounded-lg`, which do not exist here.

### Pages

- The shell: `AppShell` on the `neutral-100` canvas, the `Sidebar` (256) straight on it, an `AppPanel` inset 8px, a 54px `HeaderBar` with the page's breadcrumb, then a centred `PageContent` column 96px below it (128 on a large screen); never pass a smaller top padding. The sidebar holds places, not a create button; a product with several workspaces switches them with a `SidebarSwitcher` under the sidebar's header; every page has its breadcrumb.
- Width by kind: `max-w-content-narrow` (640) for making or editing one thing and for settings, `max-w-content` (896) for an overview, a detail or a document, `max-w-content-wide` (1080) for a table of several columns, `max-w-content-dense` (1280) for a very dense one. Never edge to edge unless asked.
- A panel, popup or fixed column takes its width token, in pixels whatever the spacing unit: `w-sidebar` (256), `w-rail` and `w-rail-open`, `w-popover` (288), `min-w-menu` (160), `w-toast` (360), `max-w-tooltip` (256), `w-search` (256), `max-w-measure` (480) for a quiet message. Never a numeric width such as `w-64` for these: it follows the spacing unit.
- The page head: a 24 medium title, a 14 `neutral-600` line `gap-1.5` below it, the page's own actions at its right; `gap-10` (40) to the first section. A section: a 16 medium title over a 13 line, `gap-5` (20) to its content; sections `gap-10` apart, never divided.
- **Overview**: the period in the head; the leading figure as a chart card; stat cards (label, 18 value, delta pill) that never repeat it; then breakdowns in list cards. No create action.
- **Index**: a toolbar (search, segmented control, selects or a Filter button) that never moves; applied filters as removable chips in a row below it; a ruled `Table`; `Pagination`; the list's views and its one primary action in the floating `Dock` at the panel's foot, never as tabs above the table. A row opens the item's own page; never a pane beside the list.
- **Detail**: one column, never split. The title row (avatar, name, status badge, meta line, actions right), line `Tabs` for facets (pill tabs only in a tight spot inside a card or dialog), stat cards, facts as label-over-value pairs in a card grid, the rest; history in a `Sheet`.
- **Create or edit**: fields stacked one per row `gap-5` apart in sections `gap-10` apart, the primary at the end. While editing an existing object it moves up: into the `Dock` as its action when the editor has facets (its views), otherwise into the title row. Never wider than 640.
- **Settings**: one `Card layout="list"` per group under a quiet `SettingGroup` title, cards `gap-6` apart; `SettingRow`s with **one control per setting** (a `Switch` to turn on, a `Select indicator="right"` to pick, a `Button` to do); rows divided by a hairline at the card's content width (a `Separator` between rows), a dependent setting sharing its parent's space between hairlines (no rule between them, disabled while the parent is off; an eyebrow over several dependents), never closeness alone; the settings areas in the floating dock.
- **Assistant**: empty, a large `ChatPrompt` in a `max-w-conversation` (720) column with the recent chats under it as quiet rows (the title, its age at the right); once asked, a `ChatThread` in that column and the prompt (`size="md"`) docked at the panel's foot. The chat is the trail's last crumb, a `BreadcrumbMenu` with New chat and the recent ones.
- Controls sit on 34px (buttons, small inputs, nav items) or 38px (fields, large buttons, the dock), nothing between: `h-control` and `h-control-lg`, never a height in pixels.
- **Narrow**, measured on the shell, not the screen (`@max-shell-sidebar/shell:` under 1024, `@max-shell-compact/shell:` under 640); a part answers to its own container, only overlays to the screen. Under 1024 the sidebar becomes a drawer behind a toggle at the header bar's far left, and the bar's actions hide; under 640 the column 16px in and 40px down. Never a rail on a phone.
- A row of controls never wraps: it scrolls (tabs, the dock, a toolbar, a table), hides (header and secondary actions, the results line, counts, `optional` table columns) or stacks (the page head, stat cards two across, card pairs one column, facts two across); never a "⋯" menu. Fold only what cannot go: pagination to ‹ 3 of 25 ›, more than four segments to a `Select`, an index's selects into its Filter button. On touch (`pointer-coarse:`) a field that takes typing is 16px, targets reach 44px, nothing hides behind hover and keyboard hints go.

### Spacing

- The 4px grid, and tight: `gap-0.5` between nav items, `gap-1.5` to `gap-2` inside controls, `gap-4` between rows and cards, `gap-5` from a section head to its content, `gap-10` between sections.
- A control's side padding is fixed by kind (`px-4` on a button, `px-3` on an input or a menu row, `px-2.5` on a nav row, `px-2` on a chip, `px-1.5` on a badge). Padding in boxes that hold content, and the gaps between texts, are derived, not picked: a box pads by its type size averaged over its lines (`0.75 × size × (1 + 0.6·log₂ lines)`), a box of boxes at least 1.5× its children, the gap between boxes 1.1× their padding, the gap between two texts by the text after it, 0.25× for a pair and 1.5× between blocks. Snap every result to a Tailwind step, never an arbitrary value. The `continuum-fix-padding` skill works it out and applies it.

### Icons and motion

- `lucide-react` at `strokeWidth={2}`: 16px, 12px in badges and chips, in the colour of the text.
- Colour changes take `duration-150` on the properties named, never `transition-all`. Entries take `duration-200 ease-out-strong` from `opacity-0` and a small move or scale. A control's response stays at or under 250ms; a large surface entering or changing size (the rail's width, a toast, a sheet) may take up to 400ms. Nothing bouncy, and `motion-reduce:transition-none`.

## Before finishing

Components first; only roles; hairlines, not shadows; space, not dividers; width by kind; one column on a detail, a form and settings; views in the dock; heights on 34 or 38; two weights; one action colour and one primary action; a visible focus ring; everything inside the `Theme`. Look at every screen at 1440 and at 390, in light and in dark, before calling it done.
