import { createAuthClient } from 'better-auth/react';
import { Zero } from '@rocicorp/zero';
import { schema, type Schema } from '~/db/schema';
import { createMutators, type Mutators } from '~/db/mutators';
import { Atom } from '~/atom';

type AuthData = {
  sub: string;
  email?: string;
  role?: string;
};

export type LoginState = {
  encoded: string;
  decoded: AuthData;
};

const zeroAtom = new Atom<Zero<Schema, Mutators>>();
const authAtom = new Atom<LoginState>();

const isClient = typeof window !== 'undefined';

const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

export const { signIn, signUp, signOut, useSession, deleteUser } = authClient;

export async function getJWT(): Promise<string | null> {
  if (!isClient) return null;

  try {
    await authClient.getSession({
      fetchOptions: {
        onSuccess: (ctx) => {
          const jwt = ctx.response.headers.get('set-auth-jwt');
          if (jwt) {
            localStorage.setItem('zero-jwt', jwt);
          }
        },
      },
    });

    const cachedJWT = localStorage.getItem('zero-jwt');
    if (cachedJWT) {
      try {
        const payload = cachedJWT.split('.')[1];
        if (payload) {
          const decoded = JSON.parse(atob(payload));
          const currentTime = Math.floor(Date.now() / 1000);

          if (decoded.exp && decoded.exp <= currentTime + 300) {
            localStorage.removeItem('zero-jwt');
          } else {
            return cachedJWT;
          }
        }
      } catch (error) {
        console.warn('[Zero Auth] Failed to check token expiration:', error);
        localStorage.removeItem('zero-jwt');
      }
    }

    const tokenResponse = await fetch('/api/auth/token', {
      credentials: 'include',
    });

    if (tokenResponse.ok) {
      const data = await tokenResponse.json();
      if (data.token) {
        localStorage.setItem('zero-jwt', data.token);
        return data.token;
      }
    }
  } catch (error) {
    console.error('Failed to get JWT:', error);
  }

  return null;
}

export async function getJwt(): Promise<AuthData | null> {
  if (!isClient) return null;

  try {
    const token = await getJWT();
    if (!token) return null;

    const payload = token.split('.')[1];
    if (!payload) return null;

    const decoded = JSON.parse(atob(payload));
    return decoded as AuthData;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export function getRawJwt(): string | null {
  if (!isClient) return null;
  return localStorage.getItem('zero-jwt');
}

export function clearJwt() {
  if (!isClient) return;
  localStorage.removeItem('zero-jwt');
}

const initializeAuth = async () => {
  if (!isClient) return;

  const jwt = await getJwt();
  const encodedJwt = await getJWT();

  authAtom.value =
    encodedJwt && jwt
      ? {
          encoded: encodedJwt,
          decoded: jwt as LoginState['decoded'],
        }
      : undefined;
};

function exposeDevHooks(z: Zero<Schema, Mutators>) {
  if (import.meta.env.DEV && isClient) {
    (window as any).zero = z;
  }
}

function mark(label: string) {
  // Development logging removed for production
}

if (isClient) {
  initializeAuth();
}

if (isClient) {
  authAtom.onChange((auth) => {
    zeroAtom.value?.close();
    mark('creating new zero');
    const authData = auth?.decoded;
    const z = new Zero({
      logLevel: import.meta.env.DEV ? 'info' : 'warn',
      server: import.meta.env.VITE_ZERO_SERVER || 'http://localhost:4848',
      userID: authData?.sub ?? 'anon',
      mutators: createMutators(),
      auth: async (error?: 'invalid-token') => {
        if (error === 'invalid-token') {
          clearJwt();

          try {
            const newToken = await getJWT();
            if (newToken) {
              const newDecoded = await getJwt();
              if (newDecoded) {
                authAtom.value = {
                  encoded: newToken,
                  decoded: newDecoded,
                };
                return newToken;
              }
            }
          } catch (error) {
            console.error('[Zero Auth] Failed to refresh token:', error);
          }

          authAtom.value = undefined;
          return undefined;
        }
        return auth?.encoded;
      },
      schema,
    });
    zeroAtom.value = z;

    exposeDevHooks(z);
  });
}

export function isTokenExpired(token: string): boolean {
  if (!token) return true;

  try {
    const payload = token.split('.')[1];
    if (!payload) return true;

    const decoded = JSON.parse(atob(payload));
    const currentTime = Math.floor(Date.now() / 1000);

    return decoded.exp && decoded.exp <= currentTime + 300;
  } catch (error) {
    console.error('Failed to check token expiration:', error);
    return true;
  }
}

export async function forceRefreshToken(): Promise<string | null> {
  if (!isClient) return null;

  clearJwt();

  const newToken = await getJWT();
  if (newToken) {
    await refreshAuth();
  }

  return newToken;
}

export async function refreshAuth() {
  if (!isClient) return;
  await initializeAuth();
}

export async function clearZeroData() {
  if (!isClient) return;

  clearJwt();
  authAtom.value = undefined;
  const { dropAllDatabases } = await import('@rocicorp/zero');
  return dropAllDatabases();
}

export { authAtom as authRef, zeroAtom as zeroRef };
