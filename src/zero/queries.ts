import { defineQueries, defineQuery } from '@rocicorp/zero';
import { z } from 'zod';
import { zql } from '~/zero/schema';

export const queries = defineQueries({
  conversation: {
    listWithMessages: defineQuery(
      z.object({
        limit: z.number().int().positive(),
      }),
      ({ args: { limit } }) =>
        zql.conversation
          .related('messages')
          .orderBy('created_at', 'desc')
          .limit(limit),
    ),
    byIdWithMessages: defineQuery(
      z.object({
        id: z.string(),
      }),
      ({ args: { id } }) =>
        zql.conversation.related('messages').where('id', '=', id),
    ),
  },
});
