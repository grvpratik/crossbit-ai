import React from "react";
import { TabsList, TabsTrigger, TabsContent, Tabs } from "~/components/ui/tabs";
import { useSharedChatContext } from "~/wrapper/chat-provider";

const FeaturedScreen = () => {
	const { chat } = useSharedChatContext();
	return (
		<div className=" max-w-3xl  mx-auto w-full h-full flex flex-col mt-40 lg:mt-60 lg:p-4 p-2">
			<h1 className="font-serif font-extrabold text-3xl tracking-wider uppercase ">
				hello degens
			</h1>
			<p className="text-accent-foreground">
				Discover hidden gem ,guides and more with your trading assistant{" "}
			</p>
			<Tabs defaultValue="reports">
				<TabsList className="my-4">
					<TabsTrigger value="reports">Reports</TabsTrigger>
					<TabsTrigger value="questions">Questions</TabsTrigger>
					<TabsTrigger value="guides">Guides</TabsTrigger>
				</TabsList>

				<TabsContent value="reports" className="px-2">
					<div className=" my-2  text-base flex w-full justify-between">
						<div>Trech BOT (#DTCJ)</div>
						<div>5min ago</div>
					</div>
					<div className=" my-2  text-base flex w-full justify-between">
						<div>Market Watch (#MW01)</div>
						<div>12min ago</div>
					</div>
				</TabsContent>

				<TabsContent value="questions" className="px-2">
					<div className=" my-2  text-base">
						<div className="font-bold">How do I deploy a bot?</div>
						<div className="text-sm text-muted-foreground">
							asked by user123 · 2h
						</div>
					</div>
					<div className=" my-2  text-base">
						<div className="font-bold">What's the best RPC for mainnet?</div>
						<div className="text-sm text-muted-foreground">
							asked by rpc-nerd · 4h
						</div>
					</div>
				</TabsContent>

				<TabsContent value="guides" className="px-2">
					<div className=" my-2  text-base">
						<div className="font-bold">Beginner's guide to Solana NFTs</div>
						<div className="text-sm text-muted-foreground">updated 3d ago</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default FeaturedScreen;
