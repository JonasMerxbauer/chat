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
  })
  .primaryKey('id');

const conversation = table('conversation')
  .columns({
    id: string(),
    title: string(),
    created_at: number(),
    updated_at: number(),
    user_id: string(),
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
  ANYONE_CAN,
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

  // Allow anonymous users to access their local data
  const isOwnerOrAnon = (
    authData: AuthData,
    { cmp }: ExpressionBuilder<Schema, 'conversation' | 'message'>,
  ) => {
    if (authData.sub === 'anon') {
      return cmp('user_id', 'anon');
    }
    return cmp('user_id', authData.sub);
  };

  return {
    conversation: {
      row: {
        select: [isOwnerOrAnon],
        insert: ANYONE_CAN,
        update: {
          preMutation: [isOwner],
        },
        delete: [isOwner],
      },
    },
    message: {
      row: {
        select: [isOwnerOrAnon],
        insert: ANYONE_CAN,
        update: {
          preMutation: [isOwner],
        },
        delete: [isOwner],
      },
    },
  } satisfies PermissionsConfig<AuthData, Schema>;
});
