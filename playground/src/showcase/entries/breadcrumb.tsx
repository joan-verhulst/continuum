import {
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbMenu,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    DropdownMenuItem,
    HeaderBar,
} from 'continuum';
import { Download, Folder } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    type PreviewProps,
    previewIcon,
    scene,
} from '../kit';

const breadcrumbKnobs: Knob[] = [
    {
        id: 'size',
        label: 'Size',
        options: [o('md', 'md · 13px'), o('lg', 'lg · 14px')],
        default: 'md',
    },
    {
        id: 'trail',
        label: 'Trail',
        options: [
            o('short', 'Short'),
            o('long', 'Long, all shown'),
            o('collapsed', 'Long, collapsed'),
        ],
        default: 'collapsed',
    },
    { id: 'switcher', label: 'Workspace switcher', switch: true, default: true },
    { id: 'home', label: 'Home icon', switch: true, default: true },
    { id: 'longPage', label: 'Long page name', switch: true, default: false },
];

const hiddenCrumbs = ['Finance', 'Payments', '2026'];

const workspaces = ['Northwind', 'Acme Corp', 'Globex'];

const BreadcrumbPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer();
    const [workspace, setWorkspace] = useState('Northwind');
    const middle =
        knobs.trail === 'short' ? [] : knobs.trail === 'long' ? hiddenCrumbs : ['collapsed'];

    return (
        // A bar's width, so a long page name has something to truncate against.
        <Breadcrumb className="w-[440px] max-w-full">
            <BreadcrumbList size={knobs.size === 'lg' ? 'lg' : 'md'}>
                {knobs.home && (
                    <>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">
                                <BreadcrumbHome />
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                    </>
                )}
                <BreadcrumbItem>
                    {knobs.switcher ? (
                        <BreadcrumbMenu container={stage} label={workspace}>
                            {workspaces.map(name => (
                                <DropdownMenuItem key={name} onClick={() => setWorkspace(name)}>
                                    {name}
                                </DropdownMenuItem>
                            ))}
                        </BreadcrumbMenu>
                    ) : (
                        <BreadcrumbLink href="#">{workspace}</BreadcrumbLink>
                    )}
                </BreadcrumbItem>
                {middle.map(crumb => (
                    <BreadcrumbItem key={crumb}>
                        <BreadcrumbSeparator />
                        {crumb === 'collapsed' ? (
                            <BreadcrumbMenu container={stage}>
                                {hiddenCrumbs.map(name => (
                                    <DropdownMenuItem key={name}>
                                        <Folder {...previewIcon} /> {name}
                                    </DropdownMenuItem>
                                ))}
                            </BreadcrumbMenu>
                        ) : (
                            <BreadcrumbLink href="#">{crumb}</BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                ))}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink href="#">Batches</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>
                        {knobs.longPage
                            ? 'Batch #12345 · October payouts to European suppliers'
                            : 'Batch #12345'}
                    </BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
};

export const entry: Entry = {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    category: 'navigation',
    description: 'Where the page sits; a long trail folds its middle into a menu.',
    knobs: breadcrumbKnobs,
    Preview: BreadcrumbPreview,
};

const foldedCrumbs = ['Finance', 'Payments', '2026'];

const BreadcrumbHeader = () => {
    const stage = useStageContainer();
    const [workspace, setWorkspace] = useState('Northwind');

    return (
        <div className="mb-24 w-full max-w-2xl self-start overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50">
            <HeaderBar>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">
                                <BreadcrumbHome />
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbMenu container={stage} label={workspace}>
                                {['Northwind', 'Acme Corp', 'Globex'].map(name => (
                                    <DropdownMenuItem key={name} onClick={() => setWorkspace(name)}>
                                        {name}
                                    </DropdownMenuItem>
                                ))}
                            </BreadcrumbMenu>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbMenu container={stage} defaultOpen modal={false}>
                                {foldedCrumbs.map(name => (
                                    <DropdownMenuItem key={name}>
                                        <Folder {...icon} /> {name}
                                    </DropdownMenuItem>
                                ))}
                            </BreadcrumbMenu>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">October batches</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Batch #12345 · European suppliers</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <Button variant="secondary">
                    <Download {...icon} /> Export
                </Button>
            </HeaderBar>
            <div className="flex flex-col gap-1.5 px-6 py-8 opacity-60">
                <p className="font-medium text-neutral-950 text-sm">Batch #12345</p>
                <p className="text-neutral-600 text-xs">
                    14 payouts · €18,420.00 · sent 14 October
                </p>
            </div>
        </div>
    );
};

export const inUse: InUse = {
    title: 'A deep trail',
    note: 'A workspace switcher first, the middle folded into a menu, the page truncating last.',
    bare: true,
    render: scene(<BreadcrumbHeader />, 'items-start'),
};
