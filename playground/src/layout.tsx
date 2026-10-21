import { cn, NavItem } from 'continuum';
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';

export type SectionEntry = {
    id: string;
    title: string;
    description?: ReactNode;
    render: () => ReactNode;
};

type SectionProps = Omit<ComponentProps<'section'>, 'title'> & {
    title: ReactNode;
    description?: ReactNode;
};

export const Section = ({ title, description, className, children, ...props }: SectionProps) => (
    <section
        className={cn(
            'flex scroll-mt-24 flex-col gap-5 border-neutral-200 border-t pt-10 first:border-t-0 first:pt-0',
            className,
        )}
        {...props}
    >
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

/** A frame on the page, like a component set on a Figma library page. */
export const Specimen = ({
    title,
    note,
    className,
    stageClassName,
    children,
    ...props
}: SpecimenProps) => (
    <div
        className={cn(
            'flex min-w-0 flex-col overflow-hidden rounded-card border border-neutral-200',
            className,
        )}
        {...props}
    >
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-neutral-200 border-b bg-neutral-100 px-4 py-2">
            <span className="font-medium text-neutral-950 text-xs">{title}</span>
            {note && <span className="text-neutral-600 text-xxs">{note}</span>}
        </div>
        <div
            className={cn(
                'flex min-w-0 flex-wrap items-start gap-8 bg-neutral-50 p-6',
                stageClassName,
            )}
        >
            {children}
        </div>
    </div>
);

/** The dashed outline Figma draws round a component set. */
export const ComponentSet = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex flex-col items-start gap-3 rounded-chip border border-primary-400/60 border-dashed p-4',
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

type PageHeaderProps = {
    eyebrow: ReactNode;
    title: ReactNode;
    description: ReactNode;
    aside?: ReactNode;
};

export const PageHeader = ({ eyebrow, title, description, aside }: PageHeaderProps) => (
    <header className="flex flex-wrap items-end justify-between gap-6 border-neutral-200 border-b px-6 py-8 lg:px-10 lg:py-10">
        <div className="flex max-w-2xl flex-col gap-2">
            <span className="text-neutral-600 text-xs">{eyebrow}</span>
            <h1 className="font-medium text-3xl text-neutral-950">{title}</h1>
            <p className="text-neutral-600 text-sm leading-6">{description}</p>
        </div>
        {aside}
    </header>
);

const useScrollSpy = (ids: string[]) => {
    const [active, setActive] = useState(ids[0]);

    useEffect(() => {
        const visible = new Map<string, boolean>();
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
                const first = ids.find(id => visible.get(id));
                if (first) setActive(first);
            },
            { rootMargin: '-96px 0px -55% 0px' },
        );
        for (const id of ids) {
            const node = document.getElementById(id);
            if (node) observer.observe(node);
        }
        return () => observer.disconnect();
    }, [ids]);

    return active;
};

type DocsPageProps = {
    sections: SectionEntry[];
    ids: string[];
};

/** A sticky index on the left, the sections on the right. */
export const DocsPage = ({ sections, ids }: DocsPageProps) => {
    const active = useScrollSpy(ids);

    return (
        <div className="grid lg:grid-cols-[224px_minmax(0,1fr)]">
            <aside className="hidden border-neutral-200 border-r lg:block">
                <nav
                    aria-label="On this page"
                    className="sticky top-[72px] flex flex-col gap-0.5 p-3"
                >
                    {sections.map(section => (
                        <NavItem
                            active={section.id === active}
                            aria-current={section.id === active ? 'location' : undefined}
                            key={section.id}
                            onClick={() =>
                                document
                                    .getElementById(section.id)
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                        >
                            {section.title}
                        </NavItem>
                    ))}
                </nav>
            </aside>
            <div className="flex min-w-0 flex-col gap-10 p-6 lg:p-10">
                {sections.map(section => (
                    <Section
                        description={section.description}
                        id={section.id}
                        key={section.id}
                        title={section.title}
                    >
                        {section.render()}
                    </Section>
                ))}
            </div>
        </div>
    );
};
