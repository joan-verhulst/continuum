import { Badge, cn } from 'continuum';
import { ArrowUp, CornerDownRight } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ease, Reveal, Section, Window } from '../web';

/*
 * MCP: what the connection gives an agent. One figure, an agent session at its real 13px calling
 * the server's tools and writing the page they add up to, then the clients it connects to. The
 * session plays once when it comes into view: the prompt types in the chat input at the bottom and
 * is sent, then each call and its answer land in turn above it. Every line keeps its place from
 * the start, so nothing below it moves; under reduced motion it is all there at once.
 */

/* ---------- The session ---------- */

const prompt = 'Add a members page to settings, in our theme.';

type Call = {
    /** The tool, as the agent names it. */
    tool: string;
    /** What it was asked, after the name. */
    args: string;
    /** What came back, one line. */
    result: ReactNode;
    /** A call to the project, not to Continuum. */
    local?: boolean;
};

const Token = ({ children }: { children: ReactNode }) => (
    <span className="text-neutral-800">{children}</span>
);

const calls: Call[] = [
    {
        tool: 'continuum.get_theme',
        args: 'project: "acme-ops"',
        result: (
            <>
                accent <Token>#ffa31a</Token> · neutrals <Token>zinc</Token> · font{' '}
                <Token>Geist</Token> · corners <Token>6px</Token>
            </>
        ),
    },
    {
        tool: 'continuum.find_pattern',
        args: '"settings page"',
        result: (
            <>
                <Token>Settings</Token> · one column at 640px, sections under eyebrows, save bar on
                change
            </>
        ),
    },
    {
        tool: 'continuum.get_component',
        args: 'Table',
        result: (
            <>
                <Token>Table</Token>, <Token>TableToolbar</Token>, <Token>TableSearch</Token> · rows
                at 13px, controls at 34px
            </>
        ),
    },
    {
        tool: 'Write',
        args: 'src/pages/settings/members.tsx',
        result: (
            <>
                <span className="text-success-600">+138</span> · 6 components, theme tokens only, no
                arbitrary values
            </>
        ),
        local: true,
    },
];

/** How long the session takes to play, in ms: the prompt's characters, then a beat per line. */
const TYPE_MS = 22;
const START_MS = 300;
const CALL_MS = 520;
const RESULT_MS = 280;

/** Every line the session shows: the sent prompt, each call and its answer, the last word. */
const LINES = calls.length * 2 + 2;

/** How far the session has played: characters of the prompt typed, then lines shown. */
const useSession = (live: boolean, reduce: boolean) => {
    const [typed, setTyped] = useState(reduce ? prompt.length : 0);
    const [shown, setShown] = useState(reduce ? LINES : 0);

    useEffect(() => {
        if (reduce) {
            setTyped(prompt.length);
            setShown(LINES);
            return;
        }
        if (!live) return;
        const timers: ReturnType<typeof setTimeout>[] = [];
        for (let index = 1; index <= prompt.length; index++) {
            timers.push(setTimeout(() => setTyped(index), START_MS + index * TYPE_MS));
        }
        let at = START_MS + prompt.length * TYPE_MS + 400;
        for (let line = 1; line <= LINES; line++) {
            const step = line;
            timers.push(setTimeout(() => setShown(step), at));
            at += line % 2 === 0 ? RESULT_MS : CALL_MS;
        }
        return () => {
            for (const timer of timers) clearTimeout(timer);
        };
    }, [live, reduce]);

    return { typed, shown };
};

/** A line that holds its place until it is shown, then fades up into it. */
const Line = ({
    on,
    reduce,
    className,
    children,
}: {
    on: boolean;
    reduce: boolean;
    className?: string;
    children: ReactNode;
}) => (
    <motion.div
        animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 3 }}
        className={className}
        initial={reduce ? false : { opacity: 0, y: 3 }}
        transition={{ duration: 0.3, ease }}
    >
        {children}
    </motion.div>
);

/** The session: the sent prompt, four calls with what they returned, and the agent's last word. */
const Session = () => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, amount: 0.5 });
    const reduce = useReducedMotion() ?? false;
    const { typed, shown } = useSession(inView, reduce);
    const sent = shown > 0;
    const done = shown > LINES - 1;

    return (
        <div className="relative">
            {/* The glow behind the window, the accent spilling out around it onto the board. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-[8%] -inset-y-[6%] rounded-full bg-primary-500/20 blur-[96px]"
            />
            <Window
                bar={
                    <>
                        <span className="flex items-center gap-1.5" aria-hidden>
                            {[0, 1, 2].map(dot => (
                                <span className="size-2.5 rounded-full bg-neutral-200" key={dot} />
                            ))}
                        </span>
                        <span className="font-mono text-neutral-600 text-xs">acme-ops</span>
                        <span className="truncate font-mono text-neutral-500 text-xs max-sm:hidden">
                            ~/code/acme-ops
                        </span>
                        <Badge className="ml-auto" tone="success" variant="dot">
                            <span>
                                <span className="max-sm:hidden">continuum </span>connected
                            </span>
                        </Badge>
                    </>
                }
                bodyClassName="flex flex-col"
                className="min-w-0 border-primary-500/40 bg-neutral-50 shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--color-primary-400)_60%,transparent),0_0_0_1px_color-mix(in_oklab,var(--color-primary-500)_15%,transparent),0_-8px_32px_-12px_color-mix(in_oklab,var(--color-primary-500)_50%,transparent)] md:aspect-video"
            >
                <div
                    aria-label="An agent session using the Continuum MCP server"
                    className="flex flex-1 flex-col gap-4 overflow-x-auto px-4 py-5 font-mono text-xs leading-5 sm:px-5"
                    ref={ref}
                    role="img"
                >
                    <Line className="flex gap-2.5 text-neutral-950" on={sent} reduce={reduce}>
                        <span aria-hidden className="select-none text-neutral-500">
                            &gt;
                        </span>
                        <span className="min-w-0">{prompt}</span>
                    </Line>

                    <ol className="flex flex-col gap-3">
                        {calls.map((call, index) => (
                            <li className="flex flex-col gap-1" key={call.tool}>
                                <Line
                                    className="flex min-w-0 items-baseline gap-2.5"
                                    on={shown > index * 2 + 1}
                                    reduce={reduce}
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'size-1.5 shrink-0 -translate-y-px self-center rounded-full',
                                            call.local ? 'bg-neutral-500' : 'bg-primary-500',
                                        )}
                                    />
                                    <span className="whitespace-nowrap">
                                        <span
                                            className={
                                                call.local ? 'text-neutral-950' : 'text-primary-600'
                                            }
                                        >
                                            {call.tool}
                                        </span>
                                        <span className="text-neutral-600"> {call.args}</span>
                                    </span>
                                </Line>
                                <Line
                                    className="flex min-w-0 gap-2 pl-4 text-neutral-500"
                                    on={shown > index * 2 + 2}
                                    reduce={reduce}
                                >
                                    <CornerDownRight
                                        aria-hidden
                                        className="mt-[3px] size-3.5 shrink-0 text-neutral-400"
                                        strokeWidth={2}
                                    />
                                    <span className="min-w-0">{call.result}</span>
                                </Line>
                            </li>
                        ))}
                    </ol>

                    <Line
                        className="border-neutral-200 border-t pt-4 font-sans text-neutral-800"
                        on={done}
                        reduce={reduce}
                    >
                        Added the members page under Settings: a table of 24 members with search and
                        roles, on your accent and corners. It matches the Settings pattern.
                    </Line>

                    <div className="mt-auto flex items-center gap-2.5 rounded-control border border-neutral-200 bg-neutral-100 py-1.5 pr-1.5 pl-3">
                        <span className="min-w-0 flex-1 truncate">
                            {sent ? (
                                <span className="text-neutral-500">Ask the agent…</span>
                            ) : (
                                <span className="text-neutral-950">
                                    {prompt.slice(0, typed)}
                                    <span
                                        aria-hidden
                                        className="ml-px inline-block h-3.5 w-[7px] translate-y-0.5 bg-primary-500"
                                    />
                                </span>
                            )}
                        </span>
                        <span
                            aria-hidden
                            className={cn(
                                'flex size-6 shrink-0 items-center justify-center rounded-control transition-colors',
                                !sent && typed > 0
                                    ? 'bg-action text-on-action'
                                    : 'bg-neutral-200 text-neutral-500',
                            )}
                        >
                            <ArrowUp className="size-3.5" strokeWidth={2} />
                        </span>
                    </div>
                </div>
            </Window>
        </div>
    );
};

/** The clients' marks, one colour so they sit with the type. */
const marks = {
    claude: 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z',
    cursor: 'M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23',
    codex: 'M8.086.457a6.105 6.105 0 013.046-.415c1.333.153 2.521.72 3.564 1.7a.117.117 0 00.107.029c1.408-.346 2.762-.224 4.061.366l.063.03.154.076c1.357.703 2.33 1.77 2.918 3.198.278.679.418 1.388.421 2.126a5.655 5.655 0 01-.18 1.631.167.167 0 00.04.155 5.982 5.982 0 011.578 2.891c.385 1.901-.01 3.615-1.183 5.14l-.182.22a6.063 6.063 0 01-2.934 1.851.162.162 0 00-.108.102c-.255.736-.511 1.364-.987 1.992-1.199 1.582-2.962 2.462-4.948 2.451-1.583-.008-2.986-.587-4.21-1.736a.145.145 0 00-.14-.032c-.518.167-1.04.191-1.604.185a5.924 5.924 0 01-2.595-.622 6.058 6.058 0 01-2.146-1.781c-.203-.269-.404-.522-.551-.821a7.74 7.74 0 01-.495-1.283 6.11 6.11 0 01-.017-3.064.166.166 0 00.008-.074.115.115 0 00-.037-.064 5.958 5.958 0 01-1.38-2.202 5.196 5.196 0 01-.333-1.589 6.915 6.915 0 01.188-2.132c.45-1.484 1.309-2.648 2.577-3.493.282-.188.55-.334.802-.438.286-.12.573-.22.861-.304a.129.129 0 00.087-.087A6.016 6.016 0 015.635 2.31C6.315 1.464 7.132.846 8.086.457zm-.804 7.85a.848.848 0 00-1.473.842l1.694 2.965-1.688 2.848a.849.849 0 001.46.864l1.94-3.272a.849.849 0 00.007-.854l-1.94-3.393zm5.446 6.24a.849.849 0 000 1.695h4.848a.849.849 0 000-1.696h-4.848z',
};

const clients = [
    { name: 'Claude Code', mark: marks.claude },
    { name: 'Cursor', mark: marks.cursor },
    { name: 'Claude Desktop', mark: marks.claude },
    { name: 'Codex', mark: marks.codex },
];

/* ---------- The section ---------- */

export const Mcp = () => (
    <Section
        description="Connect your tools and give AI agents the context and capabilities to work with Continuum. From creating new interfaces to refining existing ones, keep design standards within reach."
        eyebrow="MCP"
        id="mcp"
        title="Bring your design system into your workflow."
    >
        <div className="flex flex-col gap-8">
            <Reveal>
                <Session />
            </Reveal>

            <Reveal className="flex flex-col items-center gap-3 text-center" delay={1}>
                <p className="text-neutral-500 text-xs">Connects to</p>
                <ul className="flex flex-wrap justify-center gap-2">
                    {clients.map(client => (
                        <li
                            className="inline-flex h-8 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 pr-3 pl-2.5 text-neutral-800 text-sm"
                            key={client.name}
                        >
                            <svg
                                aria-hidden="true"
                                className="size-3.5 shrink-0 text-neutral-950"
                                fill="currentColor"
                                fillRule="evenodd"
                                viewBox="0 0 24 24"
                            >
                                <path d={client.mark} />
                            </svg>
                            {client.name}
                        </li>
                    ))}
                </ul>
                <p className="text-neutral-500 text-xs leading-5">
                    One connection per project, on Pro.
                </p>
            </Reveal>
        </div>
    </Section>
);
