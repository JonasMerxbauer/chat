import { createAPIFileRoute } from '@tanstack/react-start/api';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { Pool } from 'pg';

// Create a shared database pool for streaming updates
const streamingPool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const APIRoute = createAPIFileRoute('/api/stream-ai')({
  POST: async ({ request }) => {
    try {
      const { responseId, prompt, model = 'gpt-4o' } = await request.json();

      if (!responseId || !prompt) {
        return new Response(
          JSON.stringify({ error: 'Missing responseId or prompt' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

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
            model === 'gpt-4o'
              ? openai('gpt-4o')
              : google('gemini-2.0-flash-lite');

          const { textStream } = streamText({
            model: aiModel,
            prompt,
          });

          let fullResponse = '';
          let updateCount = 0;

          for await (const textPart of textStream) {
            fullResponse += textPart;
            updateCount++;

            // Batch updates to reduce database load (update every 5 chunks or on word boundaries)
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
      }, 100); // Small delay to ensure the transaction has committed

      return new Response(JSON.stringify({ success: true, responseId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Stream AI endpoint error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
});
