import { relations } from 'drizzle-orm';
import { bigint, pgTable, text } from 'drizzle-orm/pg-core';

export * from '~/auth/schema';

export const conversation = pgTable('conversation', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  created_at: bigint('created_at', { mode: 'number' }).notNull(),
  updated_at: bigint('updated_at', { mode: 'number' }).notNull(),
  user_id: text('user_id').notNull(),
  current_model_id: text('current_model_id').notNull(),
  current_model_provider: text('current_model_provider').notNull(),
  current_model_name: text('current_model_name').notNull(),
});

export const message = pgTable('message', {
  id: text('id').primaryKey(),
  conversation_id: text('conversation_id')
    .notNull()
    .references(() => conversation.id),
  content: text('content').notNull(),
  role: text('role').notNull(),
  status: text('status').notNull(),
  created_at: bigint('created_at', { mode: 'number' }).notNull(),
  updated_at: bigint('updated_at', { mode: 'number' }).notNull(),
  user_id: text('user_id').notNull(),
  web_search_enabled: text('web_search_enabled'),
  attachments: text('attachments'),
});

export const conversationRelations = relations(conversation, ({ many }) => ({
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversation_id],
    references: [conversation.id],
  }),
}));
