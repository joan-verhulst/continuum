import { ListFilter } from 'lucide-react';
import {
    AreaChart,
    Card,
    Dock,
    DockAction,
    DockItem,
    FunnelChart,
    type FunnelStep,
    SegmentedControl,
    SegmentedControlItem,
    StatCard,
} from 'personal-design-system';
import { useState } from 'react';
import { AnalyticsPage, AnalyticsTopBar, ChartCardHeader, PageTitle } from './shared';

const segments: Record<string, FunnelStep[]> = {
    all: [
        { label: '/pricing', value: 1840 },
        { label: '/checkout', value: 1426, delta: -22.5 },
        { label: '/checkout/step-2', value: 557, delta: -38.4 },
        { label: '/checkout/complete', value: 483, delta: -13.3 },
    ],
    new: [
        { label: '/pricing', value: 1212 },
        { label: '/checkout', value: 874, delta: -27.9 },
        { label: '/checkout/step-2', value: 301, delta: -44.1 },
        { label: '/checkout/complete', value: 254, delta: -15.6 },
    ],
    returning: [
        { label: '/pricing', value: 628 },
        { label: '/checkout', value: 552, delta: -12.1 },
        { label: '/checkout/step-2', value: 256, delta: -29.8 },
        { label: '/checkout/complete', value: 229, delta: 4.2 },
    ],
};

const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

/** Checkout funnel (Eyes, 2026): KPI cards, the funnel, and completion over time. */
export const CheckoutFunnel = () => {
    const [segment, setSegment] = useState('all');
    const [range, setRange] = useState('8w');

    return (
        <AnalyticsPage
            dock={
                <div className="flex items-center gap-2">
                    <Dock aria-label="Visitor segment" onValueChange={setSegment} value={segment}>
                        <DockItem className="pl-3" value="all">
                            All visitors
                        </DockItem>
                        <DockItem className="pl-3" value="new">
                            New
                        </DockItem>
                        <DockItem className="pl-3" value="returning">
                            Returning
                        </DockItem>
                    </Dock>
                    <DockAction aria-label="Filters, 2 applied">
                        <ListFilter strokeWidth={1.5} />
                        (2)
                    </DockAction>
                </div>
            }
            rail="dashboards"
        >
            <AnalyticsTopBar trail={['Analytics', 'Funnels', 'Checkout funnel']} />

            <div className="mt-20 mb-6">
                <PageTitle>Funnels / Checkout funnel</PageTitle>
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-4 gap-4">
                    <StatCard delta="+12%" label="Total entered" value="2,980" />
                    <StatCard delta="+12%" label="Completed" value="41%" />
                    <StatCard delta="+12%" label="Completion rate" value="51%" />
                    <StatCard
                        delta="-4%"
                        label="Avg time to complete"
                        trend="down"
                        value="1m 48s"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        delta="+18%"
                        label="Biggest drop-off"
                        trend="down"
                        value="/checkout/step-2"
                    />
                    <StatCard
                        delta="-6%"
                        label="vs previous period"
                        trend="down"
                        value="−5.1% overall completion"
                    />
                </div>
            </div>

            <FunnelChart className="mt-8" steps={segments[segment] ?? []} />

            <Card className="mt-8 gap-8 p-5 pb-8">
                <div className="flex items-start justify-between gap-4">
                    <ChartCardHeader
                        delta="+10.7% last mo"
                        size="lg"
                        title="Completion rate over time"
                        value="2.9k"
                    />
                    <SegmentedControl aria-label="Range" onValueChange={setRange} value={range}>
                        <SegmentedControlItem value="4w">4 weeks</SegmentedControlItem>
                        <SegmentedControlItem value="8w">8 weeks</SegmentedControlItem>
                        <SegmentedControlItem value="12m">12 months</SegmentedControlItem>
                    </SegmentedControl>
                </div>
                <AreaChart
                    aria-label="Funnel entries and completions per week"
                    height={260}
                    labels={weeks}
                    series={[
                        {
                            key: 'entered',
                            values: [310, 342, 298, 365, 380, 352, 401, 388],
                            color: 'chart-5',
                        },
                        {
                            key: 'completed',
                            values: [118, 136, 121, 150, 162, 149, 171, 159],
                            color: 'chart-2',
                        },
                    ]}
                    yTicks={[0, 100, 200, 300, 400]}
                />
            </Card>
        </AnalyticsPage>
    );
};
