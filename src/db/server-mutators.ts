import type { CustomMutatorDefs } from '@rocicorp/zero';
import type { Schema } from './schema';
import { createMutators as createClientMutators } from './mutators';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export function createMutators(asyncTasks: Array<() => Promise<void>>) {
  const clientMutators = createClientMutators();
  return {
    ...clientMutators,
    conversation: {
      ...clientMutators.conversation,

      create: async (
        tx: any,
        { id, prompt }: { id: string; prompt: string },
      ) => {
        console.log('Creating conversation', id, prompt);

        // First, create the conversation record using client mutator
        await clientMutators.conversation.create(tx, { id, prompt });

        const messageId = crypto.randomUUID();

        // Set initial streaming status
        await clientMutators.conversation.createMessage(tx, {
          id: messageId,
          conversationId: id,
          content: prompt,
          role: 'user',
          status: 'complete',
        });

        const responseId = crypto.randomUUID();

        // Set initial streaming status
        await clientMutators.conversation.createMessage(tx, {
          id: responseId,
          conversationId: id,
          content: '',
          role: 'assistant',
          status: 'streaming',
        });

        // Add the AI streaming task to asyncTasks to run outside the transaction
        asyncTasks.push(async () => {
          try {
            const { textStream } = streamText({
              model: openai('gpt-4o'),
              prompt: prompt,
            });

            let fullResponse = '';

            for await (const textPart of textStream) {
              fullResponse += textPart;
              console.log('Streaming text part', textPart);

              await clientMutators.conversation.updateMessage(tx, {
                id: responseId,
                content: fullResponse,
                status: 'streaming',
              });
            }

            // Final update when streaming is complete
            console.log('Streaming completed', fullResponse);
            await clientMutators.conversation.updateMessage(tx, {
              id: responseId,
              content: fullResponse,
              status: 'complete',
            });
          } catch (error) {
            console.error('AI streaming error:', error);
          }
        });

        console.log('AI streaming task queued');
      },

      createMessage: async (
        tx: any,
        { id, prompt }: { id: string; prompt: string },
      ) => {
        console.log('Sending prompt', id, prompt);

        const messageId = crypto.randomUUID();

        // Set initial streaming status
        await clientMutators.conversation.createMessage(tx, {
          id: messageId,
          conversationId: id,
          content: prompt,
          role: 'user',
          status: 'complete',
        });

        const responseId = crypto.randomUUID();

        // Set initial streaming status
        await clientMutators.conversation.createMessage(tx, {
          id: responseId,
          conversationId: id,
          content: '',
          role: 'assistant',
          status: 'streaming',
        });

        // Add the AI streaming task to asyncTasks to run outside the transaction
        asyncTasks.push(async () => {
          try {
            const { textStream } = streamText({
              model: google('gemini-2.0-flash-lite'),
              prompt: prompt,
            });

            let fullResponse = '';

            for await (const textPart of textStream) {
              fullResponse += textPart;
              console.log('Streaming text part', textPart);

              await clientMutators.conversation.updateMessage(tx, {
                id: responseId,
                content: fullResponse,
                status: 'streaming',
              });
            }

            // Final update when streaming is complete
            console.log('Streaming completed', fullResponse);
            await clientMutators.conversation.updateMessage(tx, {
              id: responseId,
              content: fullResponse,
              status: 'complete',
            });
          } catch (error) {
            console.error('AI streaming error:', error);
          }
        });
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>;
}

export type ServerMutators = ReturnType<typeof createMutators>;
