import { createFileRoute } from '@tanstack/react-router';
import { ChatInput } from '~/components/chat-input';

export const Route = createFileRoute('/_chat/')({
  component: Page,
  ssr: false,
});

export default function Page() {
  return (
    <div className="relative flex h-screen flex-col">
      <div className="absolute bottom-5 w-full">
        <ChatInput placeholder="Type your message here xd..." />
      </div>
    </div>
  );
}
