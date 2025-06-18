import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChatInput } from '~/components/chat-input';
import { Card } from '~/components/ui/card';
import { useSession } from '~/lib/zero-auth';
import { useZero } from '~/hooks/use-zero';
import { DEFAULT_MODEL } from '~/constants';
import { MessageSquare, Code, Lightbulb, HelpCircle } from 'lucide-react';

export const Route = createFileRoute('/_chat/')({
  component: Page,
  ssr: false,
});

const EXAMPLE_PROMPTS = [
  {
    icon: MessageSquare,
    title: 'General Chat',
    prompt:
      "Hello! I'd like to have a conversation about current events and interesting topics.",
    category: 'Chat',
  },
  {
    icon: Code,
    title: 'Code Help',
    prompt:
      'I need help with a coding problem. Can you assist me with debugging and best practices?',
    category: 'Development',
  },
  {
    icon: Lightbulb,
    title: 'Creative Writing',
    prompt: 'Help me write a creative short story about an adventure in space.',
    category: 'Creative',
  },
  {
    icon: HelpCircle,
    title: 'Learning Assistant',
    prompt:
      'Explain a complex topic to me in simple terms with examples and analogies.',
    category: 'Education',
  },
];

export default function Page() {
  const navigate = useNavigate();
  const z = useZero();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const handleExampleClick = async (prompt: string) => {
    if (!userId) {
      return;
    }

    const conversationId = crypto.randomUUID();
    const messageId = crypto.randomUUID();

    z.mutate.conversation.createConversation({
      id: conversationId,
      title: 'New chat',
      messageId,
      content: prompt,
      model: DEFAULT_MODEL,
      userId,
    });

    navigate({
      to: '/$chatId',
      params: {
        chatId: conversationId,
      },
    });
  };

  return (
    <div className="relative flex h-screen flex-col">
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold">Welcome to ZeroChat</h1>
            <p className="text-muted-foreground text-lg">
              Start a conversation or choose from these example prompts
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {EXAMPLE_PROMPTS.map((example, index) => {
              const Icon = example.icon;
              return (
                <Card
                  key={index}
                  className="hover:border-primary/50 cursor-pointer p-4 transition-all duration-200 hover:shadow-lg"
                  onClick={() => handleExampleClick(example.prompt)}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-1 flex-shrink-0">
                      <Icon className="text-primary h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="font-semibold">{example.title}</h3>
                        <span className="bg-foreground mt-1 rounded-full px-2 py-1 text-xs text-white">
                          {example.category}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {example.prompt}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 w-full">
        <ChatInput placeholder="Type your message here..." />
      </div>
    </div>
  );
}
