import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { authClient } from './client';
import type { RouterContext } from '~/router';
import { auth } from './auth';

export const getAuthSession = createIsomorphicFn()
  .client(async (queryClient: RouterContext['queryClient']) => {
    const { data: session } = await queryClient.ensureQueryData({
      queryFn: () => authClient.getSession(),
      queryKey: ['auth', 'getSession'],
      staleTime: 60_000, // cache for 1 minute
      revalidateIfStale: true, // fetch in background when stale
    });

    return {
      session,
    };
  })
  .server(async (_: RouterContext['queryClient']) => {
    const request = getRequest();

    if (!request?.headers) {
      return { session: null };
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return {
      session,
    };
  });
