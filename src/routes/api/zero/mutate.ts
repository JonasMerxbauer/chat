import { json } from '@tanstack/react-start';
import { handleMutateRequest } from '@rocicorp/zero/server';
import { mustGetMutator } from '@rocicorp/zero';
import { zeroPostgresJS } from '@rocicorp/zero/server/adapters/postgresjs';
import postgres from 'postgres';
import { schema } from '~/zero/schema';
import { serverMutators } from '~/zero/server-mutators';
import { createFileRoute } from '@tanstack/react-router';
import { auth } from '~/auth/auth';
import { env } from '~/env';

const pgURL = env.ZERO_UPSTREAM_DB;

const dbProvider = zeroPostgresJS(schema, postgres(pgURL) as any);

export const Route = createFileRoute('/api/zero/mutate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession(request);

        if (!session) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ctx = { userId: session.user.id };

        return json(
          await handleMutateRequest(
            dbProvider,
            async (transact) => {
              return await transact(async (tx, name, args) => {
                const mutator = mustGetMutator(serverMutators, name);
                return await mutator.fn({ tx, ctx, args });
              });
            },
            request,
          ),
        );
      },
    },
  },
});
