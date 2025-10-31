import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
	createRpcClient,
	fetchAccountType,
	matchAddress,
	uniqueBy,
	type AccountIdentifierEnum,
} from "~/lib/solana";

export type UserAddress = {
	address: string;
	type: AccountIdentifierEnum;
};

interface UseAddressManagementOptions {
	maxAddresses?: number;
	onAddressesChange?: (addresses: UserAddress[]) => void;
}

export const useAddressManagement = ({
	maxAddresses = 2,
	onAddressesChange,
}: UseAddressManagementOptions = {}) => {
	const [addresses, setAddresses] = useState<UserAddress[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const rpcClient = useMemo(() => createRpcClient(), []);

	// Validate address limit
	const validateAddressLimit = useCallback(
		(newAddressCount: number): boolean => {
			if (addresses.length + newAddressCount > maxAddresses) {
				toast.info(`Maximum of ${maxAddresses} addresses allowed`);
				return false;
			}
			return true;
		},
		[addresses.length, maxAddresses]
	);

	// Fetch address information from blockchain
	const fetchAddressInfo = useCallback(
		async (addressList: string[]): Promise<UserAddress[]> => {
			const results = await Promise.allSettled(
				addressList.map(async (address) => {
					const type = await fetchAccountType(rpcClient, address);
					if (!type) throw new Error("Invalid address type");
					return { address, type };
				})
			);

			const validAddresses: UserAddress[] = [];
			let hasErrors = false;

			results.forEach((result, index) => {
				if (result.status === "fulfilled") {
					validAddresses.push(result.value);
				} else {
					console.error(
						`Failed to fetch account type for ${addressList[index]}:`,
						result.reason
					);
					hasErrors = true;
				}
			});

			if (hasErrors) {
				toast.error("Some addresses could not be processed");
			}

			return validAddresses;
		},
		[rpcClient]
	);

	// Parse text and extract addresses
	const parseAddressesFromText = useCallback((text: string) => {
		const words = text.split(/\s+/);
		const addressWords = uniqueBy(
			words.filter(matchAddress),
			(addr: string) => addr
		);
		const nonAddressWords = words.filter((word) => !matchAddress(word));

		return {
			addresses: addressWords,
			nonAddressText: nonAddressWords.join(" "),
		};
	}, []);

	// Add addresses
	const addAddresses = useCallback(
		async (newAddresses: string[]): Promise<boolean> => {
			if (!validateAddressLimit(newAddresses.length)) {
				return false;
			}

			// Filter out existing addresses
			const uniqueNewAddresses = newAddresses.filter(
				(addr) =>
					!addresses.some(
						(existing) => existing.address.toLowerCase() === addr.toLowerCase()
					)
			);

			if (uniqueNewAddresses.length === 0) {
				toast.info("No new addresses to add");
				return false;
			}

			setIsLoading(true);

			try {
				const availableSlots = maxAddresses - addresses.length;
				const addressesToProcess = uniqueNewAddresses.slice(0, availableSlots);
				const validAddresses = await fetchAddressInfo(addressesToProcess);

				setAddresses((prev) => {
					const updated = [...prev, ...validAddresses];
					onAddressesChange?.(updated);
					return updated;
				});

				return true;
			} catch (error) {
				console.error("Error adding addresses:", error);
				toast.error("Failed to process addresses");
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[
			addresses,
			maxAddresses,
			validateAddressLimit,
			fetchAddressInfo,
			onAddressesChange,
		]
	);

	// Delete address
	const deleteAddress = useCallback(
		(addressToDelete: string) => {
			setAddresses((prev) => {
				const updated = prev.filter((addr) => addr.address !== addressToDelete);
				onAddressesChange?.(updated);
				return updated;
			});
		},
		[onAddressesChange]
	);

	// Clear all addresses
	const clearAddresses = useCallback(() => {
		setAddresses([]);
		onAddressesChange?.([]);
	}, [onAddressesChange]);

	// Handle paste event
	const handlePaste = useCallback(
		async (
			pastedText: string,
			onTextExtracted?: (text: string) => void
		): Promise<boolean> => {
			const trimmedText = pastedText.trim();
			if (!trimmedText) return false;

			const { addresses: addressWords, nonAddressText } =
				parseAddressesFromText(trimmedText);

			// No addresses or text found
			if (addressWords.length === 0 && !nonAddressText) {
				return false;
			}

			// Process addresses if found
			let success = false;
			if (addressWords.length > 0) {
				success = await addAddresses(addressWords);
			}

			// Handle non-address text
			if (nonAddressText && onTextExtracted) {
				onTextExtracted(nonAddressText);
			}

			return success || !!nonAddressText;
		},
		[parseAddressesFromText, addAddresses]
	);

	return {
		// State
		addresses,
		isLoading,
		maxAddresses,
		availableSlots: maxAddresses - addresses.length,

		// Actions
		addAddresses,
		deleteAddress,
		clearAddresses,
		handlePaste,
		parseAddressesFromText,

		// Utilities
		validateAddressLimit,
	};
};
