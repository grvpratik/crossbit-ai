import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
	server: {
		allowedHosts: [
			"pretty-outdoors-melissa-guys.trycloudflare.com",
			"quickly-considers-frequencies-cross.trycloudflare.com",
			"defend-eleven-try-usc.trycloudflare.com",
		],
	},
});
