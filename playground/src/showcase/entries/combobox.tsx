import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    Field,
    FieldLabel,
} from 'continuum';
import { UserRound } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    DialogActions,
    type Entry,
    type InUse,
    icon,
    OpenDialog,
    previewIcon,
    scene,
} from '../kit';

const owners = [
    'Anna de Vries',
    'Bram Jansen',
    'Chloé Martin',
    'Daan Visser',
    'Eva Bakker',
    'Femke Smit',
];

const ComboboxPreview = () => {
    const [open, setOpen] = useState(false);
    const stage = useStageContainer();

    return (
        <div className={stage ? 'pb-56' : 'contents'}>
            <Combobox
                defaultValue="Eva Bakker"
                items={owners}
                modal={stage ? false : undefined}
                onOpenChange={setOpen}
                open={stage ? true : open}
            >
                <ComboboxInput
                    aria-label="Account owner"
                    className="w-56"
                    leadingIcon={<UserRound {...previewIcon} />}
                    placeholder="Search people"
                    size="sm"
                />
                <ComboboxContent container={stage}>
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
        </div>
    );
};

export const entry: Entry = {
    id: 'combobox',
    name: 'Combobox',
    category: 'inputs',
    description: 'A select you type into, for long lists.',
    // Taller than a tile, so the tile keeps the top in view and lets the rest run off.
    stageClassName: 'items-start',
    Preview: ComboboxPreview,
};

const ownersInUse = [
    'Anna de Vries',
    'Bram Jansen',
    'Chloé Martin',
    'Daan Visser',
    'Eva Bakker',
    'Femke Smit',
];

const AssignOwner = () => {
    const stage = useStageContainer();

    return (
        <OpenDialog footer={<DialogActions action="Assign" />} title="Assign INV-0142">
            <Field>
                <FieldLabel>Owner</FieldLabel>
                <Combobox defaultValue="Eva Bakker" items={ownersInUse} modal={false} open>
                    <ComboboxInput
                        leadingIcon={<UserRound {...icon} />}
                        placeholder="Search people"
                    />
                    <ComboboxContent container={stage}>
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
            </Field>
            {/* Room for the open list, as the rest of the form would sit under it. */}
            <div className="h-56" />
        </OpenDialog>
    );
};

export const inUse: InUse = {
    title: 'Assign a record',
    note: 'A person picked by typing, the list open under the box.',
    bare: true,
    render: scene(<AssignOwner />, 'min-h-[480px]'),
};
