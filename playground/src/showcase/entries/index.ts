import { interactionEntries } from '../interactions';
import type { Entry, InUse } from '../kit';
import * as accordion from './accordion';
import * as activity from './activity';
import * as alert from './alert';
import * as assistantAnswer from './assistant-answer';
import * as assistantPrompt from './assistant-prompt';
import * as avatar from './avatar';
import * as badge from './badge';
import * as barList from './bar-list';
import * as blockSlider from './block-slider';
import * as bottomBar from './bottom-bar';
import * as branchGraph from './branch-graph';
import * as breadcrumb from './breadcrumb';
import * as button from './button';
import * as card from './card';
import * as areaChart from './charts/area-chart';
import * as barChart from './charts/bar-chart';
import * as bubbleChart from './charts/bubble-chart';
import * as bulletChart from './charts/bullet-chart';
import * as candlestickChart from './charts/candlestick-chart';
import * as donutChart from './charts/donut-chart';
import * as funnelChart from './charts/funnel-chart';
import * as horizontalBarChart from './charts/horizontal-bar-chart';
import * as radarChart from './charts/radar-chart';
import * as roseChart from './charts/rose-chart';
import * as treemap from './charts/treemap';
import * as uptimeStrip from './charts/uptime-strip';
import * as chatAttachment from './chat-attachment';
import * as chatMessage from './chat-message';
import * as chatReference from './chat-reference';
import * as chatSuggestions from './chat-suggestions';
import * as chatThread from './chat-thread';
import * as chatTyping from './chat-typing';
import * as checkbox from './checkbox';
import * as checklist from './checklist';
import * as chip from './chip';
import * as codeInput from './code-input';
import * as colorPicker from './color-picker';
import * as combobox from './combobox';
import * as commandMenu from './command-menu';
import * as dataGrid from './data-grid';
import * as datePicker from './date-picker';
import * as dateRangePicker from './date-range-picker';
import * as descriptionList from './description-list';
import * as dialog from './dialog';
import * as dropZone from './drop-zone';
import * as editableCell from './editable-cell';
import * as emptyState from './empty-state';
import * as field from './field';
import * as filterCondition from './filter-condition';
import * as filterMenu from './filter-menu';
import * as headerBar from './header-bar';
import * as holdButton from './hold-button';
import * as iconTile from './icon-tile';
import * as infoTip from './info-tip';
import * as input from './input';
import * as kbd from './kbd';
import * as menu from './menu';
import * as menuItem from './menu-item';
import * as messageComposer from './message-composer';
import * as meter from './meter';
import * as navRail from './nav-rail';
import * as notice from './notice';
import * as optionRow from './option-row';
import * as pagination from './pagination';
import * as popover from './popover';
import * as progress from './progress';
import * as radio from './radio';
import * as readonlyField from './readonly-field';
import * as segmented from './segmented';
import * as select from './select';
import * as settingRow from './setting-row';
import * as sheet from './sheet';
import * as sidebar from './sidebar';
import * as skeleton from './skeleton';
import * as slider from './slider';
import * as spinner from './spinner';
import * as statCard from './stat-card';
import * as statusDot from './status-dot';
import * as stepper from './stepper';
import * as switchEntry from './switch';
import * as table from './table';
import * as tableCell from './table-cell';
import * as tableDragCell from './table-drag-cell';
import * as tableHead from './table-head';
import * as tableTree from './table-tree';
import * as tabs from './tabs';
import * as thinking from './thinking';
import * as toast from './toast';
import * as toolbar from './toolbar';
import * as tooltip from './tooltip';
import * as topNav from './top-nav';
import * as truncate from './truncate';

/** Every component, in the order the grid shows them. */
export const entries: Entry[] = [
    sidebar.entry,
    topNav.entry,
    navRail.entry,
    headerBar.entry,
    bottomBar.entry,
    tabs.entry,
    breadcrumb.entry,
    pagination.entry,
    commandMenu.entry,
    stepper.entry,
    button.entry,
    holdButton.entry,
    toolbar.entry,
    menu.entry,
    kbd.entry,
    input.entry,
    field.entry,
    select.entry,
    combobox.entry,
    checkbox.entry,
    radio.entry,
    switchEntry.entry,
    segmented.entry,
    slider.entry,
    blockSlider.entry,
    codeInput.entry,
    colorPicker.entry,
    datePicker.entry,
    dateRangePicker.entry,
    dropZone.entry,
    optionRow.entry,
    settingRow.entry,
    readonlyField.entry,
    filterCondition.entry,
    filterMenu.entry,
    chip.entry,
    dialog.entry,
    sheet.entry,
    popover.entry,
    menuItem.entry,
    tooltip.entry,
    infoTip.entry,
    card.entry,
    statCard.entry,
    table.entry,
    tableHead.entry,
    tableCell.entry,
    editableCell.entry,
    tableTree.entry,
    tableDragCell.entry,
    dataGrid.entry,
    descriptionList.entry,
    accordion.entry,
    activity.entry,
    branchGraph.entry,
    barList.entry,
    truncate.entry,
    badge.entry,
    avatar.entry,
    iconTile.entry,
    statusDot.entry,
    progress.entry,
    meter.entry,
    spinner.entry,
    skeleton.entry,
    checklist.entry,
    alert.entry,
    notice.entry,
    toast.entry,
    emptyState.entry,
    areaChart.entry,
    barChart.entry,
    horizontalBarChart.entry,
    bulletChart.entry,
    funnelChart.entry,
    treemap.entry,
    donutChart.entry,
    uptimeStrip.entry,
    radarChart.entry,
    roseChart.entry,
    bubbleChart.entry,
    candlestickChart.entry,
    chatThread.entry,
    chatMessage.entry,
    chatReference.entry,
    chatAttachment.entry,
    chatTyping.entry,
    messageComposer.entry,
    chatSuggestions.entry,
    thinking.entry,
    assistantAnswer.entry,
    assistantPrompt.entry,
    // Last: the interaction patterns, which are behaviour rather than parts.
    ...interactionEntries,
];

/** The one piece each component is shown in, by its id. */
export const inUse: Record<string, InUse> = {
    'button': button.inUse,
    'badge': badge.inUse,
    chip: chip.inUse,
    'toolbar': toolbar.inUse,
    'hold-button': holdButton.inUse,
    'kbd': kbd.inUse,
    'bottom-bar': bottomBar.inUse,
    'input': input.inUse,
    'field': field.inUse,
    'select': select.inUse,
    'combobox': combobox.inUse,
    'checkbox': checkbox.inUse,
    'radio': radio.inUse,
    'switch': switchEntry.inUse,
    'slider': slider.inUse,
    'block-slider': blockSlider.inUse,
    'segmented': segmented.inUse,
    'option-row': optionRow.inUse,
    'setting-row': settingRow.inUse,
    'date-picker': datePicker.inUse,
    'date-range-picker': dateRangePicker.inUse,
    'code-input': codeInput.inUse,
    'color-picker': colorPicker.inUse,
    'readonly-field': readonlyField.inUse,
    'drop-zone': dropZone.inUse,
    'stepper': stepper.inUse,
    'filter-condition': filterCondition.inUse,
    'filter-menu': filterMenu.inUse,
    'sidebar': sidebar.inUse,
    'nav-rail': navRail.inUse,
    'top-nav': topNav.inUse,
    'tabs': tabs.inUse,
    'breadcrumb': breadcrumb.inUse,
    'header-bar': headerBar.inUse,
    'pagination': pagination.inUse,
    'command-menu': commandMenu.inUse,
    'dialog': dialog.inUse,
    'sheet': sheet.inUse,
    'menu': menu.inUse,
    'popover': popover.inUse,
    'menu-item': menuItem.inUse,
    'tooltip': tooltip.inUse,
    'info-tip': infoTip.inUse,
    'stat-card': statCard.inUse,
    'card': card.inUse,
    'table': table.inUse,
    'table-head': tableHead.inUse,
    'table-cell': tableCell.inUse,
    'editable-cell': editableCell.inUse,
    'table-tree': tableTree.inUse,
    'table-drag-cell': tableDragCell.inUse,
    'data-grid': dataGrid.inUse,
    'description-list': descriptionList.inUse,
    'accordion': accordion.inUse,
    'activity': activity.inUse,
    'branch-graph': branchGraph.inUse,
    'avatar': avatar.inUse,
    'icon-tile': iconTile.inUse,
    'bar-list': barList.inUse,
    truncate: truncate.inUse,
    'area-chart': areaChart.inUse,
    'bar-chart': barChart.inUse,
    'horizontal-bar-chart': horizontalBarChart.inUse,
    'donut-chart': donutChart.inUse,
    'funnel-chart': funnelChart.inUse,
    treemap: treemap.inUse,
    'radar-chart': radarChart.inUse,
    'bullet-chart': bulletChart.inUse,
    'uptime-strip': uptimeStrip.inUse,
    'rose-chart': roseChart.inUse,
    'bubble-chart': bubbleChart.inUse,
    'candlestick-chart': candlestickChart.inUse,
    'progress': progress.inUse,
    'meter': meter.inUse,
    'status-dot': statusDot.inUse,
    'alert': alert.inUse,
    'notice': notice.inUse,
    'toast': toast.inUse,
    'empty-state': emptyState.inUse,
    'skeleton': skeleton.inUse,
    'spinner': spinner.inUse,
    'checklist': checklist.inUse,
    'chat-thread': chatThread.inUse,
    'chat-message': chatMessage.inUse,
    'chat-reference': chatReference.inUse,
    'chat-attachment': chatAttachment.inUse,
    'chat-suggestions': chatSuggestions.inUse,
    'chat-typing': chatTyping.inUse,
    'thinking': thinking.inUse,
    'assistant-answer': assistantAnswer.inUse,
    'message-composer': messageComposer.inUse,
    'assistant-prompt': assistantPrompt.inUse,
};

export const inUseOf = (id: string): InUse | undefined => inUse[id];
