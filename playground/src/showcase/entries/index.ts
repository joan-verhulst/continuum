import type { Entry, InUse } from '../kit';
import * as activity from './activity';
import * as alert from './alert';
import * as avatar from './avatar';
import * as badge from './badge';
import * as barList from './bar-list';
import * as blockSlider from './block-slider';
import * as bottomBar from './bottom-bar';
import * as breadcrumb from './breadcrumb';
import * as button from './button';
import * as card from './card';
import * as areaChart from './charts/area-chart';
import * as barChart from './charts/bar-chart';
import * as chartLoading from './charts/chart-loading';
import * as funnelChart from './charts/funnel-chart';
import * as pieChart from './charts/pie-chart';
import * as chatAttachment from './chat-attachment';
import * as chatComposer from './chat-composer';
import * as chatMessage from './chat-message';
import * as chatPrompt from './chat-prompt';
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
import * as datePicker from './date-picker';
import * as dateRangePicker from './date-range-picker';
import * as descriptionList from './description-list';
import * as dialog from './dialog';
import * as dropZone from './drop-zone';
import * as emptyState from './empty-state';
import * as field from './field';
import * as filterCondition from './filter-condition';
import * as filterMenu from './filter-menu';
import * as headerBar from './header-bar';
import * as iconTile from './icon-tile';
import * as infoTip from './info-tip';
import * as input from './input';
import * as kbd from './kbd';
import * as logo from './logo';
import * as menu from './menu';
import * as meter from './meter';
import * as notice from './notice';
import * as optionRow from './option-row';
import * as pagination from './pagination';
import * as popover from './popover';
import * as popoverItem from './popover-item';
import * as progress from './progress';
import * as radio from './radio';
import * as rail from './rail';
import * as segmented from './segmented';
import * as select from './select';
import * as settingRow from './setting-row';
import * as sheet from './sheet';
import * as sidebar from './sidebar';
import * as sidebarLevels from './sidebar-levels';
import * as sidebarSwitcher from './sidebar-switcher';
import * as skeleton from './skeleton';
import * as slider from './slider';
import * as spinner from './spinner';
import * as statCard from './stat-card';
import * as statusDot from './status-dot';
import * as stepper from './stepper';
import * as switchEntry from './switch';
import * as table from './table';
import * as tabs from './tabs';
import * as toast from './toast';
import * as toolbar from './toolbar';
import * as tooltip from './tooltip';
import * as topNav from './top-nav';
import * as valueField from './value-field';

/** Every component, in the order the grid shows them. */
export const entries: Entry[] = [
    sidebar.entry,
    sidebarSwitcher.entry,
    sidebarLevels.entry,
    topNav.entry,
    rail.entry,
    headerBar.entry,
    bottomBar.entry,
    logo.entry,
    tabs.entry,
    breadcrumb.entry,
    pagination.entry,
    commandMenu.entry,
    stepper.entry,
    button.entry,
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
    valueField.entry,
    filterCondition.entry,
    filterMenu.entry,
    chip.entry,
    dialog.entry,
    sheet.entry,
    popover.entry,
    popoverItem.entry,
    tooltip.entry,
    infoTip.entry,
    card.entry,
    statCard.entry,
    table.entry,
    descriptionList.entry,
    activity.entry,
    barList.entry,
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
    pieChart.entry,
    funnelChart.entry,
    chartLoading.entry,
    chatThread.entry,
    chatMessage.entry,
    chatReference.entry,
    chatAttachment.entry,
    chatTyping.entry,
    chatComposer.entry,
    chatSuggestions.entry,
    chatPrompt.entry,
];

/** The one piece each component is shown in, by its id. */
export const inUse: Record<string, InUse> = {
    'button': button.inUse,
    'badge': badge.inUse,
    chip: chip.inUse,
    'toolbar': toolbar.inUse,
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
    'value-field': valueField.inUse,
    'drop-zone': dropZone.inUse,
    'stepper': stepper.inUse,
    'filter-condition': filterCondition.inUse,
    'filter-menu': filterMenu.inUse,
    'sidebar': sidebar.inUse,
    'sidebar-switcher': sidebarSwitcher.inUse,
    'sidebar-levels': sidebarLevels.inUse,
    'rail': rail.inUse,
    'top-nav': topNav.inUse,
    'tabs': tabs.inUse,
    'breadcrumb': breadcrumb.inUse,
    'header-bar': headerBar.inUse,
    'pagination': pagination.inUse,
    'logo': logo.inUse,
    'command-menu': commandMenu.inUse,
    'dialog': dialog.inUse,
    'sheet': sheet.inUse,
    'menu': menu.inUse,
    'popover': popover.inUse,
    'popover-item': popoverItem.inUse,
    'tooltip': tooltip.inUse,
    'info-tip': infoTip.inUse,
    'stat-card': statCard.inUse,
    'card': card.inUse,
    'table': table.inUse,
    'description-list': descriptionList.inUse,
    'activity': activity.inUse,
    'avatar': avatar.inUse,
    'icon-tile': iconTile.inUse,
    'bar-list': barList.inUse,
    'area-chart': areaChart.inUse,
    'bar-chart': barChart.inUse,
    'pie-chart': pieChart.inUse,
    'funnel-chart': funnelChart.inUse,
    'chart-loading': chartLoading.inUse,
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
    'chat-composer': chatComposer.inUse,
    'chat-prompt': chatPrompt.inUse,
};

export const inUseOf = (id: string): InUse | undefined => inUse[id];
