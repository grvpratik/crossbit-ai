import React from 'react';
import { cn } from '@/lib/utils';
import SideNavigation from './sidebar';
import MobileNavigation from './navigation';
import type { NavigationConfig } from '@/types/navigation.types';


interface SidebarWrapperProps {
  config: NavigationConfig;
  children: React.ReactNode;
  className?: string;
}

const SidebarWrapper: React.FC<SidebarWrapperProps> = ({
  config,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full  flex flex-col lg:flex-row h-screen lg:bg-black ',
        className,
      )}
    >
      {/* Desktop Sidebar - Hidden on mobile */}
      <SideNavigation
        brand={config.brand}
        primaryNavigation={config.primaryNavigation}
        secondaryNavigation={config.secondaryNavigation}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col   lg:ml-0 bg-background text-foreground  lg:overflow-hidden lg:overflow-y-auto ">{children}</div>

      {/* Mobile Navigation - Hidden on desktop */}
      <MobileNavigation navigationItems={config.primaryNavigation} />
    </div>
  );
};

export default SidebarWrapper;
