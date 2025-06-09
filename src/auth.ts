import { betterAuth } from 'better-auth'
import { createAuthClient } from 'better-auth/react'
import { reactStartCookies } from 'better-auth/react-start'
import { Pool } from 'pg'

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  plugins: [reactStartCookies()],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
})

export const { signIn, signUp, useSession } = createAuthClient({
  baseURL: 'http://localhost:3000',
})
