'use client';

import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { UserRound } from 'lucide-react';
import { Children, type ComponentProps, isValidElement } from 'react';
import { cn } from '../lib/cn';

/*
 * A toned avatar takes its hue from a token and draws fill, ink and line from
 * the shared lightness and chroma pairs, which dark mode swaps in tokens.css.
 */
const toned =
    'border-[oklch(var(--avatar-line)_var(--avatar-h))] bg-[oklch(var(--avatar-fill)_var(--avatar-h))] text-[oklch(var(--avatar-ink)_var(--avatar-h))]';

export const avatarVariants = cva(
    'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden border font-medium',
    {
        variants: {
            shape: {
                square: 'rounded-chip',
                round: 'rounded-full',
            },
            size: {
                24: 'size-6 text-xxs [&_svg]:size-3.5',
                32: 'size-8 text-xs [&_svg]:size-4',
                36: 'size-9 text-xs [&_svg]:size-4',
            },
            tone: {
                neutral: 'border-neutral-200 bg-neutral-100 text-neutral-600',
                blue: ['[--avatar-h:var(--avatar-blue)]', toned],
                violet: ['[--avatar-h:var(--avatar-violet)]', toned],
                rose: ['[--avatar-h:var(--avatar-rose)]', toned],
                amber: ['[--avatar-h:var(--avatar-amber)]', toned],
                teal: ['[--avatar-h:var(--avatar-teal)]', toned],
                green: ['[--avatar-h:var(--avatar-green)]', toned],
            },
        },
        defaultVariants: {
            shape: 'square',
            size: 32,
            tone: 'neutral',
        },
    },
);

type AvatarTone = NonNullable<VariantProps<typeof avatarVariants>['tone']>;

/** The same initials always get the same tone, so a person keeps their colour across screens. */
const tones = [
    'blue',
    'violet',
    'rose',
    'amber',
    'teal',
    'green',
] as const satisfies readonly AvatarTone[];

const toneFor = (initials: string): AvatarTone => {
    // FNV-1a: a plain sum puts too many two-letter initials on the same tone.
    let hash = 2166136261;

    for (const char of initials) {
        hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 16777619) >>> 0;
    }

    return tones[hash % tones.length] ?? 'neutral';
};

export type AvatarProps = Omit<ComponentProps<typeof AvatarPrimitive.Root>, 'className'> &
    VariantProps<typeof avatarVariants> & {
        /** A string only: the variants are joined onto it, so a state function cannot be. */
        className?: string;
        src?: string;
        alt?: string;
        /** Initials shown while the image loads or when it fails; a person icon otherwise. */
        fallback?: string;
    };

/**
 * A workspace or user avatar. Square by default, round for people lists.
 * Initials pick a tone from their letters unless one is given; the person icon
 * stays neutral.
 */
export const Avatar = ({
    shape,
    size,
    tone,
    src,
    alt = '',
    fallback,
    className,
    children,
    ...props
}: AvatarProps) => (
    <AvatarPrimitive.Root
        className={cn(
            avatarVariants({
                shape,
                size,
                tone: tone ?? (fallback ? toneFor(fallback) : 'neutral'),
            }),
            className,
        )}
        data-slot="avatar"
        {...props}
    >
        {src && (
            <AvatarPrimitive.Image
                alt={alt}
                className="size-full object-cover"
                data-slot="avatar-image"
                src={src}
            />
        )}
        <AvatarPrimitive.Fallback
            aria-label={alt || undefined}
            role={alt ? 'img' : undefined}
            className="flex size-full items-center justify-center"
            data-slot="avatar-fallback"
        >
            {fallback ?? <UserRound aria-hidden strokeWidth={2} />}
        </AvatarPrimitive.Fallback>
        {children}
    </AvatarPrimitive.Root>
);

export type AvatarStackProps = ComponentProps<'div'> & {
    /** Avatars past this count collapse into a "+N" tile. */
    max?: number;
};

/** Row of 24px avatars overlapping by a third, each ringed in the surface colour so they read apart. */
export const AvatarStack = ({ max, className, children, ...props }: AvatarStackProps) => {
    const items = Children.toArray(children).filter(isValidElement);
    const shown = max === undefined ? items : items.slice(0, max);
    const hidden = items.length - shown.length;

    return (
        <div
            className={cn('flex items-center -space-x-2 *:ring-2 *:ring-neutral-50', className)}
            data-slot="avatar-stack"
            {...props}
        >
            {shown}
            {hidden > 0 && (
                <span
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 font-medium text-neutral-600 text-xxs"
                    data-slot="avatar-stack-overflow"
                >
                    +{hidden}
                </span>
            )}
        </div>
    );
};
