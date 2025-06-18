import { useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { SendIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { useNavigate, useParams } from '@tanstack/react-router';
import { DEFAULT_MODEL, getAllModels, MESSAGE_STATUSES } from '~/constants';
import { useSession } from '~/lib/zero-auth';
import { useZero } from '~/hooks/use-zero';
import { cn } from '~/lib/utils';

export const ChatInput = ({ ...props }: React.ComponentProps<'textarea'>) => {
  const params = useParams({ from: '/_chat/$chatId', shouldThrow: false });
  const navigate = useNavigate();
  const z = useZero();
  const [selectedModel, setSelectedModel] = useState<{
    id: string;
    provider: string;
    name: string;
  }>({
    id: DEFAULT_MODEL.id,
    provider: DEFAULT_MODEL.provider,
    name: DEFAULT_MODEL.name,
  });

  const conversationId = params?.chatId ?? '';

  const { data: session } = useSession();

  const userId = session?.user?.id;

  const handleSendMessage = async (message: string) => {
    console.log('Sending message', message);

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (conversationId) {
      const messageId = crypto.randomUUID();

      z.mutate.conversation.createMessage({
        id: messageId,
        conversationId: conversationId,
        content: message,
        model: selectedModel,
        role: 'user',
        status: MESSAGE_STATUSES.SENDING,
        userId,
      });

      setTimeout(() => {
        const messagesContainer = document.querySelector(
          '[data-messages-container]',
        );
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    } else {
      const conversationId = crypto.randomUUID();
      const messageId = crypto.randomUUID();

      z.mutate.conversation.createConversation({
        id: conversationId,
        title: 'New chat',
        messageId,
        content: message,
        model: selectedModel,
        userId,
      });

      navigate({
        to: '/$chatId',
        params: {
          chatId: conversationId,
        },
      });
    }
  };

  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="mx-auto w-full max-w-[800px]">
      <div className="rounded-base border-border bg-secondary-background mx-4 flex w-auto flex-col border-2 p-2 focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2 focus-within:outline-none">
        <div className="flex-1">
          <textarea
            data-slot="textarea"
            ref={inputRef}
            className="font-base text-foreground placeholder:text-foreground/50 selection:bg-main selection:text-main-foreground flex min-h-[80px] w-full resize-none px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            {...props}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>{selectedModel.name}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {getAllModels().map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model);
                    }}
                  >
                    {model.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            onClick={() => {
              handleSendMessage(inputRef.current?.value ?? '');
              inputRef.current!.value = '';
            }}
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Message component
export const Message = ({ message }: { message: any }) => {
  const role = message.role;
  const content = message.content;
  const status = message.status;

  const getStatusText = () => {
    if (role !== 'assistant') return null;

    switch (status) {
      case MESSAGE_STATUSES.PENDING:
        return 'Thinking...';
      case MESSAGE_STATUSES.ERROR:
        return 'Error occurred';
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={cn(
          'rounded-base border-border shadow-shadow max-w-[90%] border-2 p-4 transition-all xl:max-w-[70%]',
          role === 'user'
            ? 'bg-main text-main-foreground'
            : 'bg-secondary text-secondary-foreground',
        )}
      >
        {/* Status indicator for AI messages */}
        {role === 'assistant' &&
          (status === MESSAGE_STATUSES.PENDING ||
            status === MESSAGE_STATUSES.STREAMING) && (
            <div className="mb-2 flex items-center gap-2 text-sm opacity-70">
              <span>{getStatusText()}</span>
            </div>
          )}

        {/* Message content */}
        {role === 'assistant' ? (
          <div className="space-y-2">
            {content && content.trim() && (
              <ReactMarkdown
                className="prose max-w-none"
                rehypePlugins={[
                  rehypeRaw,
                  rehypeSanitize,
                  rehypeHighlight,
                  remarkGfm,
                ]}
              >
                {content}
              </ReactMarkdown>
            )}

            {/* Show typing indicator when streaming with no content yet */}
            {status === MESSAGE_STATUSES.STREAMING &&
              (!content || content.trim() === '') && (
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.1s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]"></div>
                </div>
              )}
          </div>
        ) : (
          <div className="w500:text-sm">{content}</div>
        )}
      </div>
    </div>
  );
};
