import {
    Card,
    CardTitle,
    Tabs,
    TabsContent,
    TabsCount,
    TabsList,
    TabsTrigger,
    type TabsVariant,
} from 'continuum';
import { CircleAlert, FileText, History, LayoutList, ListChecks } from 'lucide-react';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    opts,
    type PreviewProps,
    previewIcon,
} from '../kit';

const tabsKnobs: Knob[] = [
    { id: 'variant', label: 'Variant', options: opts('line', 'pill'), default: 'line' },
    { id: 'icons', label: 'Icons', switch: true, default: false },
    { id: 'count', label: 'Count', switch: true, default: false },
    { id: 'content', label: 'Content', switch: true, default: true },
    { id: 'disabled', label: 'One disabled', switch: true, default: false },
];

const TabsPreview = ({ knobs }: PreviewProps) => (
    <Tabs className="w-fit min-w-80" defaultValue="summary">
        <TabsList variant={knobs.variant as TabsVariant}>
            <TabsTrigger value="summary">
                {knobs.icons && <LayoutList {...previewIcon} />}
                Summary
            </TabsTrigger>
            <TabsTrigger value="findings">
                {knobs.icons && <ListChecks {...previewIcon} />}
                Findings
                {knobs.count && <TabsCount>12</TabsCount>}
            </TabsTrigger>
            <TabsTrigger value="sources">
                {knobs.icons && <FileText {...previewIcon} />}
                Sources
            </TabsTrigger>
            {knobs.disabled && (
                <TabsTrigger disabled value="history">
                    {knobs.icons && <History {...previewIcon} />}
                    History
                </TabsTrigger>
            )}
        </TabsList>
        {knobs.content && (
            <>
                <TabsContent className="text-neutral-600 text-xs" value="summary">
                    Three risks need a decision before Friday.
                </TabsContent>
                <TabsContent className="text-neutral-600 text-xs" value="findings">
                    Twelve findings, four of them new.
                </TabsContent>
                <TabsContent className="text-neutral-600 text-xs" value="sources">
                    Built from 38 documents.
                </TabsContent>
            </>
        )}
    </Tabs>
);

export const entry: Entry = {
    id: 'tabs',
    name: 'Tabs',
    category: 'navigation',
    description:
        'Switch between the panels of one object. Line under a page or section title, pill for a tight spot in a card or dialog.',
    knobs: tabsKnobs,
    Preview: TabsPreview,
};

const findings = [
    'Supplier contract ends in 30 days',
    'Shared admin account',
    'Backups weekly, not daily',
];

const RiskTabs = () => (
    <Card className="w-full max-w-lg gap-4">
        <CardTitle>Q3 risk report</CardTitle>
        <Tabs defaultValue="summary">
            <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="findings">
                    Findings <TabsCount>{findings.length}</TabsCount>
                </TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger disabled value="history">
                    History
                </TabsTrigger>
            </TabsList>
            <TabsContent className="text-neutral-700 text-xs" value="summary">
                Three risks need a decision before the review on Friday: the supplier contract, the
                shared admin account and the backup schedule.
            </TabsContent>
            <TabsContent className="flex flex-col gap-2 text-xs" value="findings">
                {findings.map(finding => (
                    <span className="flex items-center gap-2 text-neutral-700" key={finding}>
                        <CircleAlert {...icon} className="size-4 text-warning-600" /> {finding}
                    </span>
                ))}
            </TabsContent>
            <TabsContent className="text-neutral-700 text-xs" value="sources">
                Built from 38 documents in the Northwind workspace.
            </TabsContent>
        </Tabs>
    </Card>
);

export const inUse: InUse = {
    title: 'Report facets',
    note: 'Line tabs under the report title, a count on findings, one tab not available yet.',
    canvas: true,
    render: () => <RiskTabs />,
};
