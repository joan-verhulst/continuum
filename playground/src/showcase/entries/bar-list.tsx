import { BarList, BarListItem, Card, SegmentedControl, SegmentedControlItem } from 'continuum';
import { AppWindow, type Entry, type InUse } from '../kit';

const BarListPreview = () => (
    <BarList className="w-full max-w-80" limit={3} title="Top pages" valueLabel="Visitors">
        <BarListItem href="#about" value={3312}>
            /about
        </BarListItem>
        <BarListItem href="#pricing" value={2840}>
            /pricing
        </BarListItem>
        <BarListItem href="#contact" value={1204}>
            /contact
        </BarListItem>
        <BarListItem href="#careers" value={64}>
            /careers
        </BarListItem>
    </BarList>
);

export const entry: Entry = {
    id: 'bar-list',
    name: 'Bar list',
    category: 'content',
    description: 'Ranked rows with a bar sized to each value.',
    stageClassName: 'items-stretch',
    Preview: BarListPreview,
};

const Traffic = () => (
    <AppWindow
        actions={
            <SegmentedControl aria-label="Range" defaultValue="30d">
                <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
                <SegmentedControlItem value="30d">30 days</SegmentedControlItem>
                <SegmentedControlItem value="12m">12 months</SegmentedControlItem>
            </SegmentedControl>
        }
        description="Where visitors to northwind.com came from, and what they read."
        nav="top"
        place="reports"
        title="Traffic"
    >
        <div className="grid grid-cols-3 gap-4">
            <Card layout="list">
                <BarList limit={5} title="Top pages" valueLabel="Visitors">
                    <BarListItem href="#pricing" value={4120}>
                        /pricing
                    </BarListItem>
                    <BarListItem href="#home" value={3312}>
                        /
                    </BarListItem>
                    <BarListItem href="#review" value={2840}>
                        /blog/q3-review
                    </BarListItem>
                    <BarListItem href="#contact" value={1204}>
                        /contact
                    </BarListItem>
                    <BarListItem href="#docs" value={860}>
                        /docs/invoices
                    </BarListItem>
                    <BarListItem href="#careers" value={64}>
                        /careers
                    </BarListItem>
                </BarList>
            </Card>
            <Card layout="list">
                <BarList title="Referrers" valueLabel="Visitors">
                    <BarListItem value={5210}>Google</BarListItem>
                    <BarListItem value={2480}>Direct</BarListItem>
                    <BarListItem value={1320}>LinkedIn</BarListItem>
                    <BarListItem value={640}>Newsletter</BarListItem>
                    <BarListItem value={210}>GitHub</BarListItem>
                </BarList>
            </Card>
            <Card layout="list">
                <BarList title="Countries" valueLabel="Visitors">
                    <BarListItem value={4210}>Netherlands</BarListItem>
                    <BarListItem value={2980}>Germany</BarListItem>
                    <BarListItem value={1640}>Belgium</BarListItem>
                    <BarListItem value={720}>France</BarListItem>
                    <BarListItem value={310}>Denmark</BarListItem>
                </BarList>
            </Card>
        </div>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Traffic',
    note: 'A traffic report in three ranked lists, the top pages folded after five.',
    app: true,
    render: () => <Traffic />,
};
