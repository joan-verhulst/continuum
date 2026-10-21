import {
    Badge,
    Button,
    FilterChip,
    SegmentedControl,
    SegmentedControlItem,
    SuggestionChip,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Toolbar,
    ToolbarButton,
    ToolbarChip,
} from 'continuum';
import {
    ArrowRight,
    Calendar,
    Check,
    CircleCheck,
    Filter,
    Globe,
    ListFilter,
    Minimize2,
    Plus,
    RotateCcw,
    Sparkles,
    Trash2,
    TrendingDown,
    TrendingUp,
    Users,
    WandSparkles,
} from 'lucide-react';
import { useState } from 'react';
import { ComponentSet, Specimen, Variant } from '../layout';

const icon = { strokeWidth: 1.5 } as const;

const buttonVariants = ['primary', 'secondary', 'ghost'] as const;

export const ButtonSection = () => (
    <>
        <Specimen note="13px medium label at every size; icons 16px" title="Variants × sizes">
            {buttonVariants.map(variant => (
                <ComponentSet key={variant}>
                    <Variant label={`${variant} · md`}>
                        <Button variant={variant}>
                            Button <ArrowRight {...icon} />
                        </Button>
                    </Variant>
                    <Variant label={`${variant} · md · leading icon`}>
                        <Button variant={variant}>
                            <ArrowRight {...icon} /> Button
                        </Button>
                    </Variant>
                    <Variant label={`${variant} · lg`}>
                        <Button size="lg" variant={variant}>
                            Button <ArrowRight {...icon} />
                        </Button>
                    </Variant>
                    <Variant label={`${variant} · disabled`}>
                        <Button disabled variant={variant}>
                            Button <ArrowRight {...icon} />
                        </Button>
                    </Variant>
                </ComponentSet>
            ))}
        </Specimen>
        <Specimen title="Shapes and icon buttons">
            <Variant label="pill">
                <Button shape="pill">
                    <Plus {...icon} /> New report
                </Button>
            </Variant>
            <Variant label="secondary · pill">
                <Button shape="pill" variant="secondary">
                    <Calendar {...icon} /> Last 30 days
                </Button>
            </Variant>
            <Variant label="icon">
                <Button aria-label="Add" size="icon">
                    <Plus {...icon} />
                </Button>
            </Variant>
            <Variant label="secondary · icon">
                <Button aria-label="Filter" size="icon" variant="secondary">
                    <ListFilter {...icon} />
                </Button>
            </Variant>
            <Variant label="ghost · icon-sm">
                <Button aria-label="Delete" size="icon-sm" variant="ghost">
                    <Trash2 {...icon} />
                </Button>
            </Variant>
        </Specimen>
    </>
);

const tones = ['neutral', 'success', 'warning', 'error', 'primary'] as const;
const toneLabels = {
    neutral: 'Draft',
    success: 'Paid',
    warning: 'Due soon',
    error: 'Overdue',
    primary: 'Scheduled',
} as const;

export const BadgeSection = () => (
    <Specimen stageClassName="flex-col gap-6" title="Variants × tones">
        <div className="flex flex-wrap gap-6">
            {tones.map(tone => (
                <Variant key={tone} label={`soft · ${tone}`}>
                    <Badge tone={tone}>{toneLabels[tone]}</Badge>
                </Variant>
            ))}
        </div>
        <div className="flex flex-wrap gap-6">
            {tones.map(tone => (
                <Variant key={tone} label={`pill · ${tone}`}>
                    <Badge
                        icon={
                            tone === 'error' ? <TrendingDown {...icon} /> : <TrendingUp {...icon} />
                        }
                        tone={tone}
                        variant="pill"
                    >
                        {tone === 'error' ? '−4.2%' : '+12.5%'}
                    </Badge>
                </Variant>
            ))}
        </div>
        <div className="flex flex-wrap gap-6">
            {tones.map(tone => (
                <Variant key={tone} label={`dot · ${tone}`}>
                    <Badge tone={tone} variant="dot">
                        {toneLabels[tone]}
                    </Badge>
                </Variant>
            ))}
        </div>
        <div className="flex flex-wrap gap-6">
            {tones.map((tone, i) => (
                <Variant key={tone} label={`count · ${tone}`}>
                    <Badge tone={tone} variant="count">
                        {[24, 8, 3, 1, 12][i]}
                    </Badge>
                </Variant>
            ))}
        </div>
    </Specimen>
);

const initialFilters = [
    { id: 'country', label: 'Country is Netherlands', icon: <Globe {...icon} /> },
    { id: 'device', label: 'Device is mobile', icon: <Users {...icon} /> },
    { id: 'source', label: 'Source is newsletter', icon: <Filter {...icon} /> },
];

export const ChipSection = () => {
    const [filters, setFilters] = useState(initialFilters);
    const [picked, setPicked] = useState<string | null>(null);
    const suggestions = ['Summarise this quarter', 'Compare to last year', 'Top 5 channels'];

    return (
        <>
            <Specimen note="Click the × to remove one" title="Filter chip">
                <Variant label="removable">
                    <div className="flex min-h-[25px] flex-wrap items-center gap-2">
                        {filters.map(filter => (
                            <FilterChip
                                icon={filter.icon}
                                key={filter.id}
                                onRemove={() =>
                                    setFilters(current =>
                                        current.filter(item => item.id !== filter.id),
                                    )
                                }
                            >
                                {filter.label}
                            </FilterChip>
                        ))}
                        {filters.length < initialFilters.length && (
                            <Button
                                aria-label="Reset filters"
                                onClick={() => setFilters(initialFilters)}
                                size="icon-sm"
                                variant="ghost"
                            >
                                <RotateCcw {...icon} />
                            </Button>
                        )}
                    </div>
                </Variant>
                <Variant label="static">
                    <FilterChip icon={<Calendar {...icon} />}>Last 30 days</FilterChip>
                </Variant>
            </Specimen>
            <Specimen title="Suggestion chip">
                <Variant label={picked ? `picked: ${picked}` : 'set after a "Suggestions:" label'}>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-neutral-600 text-xs">Suggestions:</span>
                        {suggestions.map(suggestion => (
                            <SuggestionChip
                                icon={<Sparkles {...icon} />}
                                key={suggestion}
                                onClick={() => setPicked(suggestion)}
                            >
                                {suggestion}
                            </SuggestionChip>
                        ))}
                    </div>
                </Variant>
                <Variant label="disabled">
                    <SuggestionChip disabled icon={<Sparkles {...icon} />}>
                        Draft an intro
                    </SuggestionChip>
                </Variant>
            </Specimen>
        </>
    );
};

export const SegmentedSection = () => (
    <>
        <Specimen note="Always holds one value" title="Segmented control">
            <Variant label="status filter">
                <SegmentedControl defaultValue="all">
                    <SegmentedControlItem value="all">All</SegmentedControlItem>
                    <SegmentedControlItem value="pending">Pending</SegmentedControlItem>
                    <SegmentedControlItem value="passed">Passed</SegmentedControlItem>
                    <SegmentedControlItem value="warning">Warning</SegmentedControlItem>
                    <SegmentedControlItem value="failed">Failed</SegmentedControlItem>
                </SegmentedControl>
            </Variant>
            <Variant label="range picker · with icon · disabled item">
                <SegmentedControl defaultValue="30d">
                    <SegmentedControlItem value="7d">7d</SegmentedControlItem>
                    <SegmentedControlItem value="30d">
                        <Calendar {...icon} /> 30d
                    </SegmentedControlItem>
                    <SegmentedControlItem value="12m">12m</SegmentedControlItem>
                    <SegmentedControlItem disabled value="all">
                        All time
                    </SegmentedControlItem>
                </SegmentedControl>
            </Variant>
        </Specimen>
        <Specimen title="Pill tabs" stageClassName="block">
            <Tabs defaultValue="summary">
                <TabsList>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="findings">Findings</TabsTrigger>
                    <TabsTrigger value="sources">Sources</TabsTrigger>
                    <TabsTrigger disabled value="history">
                        History
                    </TabsTrigger>
                </TabsList>
                <TabsContent className="text-neutral-600 text-xs leading-5" value="summary">
                    Three risks need a decision before the review on Friday.
                </TabsContent>
                <TabsContent className="text-neutral-600 text-xs leading-5" value="findings">
                    Twelve findings, four of them new since the last report.
                </TabsContent>
                <TabsContent className="text-neutral-600 text-xs leading-5" value="sources">
                    Built from 38 documents in the Northwind workspace.
                </TabsContent>
            </Tabs>
        </Specimen>
    </>
);

export const ToolbarSection = () => {
    const [last, setLast] = useState<string>();

    return (
        <Specimen
            note={last ? `Last action: ${last}` : 'Buttons draw their own dividers'}
            title="Toolbar"
        >
            <Variant label="inline AI toolbar">
                <Toolbar aria-label="AI suggestions">
                    <ToolbarChip>AI suggestions</ToolbarChip>
                    <ToolbarButton onClick={() => setLast('Rewrite')}>
                        <WandSparkles {...icon} /> Rewrite
                    </ToolbarButton>
                    <ToolbarButton onClick={() => setLast('Shorten')}>
                        <Minimize2 {...icon} /> Shorten
                    </ToolbarButton>
                    <ToolbarButton onClick={() => setLast('Accept')}>
                        <Check {...icon} /> Accept
                    </ToolbarButton>
                </Toolbar>
            </Variant>
            <Variant label="floating action bar">
                <Toolbar aria-label="Selection">
                    <ToolbarChip icon={<CircleCheck {...icon} />}>3 selected</ToolbarChip>
                    <ToolbarButton onClick={() => setLast('Duplicate')}>Duplicate</ToolbarButton>
                    <ToolbarButton onClick={() => setLast('Delete')}>
                        <Trash2 {...icon} /> Delete
                    </ToolbarButton>
                </Toolbar>
            </Variant>
        </Specimen>
    );
};
