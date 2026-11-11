import {
    Button,
    ChatAttachment,
    ChatAttachments,
    ChatPrompt,
    ChatThread,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    StatCard,
} from 'continuum';
import { ChevronDown, Mail, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { AssistantTurn, type Turn, useAssistant } from '../../screens/agent';
import { AppScene, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

const knobs: Knob[] = [
    {
        id: 'size',
        label: 'Size',
        options: [o('lg', 'Large, an empty page'), o('md', 'Docked, a conversation')],
        default: 'lg',
    },
    {
        id: 'state',
        label: 'State',
        options: [o('empty', 'Empty'), o('draft', 'A draft'), o('streaming', 'Reply streaming')],
        default: 'empty',
    },
    { id: 'attach', label: 'Attach', switch: true, default: true },
    { id: 'model', label: 'Mode menu', switch: true, default: false },
];

const modes = ['Quick', 'Thorough'];

/** A quiet menu at the foot's left: how hard the assistant should look. */
const ModeMenu = () => {
    const [mode, setMode] = useState('Quick');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={<Button className="h-control-sm gap-1 px-2" variant="ghost" />}
            >
                {mode}
                <ChevronDown {...icon} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup
                    onValueChange={value => setMode(String(value))}
                    value={mode}
                >
                    {modes.map(item => (
                        <DropdownMenuRadioItem key={item} value={item}>
                            {item}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const ChatPromptPreview = ({ knobs: values }: PreviewProps) => {
    const [sent, setSent] = useState<string>();
    const [files, setFiles] = useState<{ id: number; name: string }[]>([]);
    const state = values.state as string;

    return (
        <div className="flex w-full max-w-120 flex-col gap-3">
            <ChatPrompt
                attachments={
                    values.attach && files.length > 0 ? (
                        <ChatAttachments>
                            {files.map(file => (
                                <ChatAttachment
                                    key={file.id}
                                    name={file.name}
                                    onRemove={() =>
                                        setFiles(current => current.filter(f => f.id !== file.id))
                                    }
                                />
                            ))}
                        </ChatAttachments>
                    ) : undefined
                }
                defaultValue={state === 'empty' ? '' : 'Which customers are past due this month?'}
                key={`${values.size}-${state}`}
                onAttach={
                    values.attach
                        ? picked =>
                              setFiles(current => [
                                  ...current,
                                  ...picked.map((file, i) => ({
                                      id: Date.now() + i,
                                      name: file.name,
                                  })),
                              ])
                        : undefined
                }
                onSend={text => {
                    const names = files.map(file => file.name).join(', ');
                    setSent([text, names].filter(Boolean).join(' · '));
                    setFiles([]);
                }}
                onStop={() => {}}
                size={values.size as 'lg' | 'md'}
                start={values.model ? <ModeMenu /> : undefined}
                streaming={state === 'streaming'}
            />
            <span className="text-neutral-600 text-xxs">
                {sent ? `Sent: ${sent}` : 'Enter sends, Shift+Enter starts a new line'}
            </span>
        </div>
    );
};

export const entry: Entry = {
    id: 'chat-prompt',
    name: 'Chat prompt',
    category: 'ai',
    description: 'Where a question to an assistant is written; Stop while it answers.',
    stageClassName: 'items-center',
    knobs,
    Preview: ChatPromptPreview,
};

/* ---------- In use: asking about a customer, in a sheet beside its page ---------- */

const answer =
    'Northwind pays €4,800 a month for 120 Enterprise seats and renews on 1 December. Usage is up 12% this quarter, so the renewal looks safe; the one open question is the 20 seats they added in October, which are not on the contract yet.';

const opening: Turn[] = [
    {
        id: 1,
        own: false,
        text: 'I have Northwind’s plan, invoices and activity open. Ask what changed, what is due, or what to send them.',
    },
];

const AskSheet = () => {
    const stage = useStageContainer();
    const { turns, streaming, ask, stop } = useAssistant(opening);

    return (
        <Sheet open>
            <SheetContent
                className="w-[min(400px,calc(100%-32px))]"
                container={stage}
                finalFocus={false}
                initialFocus={false}
            >
                <SheetHeader icon={<Sparkles />}>
                    <SheetTitle>Ask about Northwind</SheetTitle>
                </SheetHeader>
                <ChatThread className="flex-1 px-5 pt-5">
                    {turns.map(turn => (
                        <AssistantTurn
                            key={turn.id}
                            turn={turn}
                            variant={turn.own ? 'own' : 'other'}
                        />
                    ))}
                </ChatThread>
                <div className="shrink-0 p-3">
                    <ChatPrompt
                        defaultValue="Is the renewal at risk?"
                        onSend={text => ask(text, answer)}
                        onStop={stop}
                        placeholder="Ask about Northwind…"
                        size="md"
                        streaming={streaming}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
};

export const inUse: InUse = {
    title: 'Ask about a customer',
    note: 'The docked prompt at the foot of the assistant’s sheet, a question drafted; the reply is written out as it comes, and Stop keeps what is there.',
    bare: true,
    render: () => (
        <AppScene
            page={{
                nav: 'rail',
                place: 'customers',
                title: 'Northwind Traders',
                description: 'northwind.com · A customer since March 2023',
                actions: (
                    <Button>
                        <Mail {...icon} /> Message customer
                    </Button>
                ),
                className: 'pr-109',
                children: (
                    <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-2 gap-4">
                        <StatCard label="Recurring revenue" value="€4,800" />
                        <StatCard delta="+20" label="Enterprise seats" value="120" />
                    </div>
                ),
            }}
        >
            <AskSheet />
        </AppScene>
    ),
};
