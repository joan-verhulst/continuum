import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    Checkbox,
    Field,
    FieldLabel,
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from 'continuum';
import { Columns3 } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { type Entry, type InUse, icon, Labelled, previewIcon, scene } from '../kit';

const columnNames = ['Owner', 'Status', 'Amount', 'Due date'];

const PopoverPreview = () => {
    const [shown, setShown] = useState(['Owner', 'Status', 'Amount']);
    const stage = useStageContainer();

    return (
        <div className={stage ? 'pb-48' : 'contents'}>
            <Popover modal={stage ? false : undefined} open={stage ? true : undefined}>
                <PopoverTrigger render={<Button variant="secondary" />}>
                    <Columns3 {...previewIcon} /> Columns
                </PopoverTrigger>
                <PopoverContent
                    className="w-56"
                    container={stage}
                    finalFocus={stage ? false : undefined}
                    initialFocus={stage ? false : undefined}
                >
                    <PopoverHeader>
                        <PopoverTitle>Columns</PopoverTitle>
                        <PopoverDescription>Pick what the table shows.</PopoverDescription>
                    </PopoverHeader>
                    <div className="flex flex-col gap-2.5">
                        {columnNames.map(column => (
                            <Labelled key={column} label={column}>
                                <Checkbox
                                    checked={shown.includes(column)}
                                    onCheckedChange={checked =>
                                        setShown(current =>
                                            checked
                                                ? [...current, column]
                                                : current.filter(name => name !== column),
                                        )
                                    }
                                />
                            </Labelled>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export const entry: Entry = {
    id: 'popover',
    name: 'Popover',
    category: 'overlays',
    description: 'An anchored panel for pickers and quick edits.',
    hero: 'min-h-80',
    Preview: PopoverPreview,
};

const columnNamesInUse = ['Client', 'Status', 'Amount', 'Due', 'Owner'];

const ColumnsPopover = () => {
    const stage = useStageContainer();
    const [shown, setShown] = useState(['Client', 'Status', 'Amount', 'Due']);

    return (
        <Card className="mb-36 w-full max-w-xl gap-4">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Open invoices</CardTitle>
                <Popover modal={false} open>
                    <PopoverTrigger render={<Button variant="secondary" />}>
                        <Columns3 {...icon} /> Columns
                    </PopoverTrigger>
                    <PopoverContent
                        align="end"
                        className="w-56"
                        container={stage}
                        finalFocus={false}
                        initialFocus={false}
                    >
                        <PopoverHeader>
                            <PopoverTitle>Columns</PopoverTitle>
                            <PopoverDescription>Pick what the table shows.</PopoverDescription>
                        </PopoverHeader>
                        <div className="flex flex-col gap-2.5">
                            {columnNamesInUse.map(column => (
                                <Field className="flex-row items-center gap-2.5" key={column}>
                                    <Checkbox
                                        checked={shown.includes(column)}
                                        onCheckedChange={checked =>
                                            setShown(current =>
                                                checked
                                                    ? [...current, column]
                                                    : current.filter(name => name !== column),
                                            )
                                        }
                                    />
                                    <FieldLabel className="cursor-pointer">{column}</FieldLabel>
                                </Field>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </CardHeader>
            <div className="flex gap-6 border-neutral-200 border-b pb-2 text-neutral-600 text-xs">
                {shown.map(column => (
                    <span className="flex-1" key={column}>
                        {column}
                    </span>
                ))}
            </div>
            <div className="h-16" />
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Column settings',
    note: 'Controls in a panel anchored to the button that opened it.',
    bare: true,
    render: scene(<ColumnsPopover />),
};
