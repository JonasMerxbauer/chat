import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { Pool } from 'pg';
import { DEFAULT_MODEL, MESSAGE_STATUSES } from '~/models';

// Create shared database pools
const titlePool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const streamingPool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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
      maxTokens: 20,
    });

    const client = await titlePool.connect();
    try {
      await client.query(
        'UPDATE conversation SET title = $1, updated_at = to_timestamp($2) WHERE id = $3',
        [title.trim(), Date.now() / 1000, conversationId],
      );
    } finally {
      client.release();
    }

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

    const client = await streamingPool.connect();
    await client.query('UPDATE message SET status = $1 WHERE id = $2', [
      isReasoningModel
        ? MESSAGE_STATUSES.REASONING
        : MESSAGE_STATUSES.STREAMING,
      responseId,
    ]);
    client.release();

    setTimeout(async () => {
      const streamClient = await streamingPool.connect();

      try {
        await handleTextGeneration(
          streamClient,
          responseId,
          model,
          webSearchEnabled,
          conversationId,
        );
      } catch (error) {
        console.error(`AI processing error for ${responseId}:`, error);

        await streamClient.query(
          'UPDATE message SET content = $1, status = $2, updated_at = $3 WHERE id = $4',
          [
            'Sorry, I encountered an error while generating the response.',
            MESSAGE_STATUSES.ERROR,
            Date.now(),
            responseId,
          ],
        );
      } finally {
        streamClient.release();
      }
    }, 100);

    return { success: true, responseId };
  } catch (error) {
    console.error('Stream AI error:', error);
    throw error;
  }
}

async function handleTextGeneration(
  client: any,
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
      const conversationMessages = await client.query(
        'SELECT id, content, role, created_at, attachments FROM message WHERE conversation_id = $1 AND role IN ($2, $3) AND content IS NOT NULL AND content != $4 ORDER BY created_at ASC',
        [conversationId, 'user', 'assistant', ''],
      );

      console.log(
        `Loading ${conversationMessages.rows.length} previous messages for conversation ${conversationId}`,
      );
      for (const msg of conversationMessages.rows) {
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
    await client.query(
      'UPDATE message SET status = $1, updated_at = $2 WHERE id = $3',
      [MESSAGE_STATUSES.REASONING, Date.now(), responseId],
    );
  }

  for await (const textPart of textStream) {
    if (isReasoningModel && !hasStartedStreaming) {
      hasStartedStreaming = true;
      await client.query(
        'UPDATE message SET status = $1, updated_at = $2 WHERE id = $3',
        [MESSAGE_STATUSES.STREAMING, Date.now(), responseId],
      );
    }

    fullResponse += textPart;
    updateCount++;

    if (
      updateCount % 5 === 0 ||
      textPart.includes(' ') ||
      textPart.includes('\n')
    ) {
      await client.query(
        'UPDATE message SET content = $1, status = $2, updated_at = $3 WHERE id = $4',
        [fullResponse, MESSAGE_STATUSES.STREAMING, Date.now(), responseId],
      );
    }
  }

  await client.query(
    'UPDATE message SET content = $1, status = $2, updated_at = $3 WHERE id = $4',
    [fullResponse, MESSAGE_STATUSES.COMPLETE, Date.now(), responseId],
  );
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
    } else {
      return { model: openai(model.id) };
    }
  } else if (model.provider === 'GOOGLE') {
    return { model: google(model.id) };
  } else if (model.provider === 'ANTHROPIC') {
    return { model: anthropic(model.id) };
  }

  return { model: google(DEFAULT_MODEL.id) };
};
