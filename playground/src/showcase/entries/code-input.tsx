import { Button, CodeInput, DialogDescription, Field, FieldHelper, FieldLabel } from 'continuum';
import { useState } from 'react';
import { type Entry, type InUse, OpenDialog, scene } from '../kit';

const CodeInputPreview = () => {
    const [code, setCode] = useState('');

    return (
        <Field>
            <FieldLabel>Verification code</FieldLabel>
            <CodeInput onValueChange={setCode} value={code} />
            <FieldHelper>
                {code.length === 6 ? 'Checking the code…' : 'Sent to your email.'}
            </FieldHelper>
        </Field>
    );
};

export const entry: Entry = {
    id: 'code-input',
    name: 'Code input',
    category: 'inputs',
    description: 'Boxes for a sign-in code, with paste and autofill.',
    Preview: CodeInputPreview,
};

const VerifyEmail = () => {
    const [code, setCode] = useState('482');

    return (
        <OpenDialog
            footer={
                <>
                    <Button variant="ghost">Resend code</Button>
                    <Button disabled={code.length < 6}>Continue</Button>
                </>
            }
            title="Verify your email"
            width={420}
        >
            <DialogDescription>
                We sent a six-digit code to maya@acme.app. It is valid for ten minutes.
            </DialogDescription>
            <Field>
                <FieldLabel>Verification code</FieldLabel>
                <CodeInput onValueChange={setCode} value={code} />
                <FieldHelper>
                    {code.length === 6 ? 'Checking the code…' : 'Paste it or type it in.'}
                </FieldHelper>
            </Field>
        </OpenDialog>
    );
};

export const inUse: InUse = {
    title: 'Verify your email',
    note: 'Six boxes, half filled; Continue waits for the rest.',
    bare: true,
    render: scene(<VerifyEmail />),
};
