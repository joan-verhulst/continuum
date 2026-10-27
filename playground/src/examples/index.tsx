import type { SectionEntry } from '../layout';
import { globalFilteringExample } from './global-filtering';
import { liveAnalyticsExample } from './live-analytics';
import { notificationSettingsExample } from './notification-settings';
import { plansPricingExample } from './plans-pricing';
import { profileDetailsExample } from './profile-details';
import { startCampaignExample } from './start-campaign';
import { supportChatExample } from './support-chat';
import { verifyEmailExample } from './verify-email';

/** Blocks: parts of a product rebuilt from the system alone. Each caps its own width and sits flush left. */
export const exampleSections: SectionEntry[] = [
    {
        id: 'e-live-analytics',
        title: 'Live analytics',
        description:
            'Who is on the site right now, by page, country, source and device. Any row filters the rest.',
        render: liveAnalyticsExample,
    },
    {
        id: 'e-profile-details',
        title: 'Profile details',
        description:
            'A visitor’s profile with their current session and a replay summary, inline and in a side sheet sharing one state.',
        render: profileDetailsExample,
    },
    {
        id: 'e-notification-settings',
        title: 'Notification settings',
        description: 'Alert switches in one card, with a sensitivity picker that follows them.',
        render: notificationSettingsExample,
    },
    {
        id: 'e-start-campaign',
        title: 'Start campaign',
        description: 'How and when a campaign starts, and who it reaches.',
        render: startCampaignExample,
    },
    {
        id: 'e-plans-pricing',
        title: 'Plans and pricing',
        description: 'The current plan, this month’s credits and how to get more of them.',
        render: plansPricingExample,
    },
    {
        id: 'e-support-chat',
        title: 'Support chat',
        description: 'One ticket’s thread in the support widget, with a composer that reopens it.',
        render: supportChatExample,
    },
    {
        id: 'e-verify-email',
        title: 'Verify email',
        description: 'A six-box code, Continue once it is full, and a resend countdown.',
        render: verifyEmailExample,
    },
    {
        id: 'e-global-filtering',
        title: 'Global filtering',
        description:
            'Date range, regions and countries in a dialog, with the applied filters as removable chips.',
        render: globalFilteringExample,
    },
];
