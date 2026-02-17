import { ZeroProvider } from '@rocicorp/zero/react';
import { useRouter } from '@tanstack/react-router';
import type { Zero } from '@rocicorp/zero';
import { schema } from '~/zero/schema';
import { env } from '~/env';
import { authClient } from '~/auth/client';
import { useCallback } from 'react';
import { mutators } from '~/zero/mutators';

const cacheURL = env.VITE_PUBLIC_ZERO_CACHE_URL;

export function ZeroInit({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = authClient.useSession();
  const userID = session.data?.user.id ?? 'anon';
  const context = { userId: userID };

  const init = useCallback(
    (zero: Zero) => {
      router.update({
        context: {
          ...router.options.context,
          zero,
        },
      });
      router.invalidate();
    },
    [router],
  );

  return (
    <ZeroProvider {...{ schema, userID, context, cacheURL, mutators, init }}>
      {children}
    </ZeroProvider>
  );
}
