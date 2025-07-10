import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  SendIcon,
  Globe,
  X,
  Loader2,
  File,
  Image,
  Copy,
  Check,
} from 'lucide-react';
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
import { UploadButton } from './uploadthing';

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
  const params = useParams({
    from: '/_chat/$chatId',
    shouldThrow: false,
  });
  const navigate = useNavigate();
  const z = useZero();

  const conversationId = params?.chatId ?? '';

  const [localSelectedModel, setLocalSelectedModel] = useState<{
    id: string;
    provider: string;
    name: string;
  }>(DEFAULT_MODEL);

  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      id: string;
      name: string;
      url: string;
      type: string;
      size?: number;
      isLoading: boolean;
    }>
  >([]);

  const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(
    null,
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const messagesContainer = document.querySelector(
        '[data-messages-container]',
      );
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }, []);

  useEffect(() => {
    if (lastUserMessageId) {
      scrollToBottom();
    }
  }, [lastUserMessageId, scrollToBottom]);

  useEffect(() => {
    setLastUserMessageId(null);
  }, [conversationId]);

  const currentModel = conversation
    ? {
        id: conversation.current_model_id,
        provider: conversation.current_model_provider,
        name: conversation.current_model_name,
      }
    : localSelectedModel;

  const { data: session } = useSession();

  const userId = session?.user?.id;
  const isAuthenticated = !!session?.user;

  const handleSendMessage = async (message: string) => {
    if (!isAuthenticated || !userId) {
      console.warn('Cannot send message: User not authenticated');
      navigate({ to: '/auth' });
      return;
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
        attachments: uploadedFiles
          .filter((f) => !f.isLoading)
          .map((f) => ({
            url: f.url,
            name: f.name,
            type: f.type,
            size: f.size,
          })),
      });

      setUploadedFiles([]);

      setLastUserMessageId(messageId);
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
        attachments: uploadedFiles
          .filter((f) => !f.isLoading)
          .map((f) => ({
            url: f.url,
            name: f.name,
            type: f.type,
            size: f.size,
          })),
      });

      setUploadedFiles([]);

      navigate({
        to: '/$chatId',
        params: {
          chatId: conversationId,
        },
      });

      setTimeout(() => {
        setLastUserMessageId(messageId);
      }, 200);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const isImageFile = (type: string) => {
    return type.startsWith('image/');
  };

  const getFileIcon = (type: string) => {
    if (isImageFile(type)) {
      return <Image className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div
      className={cn(
        'rounded-base border-border bg-secondary-background mx-4 flex w-auto flex-col border-2 p-2 focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2 focus-within:outline-none xl:mx-0',
        !isAuthenticated && 'opacity-50',
      )}
    >
      {!isAuthenticated && (
        <div className="mb-2 rounded-md border border-yellow-200 bg-yellow-50 p-2">
          <p className="text-sm text-yellow-800">
            Please{' '}
            <button
              onClick={() => navigate({ to: '/auth' })}
              className="font-medium underline hover:text-yellow-900"
            >
              sign in
            </button>{' '}
            to send messages.
          </p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="relative">
              {file.isLoading ? (
                <div className="bg-muted flex items-center gap-2 rounded-md p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground text-sm">
                    {file.name}
                  </span>
                </div>
              ) : (
                <div className="group relative">
                  {isImageFile(file.type) ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-md border">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  <Button
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="bg-main text-destructive-foreground absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex-1">
        <textarea
          data-slot="textarea"
          ref={inputRef}
          disabled={!isAuthenticated}
          placeholder={
            isAuthenticated
              ? props.placeholder
              : 'Please sign in to send messages...'
          }
          className="font-base text-foreground placeholder:text-foreground/50 selection:bg-main selection:text-main-foreground flex min-h-[80px] w-full resize-none p-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          onKeyDown={(e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              return;
            }

            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const message = inputRef.current?.value ?? '';
              if (message.trim() || uploadedFiles.some((f) => !f.isLoading)) {
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
              <Button disabled={!isAuthenticated}>{currentModel.name}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {getAllModels().map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => {
                    if (!isAuthenticated) return;

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
          <UploadButton
            endpoint="fileUploader"
            className="upload-button-custom"
            disabled={!isAuthenticated}
            onUploadBegin={(name) => {
              if (!isAuthenticated) return;

              const fileId = crypto.randomUUID();
              setUploadedFiles((prev) => [
                ...prev,
                {
                  id: fileId,
                  name: name,
                  url: '',
                  type: '',
                  isLoading: true,
                },
              ]);
            }}
            onClientUploadComplete={(res) => {
              // Update the loading file with the actual URL
              if (res && res.length > 0) {
                const uploadedFile = res[0];
                setUploadedFiles((prev) =>
                  prev.map((file) =>
                    file.isLoading && file.name === uploadedFile.name
                      ? {
                          ...file,
                          url: uploadedFile.url,
                          type: uploadedFile.type || '',
                          size: uploadedFile.size,
                          isLoading: false,
                        }
                      : file,
                  ),
                );
              }
            }}
            onUploadError={(error) => {
              console.error('Upload error:', error);
              // Remove the failed upload from state
              setUploadedFiles((prev) =>
                prev.filter((file) => !file.isLoading),
              );
            }}
            appearance={{
              button: () => ({
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                gap: '8px',
                outline: 'none',
                pointerEvents: 'auto',
                backgroundColor: isAuthenticated
                  ? 'oklch(67.47% 0.1726 259.49)'
                  : 'oklch(50% 0.05 259.49)',
                color: 'oklch(0% 0 0)',
                border: '2px solid oklch(0% 0 0)',
                boxShadow: '0px 2px 0px 0px oklch(0% 0 0)',
                height: '40px',
                padding: '8px 16px',
                opacity: isAuthenticated ? 1 : 0.5,
              }),
              container: 'flex',
              allowedContent: 'hidden',
            }}
            content={{
              button: isAuthenticated ? 'Attach images' : 'Sign in to attach',
            }}
          />
          {currentModel.id === 'gpt-4o' && (
            <Button
              variant={webSearchEnabled ? 'default' : 'neutral'}
              disabled={!isAuthenticated}
              onClick={() =>
                isAuthenticated && setWebSearchEnabled(!webSearchEnabled)
              }
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Web Search
            </Button>
          )}
        </div>

        <Button
          disabled={!isAuthenticated}
          onClick={() => {
            if (!isAuthenticated) {
              navigate({ to: '/auth' });
              return;
            }

            const message = inputRef.current?.value ?? '';
            if (message.trim() || uploadedFiles.some((f) => !f.isLoading)) {
              handleSendMessage(message);
              inputRef.current!.value = '';
            }
          }}
        >
          <SendIcon />
        </Button>
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
  const [copied, setCopied] = useState(false);

  // Parse attachments if they exist
  let attachments: Array<{
    url: string;
    name: string;
    type: string;
    size?: number;
  }> = [];
  if (message.attachments) {
    try {
      attachments = JSON.parse(message.attachments);
    } catch (error) {
      console.error('Error parsing message attachments:', error);
    }
  }

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

  const copyToClipboard = async () => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const isStreamingComplete =
    role === 'assistant' &&
    status !== MESSAGE_STATUSES.PENDING &&
    status !== MESSAGE_STATUSES.REASONING &&
    status !== MESSAGE_STATUSES.STREAMING &&
    content &&
    content.trim();

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

            {/* Copy button - show when streaming is complete */}
            {isStreamingComplete && (
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="neutral"
                  onClick={copyToClipboard}
                  className="h-8 px-2 text-xs opacity-70 transition-opacity hover:opacity-100"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Show attachments for user messages */}
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative">
                    {attachment.type && attachment.type.startsWith('image/') ? (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="h-20 w-20 rounded-md border border-white/20 object-cover"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            <div className="w500:text-sm">{content}</div>
          </div>
        )}
      </div>
    </div>
  );
};
