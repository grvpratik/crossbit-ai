// config/models.ts
export interface ModelOption {
	name: string;
	value: string;
}

export interface AgentOption {
	name: string;
	value: string;
}

export const models: ModelOption[] = [
	{
		name: "GPT 4o",
		value: "openai/gpt-4o",
	},
	{
		name: "Deepseek R1",
		value: "deepseek/deepseek-r1",
	},
];

export const agents: AgentOption[] = [
	{
		name: "Token Research",
		value: "token-research",
	},
	{
		name: "Influencer Check",
		value: "twitter-agent",
	},
];

export const getDefaultModel = (): string => models[0].value;
export const getDefaultAgent = (): string => agents[0].value;
