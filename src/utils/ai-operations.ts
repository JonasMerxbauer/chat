import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { Pool } from 'pg';
import { DEFAULT_MODEL } from '~/constants';

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

    // Generate title using AI
    const { text: title } = await generateText({
      model: google(model.id),
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
    console.log(`Starting AI streaming for response ${responseId}`);

    // Update status to streaming
    const client = await streamingPool.connect();
    await client.query('UPDATE message SET status = $1 WHERE id = $2', [
      'streaming',
      responseId,
    ]);
    client.release();

    // Start streaming in the background
    setTimeout(async () => {
      const streamClient = await streamingPool.connect();

      try {
        const aiModel =
          model.provider === 'OPENAI'
            ? openai(model.id)
            : model.provider === 'GOOGLE'
              ? google(model.id)
              : model.provider === 'ANTHROPIC'
                ? anthropic(model.id)
                : null;

        if (!aiModel) {
          throw new Error('Invalid model');
        }

        const { textStream } = streamText({
          model: aiModel,
          prompt: content,
        });

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
            await streamClient.query(
              'UPDATE message SET content = $1, status = $2, updated_at = $3 WHERE id = $4',
              [fullResponse, 'streaming', Date.now(), responseId],
            );
            console.log(
              `Updated response ${responseId} - length: ${fullResponse.length}`,
            );
          }
        }

        // Final update - mark as complete
        await streamClient.query(
          'UPDATE message SET content = $1, status = $2, updated_at = $3 WHERE id = $4',
          [fullResponse, 'complete', Date.now(), responseId],
        );

        console.log(`Completed AI streaming for response ${responseId}`);
      } catch (error) {
        console.error(`AI streaming error for ${responseId}:`, error);

        // Update message with error status
        await streamClient.query(
          'UPDATE message SET content = $1, status = $2, updated_at = $3 WHERE id = $4',
          [
            'Sorry, I encountered an error while generating the response.',
            'error',
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
