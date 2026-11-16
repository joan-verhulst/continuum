import {
    Accordion,
    AccordionItem,
    AccordionPanel,
    AccordionTrigger,
    type AccordionVariant,
    Button,
} from 'continuum';
import { Mail } from 'lucide-react';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    opts,
    type PreviewProps,
} from '../kit';

const accordionKnobs: Knob[] = [
    { id: 'variant', label: 'Variant', options: opts('plain', 'outline'), default: 'plain' },
    { id: 'multiple', label: 'Several open', switch: true, default: false },
    { id: 'disabled', label: 'Last disabled', switch: true, default: false },
];

const questions = [
    {
        id: 'seats',
        question: 'Can I add seats in the middle of a month?',
        answer: 'Yes. A new seat is charged for the days left in the month, and in full from the next invoice on.',
    },
    {
        id: 'invoice',
        question: 'When is the invoice sent?',
        answer: 'On the second of each month, to the billing email, with the PDF attached.',
    },
    {
        id: 'cancel',
        question: 'What happens when I cancel?',
        answer: 'The plan runs to the end of the period paid for. After that the workspace is read-only, and nothing is deleted for 90 days.',
    },
];

const AccordionPreview = ({ knobs }: PreviewProps) => (
    <Accordion
        className="w-full max-w-96"
        defaultValue={['seats']}
        // Remounted when the knob flips, so the open items start over under the new rule.
        key={String(knobs.multiple)}
        multiple={Boolean(knobs.multiple)}
        variant={knobs.variant as AccordionVariant}
    >
        {questions.map((item, i) => (
            <AccordionItem
                disabled={Boolean(knobs.disabled) && i === questions.length - 1}
                key={item.id}
                value={item.id}
            >
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionPanel>{item.answer}</AccordionPanel>
            </AccordionItem>
        ))}
    </Accordion>
);

export const entry: Entry = {
    id: 'accordion',
    name: 'Accordion',
    category: 'content',
    description:
        'A divided list of questions, each opening its answer under it. Read one at a time, skipped otherwise.',
    knobs: accordionKnobs,
    Preview: AccordionPreview,
};

const billing = [
    {
        id: 'seats',
        question: 'Can I add seats in the middle of a month?',
        answer: 'Yes. A new seat is charged for the days left in the month, and in full from the next invoice on. Removing one takes effect at the end of the month.',
    },
    {
        id: 'invoice',
        question: 'When is the invoice sent, and to whom?',
        answer: 'On the second of each month, to the billing email under Settings, with the PDF attached. Owners can also download every invoice from Invoices.',
    },
    {
        id: 'vat',
        question: 'Do prices include VAT?',
        answer: 'No. VAT is added by the country of the billing address. With a valid VAT number the reverse charge applies and none is added.',
    },
    {
        id: 'annual',
        question: 'Can I pay for a year at once?',
        answer: 'Yes. Paying yearly takes two months off, and the year starts on the day you switch.',
    },
    {
        id: 'cancel',
        question: 'What happens when I cancel?',
        answer: 'The plan runs to the end of the period paid for. After that the workspace is read-only, and nothing is deleted for 90 days.',
    },
];

// The questions under a plan: read one at a time, so they fold; the one action leads out of them.
const BillingHelp = () => (
    <AppWindow
        actions={
            <Button variant="secondary">
                <Mail {...icon} /> Ask support
            </Button>
        }
        description="What people ask about seats, invoices and cancelling."
        place="invoices"
        title="Billing questions"
        trail={['Invoices', 'Billing questions']}
        width="narrow"
    >
        <Accordion defaultValue={['seats']}>
            {billing.map(item => (
                <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger level={2}>{item.question}</AccordionTrigger>
                    <AccordionPanel>{item.answer}</AccordionPanel>
                </AccordionItem>
            ))}
        </Accordion>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Billing questions',
    note: 'The questions under a plan on a narrow page, plain on the page with a hairline between them; one answer open at a time.',
    app: true,
    render: () => <BillingHelp />,
};
