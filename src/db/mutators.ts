import type { CustomMutatorDefs } from '@rocicorp/zero'
import type { Schema } from './schema'

export function createMutators() {
  return {
    conversation: {
      create: async (tx, { id, prompt }: { id: string; prompt: string }) => {
        const now = Date.now()
        await tx.mutate.conversation.insert({
          id,
          prompt,
          response: '',
          status: 'pending',
          created_at: now,
          updated_at: now,
        })
      },

      updateResponse: async (
        tx,
        {
          id,
          response,
          status,
        }: { id: string; response: string; status: string },
      ) => {
        const now = Date.now()
        await tx.mutate.conversation.update({
          id,
          response,
          status,
          updated_at: now,
        })
      },

      updateStatus: async (
        tx,
        { id, status }: { id: string; status: string },
      ) => {
        const now = Date.now()
        await tx.mutate.conversation.update({
          id,
          status,
          updated_at: now,
        })
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>
}

export type Mutators = ReturnType<typeof createMutators>
