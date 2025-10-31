import { useState, useCallback, useMemo } from "react";

export type Tool = {
	name: string;
	active: boolean;
};

// Agent-specific tool configurations
export const AGENT_TOOLS: Record<string, string[]> = {
	"token-research": ["search"],
	"code-assistant": ["clipboard"],
	"data-analyst": ["search", "clipboard"],
	// Add more agent configurations as needed
};

// All available tools
export const ALL_TOOLS = ["search", "clipboard"] as const;

interface UseToolManagementOptions {
	agent: string;
	onToolsChange?: (tools: Tool[]) => void;
}

export const useToolManagement = ({
	agent,
	onToolsChange,
}: UseToolManagementOptions) => {
	const [userSelectedTools, setUserSelectedTools] = useState<string[]>([]);

	// Get agent-specific tools
	const agentTools = useMemo(() => {
		return AGENT_TOOLS[agent] || [];
	}, [agent]);

	// Calculate all tools with their active state
	const tools = useMemo(() => {
		const toolList = ALL_TOOLS.map((name) => {
			const isAgentTool = agentTools.includes(name);
			const isUserSelected = userSelectedTools.includes(name);

			return {
				name,
				active: isAgentTool || isUserSelected,
			};
		});

		onToolsChange?.(toolList);
		return toolList;
	}, [agentTools, userSelectedTools, onToolsChange]);

	// Toggle a tool
	const toggleTool = useCallback((toolName: string, isActive: boolean) => {
		setUserSelectedTools((prev) => {
			if (isActive) {
				return [...prev, toolName];
			}
			return prev.filter((t) => t !== toolName);
		});
	}, []);

	// Check if a tool is enabled by agent (and thus disabled for user toggling)
	const isToolDisabledByAgent = useCallback(
		(toolName: string): boolean => {
			return agentTools.includes(toolName);
		},
		[agentTools]
	);

	// Get a specific tool by name
	const getTool = useCallback(
		(toolName: string): Tool | undefined => {
			return tools.find((t) => t.name === toolName);
		},
		[tools]
	);

	// Check if a specific tool is active
	const isToolActive = useCallback(
		(toolName: string): boolean => {
			return tools.find((t) => t.name === toolName)?.active || false;
		},
		[tools]
	);

	// Clear user-selected tools
	const clearUserTools = useCallback(() => {
		setUserSelectedTools([]);
	}, []);

	// Set multiple tools at once
	const setTools = useCallback((toolNames: string[]) => {
		setUserSelectedTools(
			toolNames.filter((name) => ALL_TOOLS.includes(name as any))
		);
	}, []);

	// Get only active tools
	const activeTools = useMemo(() => {
		return tools.filter((t) => t.active);
	}, [tools]);

	// Individual tool setters (for backward compatibility or convenience)
	const setSearchActive = useCallback(
		(active: boolean) => {
			toggleTool("search", active);
		},
		[toggleTool]
	);

	const setClipboardActive = useCallback(
		(active: boolean) => {
			toggleTool("clipboard", active);
		},
		[toggleTool]
	);

	return {
		// State
		tools,
		activeTools,
		userSelectedTools,
		agentTools,

		// Actions
		toggleTool,
		setTools,
		clearUserTools,
		setSearchActive,
		setClipboardActive,

		// Utilities
		isToolDisabledByAgent,
		getTool,
		isToolActive,

		// Constants
		allTools: ALL_TOOLS,
		agentToolsConfig: AGENT_TOOLS,
	};
};
