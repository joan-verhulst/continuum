---
name: continuum-taste
description: Designs and builds product UI in Continuum, Joan's design system — quiet, dense tool UI with hairline borders, one action colour, 13px type and controls on two heights, in light and dark, with a theme builder for a product's own accent, greys, font and corners. The system is described in units, so it applies in React (where it ships as a component library on Base UI + Tailwind v4), on a design canvas (Paper, Figma) and in plain CSS alike. Use when asked to build, design, restyle or review an app, page, dashboard, form, component or screen "in Continuum", "in my style" or "like my design system", in any project or tool.
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
  colour: 500 at 20% behind 800 text, every tone; a rising delta `success-800`, a falling one `error-600`.
- **Lines**: a 1px hairline for every border; no dividers between sections; shadows only on what floats. A group
  is marked by a hairline, a container (never nested) or an eyebrow, never by a tighter gap.
- **Corners**: chip 6 · item 10 · control 12 · card 16 · panel 20 · dock and pills round; nested and concentric.
- **Heights**: 34 (buttons, small inputs, nav items) and 38 (medium inputs, large buttons, the dock); table rows
  41; badges 22.
- **Spacing**: a 4px scale; 2 between nav items, 16 between rows and cards, 20 from a section head to its
  content, 40 between sections; side padding fixed by kind, content padding derived (tables in `foundations.md`).
- **Layout**: sidebar 256 on the canvas, the panel inset 8, header bar 54, the page 96 below it in a centred
  column of 640 (forms, settings) · 896 (overview, detail) · 1080 (tables) · 1280 (dense tables). Panel and
  popup widths (sidebar 256, toast 360, popover 288, dialog 480, sheet 512) are fixed pixels, not spacing.
- **Decisions**: one primary action per view · an item opens on its own page · the sidebar holds places, not a
  create button · every page has a breadcrumb · a list's views go in the floating dock, not tabs · one column on
  a detail, a form and settings · check at 1440 × 900 in light and dark.

## The files

| File                            | What it is                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `references/foundations.md`     | **The values**: colour (with hex, light and dark), type, surfaces, radius, spacing (with the formula's tables), heights, icons, states, motion, layout. |
| `references/pages.md`           | **The composition**: the shell, the column, the page head and sections, each page kind's anatomy top to bottom, the secondary surfaces, the standing decisions. |
| `references/components.md`      | **The parts**: every component with its anatomy, values, states, and when to use it and when not. A lookup; read the entries you need. |
| `references/patterns.md`        | **Need → build it as**: lists, filters, totals, KPIs, steps, planners, empty states, forms, settings and the rest, as parts and placement. |
| `references/charts.md`          | **The chart kit**: which chart for which need, the card a chart sits in, the plot, the marks, colour, hover, motion, and each chart's entry. |
| `references/method.md`          | **A product the library never covered**: the steps, the recipe for a new part, a worked CMS. |
| `references/theming.md`         | What a theme can change and how it is applied, in code and on a canvas.                     |
| `references/media/react.md`     | In React: setup, the Tailwind names for every value, the code idiom.                        |
| `references/media/canvas.md`    | In Paper or Figma: tokens, what a canvas does differently, drawing a part from its spec.    |
| `references/media/css.md`       | In plain CSS or another framework.                                                           |
| `references/screens/*.tsx`      | The reference screens, built with the library: one generic app, then blocks from earlier products. |
| `assets/continuum/`             | The React library: `components/`, `lib/`, `charts/`, `styles/`, `index.ts`, the prebuilt `styles.css`. |

## Building something

1. **Take the content as given.** The fields, columns, actions and data are the product's; ask when they are
   missing, assume the least and say so when no one can answer. Never invent a product.
2. **Pick the medium file** for where the work happens: `media/react.md` in a React project (set it up if it is
   not), `media/canvas.md` in Paper or Figma, `media/css.md` elsewhere.
3. **Name each screen's kind** (overview, index, detail, create or edit, settings, sign in) and read its anatomy
   in `pages.md`. A product the references never covered is expected: `method.md`.
4. **Compose from the parts** in `components.md` (charts from `charts.md`), by the rows in `patterns.md`; write
   only the layout between them. Where nothing fits, make a new part by the recipe in `method.md`, borrowing every value.
5. **Build it** with real state for the main task, realistic data in the product's domain, and empty states.
6. **Look at it** at 1440 × 900, in light and dark, against the checklist below.

In doubt, do less, and do what a reference screen or an existing part already does.

## Check

Components first · only roles, never a hex · hairline, not shadow · space, not dividers (full-width ones in
floating containers only) · the column at its kind's width · one column on a detail, a form, settings · corners
nested and concentric · controls on 34 or 38 · two weights, 13 base · icons at stroke 2 · one action colour and
one primary action per view · views in the dock · a breadcrumb on every page · a visible focus ring · no read text lighter than
`neutral-600` · works in
the default theme, an accent theme and dark · looked at, not inferred.

Run this checklist by hand on a file, a screen or a canvas selection (a `/continuum-review` verb that runs it as
a procedure is planned, not yet installed). `/continuum-fix-padding`, the companion skill, works out padding and
gaps with the spacing formula and applies them.
