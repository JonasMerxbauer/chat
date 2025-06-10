import { createSchema, table, string, number } from '@rocicorp/zero'

const message = table('message')
  .columns({
    id: string(),
    body: string(),
  })
  .primaryKey('id')

const conversation = table('conversation')
  .columns({
    id: string(),
    prompt: string(),
    response: string(),
    status: string(), // 'pending', 'streaming', 'complete', 'error'
    created_at: number(),
    updated_at: number(),
  })
  .primaryKey('id')

export const schema = createSchema({
  tables: [message, conversation],
})

export type Schema = typeof schema

import { ANYONE_CAN_DO_ANYTHING, definePermissions } from '@rocicorp/zero'

export const permissions = definePermissions<unknown, Schema>(schema, () => ({
  message: ANYONE_CAN_DO_ANYTHING,
  conversation: ANYONE_CAN_DO_ANYTHING,
}))
