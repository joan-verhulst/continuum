import { Button, Card, ContinuumLogo, Field, FieldLabel, Input } from 'continuum';
import { KeyRound, Mail } from 'lucide-react';
import { AppWindow, type Entry, type InUse, icon } from '../kit';

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
    <AppWindow className="items-center gap-8 pt-16" nav="none">
        <ContinuumLogo size={32} />
        <Card className="w-95 gap-6 p-8">
            <div className="flex flex-col gap-1.5">
                <h1 className="font-medium text-neutral-950 text-xl">Sign in</h1>
                <p className="text-neutral-600 text-sm">
                    We email you a link to sign in; no password.
                </p>
            </div>
            <Field>
                <FieldLabel>Work email</FieldLabel>
                <Input
                    defaultValue="maya@northwind.com"
                    leadingIcon={<Mail {...icon} />}
                    type="email"
                />
            </Field>
            <div className="flex flex-col gap-3">
                <Button className="w-full" size="lg">
                    Email me a link
                </Button>
                <Button className="w-full" size="lg" variant="secondary">
                    <KeyRound {...icon} /> Continue with single sign-on
                </Button>
            </div>
        </Card>
        <p className="text-neutral-600 text-xs">
            New to Continuum?{' '}
            <button
                className="cursor-pointer font-medium text-neutral-950 hover:underline"
                type="button"
            >
                Start a free trial
            </button>
        </p>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Sign in',
    note: 'The lockup over the sign-in, the first page anyone sees.',
    app: true,
    render: () => <SignIn />,
};
