import {
    ActivityItem,
    ActivityList,
    Avatar,
    Badge,
    Button,
    Card,
    CardTitle,
    Progress,
    StatCard,
    Tabs,
    TabsList,
    TabsTrigger,
} from 'continuum';
import {
    ArrowUpRight,
    CreditCard,
    EllipsisVertical,
    FileText,
    Mail,
    MessageSquare,
    UserPlus,
} from 'lucide-react';
import { customers, formatEuro, statusTone, Workspace } from './workspace';

const icon = { strokeWidth: 2 } as const;

const customer = customers[0];

const facts = customer
    ? [
          { term: 'Plan', value: `${customer.plan}, billed yearly` },
          {
              term: 'Owner',
              value: (
                  <>
                      <Avatar
                          alt={customer.owner}
                          fallback={customer.ownerInitials}
                          shape="round"
                          size={24}
                      />
                      {customer.owner}
                  </>
              ),
          },
          { term: 'Renews', value: '1 March 2027' },
          { term: 'Domain', value: customer.domain },
          { term: 'Region', value: 'Europe, Amsterdam' },
          { term: 'VAT number', value: 'NL004495445B01' },
      ]
    : [];

/** A detail: who it is and what to do with it, then its numbers, facts, usage and history, in one column. */
export const CustomerDetail = () =>
    customer ? (
        <Workspace place="customers" trail={['Customers', customer.name]}>
            <div className="flex items-start justify-between gap-6">
                <div className="flex min-w-0 items-center gap-4">
                    <Avatar alt={customer.name} fallback={customer.initials} size={36} />
                    <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate font-medium text-2xl text-neutral-950">
                                {customer.name}
                            </h1>
                            <Badge tone={statusTone[customer.status]}>{customer.status}</Badge>
                        </div>
                        <p className="text-neutral-600 text-sm">
                            {customer.domain} · A customer since March 2023
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button variant="secondary">
                        <Mail {...icon} />
                        Message
                    </Button>
                    <Button>
                        <ArrowUpRight {...icon} />
                        Upgrade plan
                    </Button>
                    <Button aria-label="More actions" size="icon" variant="ghost">
                        <EllipsisVertical {...icon} />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* One column, as every detail is: the numbers, the facts, then what it uses and what happened. */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard delta="+12%" label="Monthly revenue" value={formatEuro(customer.mrr)} />
                <StatCard delta="+8" label="Seats in use" value="86" />
                <StatCard delta="2 open" label="Tickets" trend="neutral" value="14" />
            </div>

            {/* Each fact's label over its value, so the two read together at this width. */}
            <Card layout="list">
                <CardTitle>Details</CardTitle>
                <dl className="grid grid-cols-3 gap-x-6 gap-y-5">
                    {facts.map(fact => (
                        <div className="flex min-w-0 flex-col gap-1.5" key={fact.term}>
                            <dt className="text-neutral-600 text-xs">{fact.term}</dt>
                            <dd className="flex min-h-6 min-w-0 items-center gap-2 font-medium text-neutral-950 text-xs">
                                {fact.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </Card>

            <Card layout="list">
                <CardTitle>Usage this month</CardTitle>
                <div className="flex flex-col gap-5">
                    <Progress caption="72,000 of 100,000" label="API calls" value={72} />
                    <Progress caption="86 of 100" label="Seats" value={86} />
                    <Progress caption="41 of 100 GB" label="Storage" value={41} />
                </div>
            </Card>

            <Card layout="list">
                <CardTitle>Recent activity</CardTitle>
                <ActivityList>
                    <ActivityItem
                        icon={<CreditCard {...icon} />}
                        time="1 hour ago"
                        title="Upgraded from Pro to Enterprise"
                        tone="primary"
                    />
                    <ActivityItem
                        icon={<UserPlus {...icon} />}
                        time="Yesterday"
                        title="Eight seats added by Ana Ruiz"
                    />
                    <ActivityItem
                        action={<Badge tone="success">Paid</Badge>}
                        icon={<FileText {...icon} />}
                        time="1 October"
                        title="Invoice INV-2041 for €4,800"
                    />
                    <ActivityItem
                        icon={<MessageSquare {...icon} />}
                        time="28 September"
                        title="Asked about single sign-on"
                    />
                </ActivityList>
            </Card>
        </Workspace>
    ) : null;
