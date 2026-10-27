'use client';

import NumberFlow from '@number-flow/react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { IconTile } from '../components/icon-tile';
import { cn } from '../lib/cn';

/** Subset of `Intl.NumberFormatOptions` supported by NumberFlow */
export interface ChartStatFlowFormat {
    notation?: 'standard' | 'compact';
    compactDisplay?: 'short' | 'long';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    minimumIntegerDigits?: number;
    minimumSignificantDigits?: number;
    maximumSignificantDigits?: number;
    style?: 'decimal' | 'percent' | 'currency';
    currency?: string;
    currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
    unit?: string;
    unitDisplay?: 'short' | 'long' | 'narrow';
}

/*
 * Pinned rather than the browser's locale, so a figure reads the same as the app's own numbers
 * (formatted en-GB) beside it: 12.4k, not 12,4K under a Dutch browser.
 */
export const defaultChartStatFlowLocale = 'en-GB';

export const defaultChartStatFlowFormat: ChartStatFlowFormat = {
    notation: 'standard',
    maximumFractionDigits: 0,
};

function formatStatValue(
    value: number,
    formatOptions: ChartStatFlowFormat,
    locales: Intl.LocalesArgument,
    prefix?: string,
    suffix?: string,
): string {
    const formatted = new Intl.NumberFormat(locales, formatOptions).format(value);
    return `${prefix ?? ''}${formatted}${suffix ?? ''}`;
}

function useNumberFlowElementReady(): boolean {
    const [ready, setReady] = useState(
        () =>
            typeof customElements !== 'undefined' &&
            Boolean(customElements.get('number-flow-react')),
    );

    useEffect(() => {
        if (ready) {
            return;
        }
        let cancelled = false;
        customElements.whenDefined('number-flow-react').then(() => {
            if (!cancelled) {
                setReady(true);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [ready]);

    return ready;
}

export interface ChartStatFlowProps {
    value: number;
    label: string;
    formatOptions?: ChartStatFlowFormat;
    /** Locale for the number. Default: en-GB, as the rest of the app. */
    locales?: Intl.LocalesArgument;
    prefix?: string;
    suffix?: string;
    valueClassName?: string;
    labelClassName?: string;
    icon?: ReactNode;
}

/**
 * Shared value + label stack using NumberFlow (same layout as pie / ring centers).
 * Parent should provide flex alignment and sizing when needed.
 */
export function ChartStatFlow({
    value,
    label,
    formatOptions = defaultChartStatFlowFormat,
    locales = defaultChartStatFlowLocale,
    prefix,
    suffix,
    valueClassName = 'text-2xl font-medium',
    labelClassName = 'text-xs',
    icon,
}: ChartStatFlowProps) {
    const numberFlowReady = useNumberFlowElementReady();
    const staticValue = useMemo(
        () => formatStatValue(value, formatOptions, locales, prefix, suffix),
        [value, formatOptions, locales, prefix, suffix],
    );

    return (
        <>
            {icon ? (
                // The library's icon tile (32px, chip radius, hairline), so the well matches every other one.
                <IconTile className="mb-2" variant="outline">
                    {icon}
                </IconTile>
            ) : null}
            <span
                className={cn('text-neutral-950 tabular-nums', valueClassName)}
                data-slot="chart-stat-value"
            >
                {numberFlowReady ? (
                    <NumberFlow
                        format={formatOptions}
                        isolate
                        locales={locales}
                        prefix={prefix}
                        suffix={suffix}
                        value={value}
                        willChange
                    />
                ) : (
                    staticValue
                )}
            </span>
            <span
                className={cn('mt-0.5 text-neutral-600', labelClassName)}
                data-slot="chart-stat-label"
            >
                {label}
            </span>
        </>
    );
}

ChartStatFlow.displayName = 'ChartStatFlow';
