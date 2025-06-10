import { createAPIFileRoute } from '@tanstack/react-start/api'
import { createMutators } from '@/db/server-mutators'
import { schema } from '@/db/schema'
import {
  PushProcessor,
  ZQLDatabase,
  PostgresJSConnection,
} from '@rocicorp/zero/pg'
import postgres from 'postgres'

const processor = new PushProcessor(
  new ZQLDatabase(
    new PostgresJSConnection(postgres(process.env.ZERO_UPSTREAM_DB! as string)),
    schema,
  ),
)

export const APIRoute = createAPIFileRoute('/api/push')({
  POST: async ({ request }) => {
    try {
      console.log('Processing request')

      // Create an array to collect async tasks
      const asyncTasks: Array<() => Promise<void>> = []

      const result = await processor.process(
        createMutators(asyncTasks),
        request,
      )

      // Execute all async tasks after the main transaction completes
      if (asyncTasks.length > 0) {
        console.log(`Executing ${asyncTasks.length} async tasks`)
        // Execute all tasks in parallel (or you could do them sequentially)
        await Promise.all(asyncTasks.map((task) => task().catch(console.error)))
      }

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Push endpoint error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
  },
})
