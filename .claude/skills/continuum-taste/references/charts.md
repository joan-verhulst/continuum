# Charts

The chart kit, `continuum/charts`: which chart answers which need, the card every chart sits in, the plot, the
marks, colour, hover, motion, and each chart's own entry. It is a separate entry from the library and draws every
mark itself, with no chart library under it. A chart holds no colour or size of its own: it names the data
colours and the chart chrome (both in `foundations.md`, Data colours), the corners and the type, so a theme or a
mode switch restyles it. The values here are the kit's, read from its source; a canvas draws the same numbers.
"13/500" means 13px at weight 500, and "tint" means a mark's own colour at 20%.

A chart takes its rows and its series as props, and an `aria-label` that says what it shows.

## Which chart

| Need                                                              | Chart                                    |
| ----------------------------------------------------------------- | ---------------------------------------- |
| A measure over time, the figure a page leads with                 | AreaChart, in a ChartCard                |
| Three or more series over time; a rate, where the level matters more than the amount under it | LineChart |
| A comparison across categories or whole periods; parts of a total (`stacked`) | BarChart                   |
| The same with long names or many rows, each bar carrying its figure | HorizontalBarChart                     |
| A ranked list of names in a list card, where the names are the point | BarList (`components.md`), not a chart |
| Shares of a whole, five at most                                   | DonutChart (`half` for a short card)     |
| Shares of a whole with many parts, each with its change           | Treemap                                  |
| Steps in order and what is lost between them                      | FunnelChart                              |
| Several measures of one thing, as a profile; two things compared  | RadarChart                               |
| Amounts by a category that goes round: hours, weekdays, months    | RoseChart                                |
| A measure against its target and the ranges that say how good it is | BulletChart                           |
| How each service's days went: up, degraded, down                  | UptimeStrip                              |
| Things with three measures (across, up, size), maybe a group      | BubbleChart                              |
| A price over time, as a line or as candles                        | CandlestickChart                         |
| One figure and its change                                         | StatCard (`components.md`), not a chart  |

In doubt, the plainer chart: a bar before a rose, a line before a radar.

## The card

Every chart sits in a card, the same for every chart: **ChartFrame** takes any chart as its child, and
**ChartCard** is a ChartFrame holding an area, line or bar chart (`kind`, `area` unless given) that builds the
key and the figures for it.

- `card` corners (16), hairline, surface, **24** padding. Two parts with clear room between: the head, then
  the plot **20** below it.
- **The head**, top to bottom:
  - The **title** line, 34 high (the controls' height), so the title and the controls read as one line, 16
    apart: an optional 16 `icon` 8 before the title (for a dashboard of many cards), the title 13/500
    `neutral-600` truncating, and at the right the card's own controls, 4 apart, the group pulled 8 into the
    padding so a ghost icon button's glyph lines up with the edge.
  - The **figure** (`value`) under it: 24/500 `neutral-950`, tabular, the loudest thing on the card; nothing in
    the chart is as large, so the eye lands on it first and reads the chart as where it came from. After it, 8
    apart on its baseline, the **change** (`delta`, the figure alone: "+10.7%") at 13/500 and **what it is
    measured against** (`comparison`: "on last week") at 13/400 `neutral-600`. A rise is `success-500` mixed
    62% into `neutral-950`, a fall `error-500` mixed 80% into `neutral-950`, so both stay deep on a light
    surface and clear on a dark one; `trend` sets the way (`neutral` writes it in `neutral-600`), and without it
    a leading minus reads as down. A figure with no change to show still reads without the line.
- **The plot**: the key, then the chart **10** under it. The key names the chart's colours, so it stands close
  over the chart it names, never at the head's right.
- **Actions** are the card's own controls only: a range, a metric, a view (a segmented control, a small select).
  What narrows the data, a filter or the page's period, belongs to the page around the card, not to the card.
- **The figures menu**: given a `table` (columns and rows), the head ends in a ghost ⋮ icon button ("The chart's
  figures") opening a menu of **Download CSV** and **Copy for a sheet** (tab-separated; it says "Copied" for a
  moment). A ChartCard builds the table from its data and offers it unless `figures={false}`. `filename` names
  the download; the title unless given.
- `onOpen` adds a ghost arrow icon button at the head's end, where the chart opens in full.
- `variant="framed"` sets the plot on a stage of its own: the card on `panel` corners (20), the canvas fill
  (`neutral-100`), 4 padding; the head 20 from the sides, 16 from the top, 20 above the stage; the stage the
  surface with a hairline, 20 padding, its corner the panel's less the 4, so the two stay concentric.
- A card never repeats a stat card's figure, and a stat card never repeats the card's.

**The key**, ChartKey: an item per series, 24 high, `chip` corners, 6 side padding, 4 apart, wrapping: a
3 × 12 upright stroke of the series' colour (round), and 8 after it the name 13 `neutral-600`. The row is pulled
6 left so the first stroke stands on the card's edge. Given `onToggle`, each item is a toggle (hover the 5% wash,
the focus ring): a series switched off leaves the chart and gives the rest its room, keeps its place and colour
in the key, struck through in `neutral-400` with its stroke at 30%, so it can be found to turn back on; the last
series showing stays on. A ChartCard with two series or more draws the key as toggles itself; with one there is
no key, the title names it.

**ChartLegend** is the key for a part-of-a-whole chart: `inline` (13 `neutral-600`, 16 across, 4 down) or `list`
(rows 12 apart, the name truncating, the figure 13/500 `neutral-950` tabular at the row's end), beside a donut or
under a breakdown, where it carries the figures so the slices do not.

## The plot

- **A frame**: the plot stands in a hairline frame of its own (the frame colour, a shade quieter than the card's
  hairline) on `item` corners (10), so it reads as a place inside its card instead of melting into it. The frame
  hugs the data: no padding between the frame and the marks.
- **Marks are clipped** to the frame's rect and corner: nothing runs past its hairline or its round. The grid is
  inside with them.
- **Axis text stands outside** the frame: y labels right-aligned **8** left of it, centred on their rule; x labels
  in a 20 band under it, their baseline 16 below the frame's foot. On a line the first and last x label align
  with the frame's ends; under bars each is centred on its bar. The y gutter is as wide as the widest label,
  measured in the theme's font. 8 is left over the plot for a point at the top.
- **The grid** is horizontal hairlines in the grid colour at the y ticks (four unless given), crisp on the whole
  pixel. An area of one or two series drops the rule at its baseline: the fill's edge is the baseline. On its side
  the grid turns upright.
- **Round charts are unframed**: the donut, the radar and the rose. Their marks are still held to an unseen square
  on the item corner, and their names stand outside it, 8 away.
- The funnel, the treemap, the bullet's tracks, the uptime rows and the bubble plot are framed the same way, each
  frame hugging its marks.

## Type inside a chart

Three sizes and no more:

| What                                                                      | Type                         |
| ------------------------------------------------------------------------- | ---------------------------- |
| A part's figure: a donut's centre, a funnel step, a treemap tile, a bullet row above its line | 18/500 `neutral-950`, tabular |
| Names: a funnel step, a tile, a bullet row, a service; the readout; the key | 13 (`neutral-600` for a name, 13/500 `neutral-950` for a value) |
| Axis labels, spoke and wedge names, ring values, captions, a figure inside a bar | 11 in the label colour, tabular |

The card's own figure at 24 stays the only thing larger. A named thing being read turns `neutral-950`.

## The marks

- **The look**: a tint of the colour with a **solid edge on the data side**, as a line stands over the tint under
  it. An area's line over its wash, a tinted bar's 2 edge at its head, a donut slice's 2.5 edge along its outside,
  a rose wedge's 2, a bubble's 1.5.
- **Lines**: 2 wide (1.5 for a muted series), round caps and joins. `curve`: `smooth` (unless given) never
  overshoots a neighbour, so a peak stays the peak; `linear` runs straight; `step` holds each value across its
  own period, for a measure only ever true of that period. A single reading is a 3 dot. `points` rings each
  reading (2.5, the surface inside, a 1.5 edge) for a chart of few readings worth pointing out.
  `incompleteFrom` dashes the line (6 on, 4 off) from the row whose period is not over.
- **An area's wash**: the series' colour at 20% at its peak to 8% at the baseline, held all the way down rather
  than fading to nothing, on a foot rounded to the item corner. One or two series take the wash; three or more
  are lines, since two washes over each other read as a third colour.
- **Bars** are solid unless given: flat on the baseline, rounded at the head by the item corner or half the bar's
  width, whichever is less, so a bar is never a pill; a bar under zero hangs from the baseline, rounded at its
  foot. A bar takes half its slot up to 28 (24 on its side), a group of bars 70% of the slot, the bars in a group
  2 apart, none narrower than 2.
- **Stacked** segments stand **2** apart, so a change of colour is a seam and not a smear, and only the stack's
  head is rounded; where two segments meet it is square. The readout adds a Total under a full-width hairline.
- **A tint marks one series out**: `fill="tint"` on one series (a forecast, a plan still in trial) draws it as a
  tint with its edge. A tint on every series says nothing.
- **A muted series** (`muted`) is grey and drawn under the rest: the period before.
- **Texture** is a theme's choice (`chartTexture`, `theming.md`), none by default: diagonal stripes (45°, 7
  apart) or a field of dots (6 apart) in every tint, strongest at the top. A chart may ask for one, or `none`,
  itself (`texture`, on the chart or on one series).
- **Markers** (`markers`, by row): a note on the time axis, a release or an outage. A 28 round pin inset 4 inside
  the plot's top edge, the surface with the `float` shadow and a ring of its tone (500 at 40%; `neutral-300`
  plain), a 16 icon or a 10 dot of its tone; a hairline in `neutral-400` down to the foot and a small dark
  triangle under it on the axis. Its label shows under it on hover or focus: 11/500 in a small surface chip.

## Colour

- **Independent series** take `series-1` to `series-5` by position. A sixth is grey, never the set again: two
  series in one colour is worse than one without. Fold the small ones into "Other", or show several charts.
- **Steps in order** (a funnel's) walk `chart-1` to `chart-5`; past five they walk again from the second, so two
  neighbours never match.
- **Tones** (`success`, `warning`, `error`, `neutral`) where the measure itself is good or bad: an uptime day, a
  candle's rise and fall, a marker's news. Never to make a series louder.
- **Shades of one colour**, for parts of a single measure: 100, 80, 60, 45 and 33%.
- A donut folds its sixth part and on into one grey "Other"; a key beside it folds the same way, so the two agree.
- **Never colour alone**: two series or more always have a key; a part-of-a-whole chart names its parts (the
  funnel's names, a tile's name, a list legend with the figures); and every chart carries its figures as a table
  for a screen reader.

## Hover and reading

- **The pointed thing stays; the rest dims to 35%** over 150ms: a donut slice, a funnel step, a rose wedge, a
  bubble, a bullet row, an uptime day. A treemap tile deepens instead (its tint 16% to 26%), a radar spoke
  darkens to `neutral-400`.
- **A plotted chart marks where it is read**: a line or area chart a crosshair, 1px in the crosshair colour,
  fading out over its top and bottom 14%, with a 4 dot of each series' colour ringed 2 in the surface; a bar
  chart a band over the column, the band colour on item corners, inset 2 a side; the bar chart on its side the
  same band over the row. A reader aims at a column or a row, never at a thin bar.
- **One readout surface** for every chart, ChartTooltip, also exported for a custom readout: at least 140 wide,
  `item` corners, hairline, surface, the `float` shadow, 12 padding; the title 13/500 `neutral-950` 8 over the
  rows; a row per series 6 apart, its 3 × 12 stroke and name 13 `neutral-600`, then its value 13/500 tabular 16
  away. The value leads the eye, the legend's order inverted: the reader knows the series and wants the figure.
  A total or a note goes in a footer under a full-width hairline, 12 side, 8 vertical. Beside a line's rule the
  readout is a bubble: its bottom corner on the rule's side square, the rest round; beside a bar, all round.
- The readout of a plotted chart stands at the plot's top, 12 off the rule on the side with more room, and holds
  that height: a panel that jumps is worse than one that covers a little of a line the reader is not on.
- **Keyboard**: the plot is one tab stop; the arrow keys walk the points or rows, Home and End go to the ends,
  Escape lets go, Enter picks (`onSelect`), as a click does. The reading is announced as it changes.

## Motion

- **One reveal**: the marks wipe in from the left (a bar on its side, from its foot) once, over 700ms on
  `cubic-bezier(0.22, 1, 0.36, 1)`, in the time a reader takes to look at the card; it says which way the axis
  runs before a label is read. It is the one motion past the system's 400ms, and only on entering. It is a
  keyframe, so a chart printed or in a background tab is still drawn.
- A chart fades in over 200ms once it knows its width, rather than jumping into place.
- Hover, the dimming and the key's toggles change over 150ms. Nothing else moves; the data never springs.
- **Reduced motion**: no reveal and no transitions; the chart is simply there.

## States

- **Loading** (`loading`): the plot is one quiet block, `neutral-950` at 4% on item corners, with a band of light
  crossing it; no stand-in line, no grid, no old data at half strength. It takes the room the plot will, so
  nothing moves when the data lands.
- **Empty**: the line "No data yet" (`emptyLabel`), 13 `neutral-600`, centred where the plot would be, with no
  axes. A chart with no plot of its own (a rose, a bullet, an uptime strip) shows it in a dashed panel on item
  corners.

## Size

- **Widths follow the container**, measured as it changes; a chart answers to the room it is given, never to the
  screen. **Heights are props**, each with a default (below), and include the axis.
- Only as many x labels as fit, 16 apart; a date axis is read in five places at most. The y gutter follows the
  font.
- **Dense data gathers**: a line or area plot draws at most 60 marks, each given at least 8 of width (never
  fewer than 12 marks). Past half again as many readings, each mark is a period's average, and the readout names
  the period and the low to high it came from. A narrow plot gathers into longer periods rather than turning to
  hatching.
- Each chart narrows in its own way, given in its entry.

## Each chart

### AreaChart · LineChart · BarChart

**For** a measure over time (area), three or more series or a rate (line), a comparison across categories or
whole periods (bar). **Not for** a ranked list of names (BarList), shares of a whole (donut, treemap).

- Props: `data` (rows), `x` (the field across: a Date or number is a measure, a string a category), `series`
  (`key`, `name`, `color`, `muted`, `fill`, `texture`), `height` (240; 220 in a ChartCard). `stacked` (bars),
  `formatX`, `formatTitle` (the readout's title, the long date unless given), `formatY` (the axis, compact en-GB),
  `formatValue` (the readout alone), `yMax` (a ceiling, for a rate), `xTicks`, `yTicks`, `curve`, `points`,
  `incompleteFrom`, `markers`, `texture`, `fill`, `grid`, `xAxis`, `yAxis`, `tooltip` (false, or a function
  writing its own readout), `onSelect`, `onRead` (the reading, for a card that shows it in its own head),
  `loading`, `emptyLabel`. A child drawn in the plot's coordinates reads them with `useChart()`.
- In a card, use **ChartCard** with these props and the card's.

### HorizontalBarChart

**For** the bar chart on its side: categories with long names or many rows, each bar carrying its figure.
**Not for** a ranking where the names are the point and nothing is stacked (BarList).

- The bar chart's props under the bar chart's names (`x` is still the category, `formatY` the value axis), so one
  becomes the other by its name alone. Stacked unless `stacked={false}`.
- Rows given 36 each unless `height` is; names down the left 11, cut short past 36% of the width rather than
  squeeze the bars; the value axis at the foot, about one label per 100 of width.
- A segment's figure sits inside it (`labels`) where it fits with 6 clear a side and the bar is at least 15
  thick, at 11/500, near-white on a deep fill and near-black on a light one; otherwise the readout has it.
  `total` writes each bar's sum 6 past its end.

### DonutChart

**For** shares of a whole, five at most, in a card beside a ChartLegend in its `list` layout, 16 apart. **Not
for** a change over time, or parts that do not add up to a whole.

- `data` (`name`, `value`, `color`), `size` (160 across), the ring 14% of the size thick (14 at least), slices a
  little apart with 4 corners, tinted with an edge unless `fill="solid"`.
- The total sits in the middle at 18 over `label` at 11; pointing at a slice puts its figure and "name · share"
  there instead. `total={false}` in a card that already leads with the total: the middle stays empty until a
  slice is pointed at.
- `half` draws the top half of the ring, left to right, the figure standing on the line its two feet stand on:
  the same shares in half the height, for a short card or a row of them.

### Treemap

**For** shares of a whole with many parts, each tile as large as its share and as square as the shares allow,
the largest at the top left. **Not for** figures to be compared closely, or values below zero.

- `data` (`name`, `value`, `delta`, `icon`, `color`), `height` (280), `formatValue` (the share unless given).
- Tiles 4 apart, held 5 inside the frame (whose corner is the item corner plus 5, so the two stay concentric);
  each on item corners, 20 padding, a 16% tint of its colour. A tile says as much as it has room for: its name
  13/500 `neutral-950` with its stroke or a 14 icon (at 96 × 56), then its figure at 18 (at 80 × 84), then its
  change as a pill in a deeper tint of its own colour (at 120 wide). A tile too small for its words is read out
  beside it.

### FunnelChart

**For** steps in order and what is lost between them: one smooth shape narrowing step by step. **Not for**
categories with no order (a bar chart).

- `data` (`name`, `value`), `height` (160, the shape alone).
- Each step's figures stand over its column, outside the frame, so they never push the shape down: the name 13
  `neutral-600` with its stroke, the figure at 18, and under it at 11 the share of the first that got this far
  and, in `error-600`, what was lost from the step before.
- The shape fills its frame side to side, each step in its step colour (14% outside, a stronger 20% core, a 2 line
  on both edges), steps 2 apart, a faint upright rule where two meet.

### RadarChart

**For** several measures of one thing as a shape, two things compared on them. **Not for** fewer than three
spokes, more than two or three series, or measures on unlike scales.

- `data` (one row per spoke), `x` (the spoke's name), `series`, `height` (300).
- Each series is a 2 line over its tint; the second and later take a texture (`stripes` unless given; `none` for
  plain) so two shapes over each other stay two. The rings' values are written once, as 11 pills, on the quietest
  side. Pointing reads every series out along the nearest spoke.

### RoseChart

**For** amounts by a category that goes round: hours of a day, weekdays, months. **Not for** categories with no
cycle (a bar chart).

- `data` (one row per wedge, in order round the clock), `x`, `series` (several are stacked outward, the whole
  wedge the total), `height` (320), `fill`.
- The radius grows as the root of the value from a small hole, so a wedge's area is what is read: twice the value
  is twice the ink. Wedges and rings 2 apart, a 2 edge. The names are thinned to every second, third or fourth
  when the circle is crowded, in a step that goes into the whole (00, 03, 06).

### BulletChart

**For** a measure against its target and the ranges that say how good it is, several rows read down a card: a
quarter's goals. **Not for** a value with no target or ranges (Meter, `components.md`).

- `data` rows: `name`, `value`, `target`, `ranges` (where each range ends, lowest first), `min`, `max`,
  `lowerIsBetter` (the ranges deepen towards the high end, the target met by staying under), `format`.
- A 16 track on item corners: the ranges as washes of `neutral-950` (6, 11, 17, 23%), deepest where the measure
  is poorest; the measure a 6 bar in front, flat at its start and rounded at its head; the target a 2 upright tick
  in `neutral-950`.
- `layout`: `above` (unless given) writes the name and the figure (18) over the line, rows 28 apart, for a narrow
  card; `beside` keeps the name left (160 at most) and the figure (13/500) right, rows 12 apart, for a wide one.
  "of 500" or "target ≤ 2 h" follows the figure at 11.

### UptimeStrip

**For** how each service's days went, the most recent at the right. **Not for** a continuous measure (a line
chart).

- `services` (`name`, `days` of `date`, `state`, `downtime`, `note`), `days` (90), `blockHeight` (28).
- A day is a block, 2 apart, on 2 corners, in its state: operational `success` at 45% (the usual day is a tint,
  so the days that went wrong carry), degraded `warning`, outage `error`, no data `neutral-200`. The name (13
  `neutral-600`, 192 at most) left, the uptime (13/500) right, each 8 from the row's frame.
- A block narrower than 3 stops reading as a day: the row shows fewer, the latest, instead. Under 520 wide the
  name and the uptime go over the row.
- Give it a ChartKey of its states.

### BubbleChart

**For** things with three measures: one across, one up, one as each bubble's area (twice the value, twice the
ink), and a group that may colour them. **Not for** two measures alone, or many hundreds of points.

- `data`, `name`, `x`, `y`, `size`, `group` and `groups` (the groups' names and colours, as series), `xLabel`,
  `yLabel`, `sizeLabel`, `xScale` and `yScale` (`log` for a measure over several powers of ten), `labels` (how many
  of the largest are named, 3), `sizeKey`, `height` (340).
- The largest bubbles are drawn first so a small one is never hidden. The largest radius follows the plot's room.
  Give it a ChartKey of its groups.

### CandlestickChart

**For** a price over time, put together as a trading screen is. **Not for** any other measure (a line chart).

- `data` (`time`, `open`, `high`, `low`, `close`, `volume`), `type` (`line` unless given, or `candles`), `height`
  (360, its axis and control bar included), `volume`, `average` (a moving average over that many periods),
  `spans` (1W, 1M, All …), `zoomControls`, `range` with `onRangeChange` (or `defaultRange`), `digits`,
  `formatPrice`, `formatTime`.
- A rise is a tint with a solid edge, a fall solid, so the two are told by form as well as by tone (`success`,
  `error`). Prices are read on the right; the latest close is tagged on a dashed rule. Drag pans, ctrl or ⌘ with
  the wheel (or a pinch) zooms about the pointer, shift-drag marks a stretch, a double click shows it all.

## On a canvas

Draw a chart from these values: the card, then the plot's frame on item corners, the grid as hairlines, the marks
in the data colours as tints with their solid edge, the labels outside at 11 in the label colour, and the key 10
over the chart.
