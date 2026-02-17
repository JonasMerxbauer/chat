import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import { DEFAULT_MODEL, MESSAGE_STATUSES } from '~/models';
import { db } from '~/db';
import { conversation, message } from '~/db/schema';

export async function generateConversationTitle(
  conversationId: string,
  content: string,
  model = DEFAULT_MODEL,
) {
  try {
    const { model: aiModel } = getProvider(model);

    const { text: title } = await generateText({
      model: aiModel,
      prompt: `Generate a concise, informative title (max 60 characters) for a conversation that starts with this message: "${content}". The title should capture the main topic or question. Only return the title, nothing else.`,
    });

    await db
      .update(conversation)
      .set({ title: title.trim(), updated_at: Date.now() })
      .where(eq(conversation.id, conversationId));

    return { success: true, title: title.trim() };
  } catch (error) {
    console.error('Generate title error:', error);
    throw error;
  }
}

export async function streamAIResponse(
  responseId: string,
  model = DEFAULT_MODEL,
  webSearchEnabled = false,
  conversationId?: string,
) {
  try {
    const isReasoningModel =
      model.provider === 'OPENAI' &&
      (model.id.startsWith('o1') ||
        model.id.startsWith('o3') ||
        model.id.startsWith('o4'));

    await db
      .update(message)
      .set({
        status: isReasoningModel
          ? MESSAGE_STATUSES.REASONING
          : MESSAGE_STATUSES.STREAMING,
      })
      .where(eq(message.id, responseId));

    setTimeout(async () => {
      try {
        await handleTextGeneration(
          responseId,
          model,
          webSearchEnabled,
          conversationId,
        );
      } catch (error) {
        console.error(`AI processing error for ${responseId}:`, error);

        await db
          .update(message)
          .set({
            content:
              'Sorry, I encountered an error while generating the response.',
            status: MESSAGE_STATUSES.ERROR,
            updated_at: Date.now(),
          })
          .where(eq(message.id, responseId));
      }
    }, 100);

    return { success: true, responseId };
  } catch (error) {
    console.error('Stream AI error:', error);
    throw error;
  }
}

async function handleTextGeneration(
  responseId: string,
  model: any,
  webSearchEnabled = false,
  conversationId?: string,
) {
  const { model: aiModel, ...otherOptions } = getProvider(
    model,
    webSearchEnabled,
  );

  const isReasoningModel =
    model.provider === 'OPENAI' &&
    (model.id.startsWith('o1') ||
      model.id.startsWith('o3') ||
      model.id.startsWith('o4'));

  const messages = [];

  if (isReasoningModel) {
    messages.push({
      role: 'system',
      content:
        'Formatting re-enabled - please enclose code blocks with appropriate markdown tags and use proper formatting for all code examples.',
    });
  }

  if (conversationId) {
    try {
      const conversationMessages = await db
        .select({
          id: message.id,
          content: message.content,
          role: message.role,
          created_at: message.created_at,
          attachments: message.attachments,
        })
        .from(message)
        .where(
          and(
            eq(message.conversation_id, conversationId),
            inArray(message.role, ['user', 'assistant']),
            ne(message.content, ''),
          ),
        )
        .orderBy(asc(message.created_at));

      console.log(
        `Loading ${conversationMessages.length} previous messages for conversation ${conversationId}`,
      );
      for (const msg of conversationMessages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          const messageContent: any = {
            role: msg.role as 'user' | 'assistant',
          };

          // Handle attachments for user messages
          if (msg.role === 'user' && msg.attachments) {
            try {
              const messageAttachments = JSON.parse(msg.attachments);
              if (messageAttachments && messageAttachments.length > 0) {
                // Process images only
                const imageAttachments = messageAttachments.filter(
                  (attachment: { url: string; name: string; type: string }) =>
                    attachment.type && attachment.type.startsWith('image/'),
                );

                // Build content array
                const contentParts = [];

                // Add text content
                contentParts.push({ type: 'text', text: msg.content });

                // Add image attachments (supported by all vision models)
                imageAttachments.forEach(
                  (attachment: { url: string; name: string; type: string }) => {
                    contentParts.push({
                      type: 'image',
                      image: attachment.url,
                    });
                  },
                );

                if (contentParts.length > 1) {
                  messageContent.content = contentParts;
                } else {
                  messageContent.content = msg.content;
                }
              } else {
                messageContent.content = msg.content;
              }
            } catch (error) {
              console.error('Error parsing attachments:', error);
              messageContent.content = msg.content;
            }
          } else {
            messageContent.content = msg.content;
          }

          messages.push(messageContent);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      // Fall back to just the current prompt if history fetch fails
    }
  }

  const streamOptions: any = {
    model: aiModel,
    messages: messages,
    ...otherOptions,
  };

  const { textStream } = streamText(streamOptions);

  let fullResponse = '';
  let updateCount = 0;
  let hasStartedStreaming = false;

  if (isReasoningModel) {
    await db
      .update(message)
      .set({ status: MESSAGE_STATUSES.REASONING, updated_at: Date.now() })
      .where(eq(message.id, responseId));
  }

  for await (const textPart of textStream) {
    if (isReasoningModel && !hasStartedStreaming) {
      hasStartedStreaming = true;
      await db
        .update(message)
        .set({ status: MESSAGE_STATUSES.STREAMING, updated_at: Date.now() })
        .where(eq(message.id, responseId));
    }

    fullResponse += textPart;
    updateCount++;

    if (
      updateCount % 5 === 0 ||
      textPart.includes(' ') ||
      textPart.includes('\n')
    ) {
      await db
        .update(message)
        .set({
          content: fullResponse,
          status: MESSAGE_STATUSES.STREAMING,
          updated_at: Date.now(),
        })
        .where(eq(message.id, responseId));
    }
  }

  await db
    .update(message)
    .set({
      content: fullResponse,
      status: MESSAGE_STATUSES.COMPLETE,
      updated_at: Date.now(),
    })
    .where(eq(message.id, responseId));
}

const getProvider = (model: any, webSearchEnabled = false) => {
  if (model.provider === 'OPENAI') {
    if (model.id === 'o3-mini') {
      return {
        model: openai(model.id),
        providerOptions: { openai: { reasoningEffort: 'low' } },
      };
    }
    if (webSearchEnabled && model.id === 'gpt-4o') {
      return {
        model: openai.responses(model.id),
        tools: {
          web_search_preview: openai.tools.webSearchPreview({
            searchContextSize: 'high',
          }),
        },
        toolChoice: { type: 'tool', toolName: 'web_search_preview' },
      };
    }
  } else if (model.provider === 'GOOGLE') {
    return { model: google(model.id) };
  } else if (model.provider === 'ANTHROPIC') {
    return { model: anthropic(model.id) };
  }

  return { model: google(DEFAULT_MODEL.id) };
};
