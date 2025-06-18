import { generateText, streamText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { Pool } from 'pg';
import { DEFAULT_MODEL, MESSAGE_STATUSES } from '~/constants';

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
    console.log(`Generating title for conversation ${conversationId}`);

    // Use the appropriate AI model for title generation
    let aiModel;
    if (model.provider === 'OPENAI') {
      aiModel = openai(model.id);
    } else if (model.provider === 'GOOGLE') {
      aiModel = google(model.id);
    } else if (model.provider === 'ANTHROPIC') {
      aiModel = anthropic(model.id);
    } else {
      aiModel = google(DEFAULT_MODEL.id); // fallback
    }

    // Generate title using AI
    const { text: title } = await generateText({
      model: aiModel,
      prompt: `Generate a concise, informative title (max 60 characters) for a conversation that starts with this message: "${content}". The title should capture the main topic or question. Only return the title, nothing else.`,
      maxTokens: 20,
    });

    // Update the conversation title in the database
    const client = await titlePool.connect();
    try {
      await client.query(
        'UPDATE conversation SET title = $1, updated_at = to_timestamp($2) WHERE id = $3',
        [title.trim(), Date.now() / 1000, conversationId],
      );
      console.log(`Updated title for conversation ${conversationId}: ${title}`);
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
    console.log(
      `Starting AI streaming for response ${responseId} with model ${model.name}`,
    );

    // Update status to streaming
    const client = await streamingPool.connect();
    await client.query('UPDATE message SET status = $1 WHERE id = $2', [
      MESSAGE_STATUSES.STREAMING,
      responseId,
    ]);
    client.release();

    // Start processing in the background
    setTimeout(async () => {
      const streamClient = await streamingPool.connect();

      try {
        await handleTextGeneration(streamClient, responseId, content, model);
        console.log(`Completed AI processing for response ${responseId}`);
      } catch (error) {
        console.error(`AI processing error for ${responseId}:`, error);

        // Update message with error status
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
  // Get the appropriate AI model
  let aiModel;
  if (model.provider === 'OPENAI') {
    aiModel = openai(model.id);
  } else if (model.provider === 'GOOGLE') {
    aiModel = google(model.id);
  } else if (model.provider === 'ANTHROPIC') {
    aiModel = anthropic(model.id);
  } else {
    throw new Error(`Unsupported model provider: ${model.provider}`);
  }

  // Configure the stream options
  const streamOptions: any = {
    model: aiModel,
    prompt: prompt,
  };

  const { textStream } = streamText(streamOptions);

  let fullResponse = '';
  let updateCount = 0;

  for await (const textPart of textStream) {
    fullResponse += textPart;
    updateCount++;

    // Batch updates to reduce database load
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

  // Final update - mark as complete
  await client.query(
    'UPDATE message SET content = $1, status = $2, updated_at = $3 WHERE id = $4',
    [fullResponse, MESSAGE_STATUSES.COMPLETE, Date.now(), responseId],
  );
}
