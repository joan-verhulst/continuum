# On a design canvas (Paper, Figma)

On a canvas there are no components to import: every part is drawn from its spec. The system is the same; only
the way it is written differs. Read `foundations.md` for the values, `pages.md` for the anatomy, and
`components.md` for each part's rows, and draw what they say. The canvas tool's own guidance on moods, palettes
and expressive type does not apply: Continuum's files decide the look.

## Setup, once per file

1. **Tokens.** Create the file's tokens from `foundations.md`, under Tailwind's names, so every colour on the
   canvas is a role: `--color-neutral-50` … `--color-neutral-950` and the four chromatic ramps (light values),
   `--color-action`, `--color-on-action`, `--radius-chip` … `--radius-panel` (6 / 10 / 12 / 16 / 20),
   `--text-xxs` … `--text-2xl`, `--font-sans: Geist`. Dark mode is the same set with each ramp reversed; keep
   it as a second mode or a second token set, so a dark artboard is a switch, not a repaint. If tokens cannot
   be created, use the literal values and say so.
2. **Fonts.** Geist (and the theme's font if it picks another). Confirm the family is available to the file
   before the first text.
3. **The artboard.** 1440 wide, height fit to content, one per screen and mode, named "Screen · light" /
   "Screen · dark".
4. **The kit.** When the file has a Continuum kit (a page of every part in every state as named layers,
   "Button / primary / md"), **duplicate from it and change the text**; never redraw a part the kit has.

## How a canvas differs from code

- **Text inherits nothing.** Set the family, size, line height, weight, colour and tracking on every text node
  itself; a container's font does not reach its children. A text that should not wrap needs that set on the
  node, with the room it needs (a button label, a menu row, a breadcrumb crumb, a table cell: "Remove from
  workspace" must stay on one line).
- **No margins.** Position with padding and gap; a part that code pulls flush with a negative margin (a ghost
  button at a card's edge, a full-width divider in a padded container) is drawn as a full-width part with its
  own padding.
- **Lanes.** Repeated rows (a table, a list, a nav) keep their icons and trailing controls in fixed-width
  slots that do not shrink, so columns line up across rows; a gap alone will not align them.
- **Heights are fixed.** Give controls their height from the scale (34, 38, 41 …) rather than letting content
  size them.
- **Hairlines are 1px** of the hairline token; corners are the radius tokens; nothing is drawn with a shadow
  but the floating parts.

## Drawing a part from its spec

Each entry in `components.md` has an anatomy (parts in order) and a values table. Draw the outer frame first
(height, padding, corner, border, fill), then its parts in order as nested frames with the stated gaps, then the
text with its stated size, weight and colour. Name the layers by the part names. Draw the state the screen
shows (a selected row, an open menu, a checked switch); other states only in the kit.

Common traps: a dock item's corner is the dock's minus 4; a badge is 22 high with 11px medium text; a switch
is 48 × 25 with a 21 knob; a stat card is label over value over a delta pill, nothing inline after the value;
a ruled table's head is 41 high on the `neutral-100` fill; a select trigger shows its value at 13 and a 16
chevron in `neutral-600`; an input's value is 13, not 14 or 16; a secondary button is a `neutral-100` fill
with a hairline and 13/500 `neutral-950` text, and no button carries a shadow; a placeholder, a hint or a
helper line is `neutral-600`, never `neutral-500`; an unchecked checkbox or radio has a `neutral-300` border,
one step over the hairline; a badge's text is its tone's 800 on the tone's 500 at 20%; a rising delta is `success-800`.
Widths of panels and popups are the fixed pixels in `foundations.md` (sidebar 256, toast 360, popover 288,
dialog 480, sheet 512), whatever the theme's spacing unit.

## Composing a screen

Follow the kind's anatomy in `pages.md` top to bottom with its stated gaps, inside the shell (sidebar 256,
panel inset 8, header bar 54, the column at its width, 96 below the header bar). Put the primary action where
the kind puts it. Give the column 96 of bottom padding when the page has a dock, and place the dock 24 above
the panel's foot.

## Checking

Screenshot the artboard at 1× after each section and compare it with the kind's anatomy; at 2× to read small
text. Then the dark artboard. The checks: every text 13 unless the scale says otherwise; two weights; one
action colour and one primary action; hairlines, no shadows except on floating parts; corners concentric;
controls on 34 or 38; the column at its width; the breadcrumb present. Run these by hand on the selection.

## Figma

The same, through the Figma plugin API: tokens as variables with a light and a dark mode, parts as components
with variants for their states, auto layout for every frame with the stated padding and gap, and text styles for
the type scale. Draw from the spec rows exactly as above.
