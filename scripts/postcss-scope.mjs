/**
 * Scopes Tailwind's output to `.pds` so the built stylesheet can sit next to a
 * host site's own Tailwind without either one restyling the other.
 *
 * - `:root`, `:host`, `html` and `body` become `.pds`.
 * - Every other selector only matches inside a `.pds` element, or on it when
 *   the selector starts with a class, attribute or pseudo-class.
 * - Tailwind's layer names are kept, so in a host that also uses Tailwind the
 *   system's reset lands in the host's `base` layer and never outranks the
 *   host's own utilities.
 */
const SCOPE = '.pds';
const ROOTS = new Set([':root', ':host', 'html', 'body']);

const scopeSelector = selector => {
    const trimmed = selector.trim();

    if (trimmed.startsWith(SCOPE)) {
        return [trimmed];
    }

    if (ROOTS.has(trimmed)) {
        return [SCOPE];
    }

    if (trimmed === '*') {
        return [SCOPE, `${SCOPE} *`];
    }

    if (/^[.[:]/.test(trimmed) && !trimmed.startsWith('::')) {
        return [`${SCOPE} ${trimmed}`, `${SCOPE}${trimmed}`];
    }

    return [`${SCOPE} ${trimmed}`];
};

const insideKeyframes = rule => {
    for (let parent = rule.parent; parent; parent = parent.parent) {
        if (parent.type === 'atrule' && /keyframes$/.test(parent.name)) {
            return true;
        }
    }

    return false;
};

/** @type {import('postcss').PluginCreator<void>} */
const scope = () => ({
    postcssPlugin: 'pds-scope',
    OnceExit(root) {
        root.walkRules(rule => {
            if (insideKeyframes(rule) || rule.parent?.type === 'rule') {
                return;
            }

            rule.selectors = [...new Set(rule.selectors.flatMap(scopeSelector))];
        });
    },
});

scope.postcss = true;

export default scope;
