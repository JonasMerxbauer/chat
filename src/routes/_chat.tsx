import { useQuery } from '@rocicorp/zero/react';
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { AppSidebar } from '~/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import { useSession } from '~/auth';
import { useZero, useBackgroundChatPreload } from '~/hooks/use-zero';
import { useMemo } from 'react';

export const Route = createFileRoute('/_chat')({
  component: RouteComponent,
  ssr: false,
});

function RouteComponent() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  if (!session?.user && !isPending) {
    navigate({ to: '/auth' });
    return null;
  }

  const params = useParams({ from: '/_chat/$chatId', shouldThrow: false });
  const z = useZero();

  // Existing query for sidebar
  const [conversations] = useQuery(
    z.query.conversation
      .related('messages')
      .orderBy('created_at', 'desc')
      .limit(10),
  );

  // Memoize preloading to avoid unnecessary work
  useMemo(() => {
    // Add preloading for better performance
    // Preload more conversations with their messages for instant transitions
    z.query.conversation
      .related('messages')
      .orderBy('created_at', 'desc')
      .limit(50) // Preload more conversations
      .preload();
  }, [z]);

  // Keep recent conversations in background for instant access
  const recentChatIds = useMemo(
    () => conversations.slice(0, 5).map((c) => c.id),
    [conversations],
  );
  useBackgroundChatPreload(recentChatIds);

  if (isPending) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        conversations={conversations}
        selectedConversation={params?.chatId ?? ''}
        user={session?.user}
      />
      <SidebarInset>
        <div className="absolute top-5 right-2 z-[100] md:hidden">
          <SidebarTrigger />
        </div>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
