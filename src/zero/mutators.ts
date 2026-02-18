import { defineMutator, defineMutators } from '@rocicorp/zero';
import { MESSAGE_STATUSES } from '~/models';

type Attachment = {
  url: string;
  name: string;
  type: string;
  size?: number;
};

export type ConversationCreateArgs = {
  id: string;
  title: string;
  messageId: string;
  responseId: string;
  content: string;
  model: any;
  userId?: string;
  webSearchEnabled?: boolean;
  attachments?: Attachment[];
};

export type MessageCreateArgs = {
  id: string;
  conversationId: string;
  responseId: string;
  content: string;
  role: string;
  status: string;
  model: any;
  userId?: string;
  webSearchEnabled?: boolean;
  attachments?: Attachment[];
};

type MessageUpdateArgs = {
  id: string;
  content: string;
  status: string;
};

type ConversationModelUpdateArgs = {
  id: string;
  model: {
    id: string;
    provider: string;
    name: string;
  };
};

export const mutators = defineMutators({
  conversation: {
    createConversation: defineMutator<ConversationCreateArgs>(
      async ({ tx, args, ctx }) => {
        const {
          id,
          title,
          messageId,
          responseId,
          content,
          model,
          userId,
          webSearchEnabled,
          attachments,
        } = args;
        const now = Date.now();
        const responseCreatedAt = now + 1;
        const effectiveUserId = ctx?.userId ?? userId;
        if (!effectiveUserId) {
          throw new Error('userId is required to create a conversation.');
        }

        await tx.mutate.conversation.insert({
          id,
          title,
          created_at: now,
          updated_at: now,
          user_id: effectiveUserId,
          current_model_id: model.id,
          current_model_provider: model.provider,
          current_model_name: model.name,
        });

        await tx.mutate.message.insert({
          id: messageId,
          content,
          role: 'user',
          status: MESSAGE_STATUSES.COMPLETE,
          created_at: now,
          updated_at: now,
          conversation_id: id,
          user_id: effectiveUserId,
          web_search_enabled: webSearchEnabled ? 'true' : 'false',
          attachments:
            attachments && attachments.length > 0
              ? JSON.stringify(attachments)
              : '[]',
        });

        await tx.mutate.message.insert({
          id: responseId,
          content: '',
          role: 'assistant',
          status: MESSAGE_STATUSES.PENDING,
          created_at: responseCreatedAt,
          updated_at: responseCreatedAt,
          conversation_id: id,
          user_id: effectiveUserId,
        });

        return;
      },
    ),

    createMessage: defineMutator<MessageCreateArgs>(
      async ({ tx, args, ctx }) => {
        const {
          id,
          conversationId,
          responseId,
          content,
          userId,
          webSearchEnabled,
          attachments,
        } = args;
        const now = Date.now();
        const responseCreatedAt = now + 1;
        const effectiveUserId = ctx?.userId ?? userId;
        if (!effectiveUserId) {
          throw new Error('userId is required to create a message.');
        }

        await tx.mutate.message.insert({
          id,
          content,
          role: 'user',
          status: MESSAGE_STATUSES.COMPLETE,
          created_at: now,
          updated_at: now,
          conversation_id: conversationId,
          user_id: effectiveUserId,
          web_search_enabled: webSearchEnabled ? 'true' : 'false',
          attachments:
            attachments && attachments.length > 0
              ? JSON.stringify(attachments)
              : '[]',
        });

        await tx.mutate.message.insert({
          id: responseId,
          content: '',
          role: 'assistant',
          status: MESSAGE_STATUSES.PENDING,
          created_at: responseCreatedAt,
          updated_at: responseCreatedAt,
          conversation_id: conversationId,
          user_id: effectiveUserId,
        });

        return;
      },
    ),

    deleteMessage: defineMutator<{ id: string }>(async ({ tx, args }) => {
      await tx.mutate.message.delete({ id: args.id });
    }),

    deleteConversation: defineMutator<{ id: string }>(async ({ tx, args }) => {
      const query = (tx as { query?: any }).query;
      if (!query) {
        throw new Error(
          'Query interface is unavailable for deleteConversation.',
        );
      }
      const messages = await query.message.where(
        'conversation_id',
        '=',
        args.id,
      );

      for (const message of messages) {
        await tx.mutate.message.delete({ id: message.id });
      }

      await tx.mutate.conversation.delete({ id: args.id });
    }),

    updateMessage: defineMutator<MessageUpdateArgs>(async ({ tx, args }) => {
      await tx.mutate.message.update({
        id: args.id,
        content: args.content,
        status: args.status,
        updated_at: Date.now(),
      });
    }),

    updateConversationModel: defineMutator<ConversationModelUpdateArgs>(
      async ({ tx, args }) => {
        await tx.mutate.conversation.update({
          id: args.id,
          current_model_id: args.model.id,
          current_model_provider: args.model.provider,
          current_model_name: args.model.name,
          updated_at: Date.now(),
        });
      },
    ),
  },
});

export type ServerMutators = typeof mutators;
