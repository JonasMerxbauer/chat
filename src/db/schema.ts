import {
  createSchema,
  table,
  string,
  number,
  relationships,
} from '@rocicorp/zero';

const message = table('message')
  .columns({
    id: string(),
    conversation_id: string(),
    content: string(),
    role: string(), // 'user' | 'assistant'
    status: string(), // 'sending' | 'pending' | 'streaming' | 'complete' | 'error'
    created_at: number(),
    updated_at: number(),
    user_id: string(),
    web_search_enabled: string().optional(), // 'true' | 'false' | null
    attachments: string().optional(), // JSON string of attachment objects
  })
  .primaryKey('id');

const conversation = table('conversation')
  .columns({
    id: string(),
    title: string(),
    created_at: number(),
    updated_at: number(),
    user_id: string(),
    current_model_id: string(),
    current_model_provider: string(),
    current_model_name: string(),
  })
  .primaryKey('id');

const messageRelationships = relationships(message, ({ one }) => ({
  conversation: one({
    sourceField: ['conversation_id'],
    destField: ['id'],
    destSchema: conversation,
  }),
}));

const conversationRelationships = relationships(conversation, ({ many }) => ({
  messages: many({
    sourceField: ['id'],
    destSchema: message,
    destField: ['conversation_id'],
  }),
}));

export const schema = createSchema({
  tables: [message, conversation],
  relationships: [messageRelationships, conversationRelationships],
});

export type Schema = typeof schema;

import {
  definePermissions,
  type ExpressionBuilder,
  type PermissionsConfig,
} from '@rocicorp/zero';

// Type for JWT claims from better-auth
type AuthData = {
  sub: string; // User ID from JWT
  email?: string;
  role?: string;
};

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  // Allow users to only see their own conversations/messages
  const isOwner = (
    authData: AuthData,
    { cmp }: ExpressionBuilder<Schema, 'conversation' | 'message'>,
  ) => cmp('user_id', authData.sub);

  return {
    conversation: {
      row: {
        select: [isOwner],
        insert: [isOwner],
        update: {
          preMutation: [isOwner],
        },
        delete: [isOwner],
      },
    },
    message: {
      row: {
        select: [isOwner],
        insert: [isOwner],
        update: {
          preMutation: [isOwner],
        },
        delete: [isOwner],
      },
    },
  } satisfies PermissionsConfig<AuthData, Schema>;
});
