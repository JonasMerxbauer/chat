import { useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { SendIcon, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { useNavigate, useParams } from '@tanstack/react-router';
import { DEFAULT_MODEL, getAllModels, MESSAGE_STATUSES } from '~/models';
import { useSession } from '~/lib/zero-auth';
import { useZero } from '~/hooks/use-zero';
import { cn } from '~/lib/utils';

export const ChatInput = ({
  conversation,
  ...props
}: React.ComponentProps<'textarea'> & {
  conversation?: {
    id: string;
    current_model_id: string;
    current_model_provider: string;
    current_model_name: string;
  };
}) => {
  const params = useParams({ from: '/_chat/$chatId', shouldThrow: false });
  const navigate = useNavigate();
  const z = useZero();

  const conversationId = params?.chatId ?? '';

  // Local state for model selection when no conversation exists
  const [localSelectedModel, setLocalSelectedModel] = useState<{
    id: string;
    provider: string;
    name: string;
  }>(DEFAULT_MODEL);

  // Local state for web search toggle
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  const currentModel = conversation
    ? {
        id: conversation.current_model_id,
        provider: conversation.current_model_provider,
        name: conversation.current_model_name,
      }
    : localSelectedModel;

  const { data: session } = useSession();

  const userId = session?.user?.id;

  const handleSendMessage = async (message: string) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (conversationId) {
      const messageId = crypto.randomUUID();

      z.mutate.conversation.createMessage({
        id: messageId,
        conversationId: conversationId,
        content: message,
        model: currentModel,
        role: 'user',
        status: MESSAGE_STATUSES.SENDING,
        userId,
        webSearchEnabled,
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
        model: currentModel,
        userId,
        webSearchEnabled,
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = inputRef.current?.value ?? '';
                if (message.trim()) {
                  handleSendMessage(message);
                  inputRef.current!.value = '';
                }
              }
            }}
            {...props}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>{currentModel.name}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {getAllModels().map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => {
                      if (conversationId) {
                        // Update existing conversation's model
                        z.mutate.conversation.updateConversationModel({
                          id: conversationId,
                          model,
                        });
                      } else {
                        // Update local state for new conversation
                        setLocalSelectedModel(model);
                      }
                    }}
                  >
                    {model.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Web Search Toggle - Only show for OpenAI models */}
            {currentModel.id === 'gpt-4o' && (
              <Button
                variant={webSearchEnabled ? 'default' : 'neutral'}
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                Web Search
              </Button>
            )}
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
  const webSearchEnabled = message.web_search_enabled === 'true';

  const getStatusText = () => {
    if (role !== 'assistant') return null;

    switch (status) {
      case MESSAGE_STATUSES.PENDING:
        return 'Sending...';
      case MESSAGE_STATUSES.REASONING:
        return 'Reasoning...';
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
            status === MESSAGE_STATUSES.REASONING ||
            status === MESSAGE_STATUSES.STREAMING) && (
            <div className="mb-2 flex items-center gap-2 text-sm opacity-70">
              {(status === MESSAGE_STATUSES.REASONING ||
                status === MESSAGE_STATUSES.PENDING) && (
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:0.1s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:0.2s]"></div>
                </div>
              )}
              <span>{getStatusText()}</span>
            </div>
          )}

        {/* Web search indicator for user messages */}
        {role === 'user' && webSearchEnabled && (
          <div className="mb-2 flex items-center gap-1 text-xs opacity-70">
            <Globe className="h-3 w-3" />
            <span>Web search enabled</span>
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
