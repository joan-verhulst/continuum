# Method

How to design a product in Continuum, including one the library never covered: a CMS, a CRM, a booking tool,
an admin. The result should look as if it came from the same hand as the reference screens, because it is built
from the same values and the same decisions, not copied from another product.

## The steps

1. **Take the content as given.** What goes on a screen is the product's and the client's decision: the fields,
   the columns, the actions, the data. Do not invent it, and do not leave it out. If it is not given, ask;
   if no one can answer, assume the least and say so.
2. **Name each screen's kind**: overview, index, detail, create or edit, settings, sign in. The kind sets its
   width and anatomy (`pages.md`). A screen that fits no kind is composed from the nearest one; name which.
3. **Decide the look once.** The default (pure greys, a near-black action, Geist) suits most tools. A product
   with a colour or mood of its own gets a theme (`theming.md`): an accent, tinted greys, a font, how the action
   draws, the corners. Every theme works in light and dark; a dark-first product starts in dark.
4. **Compose from the parts in `components.md`** wherever one fits, even loosely: a tree is nav groups, a
   status is a badge, a choice list is option rows, a mode switch is a segmented control or the dock. The
   patterns in `patterns.md` say which parts a common need is built from and how they sit.
5. **Only then make a new part**, by the recipe below. Never invent a value when an existing one is near enough.
6. **Build it in the medium** (`media/`), with real state for the main task and realistic data in the product's
   own domain, and empty states.
7. **Check it** against the standing decisions in `pages.md` and the values in `foundations.md`, at 1440 × 900,
   in light and dark, running the checklist in `SKILL.md` by hand.

Never copy another product's layout into a Continuum version of it: keep its content and let the kinds decide
the structure. Think each screen through for what it is for: nothing repeats, and every element has a job (a
selection needs bulk actions; a filter that matched nothing offers to clear itself).

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
