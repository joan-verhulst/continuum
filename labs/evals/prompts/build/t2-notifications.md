# Notification settings (a settings page)

The product is **Larder**, the back office of a food wholesaler. This is the Notifications area of its
settings.

**Sidebar**: the product name "Larder". Places: Overview, Orders, Customers, Products, Invoices, Reports. At the
foot: Settings (the current page), and the signed-in account "Mira Jansen", mira@larder.co.

**Settings areas** (sibling pages): General, Team, Notifications (current), Billing, Integrations.

**Page**: title "Notifications", line "Choose what Larder tells you about, and where."

**Groups and settings** (state as shown is the default):

1. **Orders**
   - New order: on. "An email for every order placed."
   - Order cancelled: on. "An email when a customer cancels."
   - Large orders only: off. "Only tell me about orders above an amount." While on, it has one dependent:
     Amount, a value chosen from €500, €1,000, €2,500, €5,000 (€1,000 chosen).
2. **Stock**
   - Low stock alerts: on. "When a product falls below its threshold." Its dependent: Threshold, a number of
     units (20).
   - Daily stock summary: off. "One email at 07:00 with every product's stock."
3. **Where**
   - Email address: mira@larder.co (a text field).
   - Slack channel: a choice of #orders, #stock, #general (#orders chosen). Slack is connected as "larder-hq".
   - How often: Instant, Hourly or Daily (Hourly chosen).
4. **Quiet hours**
   - Quiet hours: on. "No notifications between the hours you set." Its dependents: From 22:00, To 07:00.

**Saving**: changes are not saved until the person presses "Save changes" (primary); "Cancel" discards them.
