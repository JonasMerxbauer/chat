import type { CustomMutatorDefs } from '@rocicorp/zero'
import type { Schema } from './schema'
import { createMutators as createClientMutators } from './mutators'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export function createMutators(asyncTasks: Array<() => Promise<void>>) {
  const clientMutators = createClientMutators()
  return {
    ...clientMutators,
    conversation: {
      ...clientMutators.conversation,

      create: async (
        tx: any,
        { id, prompt }: { id: string; prompt: string },
      ) => {
        // First, create the conversation record using client mutator
        await clientMutators.conversation.create(tx, { id, prompt })

        console.log('Conversation created')

        // Set initial streaming status
        await clientMutators.conversation.updateResponse(tx, {
          id,
          response: '',
          status: 'streaming',
        })

        // Add the AI streaming task to asyncTasks to run outside the transaction
        asyncTasks.push(async () => {
          try {
            const { textStream } = streamText({
              model: openai('gpt-4o'),
              prompt: prompt,
            })

            let fullResponse = ''

            for await (const textPart of textStream) {
              fullResponse += textPart
              console.log('Streaming text part', textPart)

              await clientMutators.conversation.updateResponse(tx, {
                id,
                response: fullResponse,
                status: 'streaming',
              })
            }

            // Final update when streaming is complete
            console.log('Streaming completed', fullResponse)
            await clientMutators.conversation.updateResponse(tx, {
              id,
              response: fullResponse,
              status: 'complete',
            })
          } catch (error) {
            console.error('AI streaming error:', error)
          }
        })

        console.log('AI streaming task queued')
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>
}

export type ServerMutators = ReturnType<typeof createMutators>
