import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar'

import { AppSidebar } from '~/components/app-sidebar'
import { createFileRoute } from '@tanstack/react-router'
import z from '~/db'
import { useQuery } from '@rocicorp/zero/react'

export const Route = createFileRoute('/')({
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
  console.log(conversations)

  return (
    <SidebarProvider>
      <AppSidebar conversations={conversations} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-base bg-background/50 border-2 border-border" />
            <div className="aspect-video rounded-base bg-background/50 border-2 border-border" />
            <div className="aspect-video rounded-base bg-background/50 border-2 border-border" />
          </div>
          <div className="min-h-[100vh] flex-1 rounded-base bg-background/50 border-2 border-border md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
