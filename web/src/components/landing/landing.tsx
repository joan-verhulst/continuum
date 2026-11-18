'use client';

import { Theme, ToastProvider } from 'continuum';
import { type ComponentIndex, Components } from './sections/components';
import { FairTest } from './sections/fair-test';
import { Hero } from './sections/hero';
import { HowItWorks } from './sections/how-it-works';
import { Mcp } from './sections/mcp';
import { Pricing } from './sections/pricing';
import { Uses } from './sections/uses';
import { productThemeCss } from './theme';
import { Divider, Rails, RuledFrame } from './web';

/**
 * The landing page, top to bottom. The order is the argument:
 * 1. What is it? The hero: the promise and the product, an app's screens at their real size.
 * 2. The parts: every component, live.
 * 3. Into your workflow: the MCP connection, what the system is for, then how it goes from setup
 *    to a finished screen.
 * 4. Why it matters: one prompt before and after.
 * 5. Start: pricing. The site's header and footer (in the root layout)
 *    round it, as they round every page.
 *
 * Ported from site/src/app.tsx as it is; its links now lead to the site's pages and the app.
 */
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
                <FairTest />
                <Divider />
                <Pricing />
            </main>
        </ToastProvider>
    </Theme>
);
