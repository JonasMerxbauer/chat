import { createAPIFileRoute } from '@tanstack/react-start/api';
import { createMutators } from '~/db/server-mutators';
import { schema } from '~/db/schema';
import {
  PushProcessor,
  ZQLDatabase,
  PostgresJSConnection,
} from '@rocicorp/zero/pg';
import postgres from 'postgres';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const processor = new PushProcessor(
  new ZQLDatabase(
    new PostgresJSConnection(postgres(process.env.ZERO_UPSTREAM_DB! as string)),
    schema,
  ),
);

export const APIRoute = createAPIFileRoute('/api/push')({
  POST: async ({ request }) => {
    try {
      console.log('Processing push request');

      const result = await processor.process(createMutators(), request);

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Push endpoint error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  },
});
