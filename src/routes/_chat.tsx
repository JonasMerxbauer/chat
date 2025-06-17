import { useQuery } from '@rocicorp/zero/react';
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { AppSidebar } from '~/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import { useSession } from '~/auth';
import { useZero } from '~/hooks/use-zero';

export const Route = createFileRoute('/_chat')({
  component: RouteComponent,
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
