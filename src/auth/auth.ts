import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '~/db';
import * as schema from './schema';
import { env } from '~/env';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL || 'http://localhost:3000',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {},
      afterDelete: async (user) => {
        console.log(`User ${user.email} successfully deleted`);
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: env.COOKIE_DOMAIN
    ? {
        crossSubDomainCookies: {
          enabled: true,
          domain: env.COOKIE_DOMAIN,
        },
        defaultCookieAttributes: {
          sameSite: 'none',
          secure: true,
        },
      }
    : undefined,
});
