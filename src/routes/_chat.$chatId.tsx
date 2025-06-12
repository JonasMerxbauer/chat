import { createFileRoute } from '@tanstack/react-router';
import z from '~/db';
import { useQuery } from '@rocicorp/zero/react';
import { ChatInput, Message } from '~/components/chat-input';

export const Route = createFileRoute('/_chat/$chatId')({
  component: Page,
  ssr: false,
});

export default function Page() {
  const { chatId } = Route.useParams();
  const [conversations] = useQuery(
    z.query.conversation.related('messages').where('id', '=', chatId),
  );

  const handleSendMessage = async (message: string) => {
    console.log('Sending message', message);
    await (z as any).mutate.conversation.createMessage({
      id: conversations[0].id,
      prompt: message,
    });
  };

  if (!conversations[0]) return null;

  return (
    <div className="relative flex h-screen flex-col">
      <h1 className="absolute top-4 left-4 text-3xl">
        {conversations[0].title}
      </h1>
      <div className="flex flex-col gap-4 overflow-auto p-4 pt-16 pb-[160px]">
        {[...conversations[0].messages]
          .sort((a, b) => a.created_at - b.created_at)
          .map((message) => (
            <Message key={message.id} message={message} />
          ))}
      </div>
      <div className="absolute bottom-5 w-full">
        <ChatInput
          placeholder="Type your message here xd..."
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
