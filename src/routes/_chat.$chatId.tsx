import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@rocicorp/zero/react';
import { ChatInput, Message } from '~/components/chat-input';
import { useZero, usePreloadSpecificChat } from '~/hooks/use-zero';

export const Route = createFileRoute('/_chat/$chatId')({
  component: Page,
  ssr: false,
});

export default function Page() {
  const { chatId } = Route.useParams();
  const z = useZero();

  // Preload this specific chat immediately
  usePreloadSpecificChat(chatId);

  const [conversations, conversationsResult] = useQuery(
    z.query.conversation.related('messages').where('id', '=', chatId),
  );

  const conversation = conversations[0];

  // Only show "not found" if we've completed the server query and still no results
  // AND we've waited a bit to avoid flashing on slow IndexedDB reads
  if (!conversation && conversationsResult.type === 'complete') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold">Chat not found</h2>
          <p className="text-gray-600">
            This conversation doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching
  if (!conversation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col">
      <h1 className="absolute top-4 left-4 text-3xl">{conversation.title}</h1>
      <div className="flex flex-col gap-4 overflow-auto p-4 pt-16 pb-[160px]">
        {[...conversation.messages]
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
