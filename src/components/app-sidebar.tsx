import { Link, useNavigate } from '@tanstack/react-router';
import { signOut } from '~/auth';
import { clearZeroData } from '~/lib/zero-auth';
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from 'lucide-react';

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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <Button onClick={() => navigate({ to: '/' })}>New chat</Button>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarMenu>
            {conversations.map((conversation) => (
              <SidebarMenuItem key={conversation.id}>
                <SidebarMenuButton asChild>
                  <Link
                    to="/$chatId"
                    params={{ chatId: conversation.id }}
                    className={cn(
                      selectedConversation === conversation.id &&
                        'bg-main text-main-foreground',
                    )}
                  >
                    <span>{conversation.title}</span>
                  </Link>
                </SidebarMenuButton>
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
                    className="overflow-visible group-data-[state=collapsed]:hover:bg-transparent group-data-[state=collapsed]:hover:outline-0"
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
                    <DropdownMenuItem>
                      <Sparkles />
                      Upgrade to Pro
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <BadgeCheck />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard />
                      Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
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
