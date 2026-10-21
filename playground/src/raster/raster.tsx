import { cn } from 'continuum';
import {
    type ComponentProps,
    type CSSProperties,
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    type Areas,
    areasFor,
    BODY_CAP_ON_GRID,
    baselineIn,
    computeRaster,
    gridColumn,
    type Raster,
    type RasterParams,
    type Span,
} from './engine';

type RasterValue = { raster: Raster; areas: Areas; content: { head?: Span; main: Span } };

const RasterContext = createContext<RasterValue | null>(null);

export const useRaster = () => {
    const value = useContext(RasterContext);
    if (!value) throw new Error('useRaster needs a RasterPage');
    return value;
};

type RasterPageProps = {
    params: RasterParams;
    overlay?: boolean;
    nav?: ReactNode;
    children: ReactNode;
};

/**
 * The page grid. Navigation takes its own columns; everything else lives in a
 * subgrid over the remaining columns, so labels and content share one set of
 * column lines whether or not the labels have room to hang.
 */
export const RasterPage = ({ params, overlay, nav, children }: RasterPageProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(1280);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => {
            if (entry) setWidth(entry.contentRect.width);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    // The page's margins are part of the raster, so it measures the box it sits in.
    const raster = computeRaster(width, params);
    const areas = areasFor(raster.columns);
    const contentStart = areas.head?.[0] ?? areas.main[0];
    const relative = ([start, span]: Span): Span => [start - contentStart + 1, span];
    const content = {
        head: areas.head && relative(areas.head),
        main: relative(areas.main),
    };

    const style = {
        '--rx-line': `${raster.line}px`,
        '--rx-gutter': `${raster.gutter}px`,
        gridTemplateColumns: `repeat(${raster.columns}, minmax(0, 1fr))`,
        columnGap: raster.gutter,
        paddingInline: raster.margin,
        paddingTop: raster.line * 2,
        paddingBottom: raster.line * 6,
        lineHeight: `${raster.line}px`,
    } as CSSProperties;

    return (
        <div className="relative w-full" ref={ref}>
            <RasterContext.Provider value={{ raster, areas, content }}>
                <div className="relative grid min-h-full content-start" style={style}>
                    {overlay && <RasterOverlay raster={raster} />}
                    {nav && areas.nav && (
                        <div style={{ gridColumn: gridColumn(areas.nav) }}>{nav}</div>
                    )}
                    <div
                        className="grid grid-cols-subgrid content-start"
                        style={{ gridColumn: `${contentStart} / -1` }}
                    >
                        {children}
                    </div>
                </div>
            </RasterContext.Provider>
        </div>
    );
};

/** A horizontal band across the content columns; its children place themselves. */
export const Band = ({ className, ...props }: ComponentProps<'div'>) => (
    <div className={cn('col-span-full grid grid-cols-subgrid', className)} {...props} />
);

type AreaProps = ComponentProps<'div'> & {
    area: 'head' | 'main' | 'all';
    /** A slice of the content columns, counted from the content's own first column. */
    within?: Span;
};

/**
 * Places a block in the labels' or the content's columns. Without room for
 * hanging labels, a label stacks above its content one line apart.
 */
export const Area = ({ area, within, className, style, ...props }: AreaProps) => {
    const { content } = useRaster();
    const span = area === 'head' ? (content.head ?? content.main) : content.main;
    const placed: Span = within ? [span[0] + within[0] - 1, within[1]] : span;
    const stacked = area === 'head' && !content.head;

    return (
        <div
            className={cn(stacked && 'mb-[var(--rx-line)]', className)}
            style={{ gridColumn: area === 'all' ? '1 / -1' : gridColumn(placed), ...style }}
            {...props}
        />
    );
};

type RowProps = ComponentProps<'div'> & {
    /** Row height in px; text in it is centred with its baseline on the grid. */
    height: number;
};

/** A fixed-height row whose single line of text sits on the baseline grid. */
export const Row = ({ height, className, style, ...props }: RowProps) => (
    <div
        className={cn('flex items-start', className)}
        style={{ height, paddingTop: baselineIn(height) - BODY_CAP_ON_GRID, ...style }}
        {...props}
    />
);

/**
 * Trimmed to its cap height and baseline, then nudged down so the cap tops out
 * just under a grid line: every line of it lands on the baseline grid.
 */
export const Text = ({
    as: Tag = 'span',
    className,
    children,
}: {
    as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'dt' | 'dd';
    className?: string;
    children: ReactNode;
}) => <Tag className={cn('rx block', className)}>{children}</Tag>;

/** Columns in red as Figma draws a layout grid; baselines in blue, every line stronger. */
const RasterOverlay = ({ raster }: { raster: Raster }) => (
    <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30 grid"
        style={{
            gridTemplateColumns: `repeat(${raster.columns}, minmax(0, 1fr))`,
            columnGap: raster.gutter,
            paddingInline: raster.margin,
            backgroundImage: [
                `repeating-linear-gradient(to bottom, rgb(13 153 255 / 0.35) 0 1px, transparent 1px ${raster.line}px)`,
                `repeating-linear-gradient(to bottom, rgb(13 153 255 / 0.12) 0 1px, transparent 1px ${raster.quantum}px)`,
            ].join(', '),
        }}
    >
        {Array.from({ length: raster.columns }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional
            <span className="bg-[rgb(242_72_34/0.07)]" key={index} />
        ))}
    </div>
);
