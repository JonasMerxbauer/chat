import type { CustomMutatorDefs } from '@rocicorp/zero';
import type { Schema } from './schema';
import { createMutators as createClientMutators } from './mutators';
import {
  generateConversationTitle,
  streamAIResponse,
} from '~/utils/ai-operations';

export function createMutators() {
  const clientMutators = createClientMutators();
  return {
    ...clientMutators,
    conversation: {
      ...clientMutators.conversation,

      createConversation: async (
        tx: any,
        { id, prompt, model }: { id: string; prompt: string; model: any },
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

        // Trigger AI title generation (fire and forget)
        (async () => {
          try {
            await generateConversationTitle(id, prompt, model);
          } catch (error) {
            console.error('Failed to generate title:', error);
          }
        })();

        // Trigger AI streaming (fire and forget)
        (async () => {
          try {
            await streamAIResponse(responseId, prompt, model);
          } catch (error) {
            console.error('Failed to trigger streaming:', error);
          }
        })();

        console.log('AI streaming triggered for response:', responseId);
        console.log('AI title generation triggered for conversation:', id);
      },

      createMessage: async (
        tx: any,
        { id, prompt, model }: { id: string; prompt: string; model: any },
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

        // Trigger AI streaming (fire and forget)
        (async () => {
          try {
            await streamAIResponse(responseId, prompt, model);
          } catch (error) {
            console.error('Failed to trigger streaming:', error);
          }
        })();

        console.log('AI streaming triggered for response:', responseId);
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>;
}

export type ServerMutators = ReturnType<typeof createMutators>;
