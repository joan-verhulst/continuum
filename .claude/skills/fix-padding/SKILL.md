---
name: fix-padding
description: Works out and fixes the padding and gaps of a component, screen or page with Continuum's spacing formula, so spacing follows what each box holds (its type size, how much text, the boxes inside it) and always lands on a Tailwind spacing class, never an arbitrary value. Use when asked to fix, check, tune or derive padding or spacing ("fix padding", "spacing looks off", "this card feels cramped", "too much space between the title and the description"), or invoked as /fix-padding with a file, component or page.
---

# Fix padding

Spacing here is derived, not picked. A box's padding follows its content: the size of its type, how much text it holds and the boxes inside it. Gaps between texts follow the text after them. Every result is snapped to a Tailwind spacing step and written as a class (`p-6`, `gap-1.5`), never as `p-[22px]` or an inline style.

## The formula

Defaults are in `scripts/spacing.ts` (the same file as `src/lib/spacing.ts` in the Continuum repo, and exported from `continuum`):

| Term | Rule | Default |
| --- | --- | --- |
| Type size of a box | the font size **averaged over its lines** (each inner box counts as one line at its own size), never the largest; one big figure must not pad a whole card | |
| Padding of a box of text | `k × size × (1 + α·log₂ lines)` | k 0.75, α 0.6 |
| Padding of a box of boxes | at least `r ×` the inner boxes' padding | r 1.5 |
| Gap between boxes | `g ×` the inner boxes' padding | g 1.1 |
| Gap between two texts | `t ×` the size of the text **after** the gap `× (1 + β·log₂ lines either side)`; tight for a pair, loose between blocks | pair 0.25, block 1.5, β 0.6 |
| Cap | no padding past 48px | |
| Scale | snap to Tailwind steps: 0, 0.5 … 3.5 (every 2px), 4, 5 … 12, 14, 16, 20, 24 | |

A **pair** is two texts that belong together: a header and its subheader, a label and its value, a figure and its caption. Everything else that follows a text is a **block**.

A **group without a surface** (a section, a row of cards, a stack with no border or fill) gets no padding, only gaps, and passes its children's padding on to the box around it.

Siblings compute their own padding; they do not share the fullest one's.

## What it covers, and what it does not

Covers: boxes that hold content (cards, panels, sheet and dialog bodies, sections, list rows, empty states, popovers with text) and the gaps between texts and between boxes.

Leave alone:
- **Controls with a fixed height** (buttons, inputs, selects, chips, badges, tabs, nav items, menu items): their side padding is fixed per kind and their height comes from the height scale.
- **Page-level insets** that a layout component sets (`PageContent`'s top padding, the 8px panel gutter).
- Anything the user marked as deliberate.

## Workflow

1. **Read the target** (the file, component or page named). Find each box that holds content and each run of text, and note its Tailwind type class.
2. **Map type to px** with the theme: in Continuum `text-xxs` 11, `text-xs` 13, `text-sm` 14, `text-base` 16, `text-lg` 18, `text-xl` 20, `text-2xl` 24, `text-3xl` 31, `text-4xl` 39. In another project read its `--text-*` tokens.
3. **Count lines.** Measure them in the running app where you can (`Range.getClientRects()` on the text, or a screenshot at the real width). Otherwise give the text and let the script estimate about eight words to a line, and say that you estimated.
4. **Write the box tree** as JSON and run the script from the skill's folder:

   ```json
   { "id": "card", "children": [
       { "text": "Seats", "size": 13 },
       { "text": "8 of 10", "size": 24, "pair": true },
       { "text": "Two left to assign", "size": 13, "pair": true }
   ] }
   ```

   ```
   node scripts/compute.ts tree.json
   ```

   It prints, per box, the padding class and each gap with what it sits between. Use `"surface": false` for a group with no border or fill, `"row": true` for a horizontal one, and `--params '{"k":0.8}'` only when the user asks to try other constants.
5. **Compare with the code.** List each box's current padding and gaps against the result. A difference of one step or less is noise unless the user asked for exact values; a larger one is a fix.
6. **Apply** the classes: `p-*` for padding (keep `px-*`/`py-*` only where the component deliberately differs per side, and say so), `gap-*` on the flex or grid parent for gaps, rather than margins on children. Never write an arbitrary value; if a result seems to need one, the tree is wrong, so look again at sizes, pairs and surfaces.
7. **Check it** with a screenshot of the result at its real width, sparse and dense content if both occur. If something reads off, say which term caused it (usually a pair marked as a block, or a box that should have no surface) rather than nudging a value by hand.
8. **Report** a short table: box, before, after, why.

## When the formula and the eye disagree

The constants were judged by eye on a whole billing screen, with every term tuned against the others. If a result looks wrong after the tree is right, do not override it in the one component: raise it with the user, since the fix belongs in the constants, and try new ones with `--params` first.
