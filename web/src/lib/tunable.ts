/**
 * A set of numbers a shader reads and the tuner (`?tune`) sets: its defaults, the values in effect,
 * and who to tell when they change.
 */
export type Tunable<T extends Record<string, number>> = {
    defaults: T;
    get: () => T;
    set: (patch: Partial<T>) => void;
    subscribe: (listener: () => void) => () => void;
};

export const tunable = <T extends Record<string, number>>(defaults: T): Tunable<T> => {
    let current: T = { ...defaults };
    const listeners = new Set<() => void>();
    return {
        defaults,
        get: () => current,
        set: patch => {
            current = { ...current, ...patch };
            for (const listener of listeners) listener();
        },
        subscribe: listener => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
};
