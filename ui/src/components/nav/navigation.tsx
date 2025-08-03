import { cn } from '@/lib/utils';
import type { NavigationItem } from '@/types/navigation.types';

import { Link, useLocation } from 'react-router';


interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
}

const NavItem = ({ item, isActive }: NavItemProps) => {
  const IconComponent = item.icon;
  
  return (
    <Link
      to={item.href}
      className={cn(
        'flex flex-col flex-1 items-center justify-center h-full px-2 py-3 aspect-square rounded-lg transition-colors',
        isActive
          ? 'bg-background text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground',
      )}
      aria-current={isActive ? 'page' : undefined}
      title={item.label}
    >
      <IconComponent className="w-6 h-6" />
      <span className="text-xs mt-1 truncate max-w-16 sr-only">{item.label}</span>
    </Link>
  );
};

interface MobileNavigationProps {
  navigationItems: NavigationItem[];
  className?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  navigationItems, 
  className 
}) => {
  const { pathname } = useLocation();

  const isActive = (path: string) =>
    pathname === path || (path !== '/' && pathname.startsWith(path));

  return (
    <nav
      className={cn(
        'sticky bottom-0 h-16 flex flex-col left-0 right-0 w-full bg-background shadow',
        'lg:hidden',
        className
      )}
    >
      <div className="h-full mx-auto w-full flex justify-between items-center px-4 py-2 gap-2">
        {navigationItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={isActive(item.href)}
          />
        ))}
      </div>
      <div className="h-px bg-border opacity-50" />
    </nav>
  );
};

export default MobileNavigation;
