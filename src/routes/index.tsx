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

  const [messages, messagesDetails] = useQuery(messageQuery)

  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
        <img
          src={logo}
          className="h-[40vmin] pointer-events-none animate-[spin_20s_linear_infinite]"
          alt="logo"
        />
        <p>
          Edit <code>src/routes/index.tsx</code> and save to reload.
        </p>
        <p>{new Date().toISOString()}</p>
        {messages.map((message) => (
          <p key={message.id}>{message.body}</p>
        ))}
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
      </header>
    </div>
  )
}
