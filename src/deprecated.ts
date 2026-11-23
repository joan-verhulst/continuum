/*
 * The old names of renamed parts, kept so code written against them still builds. Each is the new
 * part under its old name; use the new one.
 */

export {
    /** @deprecated Renamed to AssistantPrompt. */
    AssistantPrompt as ChatPrompt,
    type AssistantPromptProps as ChatPromptProps,
} from './components/assistant-prompt';
export {
    /** @deprecated Renamed to EditableCell. */
    EditableCell as TableEditCell,
    type EditableCellProps as TableEditCellProps,
} from './components/editable-cell';
export {
    /** @deprecated Renamed to MenuItem. */
    MenuItem as PopoverItem,
    /** @deprecated Renamed to MenuItemIndicator. */
    MenuItemIndicator as PopoverItemIndicator,
    type MenuItemProps as PopoverItemProps,
    /** @deprecated Renamed to MenuItemShortcut. */
    MenuItemShortcut as PopoverItemShortcut,
} from './components/menu-item';
export {
    /** @deprecated Renamed to MessageComposer. */
    MessageComposer as ChatComposer,
    /** @deprecated Renamed to MessageComposerAttachItem. */
    MessageComposerAttachItem as ChatComposerAttachItem,
    type MessageComposerProps as ChatComposerProps,
} from './components/message-composer';
export {
    /** @deprecated Renamed to NavRail. */
    NavRail as Rail,
    /** @deprecated Renamed to NavRailItem. */
    NavRailItem as RailItem,
    type NavRailProps as RailProps,
    /** @deprecated Renamed to NavRailSeparator. */
    NavRailSeparator as RailSeparator,
    /** @deprecated Renamed to NavRailToggle. */
    NavRailToggle as RailToggle,
} from './components/nav-rail';
export {
    /** @deprecated Renamed to ReadonlyField. */
    ReadonlyField as ValueField,
    type ReadonlyFieldProps as ValueFieldProps,
} from './components/readonly-field';
export {
    /** @deprecated Renamed to TableTree. */
    TableTree as TableFold,
    /** @deprecated Renamed to TableTreeCell. */
    TableTreeCell as TableFoldCell,
    /** @deprecated Renamed to TableTreeHead. */
    TableTreeHead as TableFoldHead,
    /** @deprecated Renamed to TableTreePanel. */
    TableTreePanel as TableFoldPanel,
    /** @deprecated Renamed to TableTreeRows. */
    TableTreeRows as TableFoldRows,
    /** @deprecated Renamed to TableTreeTrigger. */
    TableTreeTrigger as TableFoldTrigger,
} from './components/table-tree';
