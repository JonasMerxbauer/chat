import type { CustomMutatorDefs } from '@rocicorp/zero'
import type { Schema } from './schema'

export function createMutators() {
  return {
    conversation: {
      create: async (tx, { id }: { id: string; prompt: string }) => {
        const now = Date.now()
        await tx.mutate.conversation.insert({
          id,
          title: 'New chat',
          created_at: now,
          updated_at: now,
        })
      },

      createMessage: async (
        tx,
        {
          id,
          conversationId,
          content,
          role,
          status,
        }: {
          id: string
          conversationId: string
          content: string
          role: string
          status: string
        },
      ) => {
        const now = Date.now()
        await tx.mutate.message.insert({
          id,
          content,
          role,
          status,
          created_at: now,
          updated_at: now,
          conversation_id: conversationId,
        })
      },

      updateMessage: async (
        tx,
        {
          id,
          content,
          status,
        }: {
          id: string
          content: string
          status: string
        },
      ) => {
        const now = Date.now()
        await tx.mutate.message.update({
          id,
          content,
          status,
          updated_at: now,
        })
      },

      updateStatus: async (
        tx,
        { id, status }: { id: string; status: string },
      ) => {
        const now = Date.now()
        await tx.mutate.message.update({
          id,
          status,
          updated_at: now,
        })
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>
}

export type Mutators = ReturnType<typeof createMutators>
