import type { NavigationConfig } from '@/types/navigation.types';
import { Globe, History, Settings2, Sparkle, Blend } from 'lucide-react';




export const defaultNavigationConfig: NavigationConfig = {
  brand: {
    name: 'Upmint',
    href: '/',
    icon: Blend,
  },
  primaryNavigation: [
    {
      id: 'chat',
      label: 'Chat',
      href: '/',
      icon: Sparkle,
      description: 'Start a new conversation',
    },
    {
      id: 'discover',
      label: 'Discover',
      href: '/discover',
      icon: Globe,
      description: 'Explore trending topics',
    },
  ],
  secondaryNavigation: [
    {
      id: 'history',
      label: 'History',
      href: '/history',
      icon: History,
      description: 'View your chat history',
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: Settings2,
      description: 'Manage your preferences',
    },
  ],
};