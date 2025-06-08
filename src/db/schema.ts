import { createSchema, table, string } from '@rocicorp/zero'

const message = table('message')
  .columns({
    id: string(),
    body: string(),
  })
  .primaryKey('id')

export const schema = createSchema({
  tables: [message],
})

export type Schema = typeof schema

import { ANYONE_CAN_DO_ANYTHING, definePermissions } from '@rocicorp/zero'

export const permissions = definePermissions<unknown, Schema>(schema, () => ({
  message: ANYONE_CAN_DO_ANYTHING,
}))
