import { defineMutator, defineMutators } from '@rocicorp/zero';
import type {
  ConversationCreateArgs,
  MessageCreateArgs,
} from '~/zero/mutators';
import {
  mutators as baseMutators,
} from '~/zero/mutators';
import {
  generateConversationTitle,
  streamAIResponse,
} from '~/utils/ai-operations';

export const serverMutators = defineMutators(baseMutators, {
  conversation: {
    createConversation: defineMutator(async ({ tx, args, ctx }) => {
      await baseMutators.conversation.createConversation.fn({
        tx,
        ctx,
        args: args as ConversationCreateArgs,
      });

      const { id, responseId, content, model, webSearchEnabled } =
        args as ConversationCreateArgs;

      if (tx.location !== 'server') {
        return;
      }

      setTimeout(async () => {
        try {
          await generateConversationTitle(id, content, model);
        } catch (error) {
          console.error('Failed to generate title:', error);
        }
      }, 100);

      try {
        await streamAIResponse(responseId, model, webSearchEnabled, id);
      } catch (error) {
        console.error('Failed to trigger streaming:', error);
      }
    }),

    createMessage: defineMutator(async ({ tx, args, ctx }) => {
      await baseMutators.conversation.createMessage.fn({
        tx,
        ctx,
        args: args as MessageCreateArgs,
      });

      const { responseId, conversationId, model, webSearchEnabled } =
        args as MessageCreateArgs;

      if (tx.location !== 'server') {
        return;
      }

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
    }),
  },
});
