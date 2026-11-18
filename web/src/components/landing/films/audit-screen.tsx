'use client';

import { cn } from 'continuum';
import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

/** The four apps the plan card lives in, one stack each. */
export type App = 'dashboard' | 'billing' | 'admin' | 'site';

/** Where an app's file is: untouched, marked by the audit, being rewritten, rewritten. */
export type Stage = 'idle' | 'marked' | 'fixing' | 'fixed';

/** How long a rewrite waits, for the camera to arrive at its file, before the value is selected. */
const SETTLE = 650;

type Rewrite = { line: number; from: string; to: string };

/**
 * The same plan card in each app's own stack, as written, and the audit's two findings in each
 * (a weight of 600, a raw grey), with the fix in that file's own idiom, as audit_source writes it.
 */
const files: Record<App, { name: string; path: string; source: string; rewrites: Rewrite[] }> = {
    dashboard: {
        name: 'PlanCard.tsx',
        path: 'apps/dashboard/src',
        source: `import { Card, Progress } from '@/components/ui';

export function PlanCard({ plan, used }: PlanCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-6">
      <h3 className="text-sm font-semibold">{plan.name}</h3>
      <p className="text-[13px] text-[#6b7280]">
        {used} of {plan.seats} seats used
      </p>
      <Progress value={used} max={plan.seats} />
    </Card>
  );
}`,
        rewrites: [
            { line: 6, from: 'font-semibold', to: 'font-medium' },
            { line: 7, from: 'text-[#6b7280]', to: 'text-neutral-600' },
        ],
    },
    billing: {
        name: 'PlanCard.vue',
        path: 'apps/billing/src',
        source: `<template>
  <section class="plan-card">
    <h3 class="plan-name">{{ plan.name }}</h3>
    <p class="seats">{{ used }} of {{ plan.seats }}</p>
  </section>
</template>

<style scoped>
.plan-name {
  font-weight: 600;
}
.seats {
  color: #6b7280;
}
</style>`,
        rewrites: [
            { line: 10, from: '600', to: '500' },
            { line: 13, from: '#6b7280', to: 'var(--color-neutral-600)' },
        ],
    },
    admin: {
        name: 'plan-card.component.ts',
        path: 'apps/admin/src/app',
        source: `@Component({
  selector: 'app-plan-card',
  template: \`
    <h3 class="name">{{ plan().name }}</h3>
    <p class="seats">{{ used() }} of {{ plan().seats }}</p>
  \`,
  styles: \`
    .name { font-weight: 600; }
    .seats { color: #6b7280; }
  \`,
})
export class PlanCardComponent {
  plan = input.required<Plan>();
  used = input(0);
}`,
        rewrites: [
            { line: 8, from: '600', to: '500' },
            { line: 9, from: '#6b7280', to: 'var(--color-neutral-600)' },
        ],
    },
    site: {
        name: 'PlanCard.svelte',
        path: 'apps/site/src/lib',
        source: `<script lang="ts">
  let { plan, used } = $props();
</script>

<article class="plan">
  <h3>{plan.name}</h3>
  <p class="seats">{used} of {plan.seats} seats</p>
</article>

<style>
  h3 { font-weight: 600; }
  .seats { color: #6b7280; }
</style>`,
        rewrites: [
            { line: 11, from: '600', to: '500' },
            { line: 12, from: '#6b7280', to: 'var(--color-neutral-600)' },
        ],
    },
};

/* A small highlighter for these four files, in the theme's own colours. */
const syntax =
    /(<\/?[\w-]+|\/?>)|("[^"]*"|'[^']*'|`)|(\{\{|\}\})|([:@]?[\w-]+(?==))|(^\s*(?:\.[\w-]+|h3)(?= \{))|(\b[\w-]+(?=:\s))|(@Component|\b(?:import|from|export|function|return|class|let|lang)\b|\$props)/g;
const tones = [
    'text-primary-600',
    'text-success-700',
    'text-warning-700',
    'text-neutral-600',
    'text-warning-700',
    'text-primary-600',
    'text-primary-600',
];

type Token = { at: number; text: string; tone?: string };

const tokenise = (text: string): Token[] => {
    const out: Token[] = [];
    let last = 0;
    for (const match of text.matchAll(syntax)) {
        const at = match.index ?? 0;
        if (at > last) out.push({ at: last, text: text.slice(last, at) });
        out.push({ at, text: match[0], tone: tones[match.slice(1).findIndex(Boolean)] });
        last = at + match[0].length;
    }
    if (last < text.length) out.push({ at: last, text: text.slice(last) });
    return out;
};

/**
 * The finding's value, rewritten in place: underlined by the audit, then selected and typed over
 * a letter at a time once the camera has come to it, as an agent's edit lands in the file.
 */
const Retype = ({
    from,
    to,
    stage,
    tone,
}: {
    from: string;
    to: string;
    stage: Stage;
    tone?: string;
}) => {
    const reduce = useReducedMotion() ?? false;
    const [selected, setSelected] = useState(false);
    const [typed, setTyped] = useState(-1);
    useEffect(() => {
        if (stage !== 'fixing' || reduce) return;
        let timer: ReturnType<typeof setInterval> | undefined;
        const select = setTimeout(() => setSelected(true), SETTLE);
        const start = setTimeout(() => {
            let count = 0;
            setTyped(0);
            timer = setInterval(() => {
                count += 1;
                setTyped(count);
                if (count >= to.length) clearInterval(timer);
            }, 28);
        }, SETTLE + 250);
        return () => {
            clearTimeout(select);
            clearTimeout(start);
            clearInterval(timer);
        };
    }, [stage, to, reduce]);
    if (stage === 'fixed' || (stage === 'fixing' && (reduce || typed >= 0)))
        return (
            <span className={tone ?? 'text-neutral-950'}>
                {stage === 'fixed' || reduce ? to : to.slice(0, typed)}
                {stage === 'fixing' && !reduce && (
                    <span
                        aria-hidden
                        className="ml-px inline-block h-3.5 w-px translate-y-0.5 bg-neutral-950"
                    />
                )}
            </span>
        );
    return (
        <span
            className={cn(
                'rounded-xs underline decoration-1 decoration-wavy underline-offset-4 transition-[background-color,text-decoration-color] duration-200',
                tone ?? 'text-neutral-950',
                stage === 'idle' ? 'decoration-transparent' : 'decoration-error-500',
                selected && 'bg-primary-500/35',
            )}
        >
            {from}
        </span>
    );
};

/** One line of a file: its number, the audit's mark in the gutter, a modified bar once rewritten. */
const Line = ({
    number,
    text,
    rewrite,
    stage,
}: {
    number: number;
    text: string;
    rewrite?: Rewrite;
    stage: Stage;
}) => {
    const on = rewrite && (stage === 'marked' || stage === 'fixing');
    const at = rewrite ? text.indexOf(rewrite.from) : -1;
    const end = rewrite ? at + rewrite.from.length : -1;
    return (
        <div
            className={cn(
                'relative flex h-4.5 items-center transition-[background-color] duration-200',
                on ? 'bg-error-500/12' : 'bg-transparent',
            )}
        >
            <span
                className={cn(
                    'w-11 shrink-0 pr-4 text-right tabular-nums transition-colors duration-200',
                    on ? 'text-error-600' : 'text-neutral-400',
                )}
            >
                {number}
            </span>
            {/* The gutter: the audit's mark while it stands, the edit's bar once it lands. */}
            <span
                className={cn(
                    'absolute top-0.5 bottom-0.5 left-12 w-0.75 rounded-full transition-colors duration-200',
                    on ? 'bg-error-500' : 'bg-transparent',
                    rewrite && stage === 'fixed' && 'bg-primary-500',
                )}
            />
            <span className="whitespace-pre pl-2 text-neutral-800">
                {tokenise(text).map(token => {
                    const close = token.at + token.text.length;
                    if (!rewrite || close <= at || token.at >= end)
                        return (
                            <span className={token.tone} key={token.at}>
                                {token.text}
                            </span>
                        );
                    // The token that holds the value: its text either side, the value retyped.
                    return (
                        <span className={token.tone} key={token.at}>
                            {token.text.slice(0, at - token.at)}
                            <Retype
                                from={rewrite.from}
                                stage={stage}
                                to={rewrite.to}
                                tone={token.tone}
                            />
                            {token.text.slice(end - token.at)}
                        </span>
                    );
                })}
            </span>
        </div>
    );
};

/** One app's file in its editor pane: the tab with its name and where it lives, then the source. */
const Pane = ({ app, stage }: { app: App; stage: Stage }) => {
    const file = files[app];
    return (
        <div
            className="flex h-80.5 min-w-0 flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50"
            data-film={`pane-${app}`}
        >
            <div className="flex h-9 shrink-0 items-end border-neutral-200 border-b bg-neutral-100 px-2">
                <div className="-mb-px flex h-7.5 items-center gap-2 rounded-t-item border border-neutral-200 border-b-neutral-50 bg-neutral-50 px-3 text-neutral-950">
                    {file.name}
                </div>
                <span className="flex h-7.5 items-center px-3 font-mono text-[12px] text-neutral-500">
                    {file.path}
                </span>
            </div>
            <div className="py-2 font-mono text-[13px] leading-4.5">
                {file.source.split('\n').map((text, index) => {
                    const number = index + 1;
                    return (
                        <Line
                            key={number}
                            number={number}
                            rewrite={file.rewrites.find(each => each.line === number)}
                            stage={stage}
                            text={text}
                        />
                    );
                })}
            </div>
        </div>
    );
};

/**
 * One plan card, four apps, four stacks: the dashboard in React with Tailwind, billing in Vue,
 * the admin in Angular, the marketing site in Svelte. Four editor windows, one per app, on the kit's
 * 16:9 screen at real size, with room above the first row for the callout.
 */
export const AuditScreen = ({ stages }: { stages: Record<App, Stage> }) => (
    <div className="grid size-full grid-cols-2 content-start gap-x-8 gap-y-10 px-6 pt-26 text-[13px]">
        <Pane app="dashboard" stage={stages.dashboard} />
        <Pane app="billing" stage={stages.billing} />
        <Pane app="admin" stage={stages.admin} />
        <Pane app="site" stage={stages.site} />
    </div>
);
