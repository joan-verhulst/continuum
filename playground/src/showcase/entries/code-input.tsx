import { Button, Card, CodeInput, Field, FieldHelper, FieldLabel, SidebarLogo } from 'continuum';
import { ArrowLeft, Boxes } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

const codeInputKnobs: Knob[] = [
    {
        id: 'size',
        label: 'Size',
        options: [o('md', 'md · 38px'), o('lg', 'lg · 52px')],
        default: 'md',
    },
    {
        id: 'code',
        label: 'Code',
        options: [o('empty', 'Empty'), o('half', 'Half typed'), o('full', 'Full')],
        default: 'empty',
    },
    { id: 'invalid', label: 'Invalid', switch: true, default: false },
    { id: 'mask', label: 'Masked', switch: true, default: false },
];

// The code each knob value stands for; a knob's value is never empty, so the empty code has a name.
const typed: Record<string, string> = { empty: '', half: '482', full: '482913' };

const CodeInputPreview = ({ knobs }: PreviewProps) => {
    const [code, setCode] = useState(typed[String(knobs.code)] ?? '');
    const invalid = Boolean(knobs.invalid);

    // The knob sets the code; typing still changes it, as it would on the page.
    useEffect(() => setCode(typed[String(knobs.code)] ?? ''), [knobs.code]);

    return (
        <Field invalid={invalid}>
            <FieldLabel>Verification code</FieldLabel>
            <CodeInput
                mask={Boolean(knobs.mask)}
                onValueChange={setCode}
                shake
                size={knobs.size as 'md' | 'lg'}
                value={code}
            />
            <FieldHelper>
                {invalid
                    ? 'That code has expired. Ask for a new one.'
                    : code.length === 6
                      ? 'Checking the code…'
                      : 'Sent to your email.'}
            </FieldHelper>
        </Field>
    );
};

export const entry: Entry = {
    id: 'code-input',
    name: 'Code input',
    category: 'inputs',
    description: 'Boxes for a sign-in code, with paste and autofill.',
    knobs: codeInputKnobs,
    Preview: CodeInputPreview,
};

// The second step of signing in: the page alone, one card on the canvas.
const CheckEmail = () => {
    const [code, setCode] = useState('482');

    return (
        <AppWindow className="items-center justify-center bg-neutral-100 px-10 pt-0" nav="none">
            <Card className="w-full max-w-100 gap-6 p-8">
                <div className="flex flex-col items-start gap-4">
                    <SidebarLogo className="-ml-1.5">
                        <Boxes {...icon} />
                    </SidebarLogo>
                    <div className="flex flex-col gap-1.5">
                        <h1 className="font-medium text-neutral-950 text-xl">Check your email</h1>
                        <p className="text-neutral-600 text-sm">
                            We sent a six-digit code to maya@acme.app.
                        </p>
                    </div>
                </div>
                <Field>
                    <FieldLabel>Verification code</FieldLabel>
                    <CodeInput onValueChange={setCode} size="lg" value={code} />
                    <FieldHelper>
                        {code.length === 6
                            ? 'Checking the code…'
                            : 'Valid for ten minutes. Paste it or type it in.'}
                    </FieldHelper>
                </Field>
                <div className="flex flex-col gap-2">
                    <Button className="w-full" disabled={code.length < 6} size="lg">
                        Continue
                    </Button>
                    <Button className="w-full" size="lg" variant="ghost">
                        Resend code
                    </Button>
                </div>
            </Card>
            <Button variant="ghost">
                <ArrowLeft {...icon} /> Use another email
            </Button>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Check your email',
    note: 'The second step of signing in: six boxes, half filled, and Continue waiting for the rest.',
    app: true,
    render: () => <CheckEmail />,
};
