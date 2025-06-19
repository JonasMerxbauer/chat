import type { CustomMutatorDefs } from '@rocicorp/zero';
import type { Schema } from './schema';
import { createMutators as createClientMutators } from './mutators';
import {
  generateConversationTitle,
  streamAIResponse,
} from '~/utils/ai-operations';
import { MESSAGE_STATUSES } from '~/models';

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
          webSearchEnabled,
        }: {
          id: string;
          title: string;
          messageId: string;
          content: string;
          model: any;
          userId: string;
          webSearchEnabled?: boolean;
        },
      ) => {
        // First, create the conversation record using client mutator
        await clientMutators.conversation.createConversation(tx, {
          id,
          messageId,
          content,
          title,
          userId,
          model,
          webSearchEnabled,
        });

        // Note: The initial message is already created by the client mutator above

        const responseId = crypto.randomUUID();

        // Create placeholder for AI response
        await clientMutators.conversation.createMessage(tx, {
          id: responseId,
          conversationId: id,
          content: '',
          model,
          role: 'assistant',
          status: MESSAGE_STATUSES.PENDING,
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
            await streamAIResponse(responseId, model, webSearchEnabled, id);
          } catch (error) {
            console.error('Failed to trigger streaming:', error);
          }
        })();
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
          webSearchEnabled,
        }: {
          id: string;
          conversationId: string;
          content: string;
          role: string;
          status: string;
          model: any;
          userId: string;
          webSearchEnabled?: boolean;
        },
      ) => {
        // Create user message
        await clientMutators.conversation.createMessage(tx, {
          id: id,
          conversationId: conversationId,
          content: content,
          model,
          role: 'user',
          status: MESSAGE_STATUSES.COMPLETE,
          userId,
          webSearchEnabled,
        });

        const responseId = crypto.randomUUID();

        // Create placeholder for AI response
        await clientMutators.conversation.createMessage(tx, {
          id: responseId,
          conversationId: conversationId,
          content: '',
          model,
          role: 'assistant',
          status: MESSAGE_STATUSES.PENDING,
          userId,
        });

        // Trigger AI streaming (fire and forget)
        (async () => {
          try {
            await streamAIResponse(
              responseId,
              model,
              webSearchEnabled,
              conversationId,
            );
          } catch (error) {
            console.error('Failed to trigger streaming:', error);
          }
        })();
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>;
}

export type ServerMutators = ReturnType<typeof createMutators>;
