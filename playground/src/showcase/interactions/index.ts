import type { Entry } from '../kit';
import * as hoverIntent from './hover-intent';
import * as optimisticUndo from './optimistic-undo';
import * as safeTriangle from './safe-triangle';

/*
 * Interaction patterns: how things behave rather than what they look like. Each is a demo of one
 * pattern in the skill's patterns.md (Behaviour), shown on the Components view in a category of
 * its own. They live apart from entries/ because they are not components, and the site builds a
 * component page for every file in entries/.
 */
export const interactionEntries: Entry[] = [
    safeTriangle.entry,
    hoverIntent.entry,
    optimisticUndo.entry,
];
