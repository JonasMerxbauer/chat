import {
  createSchema,
  table,
  string,
  number,
  relationships,
} from '@rocicorp/zero'

const message = table('message')
  .columns({
    id: string(),
    conversation_id: string(),
    content: string(),
    role: string(),
    status: string(),
    created_at: number(),
    updated_at: number(),
  })
  .primaryKey('id')

const conversation = table('conversation')
  .columns({
    id: string(),
    title: string(),
    created_at: number(),
    updated_at: number(),
  })
  .primaryKey('id')

const messageRelationships = relationships(message, ({ one }) => ({
  conversation: one({
    sourceField: ['conversation_id'],
    destField: ['id'],
    destSchema: conversation,
  }),
}))

const conversationRelationships = relationships(conversation, ({ many }) => ({
  messages: many({
    sourceField: ['id'],
    destSchema: message,
    destField: ['conversation_id'],
  }),
}))

export const schema = createSchema({
  tables: [message, conversation],
  relationships: [messageRelationships, conversationRelationships],
})

export type Schema = typeof schema

import { ANYONE_CAN_DO_ANYTHING, definePermissions } from '@rocicorp/zero'

export const permissions = definePermissions<unknown, Schema>(schema, () => ({
  message: ANYONE_CAN_DO_ANYTHING,
  conversation: ANYONE_CAN_DO_ANYTHING,
}))
