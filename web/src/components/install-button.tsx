import { Button } from '@contui/ui';
import { ArrowRight } from 'lucide-react';

/** Where the site's one action leads: the install guide, `npx contui init` and what it sets up. */
export const installUrl = '/docs/install';

/**
 * The site's one action, Install: the library's primary button, saying what the click leads to.
 * Continuum is free to use, so the action is installing it.
 */
export const InstallButton = ({ className, size }: { className?: string; size?: 'md' | 'lg' }) => (
    <Button className={className} render={props => <a {...props} href={installUrl} />} size={size}>
        Install
        <ArrowRight strokeWidth={2} />
    </Button>
);
