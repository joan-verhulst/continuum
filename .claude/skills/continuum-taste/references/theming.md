# Theming

Continuum has one default look and a builder for others. The default is not a theme: pure greys, a near-black
action, Geist, pill docks, filled segments. A theme is a handful of choices laid over it, and every theme works
in light and dark, because dark mode reverses the ramps rather than restyling anything.

## What a theme can change

| Choice        | Values                                   | What moves                                                                    |
| ------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| `accent`      | a hex colour                             | the primary ramp's `accentStep` becomes this colour; the other steps are built around it as Tailwind builds its palette (fixed ends, a middle placed by the hue, chroma a share of the gamut); the data colours lead with it |
| `accentStep`  | `50` … `950`, `500` unless given         | which step the accent is                                                      |
| `gamut`       | `p3` · `srgb`                            | the colours the ramps may use: Display P3, as Tailwind's palette, or only what every screen shows |
| `curves`      | `{ primary?, neutral? }`, each a shape   | a ramp's curves, whole at a time: the lightest and darkest step, the midtones, the saturation, how the ends taper, the hue's drift and its turn at either end |
| `curves.*.steps` | `{ '300': { l?, c?, h? }, … }`, absolute oklch | single steps set by hand over the curves, per channel: the curve controls move every other step and leave these; a chroma not set keeps the step's share of the gamut; clamped to the gamut; a primary's seed ignores its entry. Use it for the one step a curve cannot place, never to draw a ramp step by step |
| `neutral`     | `{ hue, tint }`                          | the greys take a faint chroma towards the hue: `tint` is their chroma at the 500 (0 pure grey; 0.006 barely warm; 0.012 clearly tinted; 0.046 is slate). It rises to that from the 50 as Tailwind's tinted greys do, and holds from the 500 into the 950, so the tint shows on a dark surface and in text |
| `chartHarmony`| `auto` · `analogous` · `complementary` · `split` · `triadic` · `tetradic` · `square` · `monochrome` · `custom` | how series 2 to 4 are found from the primary: auto takes the hues that stay furthest apart for every reader; the others turn the primary's hue on the oklch wheel (30° and 60°; 180°; 150° and 210°; 120° and 240°; 60°, 180° and 240°; 90°, 180° and 270°; the primary's own steps). Each series takes the step that keeps it in the mode's lightness band and apart from its neighbours, colour-blind readers included. A harmony is worked within by three more choices: `chartSpread` widens or narrows analogous (30°, the outer hue twice as far), split complementary (30° either side of the opposite) and tetradic (a rectangle 60° wide); `custom` places series 2 to 4 at `chartTurns`, turns of the primary's hue in that order; `chartSteps` holds a hue at a light-mode step by hand (3 to 8, the 300 to the 800; null leaves it to the search), dark mode holding the same place in its band, a step lighter |
| `chartLead`   | `{ turn?, step? }`                       | series 1 put by hand: `turn` is its hue as a turn of the primary's, `step` its light-mode step (3 to 8, the 300 to the 800). Without it series 1 is the primary's own 500 in light mode. The harmony's hues are turns of series 1's, so the set follows it |
| `font`        | `geist` · `inter` · `instrument-sans` · `ibm-plex-sans` · `figtree` · a family of its own | the family of everything |
| `action`      | `accent` (unless given) · `neutral`      | what the primary button, checked controls, the active rail item and the selected dock item fill with: near-black, or the accent. On the accent the label is the palest grey wherever it keeps 3:1, the deepest only below that |
| `actionStyle` | `flat` · `lit` · `glossy`                | flat is plain; lit adds a 1px inner highlight on top and a 1px ring; glossy adds a gradient as well |
| `tint`        | `neutral` · `accent`                     | the selection wash: translucent grey, or the accent's palest step (its 50) with its 700 as the text (the 300 in dark) |
| `nav`         | `quiet` · `tinted` · `raised`            | the page you are on in the sidebar: `quiet` the wash; `tinted` the primary's 100 with its 700 (in dark the 600 at 20%, with the 200); `raised` a card on the canvas (the surface, a hairline, a faint shadow; in dark the canvas lit 7%). The foldouts that hold it stay plain in every look, their guide line darkened to it. Never the action's fill: it would read as a button |
| `elevation`   | `flat` · `full`                          | what casts a shadow: `flat` only what floats; `full` cards and table frames (`shadow-card`; the app panel stays flat) and the controls on them (`shadow-control`: fields, selects, secondary buttons, segmented controls, checkboxes). Every shadow stays short and faint. In dark, where a black shadow barely shows on the near-black canvas, both also take a faint light top edge |
| `shadowStrength` · `shadowSize` | numbers, 1 unless given          | with `elevation` past `flat`: how dark the shadows are (0.25 to 3) and how far they reach (0.5 to 3) |
| `radius`      | a number                                 | the corner scale: 0 squares every corner, 0.5 halves, 2 doubles (capped 8px past each corner's own size) |
| `charts`      | `{ steps, dark?, series? }`              | data colours of the theme's own in place of the set the harmony finds        |
| `chartTexture` | `none` (unless given) · `stripes` · `dots` | a texture in every tint a chart draws (an area's wash, a tinted bar); a chart may still ask for one, or none, itself (`charts.md`) |
| `type`        | px, 13 unless given                      | the base type size; every size on the scale and its line height follow it, each rounded to a whole pixel |
| `tracking`    | em, 0.025 unless given                   | letter spacing for everything: `--tracking-normal` (0.32px at 13px); below 0 tighter |
| `leading`     | a share of the size, 1.25 unless given   | line height for every size on the scale and for plain text (`--leading-normal`), each rounded to a pixel |
| `unit`        | whole px, 4 unless given                 | the spacing unit every padding, gap, margin and offset is a multiple of; the steps between units each round to a pixel. Sizes do not follow it: widths, heights and icon sizes stay on a fixed 4px grid, and the widths of panels, popups and fixed columns (the sidebar, a toast, a popover, a menu) are fixed pixels |
| `size`        | a number, 1 unless given                 | every fixed height times this, each rounded to a whole pixel: controls, rows, bars, the dock |

A theme may make the whole product denser or roomier with `type`, `unit` and `size`, three choices made each on
its own. The playground offers each as a judged set of three: type 12 · 13 · 14 (small, default, large), unit
3 · 4 · 5 (tight, default, roomy), heights 0.9 · 1 · 1.1 (compact, default, large). The proportions stay the
system's: every size on the type scale moves together, every padding stays a multiple of one unit, and the
two control heights stay two. The hairline and the anatomy of every page are the system's in every theme. A
theme is a look, not a layout.

## Where a theme comes from

- **The playground's projects**: each project is a product and its theme, built from a clear start in six steps:
  the primary colour, the neutral colour, the chart colours, the font and controls, the sizes (type, padding and
  heights, each a choice of three rather than free numbers), then a review. A preview panel beside the page takes
  the theme; its check layer marks every pair the roles name with its contrast, simulates colour-blind vision and
  opens a contrast grid, and the review puts any pair that misses before the theme is used. Using it makes it the
  theme the whole playground wears while that project is the current one.
- **`createThemeCss(options)`** in code turns the same choices into a `.continuum[data-theme="name"]` block.
- **The export**, from the review, hands a project two files: `app.css`, the whole theme as a Tailwind v4 entry in Tailwind's own
  names (light in `@theme`, dark under `[data-mode="dark"]`), and `DESIGN.md`, a brief for Claude: how the
  project is set up, the theme in words, and the rules in short. Put `DESIGN.md` at the root and add
  `@DESIGN.md` to `CLAUDE.md`.

## Applying it

**In code**, a project takes the exported `app.css` as its Tailwind entry: every value in Tailwind's own names
(`--color-primary-500`, `--color-action`, `--radius-card`), light in `@theme` and dark under
`[data-mode="dark"]`, with the corners already worked out to pixels at the theme's scale. To change the look,
change those names (and their dark counterparts with them), or build the theme again in the playground and
export it. A project never writes `--continuum-*` names: they are the engine's own, and `app.css` leaves them
out.

```tsx
<Theme mode="dark">…</Theme>
```

Themes nest; `useTheme()` reads the current one. Inside this repo, where the library's own stylesheet is used,
`createThemeCss` writes a theme as a `.continuum[data-theme="name"]` block and `<Theme theme="name">` opens it;
the corner scale is a theme choice (`radius`), set in the builder, not on a component.

**On a canvas**, a theme is a second token set (or mode) with the accent ramp, the tinted greys, the font and
the action value swapped; the parts need no redrawing. A project that exports `app.css` has the values ready to
paste as tokens.

**In the words of a project**, the theme is three or four lines of `DESIGN.md`: the accent, the greys, the
font, how the action draws, the corners. Everything else is the system.

## Choosing

Use the default unless the product has a colour or a mood of its own. Then: the accent is the brand colour at
500; the greys take a little of its hue (0.006–0.012); the action goes to the accent only if the product wants
colour on every button, otherwise it stays near-black and the accent appears in badges, charts and the tint;
`lit` or `glossy` only for a product that wants a tactile button. Check every page in light, dark and with the
action on the accent before settling.
