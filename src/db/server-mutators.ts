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
        {
          id,
          title,
          messageId,
          content,
          model,
          userId,
        }: {
          id: string;
          title: string;
          messageId: string;
          content: string;
          model: any;
          userId: string;
        },
      ) => {
        console.log('Creating conversation', id, content);

        // First, create the conversation record using client mutator
        await clientMutators.conversation.createConversation(tx, {
          id,
          messageId,
          content,
          title,
          userId,
          model,
        });

        // Create user message
        await clientMutators.conversation.createMessage(tx, {
          id: messageId,
          conversationId: id,
          content,
          model,
          role: 'user',
          status: 'complete',
          userId,
        });

        const responseId = crypto.randomUUID();

        // Create placeholder for AI response
        await clientMutators.conversation.createMessage(tx, {
          id: responseId,
          conversationId: id,
          content: '',
          model,
          role: 'assistant',
          status: 'pending',
          userId,
        });

        // Trigger AI title generation (fire and forget)
        (async () => {
          try {
            await generateConversationTitle(id, content);
          } catch (error) {
            console.error('Failed to generate title:', error);
          }
        })();

        // Trigger AI streaming (fire and forget)
        (async () => {
          try {
            await streamAIResponse(responseId, content, model);
          } catch (error) {
            console.error('Failed to trigger streaming:', error);
          }
        })();

        console.log('AI streaming triggered for response:', responseId);
        console.log('AI title generation triggered for conversation:', id);
      },

      createMessage: async (
        tx: any,
        {
          id,
          conversationId,
          content,
          role,
          status,
          model,
          userId,
        }: {
          id: string;
          conversationId: string;
          content: string;
          role: string;
          status: string;
          model: any;
          userId: string;
        },
      ) => {
        console.log('Sending prompt', id, content);

        // Create user message
        await clientMutators.conversation.createMessage(tx, {
          id: id,
          conversationId: conversationId,
          content: content,
          model,
          role: 'user',
          status: 'complete',
          userId,
        });

        const responseId = crypto.randomUUID();

        // Create placeholder for AI response
        await clientMutators.conversation.createMessage(tx, {
          id: responseId,
          conversationId: conversationId,
          content: '',
          model,
          role: 'assistant',
          status: 'pending',
          userId,
        });

        // Trigger AI streaming (fire and forget)
        (async () => {
          try {
            await streamAIResponse(responseId, content, model);
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
