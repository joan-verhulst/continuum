import {
    Badge,
    Button,
    Card,
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
    DateRangePicker,
    type DateRangeValue,
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Field,
    FieldHelper,
    FieldLabel,
    FilterChip,
    formatDateRange,
} from 'continuum';
import { CalendarDays, Check, Earth, Globe, ListFilter } from 'lucide-react';
import { type ReactNode, useState } from 'react';

const countriesByRegion: Record<string, string[]> = {
    Europe: ['Belgium', 'France', 'Germany', 'Netherlands', 'Spain', 'Sweden', 'United Kingdom'],
    'North America': ['Canada', 'Mexico', 'United States'],
    'Latin America': ['Argentina', 'Brazil', 'Chile', 'Colombia'],
    'Middle East & Africa': ['Egypt', 'Kenya', 'Nigeria', 'South Africa', 'United Arab Emirates'],
    'Asia Pacific': ['Australia', 'India', 'Japan', 'New Zealand', 'Singapore', 'South Korea'],
};

const regions = Object.keys(countriesByRegion);
const allCountries = Object.values(countriesByRegion).flat().sort();

type Filters = {
    range: DateRangeValue | undefined;
    regions: string[];
    countries: string[];
};

const noFilters: Filters = { range: undefined, regions: [], countries: [] };

// The last 30 days up to today, so the example opens with one filter applied, as the frame does.
const today = new Date();
const initialFilters: Filters = {
    range: {
        from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29),
        to: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    },
    regions: [],
    countries: [],
};

/** A filter counts once however many values it holds: "Apply 2 filters" means two kinds of filter. */
const countFilters = (filters: Filters) =>
    Number(Boolean(filters.range)) +
    Number(filters.regions.length > 0) +
    Number(filters.countries.length > 0);

const applyLabel = (count: number) =>
    count === 0 ? 'Apply filters' : `Apply ${count} ${count === 1 ? 'filter' : 'filters'}`;

/** Countries narrow to the chosen regions; none chosen means every region. */
const countriesFor = (picked: string[]) =>
    picked.length === 0 ? allCountries : picked.flatMap(region => countriesByRegion[region] ?? []);

type ChipsFieldProps = {
    label: string;
    items: string[];
    value: string[];
    onValueChange: (value: string[]) => void;
    placeholder: string;
    icon: ReactNode;
    helper?: string;
};

const ChipsField = ({
    label,
    items,
    value,
    onValueChange,
    placeholder,
    icon,
    helper,
}: ChipsFieldProps) => (
    <Field>
        <FieldLabel>{label}</FieldLabel>
        <Combobox items={items} multiple onValueChange={onValueChange} value={value}>
            <ComboboxChips>
                <ComboboxValue>
                    {(values: string[]) => (
                        <>
                            {values.map(item => (
                                <ComboboxChip key={item}>{item}</ComboboxChip>
                            ))}
                            <ComboboxChipsInput placeholder={values.length ? '' : placeholder} />
                        </>
                    )}
                </ComboboxValue>
                {/* The design's trailing glyph, kept quiet so the chips stay the loudest thing in the box. */}
                <span
                    aria-hidden
                    className="ms-auto flex self-start py-[4.5px] text-neutral-500 [&_svg]:size-4"
                >
                    {icon}
                </span>
            </ComboboxChips>
            <ComboboxContent>
                <ComboboxEmpty />
                <ComboboxList>
                    {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                            {item}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
        {helper && <FieldHelper>{helper}</FieldHelper>}
    </Field>
);

type FilterFieldsProps = {
    draft: Filters;
    onChange: (next: Filters) => void;
};

/** The three fields, shared by the dialog and the inline render so both behave the same. */
const FilterFields = ({ draft, onChange }: FilterFieldsProps) => {
    const countryOptions = countriesFor(draft.regions);

    return (
        <>
            <Field>
                <FieldLabel>Date range</FieldLabel>
                <DateRangePicker
                    disabledDates={{ after: today }}
                    icon="trailing"
                    onValueChange={range => onChange({ ...draft, range })}
                    placeholder="All time"
                    value={draft.range}
                />
            </Field>
            <ChipsField
                icon={<Globe strokeWidth={2} />}
                items={regions}
                label="Regions"
                onValueChange={picked => {
                    // Dropping a region drops its countries too, so no hidden filter is left behind.
                    const allowed = new Set(countriesFor(picked));
                    onChange({
                        ...draft,
                        regions: picked,
                        countries: draft.countries.filter(country => allowed.has(country)),
                    });
                }}
                placeholder="All regions"
                value={draft.regions}
            />
            <ChipsField
                helper={
                    draft.regions.length > 0
                        ? `Showing countries in ${draft.regions.join(', ')}`
                        : undefined
                }
                icon={<Earth strokeWidth={2} />}
                items={countryOptions}
                label="Countries"
                onValueChange={countries => onChange({ ...draft, countries })}
                placeholder="All countries"
                value={draft.countries}
            />
        </>
    );
};

/** Chips for what is applied, each removable without reopening the dialog. */
const AppliedFilters = ({
    filters,
    onChange,
}: {
    filters: Filters;
    onChange: (next: Filters) => void;
}) => {
    const { range } = filters;

    if (countFilters(filters) === 0) {
        return <p className="text-neutral-500 text-xs">Showing all traffic</p>;
    }

    return (
        <ul aria-label="Applied filters" className="flex min-w-0 flex-wrap items-center gap-1.5">
            {range && (
                <li>
                    <FilterChip
                        icon={<CalendarDays strokeWidth={2} />}
                        onRemove={() => onChange({ ...filters, range: undefined })}
                        removeLabel="Remove date range"
                    >
                        {formatDateRange(range)}
                    </FilterChip>
                </li>
            )}
            {filters.regions.map(region => (
                <li key={region}>
                    <FilterChip
                        icon={<Globe strokeWidth={2} />}
                        onRemove={() => {
                            const regionsLeft = filters.regions.filter(item => item !== region);
                            const allowed = new Set(countriesFor(regionsLeft));
                            onChange({
                                ...filters,
                                regions: regionsLeft,
                                countries: filters.countries.filter(c => allowed.has(c)),
                            });
                        }}
                    >
                        {region}
                    </FilterChip>
                </li>
            ))}
            {filters.countries.map(country => (
                <li key={country}>
                    <FilterChip
                        icon={<Earth strokeWidth={2} />}
                        onRemove={() =>
                            onChange({
                                ...filters,
                                countries: filters.countries.filter(item => item !== country),
                            })
                        }
                    >
                        {country}
                    </FilterChip>
                </li>
            ))}
        </ul>
    );
};

const GlobalFiltering = () => {
    const [applied, setApplied] = useState<Filters>(initialFilters);
    const [open, setOpen] = useState(false);
    // The dialog edits a draft; nothing reaches the page until Apply, and Escape throws it away.
    const [draft, setDraft] = useState<Filters>(initialFilters);
    const [inlineDraft, setInlineDraft] = useState<Filters>(initialFilters);

    const appliedCount = countFilters(applied);
    const draftCount = countFilters(draft);
    const inlineCount = countFilters(inlineDraft);

    const apply = (next: Filters) => {
        setApplied(next);
        setInlineDraft(next);
    };

    return (
        <div className="flex w-full max-w-[720px] flex-col gap-8">
            <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="font-medium text-neutral-950 text-xs">Traffic overview</h2>
                    <Dialog
                        onOpenChange={next => {
                            if (next) setDraft(applied);
                            setOpen(next);
                        }}
                        open={open}
                    >
                        <DialogTrigger render={<Button variant="secondary" />}>
                            <ListFilter strokeWidth={2} />
                            Filters
                            {appliedCount > 0 && (
                                <Badge className="-me-1" variant="count">
                                    {appliedCount}
                                </Badge>
                            )}
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Global filtering</DialogTitle>
                            </DialogHeader>
                            <DialogBody>
                                <FilterFields draft={draft} onChange={setDraft} />
                            </DialogBody>
                            <DialogFooter>
                                <Button
                                    className="me-auto"
                                    disabled={draftCount === 0}
                                    onClick={() => setDraft(noFilters)}
                                    variant="ghost"
                                >
                                    Clear all
                                </Button>
                                <Button
                                    onClick={() => {
                                        apply(draft);
                                        setOpen(false);
                                    }}
                                >
                                    {applyLabel(draftCount)}
                                    <Check strokeWidth={2} />
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <AppliedFilters filters={applied} onChange={apply} />
            </section>

            {/* The same form laid flat on the page, for a filter panel that stays open beside a report. */}
            <Card className="w-full max-w-[480px] gap-0 p-0">
                <div className="flex flex-col gap-4 p-5">
                    <h3 className="font-medium text-neutral-950 text-sm">Global filtering</h3>
                    <FilterFields draft={inlineDraft} onChange={setInlineDraft} />
                </div>
                <div className="flex items-center justify-end gap-2 px-5 pb-5">
                    <Button
                        className="me-auto"
                        disabled={inlineCount === 0}
                        onClick={() => setInlineDraft(noFilters)}
                        variant="ghost"
                    >
                        Clear all
                    </Button>
                    <Button onClick={() => apply(inlineDraft)}>
                        {applyLabel(inlineCount)}
                        <Check strokeWidth={2} />
                    </Button>
                </div>
            </Card>
        </div>
    );
};

/** "Global filtering": a dialog of date range, regions and countries, with an inline render of the form. */
export const globalFilteringExample = () => <GlobalFiltering />;
