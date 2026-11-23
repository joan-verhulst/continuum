import { Button, DataGrid, type DataGridColumn, type DataGridRange } from 'continuum';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';
import { useStageWidth } from './table';

const knobs: Knob[] = [
    {
        id: 'heads',
        label: 'Column heads',
        options: [o('named', 'Named'), o('letters', 'Letters')],
        default: 'named',
    },
    { id: 'editable', label: 'Editable', switch: true, default: true },
    { id: 'footer', label: 'Sum of the selection', switch: true, default: true },
];

const named: DataGridColumn[] = [
    { label: 'Month', width: 96 },
    { label: 'Hosting', width: 96, align: 'right' },
    { label: 'Payroll', width: 96, align: 'right' },
    { label: 'Tools', width: 96, align: 'right' },
    { label: 'Travel', width: 96, align: 'right' },
    { label: 'Note', width: 176 },
];

const budget = [
    ['Jan', '1240', '18400', '620', '310', ''],
    ['Feb', '1240', '18400', '640', '0', ''],
    ['Mar', '1310', '18400', '640', '1180', 'Offsite in Ghent'],
    ['Apr', '1310', '19650', '655', '220', 'New hire'],
    ['May', '1380', '19650', '655', '90', ''],
    ['Jun', '1380', '19650', '670', '450', ''],
    ['Jul', '', '', '', '', ''],
    ['Aug', '', '', '', '', ''],
];

const numberOf = (value: string) => {
    const n = Number(value.trim());
    return value.trim() !== '' && Number.isFinite(n) ? n : null;
};

const amount = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

/** What a selection adds up to, the way a spreadsheet's status bar says it. */
const Summary = ({ values, ranges }: { values: string[][]; ranges: DataGridRange[] }) => {
    const numbers: number[] = [];
    let filled = 0;
    // A cell in two blocks counts once.
    const seen = new Set<string>();
    for (const range of ranges)
        for (let row = range.top; row <= range.bottom; row++)
            for (let col = range.left; col <= range.right; col++) {
                if (seen.has(`${row},${col}`)) continue;
                seen.add(`${row},${col}`);
                const value = values[row]?.[col] ?? '';
                if (value.trim() !== '') filled++;
                const n = numberOf(value);
                if (n !== null) numbers.push(n);
            }
    const sum = numbers.reduce((total, n) => total + n, 0);
    if (numbers.length < 2) return <span>{filled === 1 ? '1 value' : `${filled} values`}</span>;
    return (
        <>
            <span>
                Sum <span className="font-medium text-neutral-900">{amount.format(sum)}</span>
            </span>
            <span>
                Average{' '}
                <span className="font-medium text-neutral-900">
                    {amount.format(sum / numbers.length)}
                </span>
            </span>
            <span>Count {numbers.length}</span>
        </>
    );
};

/** A team's monthly costs: select a block to see what it adds up to, type over a cell, drag a fill. */
const BudgetGrid = ({ knobs }: PreviewProps) => {
    const width = useStageWidth();
    const [values, setValues] = useState(budget);
    const [ranges, setRanges] = useState<DataGridRange[]>([
        { top: 0, left: 0, bottom: 0, right: 0 },
    ]);
    const letters = knobs.heads === 'letters';

    return (
        <DataGrid
            className={width}
            columns={letters ? named.map(({ width }) => ({ width })) : named}
            footer={knobs.footer ? <Summary ranges={ranges} values={values} /> : undefined}
            label="Monthly costs"
            onSelectionChange={(_, __, all) => setRanges(all)}
            onValuesChange={knobs.editable ? setValues : undefined}
            values={values}
        />
    );
};

export const entry: Entry = {
    id: 'data-grid',
    name: 'DataGrid',
    category: 'tables',
    description:
        'Values worked on cell by cell: blocks selected in the accent (Ctrl or ⌘ adds one), typed over, pasted into, filled down.',
    span: 2,
    knobs,
    Preview: BudgetGrid,
};

const plan = [
    ['Search ads', '4200', '4400', '4600', '4800'],
    ['Social', '2600', '2600', '2900', '3100'],
    ['Events', '0', '6500', '0', '8000'],
    ['Content', '1800', '1800', '1800', '1800'],
    ['Partners', '900', '1200', '1500', '1800'],
    ['Tools', '640', '640', '655', '655'],
];

const ForecastSheet = () => {
    const [values, setValues] = useState(plan);
    const [ranges, setRanges] = useState<DataGridRange[]>([
        { top: 0, left: 1, bottom: 0, right: 1 },
    ]);
    return (
        <AppWindow
            actions={
                <Button variant="secondary">
                    <Download {...icon} /> Export
                </Button>
            }
            description="Spend a channel a quarter. Paste from a spreadsheet, or drag a fill along a row."
            place="reports"
            title="Marketing plan 2027"
            trail={['Reports', 'Marketing plan 2027']}
        >
            <DataGrid
                className="w-full"
                columns={[
                    { label: 'Channel', width: 160 },
                    { label: 'Q1', align: 'right' },
                    { label: 'Q2', align: 'right' },
                    { label: 'Q3', align: 'right' },
                    { label: 'Q4', align: 'right' },
                ]}
                footer={<Summary ranges={ranges} values={values} />}
                label="Marketing plan 2027"
                onSelectionChange={(_, __, all) => setRanges(all)}
                onValuesChange={setValues}
                values={values}
            />
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Marketing plan',
    note: 'A plan worked on like a spreadsheet: a quarter a column, the selection summed under the grid.',
    app: true,
    render: () => <ForecastSheet />,
};
