import {
    Button,
    Card,
    Chip,
    ChipAction,
    DatePicker,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    Field,
    FieldHelper,
    formatDate,
    InfoTip,
    OptionRow,
    RadioGroup,
    RadioGroupItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    StatusDot,
} from 'continuum';
import { ArrowRight, X } from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useRef, useState } from 'react';

type StartMode = 'date' | 'trigger';
type Activation = 'now' | 'later';

const triggers = [
    { value: 'signup', label: 'User signs up' },
    { value: 'trial', label: 'Starts a free trial' },
    { value: 'list', label: 'Joins a mailing list' },
    { value: 'purchase', label: 'Completes a first purchase' },
    { value: 'checkout', label: 'Abandons checkout' },
];

const conditionCatalogue = [
    { id: 'signed-up', label: 'Signed up', detail: 'in the last 30 days' },
    { id: 'ref-newsletter', label: 'Referral', detail: 'newsletter' },
    { id: 'ref-partner', label: 'Referral', detail: 'partner link' },
    { id: 'verified', label: 'Verified email', detail: undefined },
    { id: 'engaged', label: 'Opened an email', detail: 'in the last 90 days' },
];

// Contact counts per country, so the estimate under the audience moves as it is edited.
const countryCatalogue = [
    { id: 'nl', label: 'The Netherlands', contacts: 8_420 },
    { id: 'be', label: 'Belgium', contacts: 3_960 },
    { id: 'de', label: 'Germany', contacts: 11_250 },
    { id: 'fr', label: 'France', contacts: 6_730 },
    { id: 'lu', label: 'Luxembourg', contacts: 410 },
    { id: 'gb', label: 'United Kingdom', contacts: 9_180 },
];

const initialConditions = ['signed-up', 'ref-newsletter'];
const initialCountries = ['nl', 'be'];

const today = new Date();
today.setHours(0, 0, 0, 0);

const toggle = (list: string[], id: string, on: boolean) =>
    on ? [...list, id] : list.filter(item => item !== id);

/** A section heading with an optional info tip and a description under it. */
const SectionHeading = ({
    id,
    title,
    tip,
    description,
}: {
    id: string;
    title: string;
    tip?: ReactNode;
    description?: ReactNode;
}) => (
    <div className="flex flex-col gap-1">
        <h3 className="flex items-center gap-1.5 font-medium text-neutral-950 text-xs" id={id}>
            {title}
            {tip && <InfoTip content={tip} />}
        </h3>
        {description && <p className="max-w-85 text-neutral-600 text-xs">{description}</p>}
    </div>
);

/** Start campaign panel: how and when a campaign starts, and who it reaches. */
export const startCampaignExample = () => <StartCampaign />;

const StartCampaign = () => {
    const ids = {
        start: useId(),
        active: useId(),
        audience: useId(),
    };

    const [start, setStart] = useState<StartMode>('trigger');
    const [trigger, setTrigger] = useState<string | null>(null);
    const [sendDate, setSendDate] = useState<Date | undefined>();
    const [activation, setActivation] = useState<Activation>('later');
    const [activeDate, setActiveDate] = useState<Date | undefined>();
    const [conditions, setConditions] = useState<string[]>(initialConditions);
    const [countries, setCountries] = useState<string[]>(initialCountries);
    const [scheduledKey, setScheduledKey] = useState<string | null>(null);
    const [discardOpen, setDiscardOpen] = useState(false);
    const titleRef = useRef<HTMLHeadingElement>(null);

    const reset = () => {
        setStart('trigger');
        setTrigger(null);
        setSendDate(undefined);
        setActivation('later');
        setActiveDate(undefined);
        setConditions(initialConditions);
        setCountries(initialCountries);
        setScheduledKey(null);
        setDiscardOpen(false);
    };

    const chosenConditions = conditionCatalogue.filter(c => conditions.includes(c.id));
    const chosenCountries = countryCatalogue.filter(c => countries.includes(c.id));
    // Each condition narrows the audience; a rough halving is close enough for an estimate.
    const estimate = Math.round(
        chosenCountries.reduce((sum, c) => sum + c.contacts, 0) / 2 ** chosenConditions.length,
    );

    // A send date before the campaign is active would send to nobody, so the pair must agree.
    const sendBeforeActive =
        start === 'date' &&
        activation === 'later' &&
        sendDate !== undefined &&
        activeDate !== undefined &&
        sendDate < activeDate;

    const missing = [
        start === 'trigger' && !trigger && 'pick a trigger',
        start === 'date' && !sendDate && 'pick a send date',
        activation === 'later' && !activeDate && 'pick an activation date',
        sendBeforeActive && 'activate on or before the send date',
        chosenCountries.length === 0 && 'add at least one country',
    ].filter(Boolean) as string[];

    // Nothing to discard while the form still holds what it opened with.
    const pristine =
        start === 'trigger' &&
        trigger === null &&
        sendDate === undefined &&
        activation === 'later' &&
        activeDate === undefined &&
        conditions.join() === initialConditions.join() &&
        countries.join() === initialCountries.join();

    // The confirmation belongs to the exact settings it was given, so any edit afterwards hides it.
    const key = JSON.stringify([
        start,
        trigger,
        sendDate,
        activation,
        activeDate,
        conditions,
        countries,
    ]);
    const scheduled = scheduledKey === key;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (missing.length === 0) setScheduledKey(key);
    };

    return (
        <Card className="w-120 max-w-full gap-0 p-0">
            <form className="flex flex-col" onSubmit={submit}>
                {/* The 34px button sits 9px in from the top, the side and the bottom alike. */}
                <div className="flex h-13 items-center justify-between gap-4 pr-2.25 pl-5">
                    <h2
                        className="min-w-0 truncate font-medium text-neutral-950 text-sm outline-none"
                        ref={titleRef}
                        tabIndex={-1}
                    >
                        Start campaign
                    </h2>
                    {/* There is no dialog round the example to close, so the button says what it
                        does, and asks first: one click must not wipe a form that took a while to fill. */}
                    <Dialog onOpenChange={setDiscardOpen} open={discardOpen}>
                        <DialogTrigger disabled={pristine} render={<Button variant="ghost" />}>
                            Discard draft
                        </DialogTrigger>
                        {/* Once discarded the trigger is disabled, so focus goes to the form's title
                            instead of falling to the body; on Cancel it returns to the trigger. */}
                        <DialogContent finalFocus={pristine ? titleRef : undefined}>
                            <DialogHeader>
                                <DialogTitle>Discard this draft?</DialogTitle>
                            </DialogHeader>
                            <DialogBody>
                                <DialogDescription>
                                    The start, the activation date and the audience go back to where
                                    they began. This cannot be undone.
                                </DialogDescription>
                            </DialogBody>
                            <DialogFooter>
                                <DialogClose render={<Button variant="secondary" />}>
                                    Cancel
                                </DialogClose>
                                <Button onClick={reset}>Discard draft</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-col gap-8 px-5 pt-2 pb-5">
                    <section aria-labelledby={ids.start} className="flex flex-col gap-3">
                        <SectionHeading
                            id={ids.start}
                            tip="A set date sends to everyone at once; a trigger starts each recipient on their own action."
                            title="How should this campaign start?"
                        />
                        <RadioGroup
                            aria-labelledby={ids.start}
                            onValueChange={value => setStart(value as StartMode)}
                            value={start}
                        >
                            <OptionRow
                                control={<RadioGroupItem value="date" />}
                                label="Start for all recipients on a set date"
                            />
                            <OptionRow
                                control={<RadioGroupItem value="trigger" />}
                                label="Start when a recipient triggers an action"
                            />
                        </RadioGroup>
                        {start === 'trigger' ? (
                            <Select onValueChange={setTrigger} value={trigger}>
                                <SelectTrigger
                                    aria-label="Trigger"
                                    className="w-full"
                                    indicator="right"
                                >
                                    <SelectValue placeholder="Select trigger (e.g. user signs up)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {triggers.map(item => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <DatePicker
                                aria-label="Send date"
                                className="w-full"
                                disabledDates={{ before: today }}
                                onValueChange={setSendDate}
                                placeholder="Select send date"
                                value={sendDate}
                            />
                        )}
                    </section>

                    <section aria-labelledby={ids.active} className="flex flex-col gap-3">
                        <SectionHeading
                            id={ids.active}
                            tip="Until it is active, nobody enters the campaign, even if they match."
                            title="When should this campaign become active?"
                        />
                        <RadioGroup
                            aria-labelledby={ids.active}
                            onValueChange={value => setActivation(value as Activation)}
                            value={activation}
                        >
                            <OptionRow
                                control={<RadioGroupItem value="now" />}
                                label="Start immediately"
                            />
                            <OptionRow
                                control={<RadioGroupItem value="later" />}
                                label="Schedule for later"
                            />
                        </RadioGroup>
                        {activation === 'later' && (
                            // The error sits under the later of the two dates, nearest the button it holds back.
                            <Field invalid={sendBeforeActive}>
                                <DatePicker
                                    aria-label="Activation date"
                                    className="w-full"
                                    disabledDates={{ before: today }}
                                    onValueChange={setActiveDate}
                                    value={activeDate}
                                />
                                {sendBeforeActive && sendDate && (
                                    <FieldHelper>
                                        Activate on or before the send date, {formatDate(sendDate)}.
                                    </FieldHelper>
                                )}
                            </Field>
                        )}
                    </section>

                    <section aria-labelledby={ids.audience} className="flex flex-col gap-3">
                        <SectionHeading
                            description="Only users that match these conditions will enter the campaign."
                            id={ids.audience}
                            title="Who should receive this campaign?"
                        />

                        {chosenConditions.length > 0 ? (
                            <ul className="flex flex-col gap-2" data-slot="condition-list">
                                {chosenConditions.map(condition => (
                                    <li
                                        className="flex h-10 items-center justify-between gap-3 rounded-item border border-neutral-200 pr-1.25 pl-3"
                                        key={condition.id}
                                    >
                                        <span className="min-w-0 truncate text-sm">
                                            <span className="text-neutral-950">
                                                {condition.label}
                                                {condition.detail && ':'}
                                            </span>
                                            {condition.detail && (
                                                <span className="text-neutral-600">
                                                    {' '}
                                                    {condition.detail}
                                                </span>
                                            )}
                                        </span>
                                        {/* Inset 6px in the row, so its corner is the row's less 6px. */}
                                        <Button
                                            aria-label={`Remove ${condition.label}${condition.detail ? `: ${condition.detail}` : ''}`}
                                            className="rounded-[max(calc(var(--radius-item)-6px),2px)]"
                                            onClick={() =>
                                                setConditions(list =>
                                                    toggle(list, condition.id, false),
                                                )
                                            }
                                            size="icon-sm"
                                            variant="ghost"
                                        >
                                            <X strokeWidth={2} />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-neutral-600 text-xs">
                                No conditions: everyone in the audience enters the campaign.
                            </p>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={<Button className="w-full" variant="secondary" />}
                            >
                                Manage eligibility
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-(--anchor-width)">
                                {conditionCatalogue.map(condition => (
                                    <DropdownMenuCheckboxItem
                                        checked={conditions.includes(condition.id)}
                                        key={condition.id}
                                        onCheckedChange={on =>
                                            setConditions(list => toggle(list, condition.id, on))
                                        }
                                    >
                                        {condition.label}
                                        {condition.detail && `: ${condition.detail}`}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div
                            className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-2 rounded-item border border-neutral-200 px-3 py-1.75"
                            data-slot="audience"
                        >
                            <span className="text-neutral-600 text-xs">Audience</span>
                            {chosenCountries.length > 0 ? (
                                <ul className="flex flex-wrap gap-1.5">
                                    {chosenCountries.map(country => (
                                        <li key={country.id}>
                                            <Chip
                                                action={
                                                    <ChipAction
                                                        onClick={() =>
                                                            setCountries(list =>
                                                                toggle(list, country.id, false),
                                                            )
                                                        }
                                                    />
                                                }
                                            >
                                                {country.label}
                                            </Chip>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <span className="text-neutral-600 text-xs">No countries yet</span>
                            )}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={<Button className="w-full" variant="secondary" />}
                            >
                                Manage audience
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-(--anchor-width)">
                                {countryCatalogue.map(country => (
                                    <DropdownMenuCheckboxItem
                                        checked={countries.includes(country.id)}
                                        key={country.id}
                                        onCheckedChange={on =>
                                            setCountries(list => toggle(list, country.id, on))
                                        }
                                    >
                                        {country.label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <p className="text-neutral-600 text-xxs tabular-nums">
                            About {estimate.toLocaleString('en-GB')} recipients match today
                        </p>
                    </section>

                    <div className="flex flex-col gap-3 pt-4">
                        {/* Polite, so the confirmation and what is still missing are read out as they change. */}
                        <p aria-live="polite" className="flex items-center gap-2 text-xs">
                            {scheduled ? (
                                <>
                                    <StatusDot tone="success" />
                                    <span className="text-neutral-950">
                                        {activation === 'now'
                                            ? 'Campaign is live'
                                            : `Campaign goes live on ${activeDate ? formatDate(activeDate) : ''}`}
                                    </span>
                                </>
                            ) : (
                                missing.length > 0 && (
                                    <span className="text-neutral-600">
                                        To continue, {missing.join(', ')}.
                                    </span>
                                )
                            )}
                        </p>
                        <Button
                            className="w-full"
                            disabled={missing.length > 0 || scheduled}
                            size="lg"
                            type="submit"
                        >
                            {activation === 'now' ? 'Start campaign' : 'Schedule campaign'}
                            <ArrowRight strokeWidth={2} />
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
};
