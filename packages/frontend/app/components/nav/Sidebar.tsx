import React from "react";
import { Link, useLocation } from "react-router";
import { Button } from "../ui/button";

import {
	Cog,
	Diamond,
	Globe,
	Info,
	Settings2,
	Sparkle,
	type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../wrapper/auth-provider";
import { History, Plus } from "lucide-react";
import { cn } from "~/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useSharedChatContext } from "~/wrapper/chat-provider";
import { UpmintLogo } from "~/root";

// Types
export interface NavigationItem {
	id: string;
	label: string;
	href: string;
	icon: LucideIcon;
	fn?: () => void;
	description?: string;
	isExternal?: boolean;
	requiresAuth?: boolean;
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
	"aria-label"?: string;
}

// Constants
const COMPACT_SIDEBAR_STYLES = {
	container:
		"w-16 h-screen  flex-col items-center py-2   hidden lg:flex overflow-hidden sticky top-0 bg-sidebar text-sidebar-foreground shrink-0 bottom-0",
	brandContainer: "mb-8",
	brandIcon: "w-10 h-10 bg-sidebar rounded-lg flex items-center justify-center",
	navigation: "flex flex-col space-y-3 flex-1",
	navButton: {
		base: "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group relative",
		active: "bg-sidebar-accent text-sidebar-foreground",
		inactive:
			"bg-sidebar-accent/20 hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground",
	},
	icon: "size-5 transition-colors duration-200",
	bottomContainer: "mt-auto space-y-3",
} as const;

const IconNavigationItem: React.FC<{
	item: NavigationItem;
	isActive: boolean;
	isAuthenticated: boolean;
}> = ({ item, isActive, isAuthenticated }) => {
	const IconComponent = item.icon;

	if (item.requiresAuth && !isAuthenticated) {
		return null;
	}

	const linkProps = {
		to: item.href,
		...(item.isExternal && {
			target: "_blank",
			rel: "noopener noreferrer",
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
					: COMPACT_SIDEBAR_STYLES.navButton.inactive
			)}
			aria-current={isActive ? "page" : undefined}
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
					<Diamond className="h-6 w-6" />
				)}
			</Link>
		</div>
	);
};

const IconNavigationSection: React.FC<{
	items: NavigationItem[];
	activePathname: string;
	isAuthenticated: boolean;
}> = ({ items, activePathname, isAuthenticated }) => {
	const isItemActive = (href: string): boolean => {
		return (
			activePathname === href ||
			(href !== "/" && activePathname.startsWith(href))
		);
	};

	return (
		<>
			{items.map((item) => (
				<IconNavigationItem
					key={item.id}
					item={item}
					isActive={isItemActive(item.href)}
					isAuthenticated={isAuthenticated}
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
	"aria-label": ariaLabel = "Main navigation",
}) => {
	const location = useLocation();
	const { session, signOut } = useAuth();
	const isAuthenticated = !!session;
	
	// const handleSignOut = async () => {
	// 	console.log("SIGN_OUT");
	// 	await signOut();
	// 	// window.location.href = '/';
	// };

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
					isAuthenticated={isAuthenticated}
				/>
				{/* <Button
					variant="outline"
					size="icon"
					className={cn(COMPACT_SIDEBAR_STYLES.navButton.base)}
					onClick={() => createNewChat()}
				>
					<Plus className={COMPACT_SIDEBAR_STYLES.icon} />
					<span className="sr-only">{"new chat"}</span>
				</Button> */}
			</nav>

			<div className={COMPACT_SIDEBAR_STYLES.bottomContainer}>
				<IconNavigationSection
					items={secondaryNavigation}
					activePathname={location.pathname}
					isAuthenticated={isAuthenticated}
				/>

			</div>
		</aside>
	);
};

const defaultBrand = {
	name: "ChatApp",
	href: "/",
	icon: UpmintLogo,
};

const defaultPrimaryNavigation = [
	{
		id: "home",
		label: "Home",
		href: "/",
		icon: Sparkle,
		requiresAuth: false,
	},
	{
		id: "explore",
		label: "Explore",
		href: "/explore",
		icon: Globe,
		requiresAuth: false,
	},
	{
		id: "chat",
		label: "New Chat",
		href: "/chat/new",
		icon: Plus,
		requiresAuth: true,
	},
];

const defaultSecondaryNavigation = [
	{
		id: "history",
		label: "History",
		href: "/history",
		icon: History,
		requiresAuth: true,
	},
	{
		id: "settings",
		label: "Settings",
		href: "/settings",
		icon: Settings2,
		requiresAuth: false,
	},
	{
		id: "about",
		label: "About",
		href: "/about",
		icon: Info,
		requiresAuth: false,
	},
];

export function Sidebar() {
	return (
		<CompactSidebar
			brand={defaultBrand}
			primaryNavigation={defaultPrimaryNavigation}
			secondaryNavigation={defaultSecondaryNavigation}
		/>
	);
}

export { CompactSidebar };
