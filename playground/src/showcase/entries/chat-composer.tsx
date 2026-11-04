import { Card, CardTitle, ChatComposer, ChatMessage, ChatThread } from 'continuum';
import { useState } from 'react';
import type { Entry, InUse } from '../kit';

const ChatComposerPreview = () => {
    const [sent, setSent] = useState<string>();

    return (
        <div className="flex w-full max-w-80 flex-col gap-3">
            <ChatComposer onAdd={() => {}} onSend={setSent} placeholder="Message #payment issue" />
            <span className="text-neutral-500 text-xxs">
                {sent ? `Sent: ${sent}` : 'Enter sends'}
            </span>
        </div>
    );
};

export const entry: Entry = {
    id: 'chat-composer',
    name: 'Chat composer',
    category: 'ai',
    description: 'A box that grows with the draft; Enter sends.',
    Preview: ChatComposerPreview,
};

const ComposeQuestion = () => {
    const [sent, setSent] = useState<string[]>([]);

    return (
        <Card className="w-full max-w-lg gap-4">
            <CardTitle>Ask about this report</CardTitle>
            <ChatThread
                className="h-40 w-full p-0"
                empty="Ask anything about Q3: what changed, why, and what to do next."
            >
                {sent.map(text => (
                    <ChatMessage key={text} status="sent" time="now" variant="own">
                        {text}
                    </ChatMessage>
                ))}
            </ChatThread>
            <ChatComposer
                defaultValue="Why did the bounce rate rise in August?"
                onAdd={() => setSent(current => [...current, 'Attached q3-figures.xlsx'])}
                onSend={text => setSent(current => [...current, text])}
                placeholder="Ask a question"
            />
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Ask about a report',
    note: 'An empty thread and the composer with a question drafted.',
    canvas: true,
    render: () => <ComposeQuestion />,
};
