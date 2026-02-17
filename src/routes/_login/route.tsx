import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { getAuthSession } from '~/auth/session';

export const Route = createFileRoute('/_login')({
  beforeLoad: async ({ context }) => {
    const session = await getAuthSession(context.queryClient);
    // If user is authenticated, redirect to signed area
    if (session?.session?.user) {
      throw redirect({
        to: '/',
      });
    }
  },
  component: () => <Outlet />,
});
