import { type LucideIcon } from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  isExternal?: boolean;
}

export interface SidebarBrand {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface NavigationConfig {
  brand: SidebarBrand;
  primaryNavigation: NavigationItem[];
  secondaryNavigation: NavigationItem[];
}
