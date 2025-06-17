import { createUseZero } from '@rocicorp/zero/react';
import { useEffect, useRef } from 'react';
import type { Schema } from '~/db/schema';
import type { Mutators } from '~/db/mutators';

export const useZero = createUseZero<Schema, Mutators>();

// Keep track of preloaded conversations to avoid unnecessary work
const preloadedConversations = new Set<string>();

// Hook to keep recent conversations in background for instant loading
export function useBackgroundChatPreload(recentChatIds: string[] = []) {
  const z = useZero();
  const lastPreloadedRef = useRef<string>('');

  useEffect(() => {
    if (recentChatIds.length === 0) return;

    const currentIds = recentChatIds.join(',');

    // Only preload if the list has changed
    if (lastPreloadedRef.current === currentIds) return;
    lastPreloadedRef.current = currentIds;

    // Mark these as preloaded
    recentChatIds.forEach((id) => preloadedConversations.add(id));

    // Keep recent chats loaded in background for instant transitions
    const query = z.query.conversation
      .related('messages')
      .where(({ cmp, or }) =>
        or(...recentChatIds.map((id) => cmp('id', '=', id))),
      );

    // Use preload to avoid materializing into JS objects unnecessarily
    query.preload();

    // Also keep individual queries warm for faster individual loads
    recentChatIds.forEach((chatId) => {
      z.query.conversation
        .related('messages')
        .where('id', '=', chatId)
        .preload();
    });

    if (import.meta.env.DEV) {
      console.log(
        `[Zero] Preloaded ${recentChatIds.length} conversations:`,
        recentChatIds,
      );
    }
  }, [z, recentChatIds.join(',')]);
}

// Hook for preloading a specific chat immediately when we know we'll need it
export function usePreloadSpecificChat(chatId: string | null) {
  const z = useZero();

  useEffect(() => {
    if (!chatId || preloadedConversations.has(chatId)) return;

    preloadedConversations.add(chatId);

    // Preload this specific conversation immediately
    z.query.conversation.related('messages').where('id', '=', chatId).preload();

    if (import.meta.env.DEV) {
      console.log(`[Zero] Preloaded specific chat:`, chatId);
    }
  }, [z, chatId]);
}
