import { createAuthClient } from 'better-auth/react';

// Only create the client-side auth client
export const { signIn, signUp, useSession } = createAuthClient({
  baseURL: 'http://localhost:3000',
});
