'use client';

import { Theme, ToastProvider } from 'continuum';
import { type ComponentIndex, Components } from './sections/components';
import { Hero, Screens } from './sections/hero';
import { HowItWorks } from './sections/how-it-works';
import { Mcp } from './sections/mcp';
import { Pricing } from './sections/pricing';
import { Questions } from './sections/questions';
import { Uses } from './sections/uses';
import { productThemeCss } from './theme';
import { Divider, Rails, RuledFrame } from './web';

export const Landing = ({ componentIndex }: { componentIndex: ComponentIndex }) => (
    <Theme className="min-h-dvh bg-neutral-50 text-neutral-950" mode="dark" theme="continuum-ui">
        {/* The product shots' theme: the site's, with the accent filling the action. */}
        <style>{productThemeCss}</style>
        {/* The playground's screens are shown live, and some raise toasts (an undo after archiving). */}
        <ToastProvider>
            {/* Positioned and isolated, so the rails sit under every section and the boards cover them. */}
            <main className="relative isolate">
                <Rails />
                <Hero />
                <Divider />
                <Screens />
                <Divider />
                <Components index={componentIndex} />
                <Divider />
                {/* The board brightens a step towards the terminal, as the hero does towards its foot. */}
                <RuledFrame
                    className="bg-[radial-gradient(ellipse_70%_60%_at_50%_56%,var(--color-neutral-100),var(--color-neutral-50))]"
                    grid={false}
                >
                    <Mcp />
                </RuledFrame>
                <Divider />
                <Uses />
                <Divider />
                <HowItWorks />
                <Divider />
                <Pricing families={componentIndex.families} />
                <Divider />
                <Questions />
            </main>
        </ToastProvider>
    </Theme>
);
