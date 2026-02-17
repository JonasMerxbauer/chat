import { createAuthClient } from 'better-auth/react';
import { dropAllDatabases } from '@rocicorp/zero';
import { env } from '~/env';

export const authClient = createAuthClient({
  baseURL: env.VITE_BETTER_AUTH_URL || 'http://localhost:3000',
  plugins: [],
});

export function login() {
  const callbackURL = location.href;
  authClient.signIn.social({
    provider: 'github',
    callbackURL,
    errorCallbackURL: callbackURL,
    newUserCallbackURL: callbackURL,
  });
}

export async function clearZeroCache(): Promise<void> {
  try {
    const { dropped, errors } = await dropAllDatabases();
    if (errors.length > 0) {
      console.warn('Some Zero databases failed to drop:', errors);
    }
    if (dropped.length > 0) {
      console.log('Dropped Zero databases:', dropped);
    }
  } catch (error) {
    // Silently fail - don't prevent logout if cache clear fails
    console.warn('Failed to clear Zero cache:', error);
  }
}

export async function logout() {
  await clearZeroCache();
  await authClient.signOut();
}
