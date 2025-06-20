import type { CustomMutatorDefs } from '@rocicorp/zero';
import type { Schema } from './schema';

export function createMutators() {
  return {
    conversation: {
      createConversation: async (
        tx,
        {
          id,
          messageId,
          content,
          model,
          title,
          userId,
          webSearchEnabled,
          attachments,
        }: {
          id: string;
          messageId: string;
          content: string;
          model: any;
          title: string;
          userId: string;
          webSearchEnabled?: boolean;
          attachments?: Array<{
            url: string;
            name: string;
            type: string;
            size?: number;
          }>;
        },
      ) => {
        const now = Date.now();
        await tx.mutate.conversation.insert({
          id,
          title: title,
          created_at: now,
          updated_at: now,
          user_id: userId,
          current_model_id: model.id,
          current_model_provider: model.provider,
          current_model_name: model.name,
        });

        // Create the initial message
        await tx.mutate.message.insert({
          id: messageId,
          content,
          role: 'user',
          status: 'sending',
          created_at: now,
          updated_at: now,
          conversation_id: id,
          user_id: userId,
          web_search_enabled: webSearchEnabled ? 'true' : undefined,
          attachments:
            attachments && attachments.length > 0
              ? JSON.stringify(attachments)
              : undefined,
        });
      },

      createMessage: async (
        tx,
        {
          id,
          conversationId,
          content,
          model,
          role,
          status,
          userId,
          webSearchEnabled,
          attachments,
        }: {
          id: string;
          conversationId: string;
          content: string;
          model: any;
          role: string;
          status: string;
          userId: string;
          webSearchEnabled?: boolean;
          attachments?: Array<{
            url: string;
            name: string;
            type: string;
            size?: number;
          }>;
        },
      ) => {
        const now = Date.now();

        await tx.mutate.message.insert({
          id,
          content,
          role,
          status,
          created_at: now,
          updated_at: now,
          conversation_id: conversationId,
          user_id: userId,
          web_search_enabled: webSearchEnabled ? 'true' : undefined,
          attachments:
            attachments && attachments.length > 0
              ? JSON.stringify(attachments)
              : undefined,
        });
      },

      deleteMessage: async (tx, { id }: { id: string }) => {
        await tx.mutate.message.delete({ id });
      },

      deleteConversation: async (tx, { id }: { id: string }) => {
        const messages = await tx.query.message.where(
          'conversation_id',
          '=',
          id,
        );

        for (const message of messages) {
          await tx.mutate.message.delete({ id: message.id });
        }

        await tx.mutate.conversation.delete({ id });
      },

      updateMessage: async (
        tx,
        {
          id,
          content,
          status,
        }: {
          id: string;
          content: string;
          status: string;
        },
      ) => {
        const now = Date.now();
        await tx.mutate.message.update({
          id,
          content,
          status,
          updated_at: now,
        });
      },

      updateConversationModel: async (
        tx,
        {
          id,
          model,
        }: {
          id: string;
          model: {
            id: string;
            provider: string;
            name: string;
          };
        },
      ) => {
        const now = Date.now();
        await tx.mutate.conversation.update({
          id,
          current_model_id: model.id,
          current_model_provider: model.provider,
          current_model_name: model.name,
          updated_at: now,
        });
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>;
}

export type Mutators = ReturnType<typeof createMutators>;
