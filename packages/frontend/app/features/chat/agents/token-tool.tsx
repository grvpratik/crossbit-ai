import React from "react";
import {
	CheckCircle2,
	Circle,
	AlertCircle,
	Loader2,
	ChevronDown,
	ChevronRight,
} from "lucide-react";
import { Link } from "react-router";

interface ResultCardProps {
	address: string;
	image?: string;
	name?: string;
	ticker?: string;
	category?: string;
	score?: number | string | null;
	createdOn?:string
}

const ResultCard: React.FC<ResultCardProps> = ({
	address,
	image,
	name,
	ticker,
	category,
	score,
	createdOn
}) => {
	const scoreNumber =
		typeof score === "number"
			? score
			: typeof score === "string"
			? Number(score)
			: NaN;

	const getScoreClasses = (val: number) => {
		if (Number.isNaN(val)) return "bg-gray-700 text-gray-200";
		if (val >= 75) return "bg-green-600 text-white";
		if (val >= 50) return "bg-yellow-600 text-white";
		if (val >= 30) return "bg-orange-600 text-white";
		return "bg-red-600 text-white";
	};

	const scoreLabel = Number.isNaN(scoreNumber)
		? "N/A"
		: `${Math.round(scoreNumber)}%`;

	return (
		<div className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-lg p-4">
			<div className="flex-shrink-0">
				<img
					src={
						image ||
						"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%23333'/><text x='50%' y='50%' fill='%23fff' font-size='20' font-family='Arial' text-anchor='middle' dominant-baseline='central'>T</text></svg>"
					}
					alt={`${name || ticker || "token"} logo`}
					className="w-12 h-12 rounded-full object-cover bg-gray-700"
				/>
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<div className="font-semibold truncate">
						{name || "Unknown Token"}
					</div>
					<div className="text-xs text-gray-400 truncate">
						({ticker || "—"})
					</div>
				</div>
				<div className="text-xs text-gray-400 mt-1 truncate">
					{category || "Uncategorized"}
				</div>
			</div>

			<div className="flex flex-col items-end gap-2">
				<div
					className={`text-sm font-semibold px-3 py-1 rounded-full ${getScoreClasses(
						scoreNumber
					)}`}
				>
					{scoreLabel}
				</div>

				<Link
					to={`/report/${encodeURIComponent(address)}`}
					className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded"
				>
					View details
				</Link>
			</div>
		</div>
	);
};

export { ResultCard };

const TokenAnalyserTool = ({ part, result }) => {
	const [expandedSteps, setExpandedSteps] = React.useState({});

	// If final result is ready
	if (result && result.output && result.output.success) {
		return (
			<div className="w-full bg-gray-900 text-white rounded-lg p-6">
				<h2 className="text-2xl font-bold mb-4 text-green-400">
					✓ Analysis Complete
				</h2>
				<ResultCard
					address={result.output.result.address}
					name={result.output.result.info.metadata.name}
					image={result.output.result.info.metadata.image}
					ticker={result.output.result.info.metadata.symbol}
					createdOn={result.output.result.info.metadata.createdOn}
				/>
				{/* <pre className="bg-gray-800 p-4 rounded overflow-x-auto text-sm">
					{JSON.stringify(result.output.result, null, 2)}
				</pre> */}
			</div>
		);
	}

	if (!part || !part.data) return null;

	const { all_steps = [], current_step, current_status } = part.data;

	const toggleStep = (stepName) => {
		setExpandedSteps((prev) => ({
			...prev,
			[stepName]: !prev[stepName],
		}));
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case "completed":
			case "success":
				return <CheckCircle2 className="w-5 h-5 text-green-500" />;
			case "loading":
				return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
			case "error":
				return <AlertCircle className="w-5 h-5 text-red-500" />;
			default:
				return <Circle className="w-5 h-5 text-gray-400" />;
		}
	};

	const getStepLabel = (name) => {
		const labels = {
			address_verify: "Address Verification",
			checking_cache: "Cache Check",
			metadata: "Token Metadata",
			creator_info: "Creator History",
			similar_coins: "Similar Tokens",
			holders_analysis: "Holders Analysis",
			volume_analysis: "Volume Analysis",
			Social_analysis: "Social Sentiment",
			social_analysis: "Social Sentiment",
		};
		return (
			labels[name] ||
			name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
		);
	};

	return (
		<div className="w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg shadow-2xl overflow-hidden">
			<div className="flex flex-col lg:flex-row min-h-[600px]">
				{/* Left Side - Steps Progress */}
				<div className="lg:w-1/3 bg-gray-800 border-r border-gray-700 p-6">
					<h3 className="text-xl font-bold mb-6 flex items-center gap-2">
						<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
						Analysis Progress
					</h3>

					<div className="space-y-3">
						{all_steps.map((step, idx) => {
							const isActive = step.name === current_step;
							const isExpanded = expandedSteps[step.name];

							return (
								<div
									key={idx}
									className={`rounded-lg border transition-all ${
										isActive
											? "border-blue-500 bg-blue-500/10"
											: step.status === "completed" || step.status === "success"
											? "border-green-500/30 bg-green-500/5"
											: step.status === "error"
											? "border-red-500/30 bg-red-500/5"
											: "border-gray-600 bg-gray-700/30"
									}`}
								>
									<div
										className="p-4 flex items-start gap-3 cursor-pointer hover:bg-white/5"
										onClick={() => toggleStep(step.name)}
									>
										<div className="pt-0.5">{getStatusIcon(step.status)}</div>

										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<h4 className="font-semibold text-sm">
													{getStepLabel(step.name)}
												</h4>
												{(step.data || step.error) &&
													(isExpanded ? (
														<ChevronDown className="w-4 h-4 text-gray-400" />
													) : (
														<ChevronRight className="w-4 h-4 text-gray-400" />
													))}
											</div>
											<p className="text-xs text-gray-400 mt-1">
												{step.message}
											</p>
											{step.error && (
												<p className="text-xs text-red-400 mt-1">
													{step.error}
												</p>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Right Side - Step Details */}
				<div className="lg:w-2/3 p-6 overflow-y-auto  max-h-max">
					<h3 className="text-xl font-bold mb-6 flex items-center gap-2">
						<div className="w-2 h-2 bg-purple-500 rounded-full"></div>
						Step Details
					</h3>

					{all_steps.length === 0 ? (
						<div className="flex items-center justify-center h-64 text-gray-500">
							<div className="text-center">
								<Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
								<p>Initializing analysis...</p>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							{/* Show ALL steps with data, not just expanded ones */}
							{all_steps
								.filter((step) => step.data || step.error)
								.map((step, idx) => {
									const isCurrentStep = step.name === current_step;
									const isCompleted =
										step.status === "completed" || step.status === "success";
									const isError = step.status === "error";

									return (
										<div
											key={idx}
											className={`rounded-lg p-4 border transition-all ${
												isCurrentStep
													? "bg-blue-900/20 border-blue-500/50"
													: isCompleted
													? "bg-gray-700/30 border-gray-600"
													: isError
													? "bg-red-900/20 border-red-500/30"
													: "bg-gray-700/50 border-gray-600"
											}`}
										>
											<div className="flex items-center gap-2 mb-3">
												{getStatusIcon(step.status)}
												<h4 className="font-semibold">
													{getStepLabel(step.name)}
												</h4>
												{isCurrentStep && (
													<span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
														Active
													</span>
												)}
											</div>

											<p className="text-sm text-gray-400 mb-2">
												{step.message}
											</p>

											{step.data && (
												<div className="bg-gray-900 rounded p-3 overflow-x-auto max-h-64 overflow-y-auto">
													<pre className="text-xs text-gray-300">
														{typeof step.data === "string"
															? step.data
															: JSON.stringify(step.data, null, 2)}
													</pre>
												</div>
											)}

											{step.error && (
												<div className="bg-red-900/30 border border-red-500/30 rounded p-3 mt-2">
													<p className="text-sm text-red-300">{step.error}</p>
												</div>
											)}
										</div>
									);
								})}
						</div>
					)}

					{/* Summary Stats */}
					<div className="mt-6 grid grid-cols-3 gap-4">
						<div className="bg-gray-700/50 rounded-lg p-4 text-center">
							<div className="text-2xl font-bold text-green-400">
								{part.data.completed_steps?.length || 0}
							</div>
							<div className="text-xs text-gray-400 mt-1">Completed</div>
						</div>
						<div className="bg-gray-700/50 rounded-lg p-4 text-center">
							<div className="text-2xl font-bold text-blue-400">
								{all_steps.filter((s) => s.status === "loading").length}
							</div>
							<div className="text-xs text-gray-400 mt-1">In Progress</div>
						</div>
						<div className="bg-gray-700/50 rounded-lg p-4 text-center">
							<div className="text-2xl font-bold text-red-400">
								{part.data.error_steps?.length || 0}
							</div>
							<div className="text-xs text-gray-400 mt-1">Errors</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TokenAnalyserTool;
