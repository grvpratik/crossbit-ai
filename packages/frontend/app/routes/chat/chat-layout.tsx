import { Outlet } from "react-router";
import { ChatProvider } from "~/wrapper/chat-provider";

export default function ChatLayout() {
	return (
		<ChatProvider>
			<div className="flex flex-col h-full overflow-y-hidden bg-gray-50 dark:bg-background ">
				<Outlet />
			</div>
		</ChatProvider>
	);
}
