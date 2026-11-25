import {
    FilterCondition,
    FilterConditionField,
    FilterConditionOperator,
    FilterConditionRemove,
    FilterConditionValue,
    filterOperators,
    HoldButton,
    Input,
    SegmentedControl,
    SegmentedControlItem,
    Toolbar,
    ToolbarButton,
    ToolbarChip,
} from '@contui/ui';
import {
    Archive,
    Bold,
    Braces,
    ChevronDown,
    ChevronUp,
    CircleDot,
    Expand,
    Hand,
    Italic,
    Link2,
    List,
    MessageSquare,
    Minus,
    MousePointer2,
    PenLine,
    Plus,
    Search,
    Square,
    Trash2,
    Type,
    Underline,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useState } from 'react';
import { icon } from '../../showcase/kit';

/* ---------- Buttons ---------- */

export const DangerHold = () => {
    const [done, setDone] = useState(false);
    return (
        <HoldButton onConfirm={() => setDone(true)}>
            <Trash2 {...icon} /> {done ? 'Deleted' : 'Hold to delete'}
        </HoldButton>
    );
};

export const EditComment = () => (
    <SegmentedControl aria-label="Mode" defaultValue="edit">
        <SegmentedControlItem value="edit">
            <PenLine {...icon} /> Edit
        </SegmentedControlItem>
        <SegmentedControlItem value="comment">
            <MessageSquare {...icon} /> Comment
        </SegmentedControlItem>
    </SegmentedControl>
);

/** A date range in four segments. */
export const RangeSegments = () => (
    <SegmentedControl aria-label="Range" defaultValue="30d">
        <SegmentedControlItem value="7d">7d</SegmentedControlItem>
        <SegmentedControlItem value="30d">30d</SegmentedControlItem>
        <SegmentedControlItem value="3m">3m</SegmentedControlItem>
        <SegmentedControlItem value="12m">12m</SegmentedControlItem>
    </SegmentedControl>
);

/** The reference's comment field. */
export const CommentInput = () => (
    <Input aria-label="Comment" className="w-64" placeholder="Add a comment" size="sm" />
);

/** The reference's zoom stack, flat: in, out, fit. */
export const ZoomFitBar = () => (
    <Toolbar aria-label="View">
        <ToolbarButton aria-label="Zoom in">
            <ZoomIn {...icon} />
        </ToolbarButton>
        <ToolbarButton aria-label="Zoom out">
            <ZoomOut {...icon} />
        </ToolbarButton>
        <ToolbarButton aria-label="Fit">
            <Expand {...icon} />
        </ToolbarButton>
    </Toolbar>
);

/** The reference's canvas bar: tools, a divider, then Comment. */
export const CanvasToolbar = () => (
    <Toolbar aria-label="Canvas tools" variant="floating">
        <ToolbarButton aria-label="Select">
            <MousePointer2 {...icon} />
        </ToolbarButton>
        <ToolbarButton aria-label="Pan">
            <Hand {...icon} />
        </ToolbarButton>
        <ToolbarButton aria-label="Frame">
            <Square {...icon} />
        </ToolbarButton>
        <ToolbarButton aria-label="Text">
            <Type {...icon} />
        </ToolbarButton>
        <span aria-hidden className="mx-1 my-1.5 w-px shrink-0 self-stretch bg-neutral-200" />
        <ToolbarButton>
            <MessageSquare {...icon} /> Comment
        </ToolbarButton>
    </Toolbar>
);

/** The AI bar over a selection: the lead chip, then flush segments. */
export const AiToolbar = () => (
    <Toolbar aria-label="Suggestions">
        <ToolbarChip>AI</ToolbarChip>
        <ToolbarButton>
            <PenLine {...icon} /> Improve
        </ToolbarButton>
        <ToolbarButton>
            <MessageSquare {...icon} /> Explain
        </ToolbarButton>
    </Toolbar>
);

/** A selection's action bar. */
export const SelectionToolbar = () => (
    <Toolbar aria-label="Selection" variant="floating">
        <ToolbarButton>3 selected</ToolbarButton>
        <ToolbarButton>
            <Archive {...icon} /> Archive
        </ToolbarButton>
        <ToolbarButton>
            <Trash2 {...icon} /> Delete
        </ToolbarButton>
    </Toolbar>
);

/** The reference's formatting bar: type, B I U, code, colour, list, link. */
export const FormatToolbar = () => (
    <Toolbar aria-label="Formatting" variant="floating">
        <ToolbarButton aria-label="Text style">
            <Type {...icon} />
        </ToolbarButton>
        <ToolbarButton aria-label="Bold">
            <Bold {...icon} />
        </ToolbarButton>
        <ToolbarButton aria-label="Italic">
            <Italic {...icon} />
        </ToolbarButton>
        <ToolbarButton aria-label="Underline">
            <Underline {...icon} />
        </ToolbarButton>
        <ToolbarButton aria-label="Code">
            <Braces {...icon} />
        </ToolbarButton>
        <ToolbarButton aria-label="Colour">
            <span className="size-4 rounded-full bg-primary-500" />
        </ToolbarButton>
        <ToolbarButton aria-label="List">
            <List {...icon} />
        </ToolbarButton>
        <ToolbarButton aria-label="Link">
            <Link2 {...icon} />
        </ToolbarButton>
    </Toolbar>
);

/**
 * The reference's find bar: the field (its icon on the bar's item inset, the words typed in the
 * regular weight, the count right after them in the quiet grey), a hairline, up and down, a
 * hairline, close. Each part sits on the bar's own 30 items, so nothing floats in a gap.
 */
export const FindBar = () => {
    const [hit, setHit] = useState(2);
    return (
        <Toolbar aria-label="Find" variant="floating">
            <label className="flex min-w-0 cursor-text items-center gap-2 pr-2 pl-2.5 text-xs">
                <Search className="size-icon shrink-0 text-neutral-500" strokeWidth={2} />
                <input
                    aria-label="Find"
                    className="w-24 min-w-0 bg-transparent font-normal text-neutral-950 outline-none placeholder:text-neutral-500"
                    defaultValue="toolbar"
                    placeholder="Find"
                />
                <span className="shrink-0 font-normal text-neutral-500 tabular-nums">{hit}/7</span>
            </label>
            <span aria-hidden className="mx-1 my-1.5 w-px shrink-0 self-stretch bg-neutral-200" />
            <ToolbarButton aria-label="Previous" onClick={() => setHit(h => (h > 1 ? h - 1 : 7))}>
                <ChevronUp {...icon} />
            </ToolbarButton>
            <ToolbarButton aria-label="Next" onClick={() => setHit(h => (h < 7 ? h + 1 : 1))}>
                <ChevronDown {...icon} />
            </ToolbarButton>
            <span aria-hidden className="mx-1 my-1.5 w-px shrink-0 self-stretch bg-neutral-200" />
            <ToolbarButton aria-label="Close">
                <X {...icon} />
            </ToolbarButton>
        </Toolbar>
    );
};

/** The reference's +/− stack, flat: out, the level, in. */
export const ZoomBar = () => {
    const [zoom, setZoom] = useState(100);
    return (
        <Toolbar aria-label="Zoom" variant="floating">
            <ToolbarButton aria-label="Zoom out" onClick={() => setZoom(z => Math.max(25, z - 25))}>
                <Minus {...icon} />
            </ToolbarButton>
            <ToolbarButton onClick={() => setZoom(100)}>{zoom}%</ToolbarButton>
            <ToolbarButton aria-label="Zoom in" onClick={() => setZoom(z => z + 25)}>
                <Plus {...icon} />
            </ToolbarButton>
        </Toolbar>
    );
};

const statusOptions = ['Draft', 'Due soon', 'Overdue', 'Paid'].map(value => ({ value }));

/** One filter condition: field, operator, values, remove. */
export const FilterPiece = () => {
    const [operator, setOperator] = useState<string>('any');
    const [values, setValues] = useState<string[]>(['Due soon', 'Overdue']);
    return (
        <FilterCondition aria-label="Status filter">
            <FilterConditionField icon={<CircleDot {...icon} />}>Status</FilterConditionField>
            <FilterConditionOperator
                onValueChange={setOperator}
                options={filterOperators.many}
                value={operator}
            />
            <FilterConditionValue
                multiple
                onValueChange={setValues}
                operator={operator}
                options={statusOptions}
                value={values}
            />
            <FilterConditionRemove aria-label="Remove the status filter" />
        </FilterCondition>
    );
};
