# Components

Everything `assets/continuum/index.ts` exports, grouped. Compound parts (`DialogContent`, `SelectItem`, `TableRow` …)
and the `*Variants` functions come with each family; read the component's file for its props. If something is
missing, build it with the recipe in `designing-new.md`.

- **Foundations:** `Theme` (mode · `theme` id · `radius` corner scale), `ThemeScope`, `useTheme`, `cn`, `focusRing`,
  `createThemeCss`, `createThemeVariables`, `isDefaultTheme`, `defaultThemeOptions`, `themeAccentRamp`,
  `themeNeutralRamp`, `hexToOklch`, `oklchToHex`, and the spacing formula (`boxPadding`, `boxGap`, `textGap`,
  `typeSize`, `spacingClass` …, used by the `fix-padding` skill)
- **App frame:** `AppShell` (`nav="side"`, the sidebar beside the panel, or `nav="top"`, a `TopNav` over it), `AppPanel`, `PageContent` (narrow · default · wide · dense · inset · full), `Sidebar` (+ header,
  logo, toggle, group, footer, account), `NavItem`, `NavGroup`, `Rail` + `RailItem`, `RailToggle`, `RailSeparator` (the main navigation as a floating island: 52px of icons named in tooltips, or 208px with labels once expanded; the current item sits on one action pill that slides between items), `TopNav` (+ `TopNavBrand`, `TopNavLinks`/`TopNavLink` and `TopNavActions`: the sidebar on
  its side for an app with a handful of sections, a 56px bar on the canvas with the account on the right; links
  that outgrow it scroll, with chevrons), `HeaderBar` (+ `HeaderBarStart`,
  `HeaderBarNav` (back and forward, ruled off full height; `usePageHistory` where there is no router), and
  `HeaderBarActions`; it holds a `Notice`), `BottomBar` + `Dock`/`DockItem`/`DockAction` (a large primary button
  with the dock's corners; a dock with more sections than fit scrolls, with chevrons, the selected one kept in view), `ContinuumMark`/`ContinuumLogo`
- **Navigation:** `Tabs` (panels of one object; `variant` line by default, on a hairline under a page or section title, or pill for a tight spot in a card or dialog; `TabsCount` after a label), `Breadcrumb` (one line, the page truncating first; `BreadcrumbMenu` folds a long middle
  into "…" or, with a `label`, switches workspace or project), `Pagination`, `CommandMenu` (⌘K: a dialog pinned
  near the top with a borderless search, groups of 36px rows that hide when they don't match, arrows and Enter;
  + content, input, list, group, item, empty, footer, `useCommandMenuShortcut`), `Stepper` + `StepperItem` (the
  steps of a long form, horizontal over it or vertical beside it with the step's fields inside; `value` sets the
  current step and `onValueChange` lets done steps go back; an item can be `invalid`; a narrow row keeps only the
  current label; `marker` is number, dot, icon or line, and a row sets its text beside each marker, or `centered` under it)
- **Actions:** `Button` (primary · secondary · ghost · tint, the theme's wash for AI actions beside the primary
  one; md 34px · lg 38px · icon · icon-sm; pill), `Toolbar` (inline · floating, the dock's height with the control
  corner) + `ToolbarButton`/`ToolbarChip`, `DropdownMenu` (a long one takes a `DropdownMenuSearch` on top and a `DropdownMenuEmpty`; the menu filters its own items), `Kbd`
- **Inputs:** `Field`/`FieldLabel`/`FieldHelper`, `Input` (sm 34 · md 38), `Textarea`, `Select` (the same two
  heights; trigger `indicator="right"` for the "Select ›" picker in a settings row), `Combobox` (+ input, chips,
  content, list, item, empty; `useComboboxFilter`), `Checkbox`, `RadioGroup`, `Switch`, `SegmentedControl`,
  `Slider`, `BlockSlider` (a box the value fills, sm 34 · md 38 · lg 48, with its label and value inside),
  `CodeInput` (one-time code, md · lg boxes), `Calendar`, `DatePicker`, `DateRangePicker` (with
  `defaultDateRangePresets`, `formatDate`, `formatDateRange`; these need `react-day-picker`), `DropZone` +
  `DropZoneFiles`/`DropZoneFile` (a dashed drop target with a secondary "Choose files", files under it with
  progress, done and error; `formatFileSize`)
- **Forms and settings:** `OptionRow`/`OptionList`, `SettingRow`/`SettingGroup` (title and description left,
  control right; groups spaced, not ruled), `ValueField` (read-only fact: a filled well with optional copy, or a
  `vital` pill row with a status dot)
- **Filtering:** `FilterMenu` (+ trigger with a count, content, group, item with a count, clear) and `FilterBar`
  (the trigger, a `Chip` per group and "Clear all"), with `toggleFilter` and `countFilters` over a
  `FilterValues` map
- **Overlays:** `Dialog`, `Sheet` (non-modal side sheet), `Popover` (+ trigger, content, header, title,
  description, close; `createPopoverHandle`), `PopoverItem` (the 36px row every popup list is made of: select,
  combobox, menu, filter menu and command menu items render their Base UI item through it, so they share padding,
  states and a corner nested one step inside the panel; slots `leading` (icon, `Avatar`, chip, or a
  `PopoverItemIndicator` checkbox or radio that follows the row's state), the name with `meta` inline after it (badges,
  a muted note) and an optional `description` line under it, and `trailing` (check, `PopoverItemShortcut`, count,
  icons, chevron)), `Tooltip`, `InfoTip` (a 16px info icon beside a title that explains
  it on hover, focus and tap)
- **Content:** `Card` (+ `CardTitle`, `CardValue`, `CardDelta`, `CardFigure`), `StatCard`, `Table` (ruled · rows),
  `DescriptionList`, `ActivityList`, `BarList` + `BarListItem` (ranked breakdown with bars, show more, rows as filter
  toggles), `Separator` (rarely; see Surfaces)
- **Labels and identity:** `Badge` (soft · pill · dot · count), `Chip` (a short value in a pill: `soft` for a filter, picked value or tag, removable with `onRemove`; `outline` with `onClick` for a prompt to click; `sm` 25px, `md` 29px), `Avatar`, `AvatarStack`, `IconTile`, `StatusDot`
  (+ `LiveCount`, the pulsing "129 Active now")
- **Status:** `Progress`/`Meter` (task progress and a measured amount such as usage or credits; label, caption,
  value; tones), `Spinner` (only inside a busy button: `<Button loading>`), `Skeleton`/`SkeletonText` (4%
  placeholders while loading), `Checklist` + `ChecklistItem` (onboarding steps with progress, the next one open
  with its action)
- **Messages:** `Alert` (an inline notice: a hairline card whose 32px icon well carries the tone, with an action that drops under the text below 384px inside, and
  dismiss), `Notice` + `useNotice` (the quiet toast: a tab that slides out from under a bar's hairline, the header
  bar's or a sheet's, for small actions with no undo such as "Saved" or "Link copied"), `ToastProvider` +
  `useToast` (a card in the bottom right corner, drawn in the opposite mode to the page: the thing (`title`, two
  lines at most), a line about it (`description`, three at most) and the type's icon or `data.icon` in a badge-toned
  36px well, then the action as an icon (`data.actionIcon`, an undo arrow for Undo; its label in a tooltip) and the
  ×; an optional `data.tab` sets a folder tab on top saying what happened, and the action moves into it; several
  pile up with the older ones peeking, and fan out on hover), `EmptyState` (dashed, left-aligned, one action)
- **Chat:** `ChatThread`, `ChatMessage` (own on the tint · other as a card; status), `ChatEvent` (centred system
  line), `ChatToken` (mono identifier chip), `ChatReference` (a linked record row), `ChatComposer`
- **Charts** (a separate entry, `continuum/charts`, i.e. the copied `charts/index.ts`; on visx, d3 and motion):
  compose a chart from parts. A root (`AreaChart`, `PieChart`, `FunnelChart`) sets up scales and context; its
  children read from it: `Area`, `PatternArea`, `SeriesMarkers`, `HighlightSegment`, `Grid`, `XAxis`, `YAxis`,
  `ChartTooltip` (with `TooltipBox`/`TooltipContent`/`DateTicker`), `PieSlice` + `PieCenter`. Also
  `AreaChartLoading`, `ChartStatFlow` (animated headline number), `ChartLoadingLabel`, `ShimmeringText`,
  `ChartConfigProvider` (springs) and the `useChart`/`usePie` hooks. Colours come from the `--color-chart-*`
  tokens.
