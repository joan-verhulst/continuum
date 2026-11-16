import {
    AppPanel,
    AppShell,
    Button,
    ContinuumLogo,
    Field,
    FieldLabel,
    Input,
    SheetArea,
} from 'continuum';
import { ArrowRight } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import {
    AsideSlotProvider,
    FooterSlotProvider,
    HeaderSlotProvider,
    Page,
    PageFooter,
} from './layout';

/*
 * The first visit: with no project yet, the app opens on a setup outside its shell. It asks for the
 * product's name, which makes the project, then walks the builder's own steps on it (Colour, Type,
 * Controls, Sizes, Review) with the live preview beside them. Naming it answers the welcome for
 * good; the project keeps every step as it is left, so leaving partway picks up in the app's
 * builder. Skipping before a name goes home in Continuum's own. A project brought from the site's
 * theme builder skips it, since there is a project then.
 */

const WELCOME = 'continuum.welcome';

const answered = () => {
    try {
        return localStorage.getItem(WELCOME) !== null;
    } catch {
        return false;
    }
};

/**
 * Whether the welcome has been answered, a way to answer it ('built' or 'skipped'), and the project
 * being set up in it this visit, if one has been named.
 */
export const useWelcome = () => {
    const [done, setDone] = useState(answered);
    const [building, setBuilding] = useState<string>();
    const answer = (how: 'built' | 'skipped') => {
        try {
            localStorage.setItem(WELCOME, how);
        } catch {
            // Without storage it only holds for this visit.
        }
        setDone(true);
    };
    return { done, answer, building, setBuilding };
};

const NAME = 'My product';

type OnboardingProps = {
    /** The project's builder, once it is named; the name step until then. */
    children?: ReactNode;
    /** Makes the project with this name, and opens its steps here. */
    onName: (name: string) => void;
    onSkip: () => void;
};

/**
 * The setup's canvas: the logo and Skip setup on it, then the builder's frame without its sidebar,
 * a panel for the steps and, once there is a theme to show, the preview's own panel beside it. The
 * builder puts its parts where the app's shell would take them: its save state in the canvas's
 * header, Back and Continue at the foot of the panel, the preview in the second panel.
 */
export const Onboarding = ({ children, onName, onSkip }: OnboardingProps) => {
    const [header, setHeader] = useState<HTMLDivElement | null>(null);
    const [footer, setFooter] = useState<HTMLDivElement | null>(null);
    const [aside, setAside] = useState<HTMLDivElement | null>(null);

    return (
        <div className="flex h-dvh flex-col bg-neutral-100 text-neutral-950">
            <header className="flex h-12 shrink-0 items-center justify-between gap-4 px-4 lg:px-6">
                <ContinuumLogo className="pl-1" size={18} />
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4" ref={setHeader} />
                    <Button onClick={onSkip} variant="ghost">
                        Skip setup
                    </Button>
                </div>
            </header>

            <AppShell className="min-h-0 flex-1">
                <AppPanel className="ml-2">
                    <SheetArea className="min-h-0 flex-1 overflow-auto">
                        <HeaderSlotProvider value={header}>
                            <AsideSlotProvider value={aside}>
                                <FooterSlotProvider value={footer}>
                                    {children ?? <NameStep onName={onName} />}
                                </FooterSlotProvider>
                            </AsideSlotProvider>
                        </HeaderSlotProvider>
                    </SheetArea>
                    <div className="contents" ref={setFooter} />
                </AppPanel>
                <div className="contents" ref={setAside} />
            </AppShell>
        </div>
    );
};

/** The first step, in the builder's own page: what the theme is for, then on to its steps. */
const NameStep = ({ onName }: { onName: (name: string) => void }) => {
    const [name, setName] = useState('');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        onName(name.trim() || NAME);
    };

    return (
        <Page width="narrow">
            <form className="flex flex-col gap-10" id="onboarding-name" onSubmit={submit}>
                <header className="flex flex-col gap-3">
                    <p className="text-neutral-600 text-xs">Welcome to Continuum</p>
                    <h1 className="font-medium text-3xl text-neutral-950 tracking-[-0.02em]">
                        Name your product
                    </h1>
                    <p className="max-w-xl text-base text-neutral-600">
                        What the theme is for. It is kept in this browser as a project; its theme is
                        built next, in five steps: colour, type, controls, sizes and a review.
                    </p>
                </header>
                <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                        autoFocus
                        onChange={event => setName(event.target.value)}
                        placeholder={NAME}
                        value={name}
                    />
                </Field>
            </form>
            <PageFooter>
                <Button form="onboarding-name" type="submit">
                    Continue
                    <ArrowRight strokeWidth={2} />
                </Button>
            </PageFooter>
        </Page>
    );
};
