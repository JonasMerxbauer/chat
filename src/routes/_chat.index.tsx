import { createFileRoute } from '@tanstack/react-router'
import z from '~/db'
import { useQuery } from '@rocicorp/zero/react'

export const Route = createFileRoute('/_chat/')({
  component: Page,
  ssr: false,
})

export default function Page() {
  const [conversations] = useQuery(
    z.query.conversation
      .related('messages')
      .orderBy('created_at', 'desc')
      .limit(10),
  )

  return <div>Index</div>
}
