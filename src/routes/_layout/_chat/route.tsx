import { useQuery as useZeroQuery } from '@rocicorp/zero/react';
import {
  createFileRoute,
  Outlet,
  redirect,
  useParams,
} from '@tanstack/react-router';
import { AppSidebar } from '~/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import { getAuthSession } from '~/auth/session';
import { queries } from '~/zero/queries';

export const Route = createFileRoute('/_layout/_chat')({
  beforeLoad: async ({ context }) => {
    const { session } = await getAuthSession(context.queryClient);
    // If user is not authenticated, redirect to login with return URL
    if (!session) {
      throw redirect({
        to: '/auth',
      });
    }

    const user = session.user;

    return {
      user,
    };
  },
  component: RouteComponent,
  ssr: false,
});

function RouteComponent() {
  // Get user and subscription from route context (set in beforeLoad) - avoids extra API call
  const { user } = Route.useRouteContext();

  const params = useParams({
    from: '/_layout/_chat/$chatId',
    shouldThrow: false,
  });
  // Existing query for sidebar
  const [conversations] = useZeroQuery(
    queries.conversation.listWithMessages({
      limit: 10,
    }),
  );

  return (
    <SidebarProvider>
      <AppSidebar
        conversations={conversations}
        selectedConversation={params?.chatId ?? ''}
        user={user}
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
