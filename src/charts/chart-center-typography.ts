export const chartCenterContainerClassName = '@container/chart-center size-full min-w-0';

/** Primary stat: ~22% of center width, clamped between the text-sm and text-3xl tokens. */
export const chartCenterValueClassName =
    'font-medium tabular-nums leading-none text-[length:clamp(var(--text-sm),22cqw,var(--text-3xl))]';

/** Supporting label: ~9% of center width, clamped between the text-xxs and text-xs tokens. */
export const chartCenterLabelClassName =
    'max-w-full truncate leading-tight text-[length:clamp(var(--text-xxs),9cqw,var(--text-xs))]';
