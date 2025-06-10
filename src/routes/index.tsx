import { createFileRoute } from '@tanstack/react-router'
import logo from '../logo.svg'
import { useQuery, useZero } from '@rocicorp/zero/react'
import type { Schema } from '@/db/schema'

export const Route = createFileRoute('/')({
  component: App,
  ssr: false,
})

function App() {
  const z = useZero<Schema>()
  let messageQuery = z.query.message.limit(100)
  let conversationQuery = z.query.conversation
    .limit(5)
    .orderBy('created_at', 'desc')

  const [messages, messagesDetails] = useQuery(messageQuery)
  const [conversations, conversationsDetails] = useQuery(conversationQuery)

  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <img
          src={logo}
          className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
          alt="logo"
        />

        <h1 className="text-4xl font-bold mb-4">Zero + Streaming LLM Demo</h1>

        <p className="mb-8 max-w-2xl">
          This demo showcases streaming LLM responses using Zero's custom
          mutators with OpenAI. Try the chat interface to see real-time AI
          responses streaming from the server!
        </p>

        <div className="flex gap-4 mb-8">
          <a
            href="/chat"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Try LLM Chat →
          </a>
          <a
            href="https://zero.rocicorp.dev/docs/custom-mutators"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Learn About Custom Mutators
          </a>
        </div>

        {/* Recent Conversations Preview */}
        {conversations.length > 0 && (
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 max-w-2xl mx-4 mb-8">
            <h3 className="text-xl font-semibold mb-4">
              Recent LLM Conversations
            </h3>
            <div className="space-y-3 text-left">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="bg-white/10 rounded p-3">
                  <div className="text-sm opacity-80 mb-1">
                    {new Date(conversation.created_at).toLocaleString()}
                  </div>
                  <div className="font-medium text-blue-200 mb-2">
                    "{conversation.prompt}"
                  </div>
                  <div className="text-sm">
                    Status:{' '}
                    <span
                      className={
                        conversation.status === 'complete'
                          ? 'text-green-300'
                          : conversation.status === 'streaming'
                            ? 'text-blue-300'
                            : conversation.status === 'error'
                              ? 'text-red-300'
                              : 'text-yellow-300'
                      }
                    >
                      {conversation.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 max-w-2xl mx-4 mb-8">
            <h3 className="text-xl font-semibold mb-4">Messages</h3>
            <div className="space-y-2 text-left">
              {messages.map((message) => (
                <p key={message.id} className="bg-white/10 rounded p-2">
                  {message.body}
                </p>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm opacity-80 mb-4">
          Edit <code>src/routes/index.tsx</code> and save to reload.
        </p>

        <p className="text-sm opacity-60">{new Date().toISOString()}</p>

        <div className="flex gap-6 mt-8">
          <a
            className="text-[#61dafb] hover:underline"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <a
            className="text-[#61dafb] hover:underline"
            href="https://tanstack.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn TanStack
          </a>
          <a
            className="text-[#61dafb] hover:underline"
            href="https://zero.rocicorp.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn Zero
          </a>
        </div>
      </header>
    </div>
  )
}
