import { betterAuth } from 'better-auth';
import { reactStartCookies } from 'better-auth/react-start';
import { jwt } from 'better-auth/plugins';
import { Pool } from 'pg';
import { env } from './env';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
  plugins: [reactStartCookies(), jwt()],
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
      beforeDelete: async (user) => {
        // Delete user's conversations and messages before deleting the user
        console.log(`Cleaning up data for user ${user.id}`);

        const client = await pool.connect();
        try {
          // Delete all messages for this user
          await client.query('DELETE FROM message WHERE user_id = $1', [
            user.id,
          ]);

          // Delete all conversations for this user
          await client.query('DELETE FROM conversation WHERE user_id = $1', [
            user.id,
          ]);

          console.log(`Successfully cleaned up data for user ${user.id}`);
        } catch (error) {
          console.error(`Error cleaning up data for user ${user.id}:`, error);
          throw error;
        } finally {
          client.release();
        }
      },
      afterDelete: async (user) => {
        console.log(`User ${user.email} successfully deleted`);
      },
    },
  },
});
