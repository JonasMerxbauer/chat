import { createFileRoute } from '@tanstack/react-router';
import z from '~/db';
import { useQuery } from '@rocicorp/zero/react';
import { SendIcon } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { useState } from 'react';

export const Route = createFileRoute('/_chat/$chatId')({
  component: Page,
  ssr: false,
});

export default function Page() {
  const { chatId } = Route.useParams();
  const [conversations] = useQuery(
    z.query.conversation.related('messages').where('id', '=', chatId),
  );

  console.log(conversations[0]);

  if (!conversations[0]) return null;

  return (
    <div>
      <h1 className="absolute top-4 left-4 text-3xl">
        {conversations[0].title}
      </h1>
      <div className="flex flex-col gap-4 overflow-auto p-4 pt-16">
        {conversations[0].messages.map((message: any) => (
          <Message key={message.id} message={message} />
        ))}
      </div>
      <div className="absolute bottom-5 w-full">
        <ChatInput placeholder="Type your message here xd..." />
      </div>
    </div>
  );
}
const ChatInput = ({ ...props }: React.ComponentProps<'textarea'>) => {
  return (
    <div className="mx-auto w-full max-w-[800px]">
      <div className="rounded-base border-border bg-secondary-background mx-4 flex w-auto flex-col border-2 p-2 focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2 focus-within:outline-none">
        <div className="flex-1">
          <textarea
            data-slot="textarea"
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

          <Button>
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
};

const Message = ({ message }: { message: any }) => {
  const role = message.role;
  const content = message.content;

  return (
    <div
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <a className="rounded-base border-border bg-main text-main-foreground shadow-shadow border-2 p-4 transition-all">
        <p className="w500:text-sm">{content}</p>
      </a>
    </div>
  );
};
