import { Link, useNavigate } from '@tanstack/react-router';
import { signOut } from '~/auth';
import { clearZeroData } from '~/lib/zero-auth';
import { BadgeCheck, ChevronsUpDown, Info, LogOut, X } from 'lucide-react';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '~/components/ui/sidebar';
import { cn } from '~/lib/utils';
import { Button } from './ui/button';
import { useZero } from '~/hooks/use-zero';

export function AppSidebar({
  conversations,
  selectedConversation,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  conversations: any[];
  selectedConversation: string;
  user: any;
}) {
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  const z = useZero();

  const handleSignOut = async () => {
    try {
      // Clear Zero data first
      await clearZeroData();

      // Then sign out
      await signOut();

      // Navigate to home
      navigate({ to: '/' });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    conversationId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      z.mutate.conversation.deleteConversation({ id: conversationId });

      if (selectedConversation === conversationId) {
        navigate({ to: '/' });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xl font-bold">
            ZeroChat
          </SidebarGroupLabel>
        </SidebarGroup>
        <SidebarGroup>
          <Button onClick={() => navigate({ to: '/' })}>New chat</Button>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarMenu>
            {conversations.map((conversation) => (
              <SidebarMenuItem key={conversation.id}>
                <div className="conversation-item relative flex w-full">
                  <SidebarMenuButton asChild className="flex-1 pr-8">
                    <Link
                      to="/$chatId"
                      params={{ chatId: conversation.id }}
                      className={cn(
                        'flex-1 truncate',
                        selectedConversation === conversation.id &&
                          'bg-main text-main-foreground',
                      )}
                    >
                      <span className="truncate">{conversation.title}</span>
                    </Link>
                  </SidebarMenuButton>

                  <Button
                    variant="neutral"
                    size="sm"
                    className="absolute top-1/2 right-1 z-10 h-6 w-6 -translate-y-1/2 p-0 opacity-0 transition-opacity hover:!translate-x-0 hover:!translate-y-[-50%] hover:!shadow-none [.conversation-item:hover_&]:opacity-100"
                    onClick={(e) =>
                      handleDeleteConversation(e, conversation.id)
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    className="cursor-pointer overflow-visible group-data-[state=collapsed]:hover:bg-transparent group-data-[state=collapsed]:hover:outline-0"
                    size="lg"
                  >
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="font-heading truncate">{user.name}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                  side={isMobile ? 'bottom' : 'right'}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="font-base p-0">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="font-heading truncate">
                          {user.name}
                        </span>
                        <span className="truncate text-xs">{user.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer" asChild>
                      <Link to="/account">
                        <BadgeCheck />
                        Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" asChild>
                      <Link to="/about">
                        <Info />
                        About
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button className="w-full">Sign in</Button>
              </Link>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
