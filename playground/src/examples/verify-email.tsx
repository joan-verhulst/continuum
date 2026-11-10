import {
    Button,
    Card,
    CodeInput,
    cn,
    Field,
    FieldHelper,
    FieldLabel,
    focusRing,
    IconTile,
    Input,
} from 'continuum';
import { ArrowRight, CircleCheck } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';

const icon = { strokeWidth: 2 } as const;

// The demo accepts one code; anything else shows the invalid state.
const validCode = '123456';
const codeLength = 6;
// A minute between sends, the usual floor before a mail provider throttles.
const resendDelay = 60;

const clock = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

// Inline text actions: quiet like a label, darker on hover, never the theme's action colour.
const textAction = cn(
    'cursor-pointer rounded-chip font-medium text-neutral-600 text-xs transition-[color] duration-150 hover:text-neutral-950',
    focusRing,
);

/** The "Verify your email" step: a six-box code, Continue once it is full, and a resend countdown. */
export const verifyEmailExample = () => <VerifyEmail />;

const VerifyEmail = () => {
    const [email, setEmail] = useState('maya@acme.app');
    const [editing, setEditing] = useState(false);
    const [draftEmail, setDraftEmail] = useState(email);
    const [code, setCode] = useState('');
    const [invalid, setInvalid] = useState(false);
    // Starts part-way down, as in the design, so the countdown is visibly running.
    const [remaining, setRemaining] = useState(54);
    const [verified, setVerified] = useState(false);
    const [announcement, setAnnouncement] = useState('');

    // Each of these buttons takes itself out of the page, so focus is handed on after the swap
    // instead of falling to the body: to the code boxes after a send, back to "Wrong email?" on Cancel.
    const codeRef = useRef<HTMLInputElement>(null);
    const wrongEmailRef = useRef<HTMLButtonElement>(null);
    const focusNext = useRef<'code' | 'wrong-email' | null>(null);

    useEffect(() => {
        if (!focusNext.current) return;
        (focusNext.current === 'code' ? codeRef.current : wrongEmailRef.current)?.focus();
        focusNext.current = null;
    });

    useEffect(() => {
        if (remaining <= 0) return;
        const timer = window.setTimeout(() => setRemaining(seconds => seconds - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [remaining]);

    // Only the moment resend becomes possible is spoken; a per-second tick would drown the reader.
    useEffect(() => {
        if (remaining === 0) setAnnouncement('You can request a new code now.');
    }, [remaining]);

    const complete = code.length === codeLength;

    const sendCode = (to: string) => {
        setCode('');
        setInvalid(false);
        setRemaining(resendDelay);
        setAnnouncement(`A new code was sent to ${to}.`);
        focusNext.current = 'code';
    };

    const verify = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!complete) return;
        if (code === validCode) setVerified(true);
        else setInvalid(true);
    };

    const nextEmail = draftEmail.trim();
    // The same address again is a resend, so it waits for the same countdown as "Resend code".
    const sameEmailWaiting = nextEmail === email && remaining > 0;

    const changeEmail = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!nextEmail || sameEmailWaiting) return;
        setEmail(nextEmail);
        setEditing(false);
        sendCode(nextEmail);
    };

    const startOver = () => {
        setVerified(false);
        sendCode(email);
    };

    if (verified) {
        return (
            <Card className="w-full max-w-100 gap-6 p-6">
                <div className="flex flex-col gap-3">
                    <IconTile tone="success" variant="outline">
                        <CircleCheck {...icon} />
                    </IconTile>
                    <div className="flex flex-col gap-1.5">
                        <h2 className="font-medium text-lg text-neutral-950">Email verified</h2>
                        <p className="text-neutral-600 text-xs">
                            <span className="font-medium text-neutral-950">{email}</span> is
                            confirmed. You can sign in with it from now on.
                        </p>
                    </div>
                </div>
                <Button className="w-full" onClick={startOver} size="lg" variant="secondary">
                    Start over
                </Button>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-100 gap-6 p-6">
            <div className="flex flex-col gap-1.5">
                <h2 className="font-medium text-lg text-neutral-950">Verify your email</h2>
                {editing ? (
                    <p className="text-neutral-600 text-xs">
                        We will send a new code to this address.
                    </p>
                ) : (
                    <>
                        <p className="text-neutral-600 text-xs">
                            We have sent a code to your email
                        </p>
                        <div className="flex items-baseline justify-between gap-3">
                            <p
                                className="min-w-0 truncate font-medium text-neutral-950 text-xs"
                                title={email}
                            >
                                {email}
                            </p>
                            <button
                                className={textAction}
                                onClick={() => {
                                    setDraftEmail(email);
                                    setEditing(true);
                                }}
                                ref={wrongEmailRef}
                                type="button"
                            >
                                Wrong email?
                            </button>
                        </div>
                    </>
                )}
            </div>

            {editing ? (
                <form className="flex flex-col gap-6" onSubmit={changeEmail}>
                    <Field>
                        <FieldLabel>Email address</FieldLabel>
                        <Input
                            autoComplete="email"
                            // The field replaces the "Wrong email?" button just pressed, so focus lands here.
                            autoFocus
                            onChange={event => setDraftEmail(event.target.value)}
                            required
                            type="email"
                            value={draftEmail}
                        />
                        {sameEmailWaiting && (
                            <FieldHelper>
                                That is the address the code went to. A new one can be sent in{' '}
                                {clock(remaining)}.
                            </FieldHelper>
                        )}
                    </Field>
                    <div className="flex flex-col gap-2">
                        <Button
                            className="w-full"
                            disabled={!nextEmail || sameEmailWaiting}
                            size="lg"
                            type="submit"
                        >
                            Send new code
                            <ArrowRight {...icon} />
                        </Button>
                        <Button
                            className="w-full"
                            onClick={() => {
                                focusNext.current = 'wrong-email';
                                setEditing(false);
                            }}
                            size="lg"
                            variant="ghost"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            ) : (
                <form className="flex flex-col gap-6" onSubmit={verify}>
                    <Field invalid={invalid}>
                        <FieldLabel className="sr-only">Verification code</FieldLabel>
                        <CodeInput
                            // The boxes share the full width, so the row lines up with the Continue button.
                            className="w-full"
                            length={codeLength}
                            name="code"
                            ref={codeRef}
                            onValueChange={next => {
                                setCode(next);
                                setInvalid(false);
                            }}
                            shake
                            size="lg"
                            value={code}
                        />
                        <FieldHelper>
                            {invalid
                                ? 'That code is not right. Check the latest email and try again.'
                                : `Enter the ${codeLength}-digit code. For this demo it is ${validCode}.`}
                        </FieldHelper>
                    </Field>
                    <Button className="w-full" disabled={!complete} size="lg" type="submit">
                        Continue
                        <ArrowRight {...icon} />
                    </Button>
                </form>
            )}

            {!editing &&
                (remaining > 0 ? (
                    <p className="text-neutral-600 text-xs">
                        Resend code in{' '}
                        <time
                            className="font-medium text-neutral-950 tabular-nums"
                            dateTime={`PT${remaining}S`}
                        >
                            {clock(remaining)}
                        </time>
                    </p>
                ) : (
                    <p className="text-neutral-600 text-xs">
                        Didn't get it?{' '}
                        <button
                            className={textAction}
                            onClick={() => sendCode(email)}
                            type="button"
                        >
                            Resend code
                        </button>
                    </p>
                ))}

            <p aria-live="polite" className="sr-only">
                {announcement}
            </p>
        </Card>
    );
};
