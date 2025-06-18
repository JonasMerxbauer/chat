import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@rocicorp/zero/react';
import { ChatInput, Message } from '~/components/chat-input';
import { useZero, usePreloadSpecificChat } from '~/hooks/use-zero';
import { useEffect, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import { ArrowDown } from 'lucide-react';

export const Route = createFileRoute('/_chat/$chatId')({
  component: Page,
  ssr: false,
});

export default function Page() {
  const { chatId } = Route.useParams();
  const z = useZero();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  usePreloadSpecificChat(chatId);

  const [conversations, conversationsResult] = useQuery(
    z.query.conversation.related('messages').where('id', '=', chatId),
  );

  const conversation = conversations[0];
  const messages = conversation?.messages || [];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages.length, messages[messages.length - 1]?.content]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShowScrollToBottom(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  };

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

  if (!conversation) {
    return <div className="flex h-screen items-center justify-center"></div>;
  }

  const lastUserMessage = [...messages]
    .sort((a, b) => b.created_at - a.created_at)
    .find((m) => m.role === 'user');

  return (
    <div className="relative flex h-screen flex-col">
      <div className="bg-secondary-background/0 absolute top-0 left-0 z-50 flex w-full items-center p-4 backdrop-blur-sm">
        <h1 className="text-2xl">{conversation.title}</h1>
      </div>
      <div
        ref={messagesContainerRef}
        data-messages-container
        className="flex min-h-screen flex-col gap-4 overflow-auto scroll-smooth p-4 pt-16 pb-[200px]"
      >
        {[...messages]
          .sort((a, b) => a.created_at - b.created_at)
          .map((message) => (
            <div key={message.id} className="relative">
              <Message message={message} />
              {message.role === 'user' &&
                lastUserMessage?.id === message.id && (
                  <div
                    ref={messagesEndRef}
                    className="absolute top-0 h-[75vh] w-0.5"
                  />
                )}
            </div>
          ))}
      </div>
      {showScrollToBottom && (
        <div className="absolute right-8 bottom-48 z-10 lg:bottom-32">
          <Button
            onClick={scrollToBottom}
            size="sm"
            className="h-10 w-10 rounded-full p-0 shadow-lg"
            variant="neutral"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="absolute bottom-5 w-full">
        <ChatInput placeholder="Type your message here xd..." />
      </div>
    </div>
  );
}
