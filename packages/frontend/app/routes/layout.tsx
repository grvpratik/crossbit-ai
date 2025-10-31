import { Outlet } from "react-router";
import { Sidebar } from "../components/nav/Sidebar";
import { BottomBar } from "../components/nav/BottomBar";
import type { Route } from "./+types/layout";
import { ChatProvider } from "~/wrapper/chat-provider";

export default function Layout({}: Route.ComponentProps) {
	return (
		
			<div className="flex lg:flex-row flex-col h-screen bg-sidebar dark:bg-sidebar  overflow-hidden">
				<Sidebar />
				<main className="flex-1  dark:bg-background bg-gray-50   lg:my-2  lg:pb-0 overflow-y-auto   rounded-lg ">
					<Outlet />
				</main>
				<BottomBar />
			</div>
		
	);
}
