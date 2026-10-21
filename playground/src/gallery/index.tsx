import { DocsPage, PageHeader, type SectionEntry } from '../layout';
import {
    BadgeSection,
    ButtonSection,
    ChipSection,
    SegmentedSection,
    ToolbarSection,
} from './actions';
import {
    AvatarSection,
    CardSection,
    ChartSection,
    DescriptionSection,
    SmallSection,
    TableSection,
} from './data';
import {
    InputSection,
    OptionSection,
    SelectionSection,
    SelectSection,
    SliderSection,
} from './forms';
import {
    BottomBarSection,
    BreadcrumbSection,
    PaginationSection,
    SidebarSection,
} from './navigation';
import { DialogSection, MenuSection, RailSection } from './overlays';

const sections: SectionEntry[] = [
    {
        id: 'c-button',
        title: 'Button',
        description:
            'Primary, secondary and ghost, in two heights. Size changes padding and radius only; the label stays 13px medium.',
        render: () => <ButtonSection />,
    },
    {
        id: 'c-badge',
        title: 'Badge',
        description:
            'Soft for statuses, pill for deltas, dot for workflow states and count for nav items. Every tone reads its own status ramp by index.',
        render: () => <BadgeSection />,
    },
    {
        id: 'c-chip',
        title: 'Chips',
        description: 'Filter chips sit in top bars; suggestion chips offer prompts to the AI.',
        render: () => <ChipSection />,
    },
    {
        id: 'c-input',
        title: 'Input and field',
        description:
            'The box carries the border so icons sit inside it. A Field hands its id, helper and invalid state to whatever control it holds.',
        render: () => <InputSection />,
    },
    {
        id: 'c-select',
        title: 'Select',
        description: 'Shares the input’s box; the list is the same panel as the dropdown menu.',
        render: () => <SelectSection />,
    },
    {
        id: 'c-selection',
        title: 'Checkbox, radio and switch',
        description: 'Checked controls fill with the action colour, so each theme recolours them.',
        render: () => <SelectionSection />,
    },
    {
        id: 'c-slider',
        title: 'Slider',
        description:
            'A hairline track filled with the action colour up to a knob on the surface colour.',
        render: () => <SliderSection />,
    },
    {
        id: 'c-option',
        title: 'Option rows',
        description: 'From the report generator: a bordered row that toggles the control it holds.',
        render: () => <OptionSection />,
    },
    {
        id: 'c-segmented',
        title: 'Segmented control and tabs',
        description:
            'The segmented control filters in place; pill tabs switch between views and use the tint wash.',
        render: () => <SegmentedSection />,
    },
    {
        id: 'c-menu',
        title: 'Dropdown menu',
        description: 'Row-action and account menus. Items are 32px with an 8px inner radius.',
        render: () => <MenuSection />,
    },
    {
        id: 'c-dialog',
        title: 'Dialog and sheet',
        description:
            'Centred dialogs for confirmations and short forms; a non-modal side sheet for history next to the page.',
        render: () => <DialogSection />,
    },
    {
        id: 'c-rail',
        title: 'Rail and tooltip',
        description: 'The collapsed sidebar of the analytics screens, labelled by tooltips.',
        render: () => <RailSection />,
    },
    {
        id: 'c-toolbar',
        title: 'Toolbar',
        description: 'The report editor’s inline AI toolbar and floating action bar.',
        render: () => <ToolbarSection />,
    },
    {
        id: 'c-sidebar',
        title: 'Sidebar and app shell',
        description:
            'The email sequencing sidebar: logo row, a divided block with the call to action, projects that fold open to their pages, and the account footer.',
        render: () => <SidebarSection />,
    },
    {
        id: 'c-bottom-bar',
        title: 'Bottom bar',
        description:
            'The bar that floats at the bottom of a page: a dock of sections and the page’s main action beside it, a labelled action, a filter with its count or a lone +.',
        render: () => <BottomBarSection />,
    },
    {
        id: 'c-breadcrumb',
        title: 'Breadcrumb',
        render: () => <BreadcrumbSection />,
    },
    {
        id: 'c-pagination',
        title: 'Pagination',
        render: () => <PaginationSection />,
    },
    {
        id: 'c-avatar',
        title: 'Avatar',
        description: 'Square with a hairline for workspaces, round for people.',
        render: () => <AvatarSection />,
    },
    {
        id: 'c-card',
        title: 'Cards',
        description:
            'Cards share the page colour and are told apart by the hairline alone, so there is no shadow.',
        render: () => <CardSection />,
    },
    {
        id: 'c-description',
        title: 'Description list and activity',
        render: () => <DescriptionSection />,
    },
    {
        id: 'c-small',
        title: 'Icon tile, kbd and separator',
        render: () => <SmallSection />,
    },
    {
        id: 'c-table',
        title: 'Table',
        description: 'Ruled for data you work through, rows for short ranked lists on a dashboard.',
        render: () => <TableSection />,
    },
    {
        id: 'c-charts',
        title: 'Charts',
        description:
            'Hairline grids, 1px lines over fading fills, and the data colours. No axis lines, no legends inside the plot.',
        render: () => <ChartSection />,
    },
];

const ids = sections.map(section => section.id);

export const Gallery = () => (
    <>
        <PageHeader
            description="Every component family with its variants and states, laid out like a library page. Menus, selects, dialogs, sheets and tooltips open for real."
            eyebrow="Components"
            title="Library"
        />
        <DocsPage ids={ids} sections={sections} />
    </>
);
