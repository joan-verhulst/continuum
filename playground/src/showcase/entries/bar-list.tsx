import { BarList, BarListItem, Card } from 'continuum';
import type { Entry, InUse } from '../kit';

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

const TopLists = () => (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-4">
        <Card>
            <BarList limit={4} title="Top pages" valueLabel="Visitors">
                <BarListItem href="#about" value={3312}>
                    /about
                </BarListItem>
                <BarListItem href="#pricing" value={2840}>
                    /pricing
                </BarListItem>
                <BarListItem href="#contact" value={1204}>
                    /contact
                </BarListItem>
                <BarListItem href="#blog" value={860}>
                    /blog
                </BarListItem>
                <BarListItem href="#careers" value={64}>
                    /careers
                </BarListItem>
            </BarList>
        </Card>
        <Card>
            <BarList title="Countries" valueLabel="Visitors">
                <BarListItem value={4210}>Netherlands</BarListItem>
                <BarListItem value={2980}>Germany</BarListItem>
                <BarListItem value={1640}>Belgium</BarListItem>
                <BarListItem value={720}>France</BarListItem>
            </BarList>
        </Card>
    </div>
);

export const inUse: InUse = {
    title: 'Top pages and countries',
    note: 'Ranked rows with a bar behind each, one list folded after four.',
    canvas: true,
    render: () => <TopLists />,
};
