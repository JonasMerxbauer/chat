import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { lazy, Suspense } from 'react';

import appCss from '../styles.css?url';
import { zeroRef } from '~/lib/zero-auth';
import { useCallback, useSyncExternalStore, useEffect, useState } from 'react';
import { ZeroProvider } from '@rocicorp/zero/react';

// Lazy load dev tools to reduce initial bundle size and overhead
const TanStackRouterDevtoolsLazy = lazy(() =>
  import('@tanstack/react-router-devtools').then((module) => ({
    default: module.TanStackRouterDevtools,
  })),
);

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'ZeroChat',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  component: () => (
    <ZeroAuthProvider>
      <RootDocument>
        <Outlet />

        {/* Only load dev tools when explicitly needed */}
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <TanStackRouterDevtoolsLazy />
          </Suspense>
        )}
      </RootDocument>
    </ZeroAuthProvider>
  ),
});

const ZeroAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const z = useSyncExternalStore(
    zeroRef.onChange,
    useCallback(() => zeroRef.value, []),
    // Server-side snapshot should return undefined
    () => undefined,
  );

  // Don't render anything on server or before client hydration
  if (!isClient) {
    return <RootDocument>{null}</RootDocument>;
  }

  // Show loading while Zero is initializing
  if (!z) {
    return (
      <RootDocument>
        <div>Initializing...</div>
      </RootDocument>
    );
  }

  return <ZeroProvider zero={z}>{children}</ZeroProvider>;
};

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
