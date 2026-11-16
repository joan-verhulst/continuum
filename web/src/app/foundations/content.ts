import 'server-only';
import { type FoundationTopic, firstSentence, foundationTopics } from '@/lib/content';

/*
 * The foundations section's reading of foundations.md: a page per ## topic. Most topics open on a
 * table or a list rather than a sentence, so each page's opening line (what the topic is and when it
 * matters) is said here, in the terms of the values under it; a topic not listed opens on its own
 * first sentence.
 */
const leads: Record<string, string> = {
    colour: 'Continuum’s colour is five ramps of eleven steps used by role (surface, text, hairline, action, status), so a theme changes how a colour looks and never what a step means.',
    type: 'Continuum sets tool UI in 13px type at two weights, 400 and 500, and builds hierarchy from colour and weight rather than size.',
    'surfaces-and-depth':
        'Surfaces in Continuum are told apart by a 1px hairline, not a shadow; sections are set apart by space, and only what floats casts a shadow.',
    radius: 'Every corner in Continuum comes from one scale (chip 6, item 10, control 12, card 16, panel 20) and nests a step smaller than what holds it.',
    spacing:
        'Continuum spaces everything on a 4px scale and works a box’s padding out from what it holds, so every gap lands on a step.',
    heights:
        'Anything that sits in a row in Continuum is one of two heights, 34 or 38, so a button and a field beside it line up without adjustment.',
    icons: 'Continuum uses Lucide icons at stroke 2, 16px by default, in the colour of the text beside them.',
    states: 'Every Continuum control shows hover, pressed, focus, selected, disabled, invalid and loading the same way, so a state reads alike across the system.',
    motion: 'Motion in Continuum is quiet: 150ms for a change of colour, 200ms on a strong ease-out for something entering, nothing bouncy, and none for those who ask for less.',
    layout: 'A Continuum page sits in a centred column as wide as its content is dense: 640, 896, 1080 or 1280, with the page’s rhythm on top of it.',
};

/** The one plain sentence a topic's page opens with. */
export const topicLead = (topic: FoundationTopic) =>
    leads[topic.slug] ?? (topic.summary || firstSentence(topic.section.body));

export const topicBySlug = (slug: string) => foundationTopics().find(t => t.slug === slug);
