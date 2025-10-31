import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from '../config/database'

export const auth: ReturnType<typeof betterAuth> = betterAuth({
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	trustedOrigins: [
		"http://localhost:5173",
		"https://fires-parker-regardless-curriculum.trycloudflare.com",
		"https://pretty-outdoors-melissa-guys.trycloudflare.com",
		"https://quickly-considers-frequencies-cross.trycloudflare.com",
		"https://defend-eleven-try-usc.trycloudflare.com"
	],
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
});
