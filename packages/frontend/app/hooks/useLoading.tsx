import React from "react";


export function useLoading() {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<Error | null>(null);

	const withLoading = React.useCallback(
		async <T,>(fn: () => Promise<T>): Promise<T> => {
			setLoading(true);
			setError(null);
			try {
				const result = await fn();
				return result;
			} catch (err) {
				const error = err instanceof Error ? err : new Error("Unknown error");
				setError(error);
				throw error;
			} finally {
				setLoading(false);
			}
		},
		[]
	);

	return { loading, error, withLoading };
}
