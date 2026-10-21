import { Badge, Card, CardHeader, CardTitle, cn, Separator } from 'continuum';
import {
    type ComponentProps,
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

export type SectionEntry = {
    id: string;
    title: string;
    description?: ReactNode;
    render: () => ReactNode;
};

/* ---------- Page index: a DocsPage hands its sections to the sidebar ---------- */

export type PageIndexEntry = { id: string; title: string };

type PageIndex = {
    sections: PageIndexEntry[];
    active?: string;
    setSections: (sections: PageIndexEntry[]) => void;
    setActive: (id: string | undefined) => void;
};

const noop = () => {};

const PageIndexContext = createContext<PageIndex>({
    sections: [],
    setSections: noop,
    setActive: noop,
});

export const PageIndexProvider = ({ children }: { children: ReactNode }) => {
    const [sections, setSections] = useState<PageIndexEntry[]>([]);
    const [active, setActive] = useState<string>();
    const value = useMemo(() => ({ sections, active, setSections, setActive }), [sections, active]);

    return <PageIndexContext.Provider value={value}>{children}</PageIndexContext.Provider>;
};

/** The sections of the page on show and the one being read, for the sidebar and breadcrumb. */
export const usePageIndex = () => useContext(PageIndexContext);

/** Scrolls a section to the top of the panel. */
export const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/* ---------- Sections and specimens ---------- */

type SectionProps = Omit<ComponentProps<'section'>, 'title'> & {
    title: ReactNode;
    description?: ReactNode;
};

export const Section = ({ title, description, className, children, ...props }: SectionProps) => (
    <section className={cn('flex scroll-mt-6 flex-col gap-5', className)} {...props}>
        <header className="flex max-w-2xl flex-col gap-1.5">
            <h2 className="font-medium text-lg text-neutral-950">{title}</h2>
            {description && <p className="text-neutral-600 text-xs leading-5">{description}</p>}
        </header>
        {children}
    </section>
);

type SpecimenProps = Omit<ComponentProps<'div'>, 'title'> & {
    title: ReactNode;
    note?: ReactNode;
    /** Classes for the stage the components sit on. */
    stageClassName?: string;
};

/** A card on the page holding one component set, labelled like a card title. */
export const Specimen = ({
    title,
    note,
    className,
    stageClassName,
    children,
    ...props
}: SpecimenProps) => (
    <Card className={cn('min-w-0 gap-0 overflow-hidden p-0', className)} {...props}>
        <CardHeader className="flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-4">
            <CardTitle>{title}</CardTitle>
            {note && <span className="text-neutral-500 text-xxs">{note}</span>}
        </CardHeader>
        <div className={cn('flex min-w-0 flex-wrap items-start gap-8 p-5', stageClassName)}>
            {children}
        </div>
    </Card>
);

/** The dashed outline Figma draws round a component set. */
export const ComponentSet = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex flex-col items-start gap-3 rounded-item border border-primary-400/60 border-dashed p-4',
            className,
        )}
        {...props}
    />
);

type VariantProps = Omit<ComponentProps<'div'>, 'title'> & {
    label: ReactNode;
};

export const Variant = ({ label, className, children, ...props }: VariantProps) => (
    <div className={cn('flex min-w-0 flex-col items-start gap-2.5', className)} {...props}>
        {children}
        <span className="text-neutral-500 text-xxs">{label}</span>
    </div>
);

export const Note = ({ className, ...props }: ComponentProps<'p'>) => (
    <p className={cn('max-w-2xl text-neutral-600 text-xs leading-5', className)} {...props} />
);

/* ---------- Page header ---------- */

type PageHeaderProps = {
    eyebrow: ReactNode;
    title: ReactNode;
    description: ReactNode;
    aside?: ReactNode;
};

/** Eyebrow badge, title and lead at the top of a view, closed by a hairline. */
export const PageHeader = ({ eyebrow, title, description, aside }: PageHeaderProps) => (
    <>
        <header className="flex flex-wrap items-end justify-between gap-6 px-6 py-8 lg:px-10 lg:py-10">
            <div className="flex max-w-2xl flex-col items-start gap-3">
                <Badge>{eyebrow}</Badge>
                <div className="flex flex-col gap-2">
                    <h1 className="font-medium text-3xl text-neutral-950">{title}</h1>
                    <p className="text-neutral-600 text-sm leading-6">{description}</p>
                </div>
            </div>
            {aside}
        </header>
        <Separator />
    </>
);

/* ---------- Docs page ---------- */

/** Marks the first section in the top part of the panel as the one being read. */
const useScrollSpy = (ids: string[], onChange: (id: string) => void) => {
    useEffect(() => {
        const visible = new Map<string, boolean>();
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
                const first = ids.find(id => visible.get(id));
                if (first) onChange(first);
            },
            // The panel's header bar ends about 62px down the viewport.
            { rootMargin: '-80px 0px -55% 0px' },
        );
        for (const id of ids) {
            const node = document.getElementById(id);
            if (node) observer.observe(node);
        }
        return () => observer.disconnect();
    }, [ids, onChange]);
};

type DocsPageProps = {
    sections: SectionEntry[];
    ids: string[];
};

/** The sections one under the other; their index lives in the app's sidebar. */
export const DocsPage = ({ sections, ids }: DocsPageProps) => {
    const { setSections, setActive } = usePageIndex();

    useEffect(() => {
        setSections(sections.map(({ id, title }) => ({ id, title })));
        setActive(sections[0]?.id);
        return () => {
            setSections([]);
            setActive(undefined);
        };
    }, [sections, setSections, setActive]);

    useScrollSpy(ids, setActive);

    return (
        <div className="flex min-w-0 flex-col gap-10 p-6 lg:p-10">
            {sections.map((section, i) => (
                <div className="flex min-w-0 flex-col gap-10" key={section.id}>
                    {i > 0 && <Separator />}
                    <Section
                        description={section.description}
                        id={section.id}
                        title={section.title}
                    >
                        {section.render()}
                    </Section>
                </div>
            ))}
        </div>
    );
};
