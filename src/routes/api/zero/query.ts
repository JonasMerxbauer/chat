import { json } from '@tanstack/react-start';
import { schema } from '~/zero/schema';
import { createFileRoute } from '@tanstack/react-router';
import { auth } from '~/auth/auth';
import { handleQueryRequest } from '@rocicorp/zero/server';
import { mustGetQuery } from '@rocicorp/zero';
import { queries } from '~/zero/queries';

export const Route = createFileRoute('/api/zero/query')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession(request);
        const ctx = { userId: session?.user.id ?? 'anon' };
        return json(
          await handleQueryRequest(
            (name, args) => {
              const query = mustGetQuery(queries, name);
              return query.fn({ args, ctx });
            },
            schema,
            request,
          ),
        );
      },
    },
  },
});
