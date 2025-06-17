import { useQuery } from '@rocicorp/zero/react';
import { createFileRoute, Outlet, useParams } from '@tanstack/react-router';
import { AppSidebar } from '~/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import z from '~/db';
import { useSession } from '~/auth';

export const Route = createFileRoute('/_chat')({
  component: RouteComponent,
});

function RouteComponent() {
  const params = useParams({ from: '/_chat/$chatId', shouldThrow: false });
  const { data: session } = useSession();
  const [conversations] = useQuery(
    z.query.conversation
      .related('messages')
      .orderBy('created_at', 'desc')
      .limit(10),
  );

  return (
    <SidebarProvider>
      <AppSidebar
        conversations={conversations}
        selectedConversation={params?.chatId ?? ''}
        user={session?.user}
      />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
