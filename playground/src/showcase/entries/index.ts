import type { Entry, InUse } from '../kit';
import * as activity from './activity';
import * as alert from './alert';
import * as areaChart from './area-chart';
import * as avatar from './avatar';
import * as badge from './badge';
import * as barList from './bar-list';
import * as blockSlider from './block-slider';
import * as bottomBar from './bottom-bar';
import * as breadcrumb from './breadcrumb';
import * as button from './button';
import * as card from './card';
import * as chartLoading from './chart-loading';
import * as chat from './chat';
import * as chatComposer from './chat-composer';
import * as checkbox from './checkbox';
import * as checklist from './checklist';
import * as chip from './chip';
import * as codeInput from './code-input';
import * as combobox from './combobox';
import * as commandMenu from './command-menu';
import * as datePicker from './date-picker';
import * as dateRangePicker from './date-range-picker';
import * as descriptionList from './description-list';
import * as dialog from './dialog';
import * as dropZone from './drop-zone';
import * as emptyState from './empty-state';
import * as field from './field';
import * as filterMenu from './filter-menu';
import * as funnelChart from './funnel-chart';
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
import * as pieChart from './pie-chart';
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
    datePicker.entry,
    dateRangePicker.entry,
    dropZone.entry,
    optionRow.entry,
    settingRow.entry,
    valueField.entry,
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
    pieChart.entry,
    funnelChart.entry,
    chartLoading.entry,
    chat.entry,
    chatComposer.entry,
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
    'value-field': valueField.inUse,
    'drop-zone': dropZone.inUse,
    'stepper': stepper.inUse,
    'filter-menu': filterMenu.inUse,
    'sidebar': sidebar.inUse,
    'rail': rail.inUse,
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
    'pie-chart': pieChart.inUse,
    'funnel-chart': funnelChart.inUse,
    'chart-loading': chartLoading.inUse,
    'progress': progress.inUse,
    'meter': meter.inUse,
    'status-dot': statusDot.inUse,
    'alert': alert.inUse,
    'toast': toast.inUse,
    'empty-state': emptyState.inUse,
    'skeleton': skeleton.inUse,
    'spinner': spinner.inUse,
    'checklist': checklist.inUse,
    'chat': chat.inUse,
    'chat-composer': chatComposer.inUse,
};

export const inUseOf = (id: string): InUse | undefined => inUse[id];
