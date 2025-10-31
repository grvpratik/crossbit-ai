import React from "react";
import type { Route } from "./+types/report";
import { api, isSuccess } from "~/lib/api";
import { useQuery } from "@tanstack/react-query";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Report" },
		{ name: "description", content: "Get Token Report" },
	];
}

const ReportPage = ({ params }: Route.ComponentProps) => {
	const { data, error, isLoading } = useQuery({
		queryKey: ["report", params.ca],
		retry:false,
		queryFn: async () => {
			const res = await api.post(`/api/report/token/${params.ca}`);
			if (!isSuccess(res)) {
				// normalize API error into thrown Error so react-query sets `error`
				throw new Error(res.error?.message || "API error");
			}
			return res.result;
		},
		//enabled: !!params.ca,
	});

	if (isLoading) return <div>Loading report...</div>;
	if (error) return <div>Error: {(error as Error).message}</div>;

	return (
		<div>
			<h1>Report: {params.ca}</h1>
			<pre style={{ whiteSpace: "pre-wrap" }}>
				{JSON.stringify(data, null, 2)}
			</pre>
		</div>
	);
};

export default ReportPage;
