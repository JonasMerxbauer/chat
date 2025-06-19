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
  content: string,
  model = DEFAULT_MODEL,
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
        await handleTextGeneration(streamClient, responseId, content, model);
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
  prompt: string,
  model: any,
) {
  const { model: aiModel, providerOptions } = getProvider(model);

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

  messages.push({
    role: 'user',
    content: prompt,
  });

  const streamOptions: any = {
    model: aiModel,
    messages: messages,
    providerOptions,
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

const getProvider = (model: any) => {
  if (model.provider === 'OPENAI') {
    if (model.id === 'o3-mini') {
      return {
        model: openai(model.id),
        providerOptions: { openai: { reasoningEffort: 'low' } },
      };
    } else {
      return { model: openai(model.id), providerOptions: {} };
    }
  } else if (model.provider === 'GOOGLE') {
    return { model: google(model.id), providerOptions: {} };
  } else if (model.provider === 'ANTHROPIC') {
    return { model: anthropic(model.id), providerOptions: {} };
  }

  return { model: google(DEFAULT_MODEL.id), providerOptions: {} };
};
