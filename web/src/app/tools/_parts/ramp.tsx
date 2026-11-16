import { cn, rampSteps } from 'continuum';

/*
 * A ramp drawn as eleven swatches, 50 to 950, each named under it. Plain markup, so it draws on
 * the server for a still figure and in a tool alike.
 */

export const RampStrip = ({
    colours,
    seed,
    values,
    className,
}: {
    /** The eleven steps as CSS colours. */
    colours: readonly string[];
    /** The index of the step the colour was given at: it gets a ring. */
    seed?: number;
    /** A value under each step's name (its hex, its lightness), when the figure reads them. */
    values?: readonly string[];
    className?: string;
}) => (
    <ol className={cn('grid min-w-0 grid-cols-11 gap-1 sm:gap-1.5', className)}>
        {colours.map((colour, index) => (
            <li className="flex min-w-0 flex-col gap-2" key={rampSteps[index]}>
                <span
                    className={cn(
                        'block h-14 rounded-item border border-neutral-950/5',
                        index === seed && 'outline-2 outline-neutral-950 outline-offset-2',
                    )}
                    style={{ background: colour }}
                />
                <span className="flex min-w-0 flex-col">
                    <span className="text-neutral-950 text-xxs tabular-nums">
                        {rampSteps[index]}
                    </span>
                    {values?.[index] && (
                        <span className="truncate font-mono text-neutral-600 text-xxs max-sm:hidden">
                            {values[index]}
                        </span>
                    )}
                </span>
            </li>
        ))}
    </ol>
);
