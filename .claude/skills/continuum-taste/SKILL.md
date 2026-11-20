---
name: continuum-taste
description: Use this skill whenever you build, design, restyle or review product UI that should look like Continuum — an app, page, dashboard, table, form, settings screen, card, widget, dialog, component or canvas design — in React, another framework, plain CSS, Paper or Figma. Use it when the user says "in Continuum", "in my style" or "like my design system", and also when nobody names it but the project uses Continuum (it imports `continuum`, or has a theme builder `app.css` or a DESIGN.md brief): then load it for any request that adds or changes something people see (a new page, a card on a dashboard, a sign-in screen, "make it look like the rest", "this feels cramped"), even when the request never mentions design. Continuum is quiet, dense tool UI: 13px type, hairline borders, one action colour, controls on two heights, light and dark, with a theme builder for a product's own look. Not for marketing or landing pages; for padding and gaps alone, continuum-fix-padding.
---

# Continuum

A design system for tool UI, distilled from real product screens. The look is **quiet, dense and precise**:
13px type in two weights, hairline borders, one action colour, almost no shadow, controls on two heights so
anything beside anything lines up, and one default theme with a builder for others. Quiet is how the parts
look, never a reason to show less: what a reader needs is on the screen.

The system is **described, not just implemented**: every value is stated in units and every page kind as an
anatomy, so it can be drawn anywhere. The React library is one rendering of it; on a canvas or in plain CSS the
same files decide the same screen.

## The numbers, on one page

For checking a value as you go, never instead of the references (Building something, step 2).

- **Type**: 13px base (11 meta · 14 titles in overlays · 16 section titles · 18 KPI values · 24 page titles),
  line height 1.25, tracking 0.32px, Geist, weights 400 and 500 only, sentence case.
- **Colour**: five ramps 50–950 used by role; surface `neutral-50`, canvas `neutral-100`, hairline `neutral-200`,
  secondary text `neutral-600` (hints, placeholders and helper text too: no read text is lighter),
  primary text `neutral-950`; the focus ring `neutral-500`; dark
  mode reverses each ramp. One action colour (near-black by default). Hover is a 5% wash, selection 7%. Status
  colour: 500 at 20% behind 800 text, every tone; a delta `success-800` for good news, `error-600` for bad, by meaning not direction.
- **Lines**: a 1px hairline for every border; no dividers between sections; shadows only on what floats. A group
  is marked by a hairline, a container (never nested) or an eyebrow, never by a tighter gap.
- **Corners**: chip 6 · item 10 · control 12 · card 16 · panel 20 · dock and pills round; nested and concentric.
- **Heights**: 34 (buttons, small inputs, nav items) and 38 (medium inputs, large buttons, the dock); table rows
  41; badges 22.
- **Spacing**: a 4px scale; 2 between nav items, 16 between rows and cards, 20 from a section head to its
  content; between a page's blocks (its head, a table, a chart, a section) the formula's block gap, each side
  claiming room by what it holds (about 32 under a bare title over a short card, 48 under a title and its line
  over a settings card, 64 over a dense table); side padding fixed by
  kind, content padding and gaps derived by the formula (`foundations.md`, `/continuum-fix-padding`).
- **Layout**: sidebar 256 on the canvas, the panel inset 8, header bar 54, the page 64 below it in a centred
  column of 640 (forms, settings) · 896 (overview, detail) · 1080 (tables) · 1280 (dense tables). Panel and
  popup widths (sidebar 256, toast 360, popover 288, dialog 480, sheet 512) are fixed pixels, not spacing.
- **Decisions**: one primary action per view · an item opens on its own page · the sidebar holds places, not a
  create button · every page has a breadcrumb · a list's views go in the floating dock, not tabs · one column,
  in reading order; a side panel only for what stays in view while the work changes · every section on a page titled the
  same way · a part is on the screen because the reader does something with it there, not because a page of
  that kind usually has one · design at 1920 × 1080 and check it holds at 1440 × 900 and 390, in light and
  dark. Each is stated in full in `pages.md` (Standing decisions).

## The files

| File                         | Read it when                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `references/media/react.md`  | You work in React: first, for the setup, the Tailwind name of every value and the code idiom.  |
| `references/media/css.md`    | You work in plain CSS or another framework (Angular, Vue, Svelte, Qt): first.                  |
| `references/media/canvas.md` | You draw in Paper or Figma: first, for the tokens and drawing a part from its spec.            |
| `references/pages.md`        | You start a screen: its kind sets the width and the parts it may hold, top to bottom; also the shell, the page head and the secondary surfaces (sheet, dialog, popover, toast). |
| `references/components.md`   | You place a part: read that part's entry for its anatomy, values, states and when it is the right part. A lookup, never read whole. |
| `references/patterns.md`     | The content has a need a page kind does not answer (filters, totals, key figures, steps, an empty state…): find the row whose **when** it meets. Its Behaviour section: how a thing answers hover, focus and time (a submenu's safe triangle, hover delays, Undo). |
| `references/charts.md`       | The content holds a figure over time, a share or a ranking: which chart, its card, its marks.  |
| `references/foundations.md`  | You need a value the files above do not give: colour with hex, type, radius, heights, spacing and the formula's tables, states, motion, layout. |
| `references/method.md`       | The product is one the references never covered, or nothing in `components.md` fits: the recipe for a new part. |
| `references/theming.md`      | A product needs its own accent, greys, font or corners.                                        |
| `references/screens/*.tsx`   | You want a worked screen of the same kind to compare against: one generic app, then blocks from earlier products. |
| `assets/continuum/`          | You install the React library in a project: components, lib, charts, styles and the prebuilt `styles.css`. |

## Building something

1. **Take the content as given.** The fields, columns, actions and data are the product's; ask when they are
   missing, assume the least and say so when no one can answer. Never invent a product. When the request is
   loose, first write down **what a reader opening this screen needs to know first and what they act on**.
   That list is the content; every item on it reaches the screen.
2. **Open what this screen needs before deciding anything.** This page is the procedure and a summary; the
   decisions are in the references, and a screen built from this page alone misses them. Open:
   - the medium file for where the work happens: `media/react.md` in a React project (set it up if it is not),
     `media/canvas.md` in Paper or Figma, `media/css.md` elsewhere;
   - the section of `pages.md` for the screen's kind (step 3), or `method.md` › When the screen is the work;
   - for each item of content, the row in `patterns.md` whose **when** it meets;
   - for each part, as it is chosen (step 6), its entry in `components.md` (charts in `charts.md`).

   With the Continuum MCP server connected, the same lookups are tools (`get_page_kind`, `find_pattern`,
   `get_component`), and `plan_screen` makes the first two for the whole screen.
3. **Name the page kind** from what the screen is for (`pages.md`): it sets the width and the parts marked
   always. A product the references never covered is expected: `method.md`. When the screen is the work (an
   editor, a player, a canvas), it has no page kind: the steps below lay it out from its content, and its
   look and parts are Continuum's (`method.md` › When the screen is the work).
4. **Group the content** before any part is chosen: write down which items belong together, as a tree. A
   group is what is read or acted on together: a setting and the settings that only mean something while it
   is on, a label and its value, a title and its line, the filters and the chips they applied, a record's
   facts. Every level of the tree gets **one mark** that shows it (a container, a hairline around it, an
   eyebrow or a title over it), and its title is what a reader scans for, so it reads above the items it
   holds. The gaps then follow the tree: never more room inside a group than between it and its neighbours.
   A screen whose spacing feels off almost always has a group nobody named.
5. **Place the groups**, deciding in this order:
   - **Many at once, or one at a time:** how the reader goes through the content. Scanning, finding or
     comparing many is a table or a grid. Working through items one by one to decide each (reviewing,
     approving, judging, correcting) is a different screen, and it opens on the first item still to decide,
     never on a grid of them all with this as a mode behind a toggle: the item in play fills the main region,
     large, with the one before and after it as context and its decision actions in a bar pinned at the foot of
     the main region, in view however far the item scrolls; the set is a narrow
     list of small previews with each item's state at the left, to jump to any of them. Two versions of the
     item that are compared (a source and its translation, a before and an after) sit side by side at equal
     width inside the main region.
   - **Regions:** what must stay in view together. One main region, holding what the reader works on most
     (where the assigning, editing or deciding happens, not what they pick from); a second at its right only
     for what stays in view while the main one changes (`pages.md` › The side panel), at the side panel's 360,
     never wider and never an equal half. Regions share the panel's surface and meet on a hairline; a region
     never takes a fill, which reads as the shell around it.
   - **Size:** each thing is as big as its content and the task need (a document its page, a grid its columns,
     a form its measure); what is judged closely (a photo to choose, a page to review) is large, what is
     picked from (thumbnails, a list of items) small. Among peers, the one in play (live, current, the one
     being decided) leads: more room and its state named, the rest quieter. A region takes the room left,
     never stretching what it holds; what is smaller than its region sits centred in it, or where its genre
     puts it. What has no size of its own (a room, a map, a canvas) fills its region. The item in play is set
     at the size it is judged at: text read and compared closely at reading size (16, or 18 for one short item),
     an image large; the 13 base is the interface around it.
   - **Frames:** a unit gets one mark (step 4). A region gets no frame of its own: never a frame in a frame,
     never a fill standing in for one. A unit inside a region (a pair compared, a receipt, a document) still
     gets its one mark.
   - **Controls where they act:** a control sits on what it changes. An item's actions on the item, and the
     way to add one where it would go; a selection's beside it, or anchored to it when it is small; the view's
     (zoom, the period) over what it views; the whole screen's in its head or the dock. One primary per view.
6. **Choose the parts** for the content, piece by piece: the part in `components.md` (charts from `charts.md`) or
   the row in `patterns.md` whose **when** that content meets, and the variant or size for its spot. Content is
   mapped to parts, never parts filled with content; take the simpler thing where it does the job. Write only
   the layout between the parts, its gaps from the spacing formula. Where nothing fits, make a new part by the
   recipe in `method.md`, borrowing every value.
7. **Write the plan down before any code**: a few lines each for steps 1, 3, 4, 5 and 6 (what the reader needs
   first, the kind, the groups, how they are placed, the parts), naming the sections of step 2 it rests on. A
   reference screen is compared against after, never the starting point. When the Continuum MCP server is
   connected, `plan_screen` gives this plan from
   this same text: call it here.
8. **Build it** with real state for the main task, realistic data in the product's domain, and empty states.
9. **Look at it** at 1920 × 1080, where it is designed, then at 1440 × 900 and at 390, in light and dark, and run
   the check below until it holds. When the MCP server is connected, `audit_ui` on the rendered page
   (`get_snapshot_script` in the browser) checks it too.

In doubt, do less, and do what an existing part already does. A reference screen shows one way to apply these
files; where it differs from what they state, the files are right.

## Reviewing or improving something

The same rules, read the other way. Each of these was got wrong on a real review without it.

1. **A finding is a departure from a stated rule**, and it names the rule (the file and section). What follows
   the rules is not a finding, however it could also be done. A file with nothing off is a valid answer: say
   so, and stop looking.
2. **Behaviour and copy are not design findings.** A handler that is not wired, permission logic, a label you
   would word differently: list them apart, under "Questions", or leave them out.
3. **One fix, the value the rule gives.** Never "`gap-4` or `gap-5`" or "`text-xl` or `text-2xl`": a page
   title is 24 because it is the page title, settings cards are 24 apart because the settings anatomy says
   so, a gap no part fixes is the formula's. The nearest step on the scale is not a fix; the role is. A gap
   within one step of what the formula gives is right (how rows are counted moves it a step): never a finding.
4. **Structure is yours to check**, against the page kind's anatomy in `pages.md`: one primary action, views in
   the dock, no container in a container, space not dividers, the column at its kind's width, no part that
   repeats another, every group of content marked (step 4 of building), placed by step 5 and never more room inside it than around it. `audit_source` reads values from code; it sees structure only partly.
5. **Improving is not building.** Fix what departs from the rules and keep the content and the behaviour. A
   part the page kind allows but the page does not have (a search, a stat row, a filter) is a proposal for the
   report, never something to add.

## Check

Every part earns its place (each control changes something the reader sees, each figure is one they came
for, nothing is there because the anatomy or a reference screen had it) · components first where a part is the
same thing, never a near one bent to fit · only roles, never
a hex · hairline, not shadow · space, not dividers (full-width ones in
floating containers only) · the column at its kind's width · one column on a form and settings · corners
nested and concentric · controls on 34 or 38 · two weights, 13 base · icons at stroke 2 · one action colour and
one primary action per view · views in the dock · a breadcrumb on every page · a visible focus ring · no read text lighter than
`neutral-600` · works in
the default theme, an accent theme and dark · looked at, not inferred.

Run it as a loop on a file, a screen or a canvas selection: check every item, fix what fails, look again, and
only report the work done when every item holds. With the MCP server, `audit_source` or `audit_ui` checks the
measurable items; the rest is by eye. `/continuum-fix-padding`, the companion skill, works out padding and gaps
with the spacing formula and applies them.
