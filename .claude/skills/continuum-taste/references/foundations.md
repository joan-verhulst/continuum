# Foundations

The values Continuum is made of, in units: pixels, hex, weights, milliseconds. They hold in any medium. Where a
value has a name (`neutral-200`, `radius-item`), that is the system's name for it; how the name is written in a
given medium (a Tailwind class, a Paper token, a CSS variable) is in `media/`. Nothing here depends on the
components existing.

Two settings to know first: everything sits in **light** or **dark** mode, and every colour ramp reads back to
front in dark, so a role keeps its name and swaps its value. And every corner follows one **corner scale**, so a
product can square or round the whole system at once.

## Colour

### The ramps

Five ramps of eleven steps, 50 to 950. The neutral ramp is pure grey by default; a theme may tint it. The
four chromatic ramps are built on one lightness curve from their 500, so they step alike and an accent built the
same way sits beside them without a seam.

| Step | neutral   | primary   | success   | warning   | error     |
| ---- | --------- | --------- | --------- | --------- | --------- |
| 50   | `#f8f8f8` | `#f2f5ff` | `#f1f7ee` | `#faf4ee` | `#fff2ef` |
| 100  | `#ededed` | `#dee6ff` | `#e7f5e0` | `#fbeddf` | `#ffe4de` |
| 200  | `#d2d2d2` | `#bdccfe` | `#d6f1c9` | `#fce1c6` | `#ffcdc3` |
| 300  | `#b3b3b3` | `#91a7fe` | `#bceca4` | `#ffcfa0` | `#ffab9a` |
| 400  | `#9a9a9a` | `#596ff4` | `#98e26d` | `#ffb567` | `#ff7259` |
| 500  | `#818181` | `#3939e5` | `#7cd93a` | `#fca131` | `#f53e20` |
| 600  | `#676767` | `#3218e0` | `#5db500` | `#d68200` | `#d62400` |
| 700  | `#484848` | `#2a16c4` | `#4a9300` | `#ae6900` | `#b41c00` |
| 800  | `#2a2a2a` | `#23219f` | `#397400` | `#8a5200` | `#941600` |
| 900  | `#181818` | `#20267f` | `#2e5d04` | `#704201` | `#791a0b` |
| 950  | `#0d0d0d` | `#171e52` | `#122d00` | `#381e00` | `#461007` |

**Dark mode reverses each ramp**: `neutral-50` becomes `#0d0d0d`, `neutral-950` becomes `#f8f8f8`, `neutral-200`
becomes `#2a2a2a`, and so on, step *n* taking the value of step *1000 − n*; 500 stays. The same for the four
chromatic ramps. So a role is always named by its light step, and the value follows the mode.

### Roles

Use a step by what it means, never by how it looks:

| Role                                                      | Name          | Light     | Dark      |
| --------------------------------------------------------- | ------------- | --------- | --------- |
| Surface: panels, cards, dialogs, floating bars, inputs    | `neutral-50`  | `#f8f8f8` | `#0d0d0d` |
| Canvas behind the panel; muted fills *inside* a bordered container (a table header, a group row) | `neutral-100` | `#ededed` | `#181818` |
| The hairline: every border and every divider              | `neutral-200` | `#d2d2d2` | `#2a2a2a` |
| A plain field's hover border; a switch's off track; an unchecked mark's border (checkbox, radio, a menu row's indicator) | `neutral-300` | `#b3b3b3` | `#484848` |
| Disabled helper text; decorative marks (a breadcrumb's home and separators); a calendar's days outside the month; an unchecked mark's hover border | `neutral-400` | `#9a9a9a` | `#676767` |
| The focus ring; quiet icons | `neutral-500` | `#818181` | `#818181` |
| Secondary text, card titles, idle controls, default icons; **and every quieter text**: placeholders, hints, helper text, muted labels, eyebrows, timestamps, counts | `neutral-600` | `#676767` | `#9a9a9a` |
| Quieter body text; a footer label                         | `neutral-700` | `#484848` | `#b3b3b3` |
| Ghost text on hover                                       | `neutral-800` | `#2a2a2a` | `#d2d2d2` |
| An input's value, a table cell                            | `neutral-900` | `#181818` | `#ededed` |
| Primary text, titles, the active nav item                 | `neutral-950` | `#0d0d0d` | `#f8f8f8` |

**Contrast sets the lightest step a role may take.** Text that is read needs 4.5:1 on the surface and on the
canvas; `neutral-500` gives 3.67 on the surface and 3.33 on the canvas, so it is never text, and `neutral-600`
(5.33 on the surface) is the lightest text there is. Hints, placeholders and helper text share the secondary
step with descriptions: they are told apart by size and place, not by a paler grey. An icon that alone carries
a meaning and the focus ring need 3:1, which `neutral-500` gives (3.67). A control's own outline or track (an
unchecked mark's border, a switch's off track) is a shape, not something read: it has to be seen, about 1.5:1,
which `neutral-300` gives (1.97). A hairline is meant to be faint and is held to nothing.
Disabled text is exempt (it sits at 50%, or in `neutral-400` for a disabled helper). In dark the ramps reverse
and every role passes at the same step.

The hairline is **1px** of `neutral-200`, always. There is no second border weight and no second border colour
except on hover (`neutral-300`), in an invalid state (`error-500`) and on an **unchecked mark** (a checkbox, a
radio, a menu row's indicator: `neutral-300`, `neutral-400` on hover), one step over the hairline, so an empty
box stands a little clearer than a field's edge and still sits with the fields. A plain field's border is the
hairline: its label and placeholder say it is a field.

### The action colour

One colour does everything that acts: the primary button, a checked checkbox or switch, the active rail item, the
selected dock item, the logo mark.

| Name          | Default value                     | Dark      |
| ------------- | --------------------------------- | --------- |
| `action`      | `neutral-950` → `#0d0d0d`         | `#f8f8f8` |
| `action-hover`| `neutral-900` → `#181818`         | `#ededed` |
| `on-action`   | `neutral-50` → `#f8f8f8`          | `#0d0d0d` |

A theme may move `action` to its accent (`primary-500`), and may add a *lit* look (a 1px inner highlight on top
and a 1px ring) or a *glossy* one (a gradient as well). The default is flat: no highlight, no ring, no shadow.
Nothing else is ever this colour. **One primary action per view.**

### Washes: selection and hover are translucent

What is hovered, current or selected takes a wash of `neutral-950` at a small opacity, not a colour, so it reads
on the surface and on the canvas alike:

| State                                                                 | Wash                    |
| --------------------------------------------------------------------- | ----------------------- |
| Hover on a row, item or ghost button                                  | `neutral-950` at **5%** |
| Hover on a table row                                                  | `neutral-950` at **3%** |
| Current, selected or open: the page in the nav, a chosen row, a menu whose trigger is open (`selected`); always grey | `neutral-950` at **7%** |
| The tint: an active pill tab, an own chat message, a cell being edited (`tint`), text `tint-fg` = `neutral-950`; the one wash a theme may colour (the accent's palest step) | `neutral-950` at **7%** |
| A fill that may land on the canvas (a `rows` table cell, a thumbnail well) | `neutral-950` at **4%** |

A solid `neutral-100` fill vanishes on the canvas, so it is only for fills inside a bordered container. A theme
may make the tint the accent's palest step instead.

### Status colour

Only in badges, deltas, status dots, icon tiles, meters near a limit, and invalid states. Never on a whole row,
never for emphasis. `primary` means information and the assistant (a scheduled badge, the AI chip), not
importance.

| Use                                | Recipe                                                             |
| ---------------------------------- | ------------------------------------------------------------------ |
| A badge, tinted chip, status label, a toast's or a chat token's tone | fill: the ramp's **500 at 20%**; text: the ramp's **800**, for every tone. Filled, never outlined |
| An icon, on that tint or on the surface | the ramp's **600** where it reaches 3:1 (`primary`, `error`), else **700** (`success`, `warning`: the pale green and amber) |
| A dot or a solid fill              | **500**                                                            |
| A delta                            | rising `success-800` `#397400`; falling `error-600` `#d62400`      |
| Error text (an invalid helper, a danger row) | `error-600` `#d62400`                                    |
| An invalid border                  | `error-500` `#f53e20`                                              |

The 20% fill adapts to whatever it sits on, light or dark; a solid 100 fill would not. The steps are the
smallest whole ones that pass: tone text on its tint needs 4.5:1, which the 700 misses for `success` (3.25) and
`warning` (3.59) and the 800 gives every tone (4.8 and up), so all badges keep one rule; a rising delta in
`success-700` would still miss on the surface (3.62), so it is the 800 (5.38), while `error-600` passes (4.81).
An icon needs 3:1 against what it sits on, so it keeps the lighter step where that reaches it. Tones: draft `neutral`,
waiting on someone `warning`, scheduled or informational `primary`, done or live `success`, failed `error`.

### Focus

A **2px** outline, **2px** outside the element (inside a clipping container, 2px inside it), in `neutral-500`
in light and dark (3.67 on the surface, past the 3:1 a focus indicator needs). Only on keyboard focus.

### Shadows

Two, and only on what floats:

| Name    | Light                                 | Dark                              | On                                         |
| ------- | ------------------------------------- | --------------------------------- | ------------------------------------------ |
| `float` | `1px 1px 4px rgb(20 22 23 / 0.10)`    | `1px 1px 4px rgb(0 0 0 / 0.40)`   | the dock, floating toolbars, menus, popovers, a slider knob |
| `sheet` | `0 2px 4px rgb(20 22 23 / 0.10)`      | `0 2px 8px rgb(0 0 0 / 0.50)`     | dialogs, sheets, the sidebar as a drawer   |

Never on a card, a button, an icon button or a selected segment, unless the theme's `elevation` is `full`: then cards and table frames take `shadow-card` (the app panel stays flat) and the controls on them `shadow-control`, both short and faint. A scrim behind a dialog or the sidebar's drawer
is `black` at 40% and does not flip with the mode.

### Data colours

Steps in order (a funnel, shades of one measure) walk `chart-1` to `chart-5`; independent series take
`chart-series-1` to `chart-series-5`. Neighbours stay apart for colour-blind readers.

| Name       | Light                     | Dark                      |
| ---------- | ------------------------- | ------------------------- |
| `chart-1`  | `primary-500` `#3939e5`   | `#596ff4`                 |
| `chart-2`  | `#eb6834`                 | `#d95926`                 |
| `chart-3`  | `#1baf7a`                 | `#199e70`                 |
| `chart-4`  | `#d4a800`                 | `#c98500`                 |
| `chart-5`  | `primary-600` `#3218e0`   | `#91a7fe`                 |
| `chart-series-1…4` | `chart-1…4`       |                           |
| `chart-series-5` | `neutral-400`       |                           |

Shades of one series are the same colour at 80% and 33%. Chart chrome is the neutral ramp: grid `neutral-200`,
labels `neutral-600`, crosshair `neutral-300`, a highlighted range the 5% wash. An accent theme leads with its
accent in place of `primary`.

### Avatar tones

Six hues at one lightness and chroma, so no person is louder than another: blue 250°, violet 295°, rose 10°,
amber 75°, teal 190°, green 145°. Each is a pale fill with a deep ink of the same hue, in oklch:

| Part | Light (L C)   | Dark (L C)    |
| ---- | ------------- | ------------- |
| fill | `0.95 0.025`  | `0.31 0.04`   |
| ink  | `0.47 0.09`   | `0.86 0.06`   |
| line | `0.89 0.04`   | `0.38 0.045`  |

### Never

Hex values in a design or a component (every colour is a role); a white or black that is not a ramp step; a
second accent; status colour for emphasis; a solid 100 fill on something that may sit on the canvas; a border
darker than the hairline.

## Type

### Family

**Geist** by default. A theme may pick Inter, Instrument Sans, IBM Plex Sans or Figtree, or name a family of
its own. Monospace is the platform's (`ui-monospace`, SFMono, Menlo). Fonts are loaded by the project; the
system only names them.

### Scale

Line height is **1.25** throughout; tracking **0.32px** throughout, at every size. Sizes are fixed pixels.

| Name   | Size | Line | For                                                                                   |
| ------ | ---- | ---- | ------------------------------------------------------------------------------------- |
| `xxs`  | 11   | 13.75 | badges, counts, kbd, tooltips, hints, meta under a name, a sidebar group label      |
| `xs`   | 13   | 16.25 | **the base**: body, controls, inputs and their values, labels, table cells, nav items, descriptions |
| `sm`   | 14   | 17.5 | dialog and sheet titles, option labels, project-level nav items, a page's description line |
| `base` | 16   | 20   | section titles                                                                        |
| `lg`   | 18   | 22.5 | a KPI value, a block or sheet heading                                                 |
| `xl`   | 20   | 25   | rarely: a secondary headline figure                                                   |
| `2xl`  | 24   | 30   | page titles, a chart card's headline figure                                           |
| `3xl`  | 31   | 38.75 | a leading chart headline                                                             |

Anything above `3xl` is marketing, not tool UI: the tokens carry `4xl` to `6xl` for such pages, and tool UI
stops at `3xl`. Most of a screen is `xs`; a screen with many sizes is wrong.

### Weight and hierarchy

- **Two weights**: `normal` (400) and `medium` (500). Never semibold or bold, never all caps.
- Hierarchy comes from **colour and weight, not size**: a card title is `normal` `neutral-600` at 13; its value
  is `medium` `neutral-950`. Labels quiet, data loud. A section title is `medium` at 16; a page title `medium` at
  24.
- A control's label is 13 `medium` at every height; a bigger control has more padding, not bigger text.
- An input's value is 13, like the page: a field reads as part of the page, not louder than it.
- Numbers are **tabular**, right-aligned in tables; a value and its delta share a baseline.
- Text that overflows **truncates** with an ellipsis; it never wraps a control or grows it.
- **Copy** is sentence case. Buttons are verb + object ("Add email", "Generate report"). Descriptions are one
  sentence, no full stop needed under a title; under a section head, one or two sentences with full stops.

## Surfaces and depth

- **Hairlines over shadows.** Cards, inputs, tables, panels and the sidebar's panel are all the surface colour
  with a 1px `neutral-200` border. They are told apart by the line alone.
- **Space, not dividers.** Sections, groups and a header and its body are separated by distance. A divider is
  kept only where nothing else can mark an edge: rows inside a table or list that is itself a bordered
  container (a table, a description list, the settings in a group card), the parts of a floating container, the
  header bar the page scrolls under. Inside a card the rule runs at the content's width; in a floating
  container, full width. On a page: no line
  between sections, no line under a page title. Line tabs sit on a hairline of their own, which is their
  track, not a divider.
- **A group is marked, never implied.** Things that belong together are shown to by one of three means: a
  hairline between them and their neighbours, a container around them, or an eyebrow (a small quiet title)
  over them. Closeness alone, a tighter gap, is not a group: it reads as a mistake in the rhythm. A container
  never sits inside a container, so inside a card the mark is a hairline or an eyebrow.
- **Dividers in floating containers** (dialogs, sheets, popovers, menus) run **full width**, edge to edge, never
  inset by the container's padding.
- **No card inside a card** as a general rule: a sheet or dialog holds its parts with space and full-width rules.
  A card is for a self-contained unit (a KPI, a chart, a group of settings). The one exception is a highlighted
  item inside a group, such as the plan in force inside a billing group.
- Floating things (dock, toolbar, menu, popover) are the surface colour with a hairline and the `float` shadow.

## Radius

Corners nest, each smaller than what holds it: **panel ⊃ card ⊃ control ⊃ item ⊃ chip**.

| Name      | Value   | On                                                                            |
| --------- | ------- | ----------------------------------------------------------------------------- |
| `chip`    | 6px     | badges, checkboxes, icon tiles, small chips, code blocks                       |
| `item`    | 10px    | nav items, menu and list rows, cards inside a list, kanban cards, media tiles |
| `control` | 12px    | buttons, inputs, selects, segmented tracks, the ruled table's frame           |
| `card`    | 16px    | cards, dialogs                                                                |
| `panel`   | 20px    | the app panel, sheets                                                         |
| `dock`    | 26px    | the dock, the rail, dock actions: a full pill on 38 or 52px                   |
| `pill`    | 12.5px  | chips and delta pills: a full pill at 25px                                    |
| `xs`      | 4px     | a tiny inner corner (a progress bar's fill)                                   |
| `full`    | round   | avatars, status dots, switch tracks and knobs, radio buttons                  |

An element **inset in a rounded container takes the container's radius minus the inset**, so the curves stay
concentric: a 32px dock item inside the 38px dock (3px inset, 1px border) is `dock − 4px`; a knob inside a 2px
track is `track − 2px`.

**The corner scale.** Every token is its value times one scale, which a theme sets (1 by default; 0 squares
everything; 2 doubles). Growing, a corner stops 8px past its own value, so a doubled panel is 28px rather than
a 40px pill and the nesting order holds at every scale; `dock` and `pill` are round by design and scale freely.
Never multiply a radius by hand, and never give a theme-following corner a hard-coded round value.

## Spacing

The unit is **4px**. Every padding, gap, margin and offset lands on this scale, never between steps. Sizes are
not spacing: the width and height of a box, an icon, a control's part or a column stay on a fixed 4px grid
whatever unit a theme picks, and the widths of panels, popups and fixed columns are fixed pixels (Layout below).
A tight or roomy theme changes the room around things, never their size, so an icon stays 16 and its strokes
stay on whole pixels:

`0 · 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 28 · 32 · 36 · 40 · 44 · 48 · 56 · 64 · 80 · 96`

### Fixed side padding, by kind of control

A control's height already decides its vertical room, so its side padding is fixed by kind, not derived:

| Control                                           | Side padding                      |
| ------------------------------------------------- | --------------------------------- |
| Button                                            | 16 (12 on the side that has an icon) |
| Input, select, date picker, tab, dock item, menu row, select option | 12              |
| Nav item, segmented item, bar-list row, rail item | 10 (rail 9)                       |
| Chip, tooltip, pill badge                         | 8                                 |
| Badge                                             | 6                                 |

### Derived padding: a box holds content

The padding of a box that holds content (a card, a panel, a sheet body, a section, a list row) and the gap
between two texts are **derived from what the box holds**, then snapped to the scale. The formula is in
`lib/spacing.ts` and the `continuum-fix-padding` skill runs it; the results for common cases are here, so no
medium needs to run it.

**A box of text** pads by its type size and how many lines it holds (size averaged over the lines, so one large
figure does not size a whole card):

| Type size | 1 line | 2 lines | 3 lines | 4 lines | 6 lines | 8 lines | 12 lines |
| --------- | ------ | ------- | ------- | ------- | ------- | ------- | -------- |
| 11        | 8      | 14      | 16      | 20      | 20      | 24      | 24       |
| 13        | 10     | 16      | 20      | 20      | 24      | 28      | 32       |
| 14        | 10     | 16      | 20      | 24      | 28      | 28      | 32       |
| 18        | 14     | 20      | 28      | 28      | 36      | 36      | 44       |
| 24        | 16     | 28      | 36      | 40      | 44      | 48      | 48       |

Nothing pads past 48. Worked cases: a KPI card (13 label over an 18 value) pads **20**; a chart card (13, 24,
13) pads **24**; a card of four setting rows (eight lines of 13) pads **28**.

**Where a library part is drawn off the formula, the drawn value wins for that part.** The KPI card is drawn at
16, the settings card at 20 with its rows spaced 16, and `components.md` gives each part's drawn numbers. The
formula is for the boxes the library does not draw.

**A box of boxes** pads at least 1.5× its children's padding: children padded 8 or 12 → **20**; 16 → **24**;
20 → **28**; 24 → **36**.

**The gap between sibling boxes** is 1.1× their padding: padded 8 → **8**; 12 → **14**; 16 → **16**; 20 → **20**;
24 → **28**.

**The gap between two texts** follows the text *after* the gap, tight inside a pair (a title and its description,
a label and its value, a figure and its caption) and loose between blocks, growing with the lines either side:

| Before → after                      | In a pair | Between blocks |
| ----------------------------------- | --------- | -------------- |
| 13 → 13, one line each              | 4         | 20             |
| 13 → 11 (a name and its meta)       | 2         | 16             |
| 18 → 13 (a value and its caption)   | 4         | 20             |
| 13 → 18 (a label and its value)     | 4         | 28             |
| 24 → 14 (a page title and its line) | 4         | 20             |
| 16 → 13 × 2 (a section title and two lines) | 6 | 32             |
| 13 × 2 → 13 × 2 (two short paragraphs) | 6      | 40             |
| 13 × 3 → 13 × 3                     | 8         | 48             |

### The page's rhythm

| Between                                               | Gap |
| ----------------------------------------------------- | --- |
| Nav items in the sidebar                              | 2   |
| Parts inside a control (icon and label)               | 6–8 |
| A title and its description (a pair)                  | 6 under a page title, 4 under a section title, 2 for a name and its meta (the drawn values, which win over the formula) |
| Rows inside a group or card                           | 16  |
| Cards in a grid or a stack of group cards             | 16; 24 for a stack of settings cards |
| Blocks inside a section                               | 20  |
| A section head and its content                        | 20  |
| Sections of a page                                    | 40  |
| Sections of a long document                           | 64  |
| Groups in the sidebar                                 | 24  |
| The gutter around the app panel                       | 8   |

This is tool UI: density is the point. Nothing on a page has marketing-page air around it.

## Heights

Heights are fixed pixels, at the default height scale. Anything that sits in a row is on one of two rows, **34**
or **38**, so a button and a field beside each other line up without adjustment. A new control takes one of
these; never a height between them, never 32 or 36 for a control in a row. The one exception is an icon square in
an overlay's header or corner, sized to the bar it sits in: a dialog's close is 30, a sheet's close and a toast's
action and close squares are 36, and the header bar's back and forward are ghost 28. A row in a popup list (a
menu's, a command menu's) is 36 high, as a list row rather than a control.

A theme sets three sizes, each on its own: the base type size (12, 13 or 14), the spacing unit (3, 4 or 5) and
a height scale (0.9 compact, 1 default, 1.1 large). The height scale moves every height in the table below by
one factor, each rounded to a whole pixel, so the two rows stay two and stay level. Marks sized to their glyph or
text (badge, kbd, checkbox, radio, switch, avatar, status dot) keep their size. A height is always read by its
name, never written as pixels, so it follows the theme.

| Height | What sits on it                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------- |
| 21     | kbd                                                                                                   |
| 22     | badge (every variant), count                                                                          |
| 25     | small chip, a picked value in a combobox, the switch track (48 wide, 21 knob)                         |
| 29     | segmented item, medium chip, vital row, bar-list "show more"                                          |
| 32     | dock item, calendar day, date-range preset, icon tile                                                 |
| **34** | **the control row**: button, icon button, small input / select / date picker, segmented track, nav item, pagination, rail item, inline toolbar, bar-list row, table group row, pill tab, top-nav link |
| 36     | rows inside a popup list: menu, select, combobox, filter and command menu items                       |
| **38** | **the field row**: medium input / select / date picker, large button, the dock and its action, floating toolbar, medium code box, a setting row (minimum) |
| 41     | ruled table row and head                                                                              |
| 44     | line tab                                                                                              |
| 52     | dialog and sheet header                                                                               |
| 54     | header bar                                                                                            |
| 56     | sidebar header, top nav                                                                               |
| 4 · 8  | progress and meter track, small · medium                                                              |
| 6 · 8  | status dot, small · medium                                                                            |
| 20     | checkbox and radio (16 inside a menu row)                                                             |

## Icons

Lucide, **stroke 2**, always. **16px** by default; 12 in badges and small chips; 14 as a checkbox mark. An icon
takes its text's colour: `neutral-950` beside a nav item's label, `neutral-600` in a ghost control or a muted
row (darker on hover), in a status the tone's 600, or its 700 for `success` and `warning` (the status table). A quiet icon
may be `neutral-500`, which is 3:1; text beside it may not. An icon tile is a 32px well with `chip` corners
and a hairline. Icons lead in navigation and menu rows and trail on action buttons ("Add email +").

## States

| State    | Look                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------- |
| Hover    | border `200 → 300` (an unchecked mark `300 → 400`); ghost text `600 → 800`; a row or item takes the 5% wash (a table row 3%) |
| Pressed  | a button scales to 97% for the press                                                                |
| Focus    | the 2px ring above, keyboard only                                                                   |
| Selected | the 7% wash; in a dock, segment or rail, the action fill with `on-action` text                      |
| Disabled | 50% opacity, no pointer                                                                             |
| Invalid  | border `error-500`, the helper text and icon in `error-600`                                         |
| Loading  | a spinner inside the control that is busy, never over the page; skeletons at the element's size     |

A single-choice group (segmented control, dock, radio) always keeps one value.

## Motion

| What                              | Duration | Easing                               | From                                      |
| --------------------------------- | -------- | ------------------------------------ | ----------------------------------------- |
| Colour, border, opacity changes   | 150ms    | ease-out                             |                                           |
| Something entering (dialog, sheet, popup, menu, the sidebar's drawer) | 200ms | `cubic-bezier(0.22, 1, 0.36, 1)` | opacity 0 plus a small move: dialogs 8px up, sheets 16px from their edge, popups scale 95%; the drawer slides its whole width from the left |
| A press                           | 150ms    |                                      | scale 97%                                 |

A control's response stays at or under 250ms; a large surface entering or changing size (the rail's width, a
toast, a sheet) may take up to 400ms. Nothing bouncy, no animated layout. Reveal-on-hover only for secondary affordances (a
chevron), never a primary action, and never on touch (Touch, under Layout). Reduced motion turns transitions off.

## Layout

| Value                                              | Px                                       |
| -------------------------------------------------- | ---------------------------------------- |
| Content column, `narrow` (one object's fields; settings) | 640                                |
| Content column, `default` (overview, detail, document)   | 896                                |
| Content column, `wide` (a table of several columns)      | 1080                               |
| Content column, `dense` (a very dense table)             | 1280                               |
| Side padding of the column, below its width        | 16; 24 from a 640px screen; 16 in a compact shell |
| `inset` (several dense tables): the panel less, a side | 64 from 1024px; 128 from 1536px     |
| The page's top offset below the header bar         | 96; 128 on a large screen (from 1536px); 40 in a compact shell |
| Check at                                           | 1440 × 900 and 390, light and dark       |

The column is centred and never runs to the panel's edge unless a page is explicitly asked to be `full`.

### Narrow screens

The system is drawn at 1440 and holds down to a phone at 390. Two widths change the shell, measured on the shell
itself, not the screen, so a shell shown narrow inside a box or embedded in another page behaves as on a phone:

| Shell width               | What changes                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| 1024 and up               | Nothing: everything as drawn.                                                                  |
| under 1024 (`shell-sidebar`) | The sidebar no longer fits beside the panel. It becomes a drawer behind a toggle at the far left of the header bar; the header bar's back and forward and its actions hide; a top nav's links go into the same drawer. |
| under 640 (`shell-compact`)  | Compact, a phone: the page's top offset is 40 and its side padding 16. The panel keeps its 8 gutter, its corners and its hairline, as on a wide screen. |

**A part answers to the width it is given**, its container, never the screen: a table or a pager in a narrow
card behaves as it would on a phone. Only overlays (dialogs, sheets, toasts, popovers, a date picker's panel)
answer to the screen, since they float over it.

**A row of controls never wraps.** When it runs out of room it does one of three things:

- **Scroll**, a row of peers that are all needed: tabs, the dock, a top nav's links, a toolbar, a table. It
  moves sideways under an edge fade at the end that has more (with a chevron where a pointer needs one), the
  current item kept in view.
- **Hide**, what the page works without: the header bar's actions, a page's secondary actions, pagination's
  results line, the dock's counts, a table's optional columns, keyboard hints on touch. Hidden, never folded
  into a "⋯" menu.
- **Stack**, blocks side by side: the page head (the title, its line, then the actions), stat cards four
  across become two, two cards side by side become one column, a facts grid three across becomes two.
  Stacking costs height, which a phone has; width it has not.

Fold into a smaller control only what can neither scroll nor go: pagination to ‹ 3 of 25 ›, a segmented control
of more than four options to a select, an index's selects into its one Filter button. Only content wraps: text,
and applied-filter chips.

### Touch

On a touch screen (a coarse pointer), at any width:

- Every field that takes typing is **16**, not 13, so the phone does not zoom the page on focus; the box keeps
  its height. The one place the type scale yields.
- A target is at least **44** square. A smaller control keeps its drawn size and gets an invisible hit area
  round it, so nothing in a row grows wider.
- Nothing is revealed by hover alone: what shows on hover (a group's chevron, a block's handle) shows always.
- No keyboard hints: a kbd and a menu row's shortcut hide.

### Fixed widths

The width of a panel, a popup or a fixed column is a fixed pixel value, like the content columns and the
heights: it does **not** follow the spacing unit, so a tight or roomy theme changes the padding inside a sidebar
or a toast, never how wide it is. Small sizes that belong to a control's anatomy (an icon, a dot, a bar of a few
pixels) stay on the spacing scale.

| Width                                                       | Px                         |
| ----------------------------------------------------------- | -------------------------- |
| Sidebar (as a drawer, never wider than the shell − 48)      | 256                        |
| Rail, closed · open                                         | 52 · 208                   |
| Toast                                                       | 360                        |
| Popover                                                     | 288                        |
| Dialog (never wider than the viewport − 32)                 | 480                        |
| Sheet                                                       | 512                        |
| Command menu (never wider than the viewport − 32)           | 560                        |
| Filter menu                                                 | 240                        |
| A menu's minimum (dropdown) · a breadcrumb menu's minimum   | 160 · 192                  |
| Tooltip, info tip (maximum) · a chart's tooltip (minimum)   | 256 · 140                  |
| A table's or an index's search                              | 256                        |
| A date-range picker's presets column                        | 144                        |
| An empty state's sentence · a chat's empty line (maximum)   | 480 · 288                  |
| Sign-in card (on a phone, the screen less 16 a side)        | 400                        |
| An assistant's conversation column and its prompt           | 720                        |
