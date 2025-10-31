import React from "react";
import { Link, useLocation } from "react-router";
import {
	
	History,
	Globe,
	Settings2,
	Sparkle,
	User,
} from "lucide-react";

export function BottomBar() {
	const location = useLocation();
	const navItems = [
		{ href: "/", label: "Home", icon: Sparkle },
		{ href: "/explore", label: "Explore", icon: Globe },
		{ href: "/history", label: "Chats", icon: History },
		{ href: "/settings", label: "Settings", icon: User },
	];

	return (
		<nav className="lg:hidden  bottom-0 w-full bg-sidebar h-14 text-sidebar-foreground ">
			<div className="flex justify-around w-full h-full items-center">
				{navItems.map(({ href, label, icon: Icon }) => {
					const isActive =
						href === "/"
							? location.pathname === "/" || location.pathname === "/home"
							: location.pathname.startsWith(href);

					return (
						<Link
							key={href}
							to={href}
							className={`flex flex-col items-center p-3 flex-1 h-full justify-center ${
								isActive ? "text-foreground" : "text-foreground/50"
							}`}
						>
							<Icon className="w-5 h-5  " />
							<span className="text-xs mt-1 sr-only ">{label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
