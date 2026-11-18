---
name: continuum-taste
description: Use this skill whenever you build, design, restyle or review product UI that should look like Continuum — an app, page, dashboard, table, form, settings screen, card, widget, dialog, component or canvas design — in React, another framework, plain CSS, Paper or Figma. Use it when the user says "in Continuum", "in my style" or "like my design system", and also when nobody names it but the project uses Continuum (it imports `continuum`, or has a theme builder `app.css` or a DESIGN.md brief): then load it for any request that adds or changes something people see (a new page, a card on a dashboard, a sign-in screen, "make it look like the rest", "this feels cramped"), even when the request never mentions design. Continuum is quiet, dense tool UI: 13px type, hairline borders, one action colour, controls on two heights, light and dark, with a theme builder for a product's own look. Not for marketing or landing pages; for padding and gaps alone, continuum-fix-padding.
---

# Continuum

A design system for tool UI, distilled from real product screens. The look is **quiet, dense and precise**:
13px type in two weights, hairline borders, one action colour, almost no shadow, controls on two heights so
anything beside anything lines up, and one default theme with a builder for others.

The system is **described, not just implemented**: every value is stated in units and every page kind as an
anatomy, so it can be drawn anywhere. The React library is one rendering of it; on a canvas or in plain CSS the
same files decide the same screen.

## The numbers, on one page

- **Type**: 13px base (11 meta · 14 titles in overlays · 16 section titles · 18 KPI values · 24 page titles),
  line height 1.25, tracking 0.32px, Geist, weights 400 and 500 only, sentence case.
- **Colour**: five ramps 50–950 used by role; surface `neutral-50`, canvas `neutral-100`, hairline `neutral-200`,
  secondary text `neutral-600` (hints, placeholders and helper text too: no read text is lighter),
  primary text `neutral-950`; the focus ring and an unchecked checkbox's or radio's border `neutral-500`; dark
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
- **Layout**: sidebar 256 on the canvas, the panel inset 8, header bar 54, the page 96 below it in a centred
  column of 640 (forms, settings) · 896 (overview, detail) · 1080 (tables) · 1280 (dense tables). Panel and
  popup widths (sidebar 256, toast 360, popover 288, dialog 480, sheet 512) are fixed pixels, not spacing.
- **Decisions**: one primary action per view · an item opens on its own page · the sidebar holds places, not a
  create button · every page has a breadcrumb · a list's views go in the floating dock, not tabs · one column on
  a detail, a form and settings · a part is on the screen because the reader does something with it there, not
  because a page of that kind usually has one · design at 1920 × 1080 and check it holds at 1440 × 900 and 390, in light and dark.

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
   missing, assume the least and say so when no one can answer. Never invent a product.
2. **Pick the medium file** for where the work happens: `media/react.md` in a React project (set it up if it is
   not), `media/canvas.md` in Paper or Figma, `media/css.md` elsewhere.
3. **Name the page kind** from what the screen is for (`pages.md`): it sets the width and the parts marked
   always. A product the references never covered is expected: `method.md`. When the screen is the work (an
   editor, a player, a mail client, a canvas), it has no page kind: its layout is the genre's (or the
   reference the person gave), its look and its parts are Continuum's (`method.md` › When the screen is the work).
4. **Group the content** before any part is chosen: write down which items belong together, as a tree. A
   group is what is read or acted on together: a setting and the settings that only mean something while it
   is on, a label and its value, a title and its line, the filters and the chips they applied, a record's
   facts. Every level of the tree gets **one mark** that shows it (a container, a hairline around it, an
   eyebrow or a title over it), and its title is what a reader scans for, so it reads above the items it
   holds. The gaps then follow the tree: never more room inside a group than between it and its neighbours.
   A screen whose spacing feels off almost always has a group nobody named.
5. **Choose the parts** for the content, piece by piece: the part in `components.md` (charts from `charts.md`) or
   the row in `patterns.md` whose **when** that content meets, and the variant or size for its spot. Content is
   mapped to parts, never parts filled with content; take the simpler thing where it does the job. Write only
   the layout between the parts, its gaps from the spacing formula. Where nothing fits, make a new part by the
   recipe in `method.md`, borrowing every value.
6. **Build it** with real state for the main task, realistic data in the product's domain, and empty states.
7. **Look at it** at 1920 × 1080, where it is designed, then at 1440 × 900 and at 390, in light and dark, and run
   the check below until it holds.

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
   repeats another, every group of content marked (step 4 of building) and never more room inside it than around it. `audit_source` reads values from code; it sees structure only partly.
5. **Improving is not building.** Fix what departs from the rules and keep the content and the behaviour. A
   part the page kind allows but the page does not have (a search, a stat row, a filter) is a proposal for the
   report, never something to add.

## Gotchas

Each of these was got wrong on a real screen without it.

- **A spacing no part draws comes from the formula**, never a guess or a number copied from another place
  (`/continuum-fix-padding`, or `get_spacing` with the MCP server). Between a page head and a dense table that
  is about 64, not 16.
- **Closeness never groups.** Rows that belong together get a hairline around them or an eyebrow over them,
  never a tighter gap. An eyebrow never repeats the title of what holds it.
- **An index's toolbar is the table's own top bar**, inside its frame, not a row above it. Search is always in
  it unless the items have nothing to type: never leave it out by guessing how readers look things up.
- **A delta is coloured by what it means**: churn falling is good news, `success-800`; not by its direction.
- **Colour is for state, never for a label.** A reference (`INV-1043`, `#4821`), an "Internal note" or "AI"
  label, a tag stays neutral; a tone marks only a state that needs the eye (failed, overdue, paid). In an
  accent theme the primary is loud: a primary pill that is not a state pulls the eye off the content.
- **The page head starts 96 below the header bar's hairline** (128 on a large screen), measured from the bar,
  never from the panel's top, and never squeezed to fit more in. Content longer than the panel runs on under
  the floating dock and past the foot, as it scrolls in the app; never thin it out or fold it to end early.
- **Design at 1920 × 1080**, not 1440: the system is drawn there and holds below it.
- **Never invent content** to fill a part: a part with nothing real to show is left out.
- **A page head stays lean, by moving things, not dropping them**: the title, at most one badge (the state
  that needs the eye), one meta line of plain text, the page's actions. What else the object carries moves to
  where it is read: people with roles to a card of their own, history to a timeline, a second state into the
  meta line as text. Only what repeats something already on the screen (an icon tile echoing the nav) goes.

## Check

Every part earns its place (each control changes something the reader sees, each figure is one they came
for, nothing is there because the anatomy or a reference screen had it) · components first where a part is the
same thing, never a near one bent to fit · only roles, never
a hex · hairline, not shadow · space, not dividers (full-width ones in
floating containers only) · the column at its kind's width · one column on a detail, a form, settings · corners
nested and concentric · controls on 34 or 38 · two weights, 13 base · icons at stroke 2 · one action colour and
one primary action per view · views in the dock · a breadcrumb on every page · a visible focus ring · no read text lighter than
`neutral-600` · works in
the default theme, an accent theme and dark · looked at, not inferred.

Run it as a loop on a file, a screen or a canvas selection: check every item, fix what fails, look again, and
only report the work done when every item holds. With the MCP server, `audit_source` or `audit_ui` checks the
measurable items; the rest is by eye. `/continuum-fix-padding`, the companion skill, works out padding and gaps
with the spacing formula and applies them.
