import { createAPIFileRoute } from '@tanstack/react-start/api';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { Pool } from 'pg';

// Create a shared database pool for title updates
const titlePool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const APIRoute = createAPIFileRoute('/api/generate-title')({
  POST: async ({ request }) => {
    try {
      const { conversationId, prompt } = await request.json();

      if (!conversationId || !prompt) {
        return new Response(
          JSON.stringify({ error: 'Missing conversationId or prompt' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      console.log(`Generating title for conversation ${conversationId}`);

      // Generate title using AI
      const { text: title } = await generateText({
        model: openai('gpt-4o'),
        prompt: `Generate a concise, informative title (max 60 characters) for a conversation that starts with this message: "${prompt}". The title should capture the main topic or question. Only return the title, nothing else.`,
        maxTokens: 20,
      });

      // Update the conversation title in the database
      const client = await titlePool.connect();
      try {
        // Use PostgreSQL's to_timestamp function to handle the timestamp conversion
        await client.query(
          'UPDATE conversation SET title = $1, updated_at = to_timestamp($2) WHERE id = $3',
          [title.trim(), Date.now() / 1000, conversationId],
        );
        console.log(
          `Updated title for conversation ${conversationId}: ${title}`,
        );
      } finally {
        client.release();
      }

      return new Response(
        JSON.stringify({ success: true, title: title.trim() }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } catch (error) {
      console.error('Generate title endpoint error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
});
