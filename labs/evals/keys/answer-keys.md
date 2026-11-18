# Answer keys

Every planted defect, where it is, and the right fix. Line numbers are the fixture's. "Decoys" look odd and are
right: flagging one is a false positive. A finding counts as a hit when it names the place (± 3 lines) and the
problem; the fix is scored separately.

## B6: clean settings (`fixtures/b6-clean-settings.tsx`)

A copy of the Kestrel notification settings screen (`new-settings.tsx`), its page-head gap set to the formula's
`gap-14` (2026-11-18: the skill wins over the screen's old `gap-10`). The engine finds nothing on it. The
right answer is "nothing to fix". Any finding is a false positive, except one we accept as a matter of taste:

- Accepted (not counted either way): a page-head gap of `gap-12` proposed for the `gap-14` (one step, within the
  formula), suggestions that only restate a value already right, or a question about
  copy.

## B1: nearly right settings (`fixtures/b1-near-miss-settings.tsx`)

The same screen with eleven subtle defects.

| #   | Line | Defect                                                        | Rule         | Right fix                          |
| --- | ---- | ------------------------------------------------------------- | ------------ | ---------------------------------- |
| D1  | 102  | eyebrow in `font-semibold` (a third weight)                   | weight       | `font-normal` (it was 400)         |
| D2  | 170  | avatar `bg-[#1a1d2e]`, a hex off every ramp                   | colour       | `bg-neutral-950`                   |
| D3  | 201  | page column `gap-[38px]`, off the 4px scale                   | spacing      | `gap-14` (56) or `gap-12` (48): the block gap, head and line over a nine-row card; one step is within the formula |
| D4  | 203  | page title `text-[22px]`, off the type scale                  | type-size    | `text-2xl` (24, the page title)    |
| D5  | 204  | page line `text-neutral-400`, lighter than any read text      | text-tone    | `text-neutral-600`                 |
| D6  | 209  | cards `gap-[18px]`, off the scale                             | spacing      | `gap-6` (24, the settings anatomy) |
| D7  | 210  | `shadow-lg` on a card that does not float                     | shadow       | remove it                          |
| D8  | 345  | button `h-9` (36), off the two heights                        | height       | remove it (the Button's own 34)    |
| D9  | 345  | button `rounded-lg` (8), off the corner scale                 | radius       | remove it (control 12)             |
| D10 | 313  | a hand-rolled checkbox where every other setting is a Switch  | component    | `<Switch>` with `onCheckedChange`  |
| D11 | 365  | `border-2` on a card: a second border weight                  | border-width | remove it                          |

Decoys: `pb-24` (room for the floating dock), `opacity-50` on dimmed dependents, `text-xs` eyebrows (11, the
meta size), `[&_svg]:size-4`, `h-dvh min-h-0` on the shell, the setting rows with no description, the
dependents sharing a card without a hairline above the eyebrow.

Engine (`audit_source`, 2026-11-18): found D1, D3, D4 (fix said `text-xl`, 20, where the title wants 24), D6
(fix `gap-5`), D10 (as a Checkbox, where a Switch is right). **Missed D2, D5, D7, D8, D9, D11**: classes on
library components (`Card`, `Button`) and an arbitrary hex in a class seem not to be read. 5/11.

## B3: structural mistakes (`fixtures/b3-structure-invoices.tsx`)

The Kestrel invoices index (`new-index.tsx`) with six structural defects. These are `advise` findings: the right
behaviour in improve mode is to propose them, or to fix them while saying so.

| #   | Line     | Defect                                                                                  | Rule              | Right fix                                                  |
| --- | -------- | --------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------- |
| S1  | 470      | a primary "New invoice" button in the page head, while the dock's action is also "New invoice" | one-primary   | remove the head's button; the dock action stays          |
| S2  | 477      | a `Separator` between the page head and the content                                     | dividers          | remove it: no dividers between sections                    |
| S3  | 510      | the table inside a `Card` with padding: a container in a container                      | nested-containers | remove the card; the table is its own container            |
| S4  | 456      | an index with a seven-column table in the `narrow` column                               | page width        | `width="wide"`                                             |
| S5  | 495, 365 | the status views as tabs on the page; the dock holds only the action                    | views-in-dock     | the views back in the dock as `DockItem`s with counts      |
| S6  | 479      | three stat cards repeating the counts the views already show                            | repetition        | remove them (an index has no KPI row)                      |

Decoys: the hand-rolled `<button>` that links the invoice number (a row link, not a button; flagging it is
accepted, not counted), `py-0` on cells holding a checkbox, badge or menu, the bulk bar replacing the dock
on selection, the `@max-shell-compact` classes.

Engine (`audit_source`): **found none of S1–S6**; it reported the row link only. Structure seems to be read only
by `audit_ui` on the rendered page. 0/6.

## B2: generic AI dashboard (`fixtures/b2-generic-dashboard.tsx`)

Not a near miss: a whole look to replace. Scored by category, each counted once whether the agent names one
instance or all.

| #   | Category                                                                                 |
| --- | ---------------------------------------------------------------------------------------- |
| G1  | gradients (page background, title text, buttons, chart bars, the promo card)            |
| G2  | shadows on cards and buttons that do not float                                           |
| G3  | weights above 500 (semibold, bold, extrabold, black)                                     |
| G4  | type sizes off the scale or too large (text-4xl, text-3xl, text-lg, text-base body)      |
| G5  | colours off the theme: several accents (indigo, violet, pink, emerald, orange, purple)   |
| G6  | text lighter than neutral-600 (`text-gray-400` labels and lines)                         |
| G7  | two primary actions ("New order" and "Export report"), both filled                      |
| G8  | corners off the scale (rounded-3xl, rounded-2xl, rounded-full buttons)                   |
| G9  | emoji as icons and in titles                                                             |
| G10 | uppercase, widely tracked labels (Continuum is sentence case)                            |
| G11 | centred hero-style page head (a tool page is left-aligned, title + line + actions)       |
| G12 | the KPI row and the chart's footer line repeat each other (total revenue twice)          |
| G13 | hand-rolled button, select and table where the library has them                          |
| G14 | 2px borders                                                                              |
| G15 | glassmorphism (`backdrop-blur`, translucent white cards)                                 |
| G16 | marketing tone in a tool: "Pro tip", "Welcome back, Mira! 👋", the campaign card         |
| G17 | no dark mode: hard-coded light colours (`bg-white`, gray-*)                              |

Engine (`audit_source`): found G2, G3, G5, G6, G8, G13, G14 and gradients only as their colours. Missed G4 (no
type-size findings at all), G7, G9, G10, G11, G12, G15, G16. Some fixes map to the wrong role: a gray border
(`#f3f4f6`) to `primary-50`, a pink wash to `error-50`, an indigo select background to `action`, body text
`#101828` to `neutral-900` where primary text is `neutral-950`.
