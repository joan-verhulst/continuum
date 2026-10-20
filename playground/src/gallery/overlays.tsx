import {
    BarChart3,
    ChevronDown,
    CircleCheck,
    Clock,
    Copy,
    Download,
    Ellipsis,
    FileText,
    History,
    Home,
    Inbox,
    Pencil,
    Send,
    Settings,
    Share2,
    Trash2,
    Users,
} from 'lucide-react';
import {
    ActivityItem,
    ActivityList,
    Avatar,
    Badge,
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
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
    Field,
    FieldHelper,
    FieldLabel,
    Input,
    Rail,
    RailItem,
    RailSeparator,
    Sheet,
    SheetBody,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from 'personal-design-system';
import { useState } from 'react';
import { Specimen, Variant } from '../layout';

const icon = { strokeWidth: 1.5 } as const;

export const MenuSection = () => {
    const [grid, setGrid] = useState(true);
    const [density, setDensity] = useState('comfortable');
    const [last, setLast] = useState<string>();

    return (
        <Specimen note={last ? `Last picked: ${last}` : 'Open either menu'} title="Dropdown menu">
            <Variant label="labels · shortcuts · submenu · checkbox and radio items · danger">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary">
                            Report <ChevronDown {...icon} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-60">
                        <DropdownMenuLabel>Northwind Q3 review</DropdownMenuLabel>
                        <DropdownMenuGroup>
                            <DropdownMenuItem onSelect={() => setLast('Rename')}>
                                <Pencil {...icon} /> Rename
                                <DropdownMenuShortcut>R</DropdownMenuShortcut>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setLast('Duplicate')}>
                                <Copy {...icon} /> Duplicate
                                <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <Download {...icon} /> Export as
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onSelect={() => setLast('PDF')}>
                                        PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setLast('CSV')}>
                                        CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled>PowerPoint</DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>View</DropdownMenuLabel>
                        <DropdownMenuCheckboxItem
                            checked={grid}
                            onCheckedChange={checked => setGrid(checked === true)}
                        >
                            Show grid lines
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuRadioGroup onValueChange={setDensity} value={density}>
                            <DropdownMenuRadioItem value="comfortable">
                                Comfortable
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setLast('Delete')} variant="danger">
                            <Trash2 {...icon} /> Delete report
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </Variant>
            <Variant label="row actions">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button aria-label="Row actions" size="icon-sm" variant="ghost">
                            <Ellipsis {...icon} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setLast('Send reminder')}>
                            <Send {...icon} /> Send reminder
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setLast('Share')}>
                            <Share2 {...icon} /> Share link
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setLast('Void')} variant="danger">
                            <Trash2 {...icon} /> Void invoice
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </Variant>
        </Specimen>
    );
};

export const DialogSection = () => {
    const [name, setName] = useState('Northwind Q3 review');
    const [open, setOpen] = useState(false);

    return (
        <Specimen note="Both are portalled and keep the theme" title="Dialog and sheet">
            <Variant label={`dialog · ${name}`}>
                <Dialog onOpenChange={setOpen} open={open}>
                    <DialogTrigger asChild>
                        <Button>
                            <Pencil {...icon} /> Rename report
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Rename report</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                            The new name shows up for everyone in the workspace.
                        </DialogDescription>
                        <DialogBody>
                            {/* Closes on submit rather than through DialogClose, which would
                                unmount the form before it submits. */}
                            <form
                                id="rename-report"
                                onSubmit={event => {
                                    event.preventDefault();
                                    const value = new FormData(event.currentTarget).get('name');
                                    if (typeof value === 'string' && value.trim()) {
                                        setName(value.trim());
                                    }
                                    setOpen(false);
                                }}
                            >
                                <Field>
                                    <FieldLabel>Name</FieldLabel>
                                    <Input defaultValue={name} maxLength={60} name="name" />
                                    <FieldHelper>Up to 60 characters.</FieldHelper>
                                </Field>
                            </form>
                        </DialogBody>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button form="rename-report" type="submit">
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Variant>
            <Variant label="side sheet · non-modal">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="secondary">
                            <History {...icon} /> Status history
                        </Button>
                    </SheetTrigger>
                    <SheetContent aria-describedby={undefined}>
                        <SheetHeader icon={<History />}>
                            <SheetTitle>Status history</SheetTitle>
                        </SheetHeader>
                        <SheetBody className="p-4">
                            <ActivityList>
                                <ActivityItem
                                    action={<Badge tone="success">Paid</Badge>}
                                    icon={<CircleCheck {...icon} />}
                                    time="Today, 09:12"
                                    title="Payment received from Acme"
                                    tone="success"
                                />
                                <ActivityItem
                                    action={<Badge tone="warning">Reminder</Badge>}
                                    icon={<Clock {...icon} />}
                                    time="2 days ago"
                                    title="Reminder sent"
                                    tone="warning"
                                />
                                <ActivityItem
                                    icon={<Send {...icon} />}
                                    time="12 days ago"
                                    title="Invoice sent to finance@acme.com"
                                />
                                <ActivityItem
                                    icon={<FileText {...icon} />}
                                    time="12 days ago"
                                    title="Invoice created"
                                />
                            </ActivityList>
                        </SheetBody>
                    </SheetContent>
                </Sheet>
            </Variant>
        </Specimen>
    );
};

const railItems = [
    { id: 'home', label: 'Home', icon: <Home {...icon} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 {...icon} /> },
    { id: 'inbox', label: 'Inbox', icon: <Inbox {...icon} /> },
    { id: 'people', label: 'People', icon: <Users {...icon} /> },
];

export const RailSection = () => {
    const [active, setActive] = useState('analytics');

    return (
        <Specimen
            note="Hover an icon for its tooltip"
            stageClassName="bg-neutral-100"
            title="Rail and tooltip"
        >
            <TooltipProvider>
                <Variant label={`rail · ${active}`}>
                    <Rail aria-label="Main">
                        {railItems.map(item => (
                            <RailItem
                                active={item.id === active}
                                aria-current={item.id === active ? 'page' : undefined}
                                key={item.id}
                                label={item.label}
                                onClick={() => setActive(item.id)}
                            >
                                {item.icon}
                            </RailItem>
                        ))}
                        <RailSeparator />
                        <RailItem
                            active={active === 'settings'}
                            aria-current={active === 'settings' ? 'page' : undefined}
                            label="Settings"
                            onClick={() => setActive('settings')}
                        >
                            <Settings {...icon} />
                        </RailItem>
                        <div className="mt-1">
                            <Avatar fallback="AS" shape="round" size={24} />
                        </div>
                    </Rail>
                </Variant>
                <Variant label="tooltip on any trigger">
                    <div className="flex gap-2">
                        {(['top', 'bottom'] as const).map(side => (
                            <Tooltip key={side}>
                                <TooltipTrigger asChild>
                                    <Button variant="secondary">Tooltip {side}</Button>
                                </TooltipTrigger>
                                <TooltipContent side={side}>Shown on the {side}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </Variant>
            </TooltipProvider>
        </Specimen>
    );
};
