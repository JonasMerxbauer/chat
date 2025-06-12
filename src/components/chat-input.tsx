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
import z from '~/db';

export const ChatInput = ({ ...props }: React.ComponentProps<'textarea'>) => {
  const params = useParams({ from: '/_chat/$chatId', shouldThrow: false });
  const navigate = useNavigate();
  const conversationId = params?.chatId ?? '';

  const handleSendMessage = async (message: string) => {
    console.log('Sending message', message);

    if (conversationId) {
      (z as any).mutate.conversation.createMessage({
        id: conversationId,
        prompt: message,
      });
    } else {
      const id = crypto.randomUUID();

      (z as any).mutate.conversation.createConversation({
        id,
        title: 'New chat',
        prompt: message,
      });

      navigate({
        to: '/$chatId',
        params: {
          chatId: id,
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
        <div className="flex justify-between">
          {(() => {
            const models = ['GPT 4o', 'GPT 4o mini'];
            const [selectedModel, setSelectedModel] = useState(models[0]);
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>{selectedModel}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {models.map((model) => (
                    <DropdownMenuItem
                      key={model}
                      onClick={() => setSelectedModel(model)}
                    >
                      {model}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })()}

          <Button
            onClick={() => {
              console.log('Sending message', inputRef.current?.value);
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

export const Message = ({ message }: { message: any }) => {
  const role = message.role;
  const content = message.content;

  return (
    <div
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className="rounded-base border-border bg-main text-main-foreground shadow-shadow max-w-[70%] border-2 p-4 transition-all">
        {role === 'assistant' ? (
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
        ) : (
          <div className="w500:text-sm">{content}</div>
        )}
      </div>
    </div>
  );
};
