import { Button } from 'continuum';
import { ArrowRight } from 'lucide-react';
import { proLaunchPriceEUR } from '@/lib/site';

/**
 * Where the button leads: Pro's checkout. Until payment exists, Pro's waitlist on the landing's
 * pricing (`#pro-early-access`).
 */
export const proCheckout = '/#pro-early-access';

/**
 * The site's one action, Buy for €299 (the launch price, from site.ts): the library's primary button, saying what the click does and costs (it leads
 * to Pro's checkout), so there is no separate Pro button beside it.
 */
export const GetStartedPro = ({ className, size }: { className?: string; size?: 'md' | 'lg' }) => (
    <Button className={className} render={props => <a {...props} href={proCheckout} />} size={size}>
        Buy for €{proLaunchPriceEUR}
        <ArrowRight strokeWidth={2} />
    </Button>
);
