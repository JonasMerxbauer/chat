import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@rocicorp/zero/react';
import { ChatInput, Message } from '~/components/chat-input';
import { useZero } from '~/hooks/use-zero';

export const Route = createFileRoute('/_chat/$chatId')({
  component: Page,
  ssr: false,
});

export default function Page() {
  const { chatId } = Route.useParams();
  const z = useZero();
  const [conversations] = useQuery(
    z.query.conversation.related('messages').where('id', '=', chatId),
  );

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
        <ChatInput placeholder="Type your message here xd..." />
      </div>
    </div>
  );
}
