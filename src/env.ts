import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
export const env = createEnv({
  server: {
    SERVER_URL: z.string().url().optional(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    DISCORD_CLIENT_ID: z.string(),
    DISCORD_CLIENT_SECRET: z.string(),
    COOKIE_DOMAIN: z.string().optional(),
    ZERO_UPSTREAM_DB: z.string().url(),
    BETTER_AUTH_URL: z.string().url(),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',

  client: {
    VITE_API_URL: z.string().url().optional(),
    VITE_ZERO_SERVER: z.string().url().optional(),
    VITE_PUBLIC_ZERO_CACHE_URL: z.string().url(),
    VITE_BETTER_AUTH_URL: z.string().url(),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: typeof window !== 'undefined' ? import.meta.env : process.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
});
