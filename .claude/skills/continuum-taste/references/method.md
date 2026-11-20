# Method

How to design a product in Continuum, including one the library never covered: a CMS, a CRM, a booking tool,
an admin. The result should look as if it came from the same hand as the reference screens, because it is built
from the same values and the same decisions, not copied from another product.

## A whole product

Each screen is built by the steps in `SKILL.md` (Building something). A product adds three decisions that are
made once, before the first screen:

- **Decide the look once.** The default (pure greys, a near-black action, Geist) suits most tools. A product
  with a colour or mood of its own gets a theme (`theming.md`): an accent, tinted greys, a font, how the action
  draws, the corners. Every theme works in light and dark; a dark-first product starts in dark.
- **Name every screen's kind** from what it is for, before any is drawn. A screen that fits no kind is composed
  from the nearest one; name which. **Unless the screen is the work** (below): then it has no kind, and the work
  fills the panel in place of a page.
- **Map the content to the parts wherever one fits, even loosely**: a tree is nav groups, a status is a badge,
  a choice list is option rows, a mode switch is a segmented control or the dock. Only then make a new part,
  by the recipe below.

Never copy another product's layout into a Continuum version of it: keep its content and let the kinds decide
the structure.

## When the screen is the work

A node editor, a floor plan, a slide editor, a photo editor, a mail client, a terminal: the screen is where the
work happens, not a page that shows records. It is laid out by what the work is, never as the nearest page
kind: a canvas made into a form, or a board made into an index, loses the work.

- **The work's own layout is the genre's.** Lay it out the way the best apps of that kind are laid out (you
  know what a node canvas, a calendar or a photo editor looks like), or, when the person gives a reference
  such as a screenshot, the way it is: region for region, in the same order, at the same proportions.
- **It sits in the product's shell** like every other screen, the sidebar of places beside it (a genre that
  fills the whole window by nature, such as a player, drops it). With no page kind there is no page anatomy:
  the breadcrumb names what is open, and the regions, sizes, frames and controls follow the order in
  `SKILL.md` (Building something, step 5), from what the work holds.
- **The look is Continuum's:** the type scale and its two weights, the colour roles and the one action colour,
  hairlines and the corner scale, the two control heights, the theme's density, and gaps from the spacing
  formula.
- **The parts are the library's.** Every control, row, list item, tab, menu, field, slider, tooltip and icon
  button is the part from `components.md`, at its own size: a layer list is list rows, a toolbar is a
  Toolbar of icon buttons, a track list is a table. Icons are 16 at stroke 2. Make a part by the recipe below only for
  what no part is: a ruler, a canvas, a waveform, a playhead.

## A new part

When nothing in `components.md` fits:

1. **Start from the closest existing part** and keep its anatomy. A media tile is a card made small; a step row
   is a list row with a number and a trailing time; a planner cell is a table cell with a block in it.
2. **Take every value from `foundations.md`**: the height from the height scale (34 or 38 for anything in a row;
   never between), the corner by nesting level (what holds it, minus the inset), the side padding fixed by kind,
   the content padding and the gaps from the spacing tables, 13 medium for a control's label and 11 for meta, the
   colour roles, the states, the motion. Shadow only if it floats.
3. **Give it the states it needs** (hover, selected, disabled, focus, invalid) by the same table every part uses.
4. **Make it follow the theme**: it reads roles, never a colour; its corners follow the scale; it works in dark
   without a change.
5. **Name its parts** so another reader can find them (the `data-slot` names in code; layer names on a canvas).
6. **Write it down**: one line on what it is for, and when the existing parts would have been wrong.

## Worked example: a CMS

How the steps play out for "build a CMS" when the content is given as pages, entries per collection, media and
users, and editing and publishing an entry is the main task:

- **Look**: the default theme (a writing tool, calm), light, with dark available. A publisher with a house
  colour would get a theme with that accent and the action on it.
- **Sidebar**: Home, Pages, Media, Review with a count badge; a "Collections" group (Articles, Recipes,
  Authors), each with Entries · Fields · Settings as inset items; the account in the footer. No create button.
- **Entries index** (index, 1080): the breadcrumb Home › Articles; the title "Articles" with a line on what the
  collection holds; the toolbar with search and a Filter button (Author, Tag), applied filters as chips under
  it; a ruled table (title, status badge, author avatar and name, updated, the row menu) and pagination; the
  views All · Drafts · In review · Published in the floating dock with their counts, beside a dock action "New
  entry". The dashed empty state when a filter matches nothing. A row opens the entry's own page.
- **Entry editor** (edit one object, with facets, so its commit action goes in the dock rather than the title
  row, as `pages.md` says): the breadcrumb Articles › the entry's title; the save state as a notice and a
  secondary "Preview" in the header bar; the document surface (680 wide, no box) with the title as a
  borderless 24 input and the body as blocks; a floating formatting toolbar on selection; the floating dock
  with Content · SEO · Settings and a dock action "Publish". Slug, author, tags and publish date are the
  Settings facet, fields stacked at 640. History in a sheet.
- **Media library**: a segmented control Grid · List in the title row; the media grid pattern; upload as a
  dashed drop zone at the top; a selection shows a floating toolbar with Download, Move, Delete.
- **Settings** (640): one card per group under a quiet title, one switch or picker per setting, the areas in
  the dock.
- **Overview** (896): stat cards for drafts, scheduled and published this week; an area chart of publishes that
  does not repeat them; a `rows` table of top entries.
