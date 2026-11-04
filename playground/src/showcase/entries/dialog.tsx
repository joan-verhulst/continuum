import {
    Button,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Field,
    FieldHelper,
    FieldLabel,
    Input,
} from 'continuum';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { type Entry, type InUse, icon, OpenDialog, previewIcon, scene } from '../kit';

/*
 * Overlays are shown open: on a stage, the overlay is portalled into the stage and held
 * open there, scrim and all, so the component itself is on show rather than its trigger.
 * Off a stage, the trigger opens it as it would in a product.
 */

const DialogPreview = () => {
    const [name, setName] = useState('Northwind Q3 review');
    const [open, setOpen] = useState(false);
    const stage = useStageContainer();

    return (
        <div className="flex flex-col items-center gap-3">
            <Dialog
                modal={stage ? false : undefined}
                onOpenChange={setOpen}
                open={stage ? true : open}
            >
                <DialogTrigger render={<Button variant="secondary" />}>
                    <Pencil {...previewIcon} /> Rename report
                </DialogTrigger>
                <DialogContent
                    className={stage ? 'w-[min(420px,calc(100%-32px))]' : undefined}
                    container={stage}
                    finalFocus={stage ? false : undefined}
                    initialFocus={stage ? false : undefined}
                >
                    <DialogHeader>
                        <DialogTitle>Rename report</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <DialogDescription>
                            The new name shows up for everyone in the workspace.
                        </DialogDescription>
                        <form
                            id="showcase-rename"
                            onSubmit={event => {
                                event.preventDefault();
                                const value = new FormData(event.currentTarget).get('name');
                                if (typeof value === 'string' && value.trim())
                                    setName(value.trim());
                                setOpen(false);
                            }}
                        >
                            <Field>
                                <FieldLabel>Name</FieldLabel>
                                <Input defaultValue={name} maxLength={60} name="name" />
                            </Field>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                        <Button form="showcase-rename" type="submit">
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {!stage && <span className="max-w-56 truncate text-neutral-500 text-xxs">{name}</span>}
        </div>
    );
};

export const entry: Entry = {
    id: 'dialog',
    name: 'Dialog',
    category: 'overlays',
    description: 'Confirmations and short forms, centred.',
    hero: 'min-h-80',
    Preview: DialogPreview,
};

const DeleteReport = () => {
    const [name, setName] = useState('');

    return (
        <OpenDialog
            footer={
                <>
                    <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                    <Button disabled={name.trim() !== 'Northwind Q3 review'}>
                        <Trash2 {...icon} /> Delete report
                    </Button>
                </>
            }
            title="Delete report"
            width={420}
        >
            <DialogDescription>
                Northwind Q3 review and its 14 exports go for good. Type the report's name to
                confirm.
            </DialogDescription>
            <Field>
                <FieldLabel>Report name</FieldLabel>
                <Input
                    onChange={event => setName(event.target.value)}
                    placeholder="Northwind Q3 review"
                    value={name}
                />
                <FieldHelper>This cannot be undone.</FieldHelper>
            </Field>
        </OpenDialog>
    );
};

export const inUse: InUse = {
    title: 'Confirm a deletion',
    note: 'A destructive action that asks for the name back.',
    bare: true,
    render: scene(<DeleteReport />),
};
