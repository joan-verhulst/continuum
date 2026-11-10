import { Theme, ToastProvider } from 'continuum';
import { BuiltWith } from './sections/built-with';
import { Footer } from './sections/closer';
import { Components } from './sections/components';
import { FairTest } from './sections/fair-test';
import { Hero } from './sections/hero';
import { HowItWorks } from './sections/how-it-works';
import { Mcp } from './sections/mcp';
import { Nav } from './sections/nav';
import { Pricing } from './sections/pricing';
import { Uses } from './sections/uses';
import { SITE_THEME, siteThemeCss } from './theme';
import { RuledFrame } from './web';

/**
 * The landing page, top to bottom. The order is the argument:
 * 1. What is it? The hero: the promise and the product, an app's screens at their real size.
 * 2. The parts: every component, live.
 * 3. Into your workflow: the MCP connection, what the system is for, then how it goes from setup
 *    to a finished screen.
 * 4. Why it matters: one prompt before and after.
 * 5. Start: pricing, what was built with it, the footer.
 */
export const App = () => (
    <Theme className="min-h-dvh bg-neutral-50 text-neutral-950" mode="dark" theme={SITE_THEME}>
        <style>{siteThemeCss}</style>
        {/* The playground's screens are shown live, and some raise toasts (an undo after archiving). */}
        <ToastProvider>
            <Nav />
            <main>
                <Hero />
                <Components />
                <RuledFrame grid={false}>
                    <Mcp />
                </RuledFrame>
                <Uses />
                <HowItWorks />
                <FairTest />
                <Pricing />
                <BuiltWith />
            </main>
            <Footer />
        </ToastProvider>
    </Theme>
);
