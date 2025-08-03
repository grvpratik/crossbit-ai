import React from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

// Types
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

export interface SidebarProps {
  brand: SidebarBrand;
  primaryNavigation: NavigationItem[];
  secondaryNavigation: NavigationItem[];
  className?: string;
  'aria-label'?: string;
}

// Constants
const COMPACT_SIDEBAR_STYLES = {
  container:
    'w-16 h-screen  flex-col items-center py-2  shadow-lg hidden lg:flex overflow-hidden sticky top-0 bg-sidebar text-sidebar-foreground shrink-0 bottom-0',
  brandContainer: 'mb-8',
  brandIcon: 'w-10 h-10 bg-white rounded-lg flex items-center justify-center',
  navigation: 'flex flex-col space-y-3 flex-1',
  navButton: {
    base: 'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative',
    active: 'bg-sidebar-accent text-sidebar-foreground shadow-sm',
    inactive:
      'bg-sidebar-accent/20 hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground',
  },
  icon: 'size-5 transition-colors duration-200',
  bottomContainer: 'mt-auto space-y-3',
} as const;


const IconNavigationItem: React.FC<{
  item: NavigationItem;
  isActive: boolean;
}> = ({ item, isActive }) => {
  const IconComponent = item.icon;

  const linkProps = {
    to: item.href,
    ...(item.isExternal && {
      target: '_blank',
      rel: 'noopener noreferrer',
    }),
  };

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        COMPACT_SIDEBAR_STYLES.navButton.base,
        isActive
          ? COMPACT_SIDEBAR_STYLES.navButton.active
          : COMPACT_SIDEBAR_STYLES.navButton.inactive,
      )}
      aria-current={isActive ? 'page' : undefined}
      title={item.label} 
    >
      <Link {...linkProps}>
        <IconComponent className={COMPACT_SIDEBAR_STYLES.icon} />
        <span className="sr-only">{item.label}</span>
      </Link>
    </Button>
  );
};

const CompactSidebarBrand: React.FC<{ brand: SidebarBrand }> = ({ brand }) => {
  const BrandIcon = brand.icon;

  return (
    <div className={COMPACT_SIDEBAR_STYLES.brandContainer}>
      <Link
        to={brand.href}
        className={COMPACT_SIDEBAR_STYLES.brandIcon}
        title={brand.name}
      >
        {BrandIcon ? (
          <BrandIcon className="h-6 w-6" />
        ) : (
          <svg
            version="1.0"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            className="h-6 w-6"
            viewBox="0 0 284 284"
            preserveAspectRatio="xMidYMid meet"
          >
            <g
              transform="translate(0,284) scale(0.1,-0.1)"
              fill="#000000"
              stroke="none"
            >
              <path d="M873 2480 c-159 -32 -323 -228 -476 -570 -63 -141 -180 -458 -217 -589 -63 -219 -84 -343 -84 -511 -1 -138 2 -161 22 -211 59 -148 186 -215 328 -174 45 13 69 28 104 64 65 67 86 136 116 376 40 326 75 471 138 579 28 48 57 63 101 52 37 -9 69 -74 114 -233 78 -275 159 -376 301 -376 129 0 205 75 393 388 133 223 211 270 290 176 52 -63 103 -251 132 -491 44 -362 77 -456 186 -514 135 -74 299 -23 369 113 90 178 62 401 -131 1029 -85 277 -142 429 -210 562 -102 201 -191 274 -333 275 -174 1 -283 -114 -502 -528 -79 -149 -104 -179 -148 -175 -44 4 -59 42 -95 238 -60 325 -139 475 -272 514 -57 17 -64 18 -126 6z" />
            </g>
          </svg>
        )}
      </Link>
    </div>
  );
};

const IconNavigationSection: React.FC<{
  items: NavigationItem[];
  activePathname: string;
}> = ({ items, activePathname }) => {
  const isItemActive = (href: string): boolean => {
    return (
      activePathname === href ||
      (href !== '/' && activePathname.startsWith(href))
    );
  };

  return (
    <>
      {items.map((item) => (
        <IconNavigationItem
          key={item.id}
          item={item}
          isActive={isItemActive(item.href)}
        />
      ))}
    </>
  );
};

const CompactSidebar: React.FC<SidebarProps> = ({
  brand,
  primaryNavigation,
  secondaryNavigation,
  className,
  'aria-label': ariaLabel = 'Main navigation',
}) => {
  const location = useLocation();

  return (
    <aside
      aria-label={ariaLabel}
      className={cn(COMPACT_SIDEBAR_STYLES.container, className)}
    >
    
      <CompactSidebarBrand brand={brand} />

     
      <nav className={COMPACT_SIDEBAR_STYLES.navigation} role="navigation">
        <IconNavigationSection
          items={primaryNavigation}
          activePathname={location.pathname}
        />
      </nav>

      
      <div className={COMPACT_SIDEBAR_STYLES.bottomContainer}>
        <IconNavigationSection
          items={secondaryNavigation}
          activePathname={location.pathname}
        />
      </div>
    </aside>
  );
};

const 
SideNavigation: React.FC<SidebarProps> = (props) => {
  return <CompactSidebar {...props} />;
};

export default SideNavigation;
