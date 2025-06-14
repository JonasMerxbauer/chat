import type { CustomMutatorDefs } from '@rocicorp/zero';
import type { Schema } from './schema';
import { createMutators as createClientMutators } from './mutators';

export function createMutators() {
  const clientMutators = createClientMutators();
  return {
    ...clientMutators,
    conversation: {
      ...clientMutators.conversation,

      createConversation: async (
        tx: any,
        { id, prompt }: { id: string; prompt: string },
      ) => {
        console.log('Creating conversation', id, prompt);

        // First, create the conversation record using client mutator
        await clientMutators.conversation.createConversation(tx, {
          id,
        });

        const messageId = crypto.randomUUID();

        // Create user message
        await clientMutators.conversation.createMessage(tx, {
          id: messageId,
          conversationId: id,
          content: prompt,
          role: 'user',
          status: 'complete',
        });

        const responseId = crypto.randomUUID();

        // Create placeholder for AI response
        await clientMutators.conversation.createMessage(tx, {
          id: responseId,
          conversationId: id,
          content: '',
          role: 'assistant',
          status: 'pending',
        });

        // Trigger AI title generation (independent from response)
        setTimeout(() => {
          const baseUrl =
            process.env.NODE_ENV === 'production'
              ? process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000'
              : 'http://localhost:3000';

          fetch(`${baseUrl}/api/generate-title`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: id,
              prompt,
            }),
          }).catch((error) => {
            console.error('Failed to trigger title generation:', error);
          });
        }, 0);

        // Trigger streaming via separate endpoint (no async task)
        setTimeout(() => {
          const baseUrl =
            process.env.NODE_ENV === 'production'
              ? process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000'
              : 'http://localhost:3000';

          fetch(`${baseUrl}/api/stream-ai`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              responseId,
              prompt,
              model: 'gpt-4o',
            }),
          }).catch((error) => {
            console.error('Failed to trigger streaming:', error);
          });
        }, 0);

        console.log('AI streaming triggered for response:', responseId);
        console.log('AI title generation triggered for conversation:', id);
      },

      createMessage: async (
        tx: any,
        { id, prompt }: { id: string; prompt: string },
      ) => {
        console.log('Sending prompt', id, prompt);

        const messageId = crypto.randomUUID();

        // Create user message
        await clientMutators.conversation.createMessage(tx, {
          id: messageId,
          conversationId: id,
          content: prompt,
          role: 'user',
          status: 'complete',
        });

        const responseId = crypto.randomUUID();

        // Create placeholder for AI response
        await clientMutators.conversation.createMessage(tx, {
          id: responseId,
          conversationId: id,
          content: '',
          role: 'assistant',
          status: 'pending',
        });

        // Trigger streaming via separate endpoint (no async task)
        setTimeout(() => {
          const baseUrl =
            process.env.NODE_ENV === 'production'
              ? process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000'
              : 'http://localhost:3000';

          fetch(`${baseUrl}/api/stream-ai`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              responseId,
              prompt,
              model: 'gpt-4o',
            }),
          }).catch((error) => {
            console.error('Failed to trigger streaming:', error);
          });
        }, 0);

        console.log('AI streaming triggered for response:', responseId);
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>;
}

export type ServerMutators = ReturnType<typeof createMutators>;
