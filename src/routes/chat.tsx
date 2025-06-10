import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useZero } from '@rocicorp/zero/react'
import type { Schema } from '~/db/schema'

export const Route = createFileRoute('/chat')({
  component: Chat,
  ssr: false,
})

function Chat() {
  const z = useZero<Schema>()
  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Query all conversations
  const [conversations] = useQuery(
    z.query.conversation
      .related('messages')
      .orderBy('created_at', 'desc')
      .limit(10),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const conversationId = crypto.randomUUID()

      // Create conversation using Zero mutator
      await (z as any).mutate.conversation.create({
        id: conversationId,
        prompt: prompt.trim(),
      })

      setPrompt('')
    } catch (error) {
      console.error('Error creating conversation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  console.log('Conversations', conversations)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Streaming LLM Chat with Zero
          </h1>
        </div>

        {/* Chat Input */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter your prompt:
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={!prompt.trim() || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Ask AI'}
            </button>
          </form>
        </div>

        {/* Conversations */}
        <div className="space-y-6">
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
            />
          ))}
        </div>

        {conversations.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p>No conversations yet. Start by asking a question above!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ConversationCard({ conversation }: { conversation: any }) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending...', color: 'text-yellow-600' }
      case 'streaming':
        return {
          text: 'AI Thinking...',
          color: 'text-blue-600',
        }
      case 'complete':
        return { text: 'Complete', color: 'text-green-600' }
      case 'error':
        return { text: 'Error', color: 'text-red-600' }
      default:
        return { text: status, color: 'text-gray-600' }
    }
  }

  const statusDisplay = getStatusDisplay(conversation.status)

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              AI Conversation
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(conversation.created_at).toLocaleString()}
            </p>
          </div>
          <span className={`text-sm font-medium ${statusDisplay.color}`}>
            {statusDisplay.text}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        {/* User Prompt */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-900 mb-2">
            You asked:
          </div>
          <div className="text-blue-800">{conversation.prompt}</div>
        </div>

        {/* AI Response */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-900 mb-2">
            AI Response:
          </div>
          <div className="text-gray-800 whitespace-pre-wrap">
            {conversation.response ||
              (conversation.status === 'pending'
                ? 'Waiting for response...'
                : conversation.status === 'streaming'
                  ? 'AI is thinking...'
                  : conversation.status === 'error'
                    ? 'Error generating response.'
                    : 'No response yet.')}
            {conversation.status === 'streaming' && conversation.response && (
              <span className="inline-block w-2 h-5 bg-gray-800 ml-1 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
