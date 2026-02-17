// app/router.tsx
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { Zero } from '@rocicorp/zero';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export interface RouterContext {
  zero: Zero;
  queryClient: QueryClient;
}

// Create QueryClient once, outside the function to ensure single instance
const queryClient = new QueryClient();

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'viewport',
    // It is fine to call Zero multiple times for same query, Zero dedupes the
    // queries internally.
    defaultPreloadStaleTime: 0,
    // We don't want TanStack skipping any calls to us. We want to be asked to
    // preload every link. This is fine because Zero has its own internal
    // deduping and caching.
    defaultPreloadGcTime: 0,
    context: {
      zero: undefined as unknown as Zero, // populated in ZeroInit,
      queryClient,
    } satisfies RouterContext,
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQueryProvider queryClient={queryClient}>
          {props.children}
        </TanstackQueryProvider>
      );
    },
  });

  return router;
}

function TanstackQueryProvider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
