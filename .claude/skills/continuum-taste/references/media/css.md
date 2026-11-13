# In plain CSS, or another framework

Without React (Vue, Svelte, Rails or Django templates, plain HTML), the system is the tokens plus the spec rows
in `components.md`, written as the project's own markup and styles.

## Setup

1. Copy `styles/tokens.css` from `assets/continuum/` into the project and load it. It sets every value as a CSS
   variable under Tailwind's names on the `.continuum` element: the ramps (`--color-neutral-200`), the action
   (`--color-action`, `--color-on-action`), the washes (`--color-selected`, `--color-tint`), the radii
   (`--radius-item`), the shadows (`--shadow-float`), the content widths (`--container-content`), and the base
   type (13px, line height 1.25, tracking 0.32px, Geist). Dark mode is `[data-mode="dark"]` on the same element:
   the ramps flip on their own.
2. Put `class="continuum" data-mode="light"` on the root of the app, and load Geist.
3. A theme is a `.continuum[data-theme="name"]` block written by `createThemeCss` (see `theming.md`); set
   `data-theme` on the root with the mode.

## Building a part

Each entry in `components.md` is the part's spec: anatomy, values, states. Write it as an element with those
values, reading every colour and radius from the variables:

```css
.button-primary {
    height: var(--spacing-control);
    padding: 0 16px;
    border-radius: var(--radius-control);
    background: var(--color-action);
    color: var(--color-on-action);
    font-size: var(--text-xs, 13px);
    font-weight: 500;
}
.button-primary:hover { background: var(--color-action-hover); }
.button-primary:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
```

Heights by their variables, never in pixels, so they follow a theme's height scale: `--spacing-control` (34),
`--spacing-control-lg` (38), `--spacing-control-sm` (28), `--spacing-segment` (29), `--spacing-chip` (25),
`--spacing-option` (36), `--spacing-option-md` (44) and `--spacing-option-lg` (56) for a popup row led by an avatar, `--spacing-row` (40), `--spacing-table-row` (41), `--spacing-tab` (44), `--spacing-bar`
(52), `--spacing-header` (54), `--spacing-nav` (56). Widths of panels and popups by their variables too, fixed
pixels that a theme's spacing unit never changes: `--spacing-sidebar` (256), `--spacing-rail` (52) and
`--spacing-rail-open` (208), `--spacing-popover` (288), `--spacing-menu` (160, a minimum) and `--spacing-menu-wide`
(192), `--spacing-filter-menu` (240), `--spacing-toast` (360), `--spacing-tooltip` (256, a maximum),
`--spacing-chart-tooltip` (140, a minimum), `--spacing-search` (256), `--spacing-presets` (144), `--spacing-measure` (480)
and `--spacing-measure-narrow` (288), `--spacing-conversation` (720) for an assistant's column and prompt; a dialog is 480, a sheet 512, the command menu 560, each never wider than
the viewport less 32. Colours by their roles: placeholders and hints `--color-neutral-600`, an unchecked
checkbox's border `--color-neutral-300`, a badge's text its tone's 800 on the tone's 500 at 20%, the focus ring
`--color-focus` (`neutral-500`). Side padding by kind; content padding from the spacing tables; the state
table for hover, selected, disabled, invalid. A selected row is `color-mix(in oklab, var(--color-neutral-950)
7%, transparent)`, which is what `--color-selected` holds. Nothing is ever a hex value in the project's styles.

## Behaviour

What Base UI gives the React parts (menus, selects, dialogs, tooltips, keyboard and focus handling) has to come
from the framework's own primitives or a headless library. Keep the ARIA roles and the data-state attributes the
spec rows mention (`data-checked`, `data-open`, `aria-current="page"`), and style off those.

## Composing and checking

The same as everywhere: the kind's anatomy from `pages.md` in the shell, checked at 1440 × 900 in light and dark.
