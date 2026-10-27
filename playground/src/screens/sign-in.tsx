import {
    Button,
    Card,
    Checkbox,
    Field,
    FieldLabel,
    Input,
    Separator,
    SidebarLogo,
} from 'continuum';
import { Boxes, KeyRound } from 'lucide-react';

const icon = { strokeWidth: 2 } as const;

/** A sign-in: one card on the canvas, the email and password, and a way in without them. */
export const SignIn = () => (
    <div className="flex h-full min-h-full min-w-[1280px] flex-col items-center justify-center gap-6 bg-neutral-100 p-10">
        <Card className="w-[400px] gap-6 p-8">
            <div className="flex flex-col items-start gap-4">
                <SidebarLogo className="-ml-1.5">
                    <Boxes {...icon} />
                </SidebarLogo>
                <div className="flex flex-col gap-1.5">
                    <h1 className="font-medium text-neutral-950 text-xl">Sign in to Acme</h1>
                    <p className="text-neutral-600 text-sm">Welcome back. Use your work email.</p>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                <Field>
                    <FieldLabel>Work email</FieldLabel>
                    <Input defaultValue="maya@acme.app" type="email" />
                </Field>
                <Field>
                    <div className="flex items-baseline justify-between gap-3">
                        <FieldLabel>Password</FieldLabel>
                        <button
                            className="cursor-pointer text-neutral-600 text-xs hover:text-neutral-950"
                            type="button"
                        >
                            Forgot it?
                        </button>
                    </div>
                    <Input defaultValue="correct horse battery" type="password" />
                </Field>
                <Field className="flex-row items-center gap-2.5">
                    <Checkbox defaultChecked />
                    <FieldLabel className="font-normal">Keep me signed in</FieldLabel>
                </Field>
            </div>

            <div className="flex flex-col gap-4">
                <Button className="w-full" size="lg">
                    Sign in
                </Button>
                <div className="flex items-center gap-3 text-neutral-500 text-xs">
                    <Separator className="flex-1" />
                    or
                    <Separator className="flex-1" />
                </div>
                <Button className="w-full" size="lg" variant="secondary">
                    <KeyRound {...icon} />
                    Continue with single sign-on
                </Button>
            </div>
        </Card>
        <p className="text-neutral-600 text-xs">
            No account yet?{' '}
            <button
                className="cursor-pointer font-medium text-neutral-950 hover:underline"
                type="button"
            >
                Start a free trial
            </button>
        </p>
    </div>
);
