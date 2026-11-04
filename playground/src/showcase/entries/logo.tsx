import { Button, Card, ContinuumLogo, Field, FieldLabel, Input } from 'continuum';
import { Mail } from 'lucide-react';
import { type Entry, type InUse, icon } from '../kit';

const LogoPreview = () => (
    <div className="flex flex-col items-center gap-6">
        <ContinuumLogo size={32} />
        <ContinuumLogo size={20} />
    </div>
);

export const entry: Entry = {
    id: 'logo',
    name: 'Logo',
    category: 'frame',
    description: 'The Continuum mark, a rounded endless loop.',
    Preview: LogoPreview,
};

const SignIn = () => (
    <Card className="w-full max-w-sm items-stretch gap-5 px-6 py-8">
        <ContinuumLogo className="self-center" size={24} />
        <div className="flex flex-col items-center gap-1 text-center">
            <p className="font-medium text-neutral-950 text-sm">Sign in to your workspace</p>
            <p className="text-neutral-600 text-xs">We send a link to your email; no password.</p>
        </div>
        <Field>
            <FieldLabel>Work email</FieldLabel>
            <Input leadingIcon={<Mail {...icon} />} placeholder="name@company.com" />
        </Field>
        <Button size="lg">Continue</Button>
    </Card>
);

export const inUse: InUse = {
    title: 'Sign in',
    note: 'The lockup over a one-field sign in.',
    canvas: true,
    render: () => <SignIn />,
};
