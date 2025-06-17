import { createAuthClient } from 'better-auth/react';
import { Zero } from '@rocicorp/zero';
import { schema, type Schema } from '~/db/schema';
import { createMutators, type Mutators } from '~/db/mutators';
import { Atom } from '~/atom';

// Type for JWT claims from better-auth
type AuthData = {
  sub: string; // User ID from JWT
  email?: string;
  role?: string;
};

export type LoginState = {
  encoded: string;
  decoded: AuthData;
};

// Create atoms for state management
const zeroAtom = new Atom<Zero<Schema, Mutators>>();
const authAtom = new Atom<LoginState>();

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Create the better-auth client
const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Export auth methods
export const { signIn, signUp, signOut, useSession } = authClient;

// Function to get JWT token from better-auth
export async function getJWT(): Promise<string | null> {
  if (!isClient) return null;

  try {
    // Method 1: Try to get JWT from getSession with set-auth-jwt header
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

    // Check if we got the JWT from the header
    const cachedJWT = localStorage.getItem('zero-jwt');
    if (cachedJWT) {
      return cachedJWT;
    }

    // Method 2: If no JWT from getSession, try the /api/auth/token endpoint
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

// Function to get decoded JWT token
export async function getJwt(): Promise<AuthData | null> {
  if (!isClient) return null;

  try {
    const token = await getJWT();
    if (!token) return null;

    // Decode JWT (simple base64 decode for the payload)
    const payload = token.split('.')[1];
    if (!payload) return null;

    const decoded = JSON.parse(atob(payload));
    return decoded as AuthData;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Function to get raw JWT token
export function getRawJwt(): string | null {
  if (!isClient) return null; // Only run on client
  return localStorage.getItem('zero-jwt');
}

// Function to clear JWT and auth state
export function clearJwt() {
  if (!isClient) return; // Only run on client
  localStorage.removeItem('zero-jwt');
}

// Initialize auth state function
const initializeAuth = async () => {
  if (!isClient) return; // Only run on client

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

// Development hooks for debugging
function exposeDevHooks(z: Zero<Schema, Mutators>) {
  if (import.meta.env.DEV && isClient) {
    (window as any).zero = z;
  }
}

// Mark function for performance debugging
function mark(label: string) {
  if (import.meta.env.DEV) {
    console.log(`[Zero] ${label}`);
  }
}

// Initialize immediately (only on client)
if (isClient) {
  initializeAuth();
}

// Set up reactive Zero instance creation (only on client)
if (isClient) {
  authAtom.onChange((auth) => {
    zeroAtom.value?.close();
    mark('creating new zero');
    const authData = auth?.decoded;
    const z = new Zero({
      logLevel: 'info',
      server: import.meta.env.VITE_ZERO_SERVER || 'http://localhost:4848',
      userID: authData?.sub ?? 'anon',
      mutators: createMutators(),
      auth: (error?: 'invalid-token') => {
        if (error === 'invalid-token') {
          clearJwt();
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

// Refresh JWT and auth state (call this after successful login)
export async function refreshAuth() {
  if (!isClient) return;
  await initializeAuth();
}

// Clear all Zero data on logout
export async function clearZeroData() {
  if (!isClient) return; // Only run on client

  clearJwt();
  authAtom.value = undefined;
  const { dropAllDatabases } = await import('@rocicorp/zero');
  return dropAllDatabases();
}

export { authAtom as authRef, zeroAtom as zeroRef };
