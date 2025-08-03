import { Button } from '@/components/ui/button';
import ResizableTextarea from '@/components/ui/resizable-textarea';
import {
  type AccountIdentifierEnum,
  createRpcClient,
  fetchAccountType,
  matchAddress,
} from '@/lib/solana';
import { type UseChatHelpers } from '@ai-sdk/react';
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { toast } from 'sonner';
import AddressTags from './address-tags';

import { getTools, type ChatMode } from '@/lib/constant';
import ModeSelect from './mode-select';
import { ArrowUp, ClipboardIcon, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCreateChat } from '@/hooks/mutations/useChatMutations';

export type UserAddress = {
  address: string;
  type: AccountIdentifierEnum;
};

interface ChatInputProps {
  messages: UseChatHelpers['messages'];
  chatId: string;
  mode: ChatMode | null;
  setMode: Dispatch<SetStateAction<ChatMode | null>>;
  chatInput: UseChatHelpers['input'];
  handleChatInputChange: UseChatHelpers['handleInputChange'];
  setChatInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: UseChatHelpers['stop'];
  handleChatSubmit: UseChatHelpers['handleSubmit'];
  append: UseChatHelpers['append'];
}

const DEFAULT_MAX_ADDRESS = 2;
const MAX_TEXT_LENGTH = 1000;

const ChatInput: React.FC<ChatInputProps> = ({
  messages,
  chatId,
  mode,
  setMode,
  status,
  append,
}) => {
  const { isConnected } = useAppKitAccount();
  const navigate = useNavigate();
  const chatCreate = useCreateChat();
  // State management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [text, setText] = useState<string>('');

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rpcClient = useMemo(() => createRpcClient(), []);

  // Computed values
  const maxAddresses = mode?.requiredAddress || DEFAULT_MAX_ADDRESS;
  const messageLoading = status === 'submitted' || status === 'streaming';
  const isSubmitDisabled = messageLoading || isLoading || !text.trim();

  // Focus textarea when loading completes
  useEffect(() => {
    if (textareaRef.current && !isLoading) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Utility functions
  const validateAddressLimit = useCallback(
    (newAddressCount: number): boolean => {
      if (addresses.length + newAddressCount > maxAddresses) {
        toast.info(`Maximum of ${maxAddresses} addresses allowed`);
        return false;
      }
      return true;
    },
    [addresses.length, maxAddresses],
  );

  const filterAddressesByMode = useCallback(
    (
      addressList: UserAddress[],
      selectedMode: ChatMode | null,
    ): UserAddress[] => {
      if (!selectedMode?.requiredTokenTypes?.length) {
        return addressList;
      }

      const filtered = addressList.filter((addr) =>
        selectedMode.requiredTokenTypes?.includes(addr.type),
      );

      if (filtered.length === 0 && addressList.length > 0) {
        toast.error(
          `Selected mode requires specific token types: ${selectedMode.requiredTokenTypes.join(', ')}`,
        );
      }

      return filtered;
    },
    [],
  );

  const fetchAddressInfo = useCallback(
    async (addressList: string[]): Promise<UserAddress[]> => {
      const results = await Promise.allSettled(
        addressList.map(async (address) => {
          const type = await fetchAccountType(rpcClient, address);
          if (!type) throw new Error('Invalid address type');
          return { address, type };
        }),
      );

      const validAddresses: UserAddress[] = [];
      let hasErrors = false;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          validAddresses.push(result.value);
        } else {
          console.error(
            `Failed to fetch account type for ${addressList[index]}:`,
            result.reason,
          );
          hasErrors = true;
        }
      });

      if (hasErrors) {
        toast.error('Some addresses could not be processed');
      }

      return validAddresses;
    },
    [rpcClient],
  );

  // Event handlers
  const handleTokenPaste = useCallback(
    async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      event.preventDefault();

      const pastedText = event.clipboardData.getData('text').trim();
      if (!pastedText) return;

      const words = pastedText.split(/\s+/);
      const addressWords = uniqueBy(words.filter(matchAddress), (addr) => addr);
      const nonAddressWords = words.filter((word) => !matchAddress(word));

      // Validate address limit
      if (!validateAddressLimit(addressWords.length)) return;

      // Filter out already existing addresses
      const newAddresses = addressWords.filter(
        (addr) =>
          !addresses.some(
            (existing) => existing.address.toLowerCase() === addr.toLowerCase(),
          ),
      );

      if (newAddresses.length === 0 && nonAddressWords.length === 0) {
        toast.info('No new content to add');
        return;
      }

      setIsLoading(true);

      try {
        // Process new addresses
        if (newAddresses.length > 0) {
          const availableSlots = maxAddresses - addresses.length;
          const addressesToProcess = newAddresses.slice(0, availableSlots);

          const validAddresses = await fetchAddressInfo(addressesToProcess);
          const filteredAddresses = filterAddressesByMode(validAddresses, mode);

          setAddresses((prev) => [...prev, ...filteredAddresses]);
        }

        // Add non-address words to text
        if (nonAddressWords.length > 0) {
          const newText = nonAddressWords.join(' ');
          setText((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${newText}` : newText;
          });
        }
      } catch (error) {
        console.error('Error handling token paste:', error);
        toast.error('Failed to process pasted content');
      } finally {
        setIsLoading(false);
        textareaRef.current?.focus();
      }
    },
    [
      addresses,
      maxAddresses,
      mode,
      validateAddressLimit,
      fetchAddressInfo,
      filterAddressesByMode,
    ],
  );

  const handleClipboardPaste = useCallback(async () => {
    if (isLoading) return;

    try {
      const clipboardText = await navigator.clipboard.readText();

      // Create synthetic paste event
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text', clipboardText);

      const syntheticEvent = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
      }) as unknown as React.ClipboardEvent<HTMLTextAreaElement>;

      await handleTokenPaste(syntheticEvent);
    } catch (error) {
      console.error('Clipboard paste failed:', error);
      toast.error('Failed to paste from clipboard');
    }
  }, [isLoading, handleTokenPaste]);

  const handleDeleteAddress = useCallback((addressToDelete: string) => {
    setAddresses((prev) =>
      prev.filter((addr) => addr.address !== addressToDelete),
    );
  }, []);

  const handleModeChange = useCallback(
    (modeId: string) => {
      const tools = getTools();

      if (mode?.modeId === modeId) {
        return setMode(null);
      }

      const selectedTool = tools.find((tool) => tool.modeId === modeId);
      if (!selectedTool) return;

      setMode(selectedTool);

      if (selectedTool.requiredTokenTypes?.length && addresses.length > 0) {
        const compatibleAddresses = addresses.filter((addr) =>
          selectedTool.requiredTokenTypes?.includes(addr.type),
        );

        if (compatibleAddresses.length < addresses.length) {
          toast.warning(
            'Some addresses are not compatible with the selected mode and will be removed',
          );
          setAddresses(compatibleAddresses);
        }
      }
    },
    [mode, addresses, setMode],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedText = text.trim();
    if (!trimmedText) return;

    const safeText = trimmedText.slice(0, MAX_TEXT_LENGTH);
    const safeAddresses = addresses.map((addr) => ({
      address: addr.address,
      type: addr.type,
    }));

    const content =
      safeAddresses.length > 0
        ? JSON.stringify({
            metadata: { addresses: safeAddresses },
            message: safeText,
          })
        : safeText;

    // Reset form
    setText('');
    setAddresses([]);
    textareaRef.current?.focus();

    // Handle navigation for new chat
    // if (messages.length === 0 && isConnected) {
    //   chatCreate.mutate({
    //     chatId,
    //     messages: {
    //       role: 'user',
    //       parts: {
    //         text: content,
    //         type: 'text',
    //       },
    //     },
    //   });
    //   localStorage.setItem(chatId, content);
    //   return navigate(`/chat/${chatId}`);
    // }

    // Append message
    append({
      // id: Math.random().toString(36).substring(2, 15),
      role: 'user',
      content,
    });
  };

  return (
    <div className="w-full flex flex-col border border-input rounded-3xl py-2 px-3 bg-accent md:px-4">
      {addresses.length > 0 && (
        <AddressTags addressTags={addresses} onDelete={handleDeleteAddress} />
      )}

      <ResizableTextarea
        className="md:p-1 p-0.5" // Keep current padding, ensures textarea itself is good
        disabled={messageLoading || isLoading}
        ref={textareaRef}
        input={text}
        onPaste={handleTokenPaste}
        onChange={(e) => setText(e.target.value)}
        onEnterPress={handleSubmit}
        placeholder="Type a message or paste token addresses..."
      />

      <div className="flex justify-between items-center mt-2">
        {' '}
        {/* Increased margin-top slightly */}
        <div className="flex flex-1 justify-between items-center">
          <ModeSelect mode={mode} setMode={handleModeChange} />
          {/* <div className="flex-1" /> // This div is not needed here and can cause layout issues */}

          <div className="flex items-center gap-1">
            {' '}
            {/* Removed mr-1 as it's often not needed with flex */}
            <Button
              size="icon"
              variant="ghost"
              disabled={isLoading}
              onClick={handleClipboardPaste}
              title="Paste from clipboard"
            >
              {isLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ClipboardIcon className="size-4" />
              )}
            </Button>
          </div>
        </div>
        <Button
          className="rounded-full flex-shrink-0 ml-2" // Added ml-2 for spacing, flex-shrink-0 to prevent shrinking
          size="icon"
          variant={status === 'streaming' ? 'destructive' : 'default'}
          onClick={status === 'streaming' ? stop : handleSubmit}
          disabled={status === 'streaming' ? false : isSubmitDisabled}
          title={status === 'streaming' ? 'Stop generation' : 'Send message'}
        >
          {status === 'streaming' ? (
            <div
              className="w-4 h-4 rounded-[4px] animate-spin bg-white cursor-pointer pointer-events-auto"
              style={{ animationDuration: '3s' }}
            />
          ) : status === 'submitted' ? (
            <LoaderCircle className="size-4 animate-spin " />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;

// import { Button } from '@/components/ui/button';
// import ResizableTextarea from '@/components/ui/resizable-textarea';
// import {
//   type AccountIdentifierEnum,
//   createRpcClient,
//   fetchAccountType,
//   matchAddress,
// } from '@/lib/solana';
// import {
//   type UseChatHelpers,
// } from '@ai-sdk/react';
// import {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
//   useMemo,
//   type Dispatch,
//   type SetStateAction,
// } from 'react';
// import { toast } from 'sonner';
// import AddressTags from './address-tags';
// import { uniqueBy } from '@/lib/utils';
// import { getTools, type ChatMode } from '@/lib/constant';
// import ModeSelect from './mode-select';
// import { ArrowUp, ClipboardIcon, LoaderCircle } from 'lucide-react';
// import { useNavigate } from 'react-router';
// import { useAppKitAccount } from '@reown/appkit/react';
// import { useCreateChat } from '@/hooks/mutations/useChatMutations';

// export type UserAddress = {
//   address: string;
//   type: AccountIdentifierEnum;
// };

// interface ChatInputProps {
//   messages: UseChatHelpers['messages'];
//   chatId: string;
//   mode: ChatMode | null;
//   setMode: Dispatch<SetStateAction<ChatMode | null>>;
//   chatInput: UseChatHelpers['input'];
//   handleChatInputChange: UseChatHelpers['handleInputChange'];
//   setChatInput: UseChatHelpers['setInput'];
//   status: UseChatHelpers['status'];
//   stop: UseChatHelpers['stop'];
//   handleChatSubmit: UseChatHelpers['handleSubmit'];
//   append: UseChatHelpers['append'];
// }

// const DEFAULT_MAX_ADDRESS = 2;
// const MAX_TEXT_LENGTH = 1000;

// const ChatInput: React.FC<ChatInputProps> = ({
//   messages,
//   chatId,
//   mode,
//   setMode,
//   status,
//   append,
// }) => {
//   const { isConnected } = useAppKitAccount();
//   const navigate = useNavigate();
// const chatCreate=useCreateChat()
//   // State management
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [addresses, setAddresses] = useState<UserAddress[]>([]);
//   const [text, setText] = useState<string>('');

//   // Refs
//   const textareaRef = useRef<HTMLTextAreaElement>(null);
//   const rpcClient = useMemo(() => createRpcClient(), []);

//   // Computed values
//   const maxAddresses = mode?.requiredAddress || DEFAULT_MAX_ADDRESS;
//   const messageLoading = status === 'submitted' || status === 'streaming';
//   const isSubmitDisabled = messageLoading || isLoading || !text.trim();

//   // Focus textarea when loading completes
//   useEffect(() => {
//     if (textareaRef.current && !isLoading) {
//       textareaRef.current.focus();
//     }
//   }, [isLoading]);

//   // Utility functions
//   const validateAddressLimit = useCallback(
//     (newAddressCount: number): boolean => {
//       if (addresses.length + newAddressCount > maxAddresses) {
//         toast.info(`Maximum of ${maxAddresses} addresses allowed`);
//         return false;
//       }
//       return true;
//     },
//     [addresses.length, maxAddresses],
//   );

//   const filterAddressesByMode = useCallback(
//     (
//       addressList: UserAddress[],
//       selectedMode: ChatMode | null,
//     ): UserAddress[] => {
//       if (!selectedMode?.requiredTokenTypes?.length) {
//         return addressList;
//       }

//       const filtered = addressList.filter((addr) =>
//         selectedMode.requiredTokenTypes?.includes(addr.type),
//       );

//       if (filtered.length === 0 && addressList.length > 0) {
//         toast.error(
//           `Selected mode requires specific token types: ${selectedMode.requiredTokenTypes.join(', ')}`,
//         );
//       }

//       return filtered;
//     },
//     [],
//   );

//   const fetchAddressInfo = useCallback(
//     async (addressList: string[]): Promise<UserAddress[]> => {
//       const results = await Promise.allSettled(
//         addressList.map(async (address) => {
//           const type = await fetchAccountType(rpcClient, address);
//           if (!type) throw new Error('Invalid address type');
//           return { address, type };
//         }),
//       );

//       const validAddresses: UserAddress[] = [];
//       let hasErrors = false;

//       results.forEach((result, index) => {
//         if (result.status === 'fulfilled') {
//           validAddresses.push(result.value);
//         } else {
//           console.error(
//             `Failed to fetch account type for ${addressList[index]}:`,
//             result.reason,
//           );
//           hasErrors = true;
//         }
//       });

//       if (hasErrors) {
//         toast.error('Some addresses could not be processed');
//       }

//       return validAddresses;
//     },
//     [rpcClient],
//   );

//   // Event handlers
//   const handleTokenPaste = useCallback(
//     async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
//       event.preventDefault();

//       const pastedText = event.clipboardData.getData('text').trim();
//       if (!pastedText) return;

//       const words = pastedText.split(/\s+/);
//       const addressWords = uniqueBy(words.filter(matchAddress), (addr) => addr);
//       const nonAddressWords = words.filter((word) => !matchAddress(word));

//       // Validate address limit
//       if (!validateAddressLimit(addressWords.length)) return;

//       // Filter out already existing addresses
//       const newAddresses = addressWords.filter(
//         (addr) =>
//           !addresses.some(
//             (existing) => existing.address.toLowerCase() === addr.toLowerCase(),
//           ),
//       );

//       if (newAddresses.length === 0 && nonAddressWords.length === 0) {
//         toast.info('No new content to add');
//         return;
//       }

//       setIsLoading(true);

//       try {
//         // Process new addresses
//         if (newAddresses.length > 0) {
//           const availableSlots = maxAddresses - addresses.length;
//           const addressesToProcess = newAddresses.slice(0, availableSlots);

//           const validAddresses = await fetchAddressInfo(addressesToProcess);
//           const filteredAddresses = filterAddressesByMode(validAddresses, mode);

//           setAddresses((prev) => [...prev, ...filteredAddresses]);
//         }

//         // Add non-address words to text
//         if (nonAddressWords.length > 0) {
//           const newText = nonAddressWords.join(' ');
//           setText((prev) => {
//             const trimmed = prev.trim();
//             return trimmed ? `${trimmed} ${newText}` : newText;
//           });
//         }
//       } catch (error) {
//         console.error('Error handling token paste:', error);
//         toast.error('Failed to process pasted content');
//       } finally {
//         setIsLoading(false);
//         textareaRef.current?.focus();
//       }
//     },
//     [
//       addresses,
//       maxAddresses,
//       mode,
//       validateAddressLimit,
//       fetchAddressInfo,
//       filterAddressesByMode,
//     ],
//   );

//   const handleClipboardPaste = useCallback(async () => {
//     if (isLoading) return;

//     try {
//       const clipboardText = await navigator.clipboard.readText();

//       // Create synthetic paste event
//       const dataTransfer = new DataTransfer();
//       dataTransfer.setData('text', clipboardText);

//       const syntheticEvent = new ClipboardEvent('paste', {
//         clipboardData: dataTransfer,
//       }) as unknown as React.ClipboardEvent<HTMLTextAreaElement>;

//       await handleTokenPaste(syntheticEvent);
//     } catch (error) {
//       console.error('Clipboard paste failed:', error);
//       toast.error('Failed to paste from clipboard');
//     }
//   }, [isLoading, handleTokenPaste]);

//   const handleDeleteAddress = useCallback((addressToDelete: string) => {
//     setAddresses((prev) =>
//       prev.filter((addr) => addr.address !== addressToDelete),
//     );
//   }, []);

//   const handleModeChange = useCallback(
//     (modeId: string) => {
//       const tools = getTools();

//       if (mode?.modeId === modeId) {
//         return setMode(null);
//       }

//       const selectedTool = tools.find((tool) => tool.modeId === modeId);
//       if (!selectedTool) return;

//       setMode(selectedTool);

//       if (selectedTool.requiredTokenTypes?.length && addresses.length > 0) {
//         const compatibleAddresses = addresses.filter((addr) =>
//           selectedTool.requiredTokenTypes?.includes(addr.type),
//         );

//         if (compatibleAddresses.length < addresses.length) {
//           toast.warning(
//             'Some addresses are not compatible with the selected mode and will be removed',
//           );
//           setAddresses(compatibleAddresses);
//         }
//       }
//     },
//     [mode, addresses, setMode],
//   );

//   const handleSubmit = useCallback(
//     async (event: React.FormEvent) => {
//       event.preventDefault();

//       const trimmedText = text.trim();
//       if (!trimmedText) return;

//       const safeText = trimmedText.slice(0, MAX_TEXT_LENGTH);
//       const safeAddresses = addresses.map((addr) => ({
//         address: addr.address,
//         type: addr.type,
//       }));

//       const content =
//         safeAddresses.length > 0
//           ? JSON.stringify({
//               metadata: { addresses: safeAddresses },
//               message: safeText,
//             })
//           : safeText;

//       // Reset form
//       setText('');
//       setAddresses([]);
//       textareaRef.current?.focus();

//       // Handle navigation for new chat
//       if (messages.length === 0 && isConnected) {
//         localStorage.setItem(chatId, content);
//         return navigate(`/chat/${chatId}`);
//       }

//       // Append message
//       append({
//         role: 'user',
//         content,
//       });
//     },
//     [text, addresses, messages.length, isConnected, chatId, navigate, append],
//   );

//   return (
//     <div className="w-full flex flex-col border border-input rounded-3xl py-2 px-2.5 bg-accent">
//       {addresses.length > 0 && (
//         <AddressTags addressTags={addresses} onDelete={handleDeleteAddress} />
//       )}

//       <ResizableTextarea
//         className="md:p-1 p-0.5"
//         disabled={messageLoading || isLoading}
//         ref={textareaRef}
//         input={text}
//         onPaste={handleTokenPaste}
//         onChange={(e) => setText(e.target.value)}
//         onEnterPress={handleSubmit}
//         placeholder="Type a message or paste token addresses..."
//       />

//       <div className="flex justify-between items-center mt-1">
//         <div className="flex flex-1 justify-between items-center">
//           <ModeSelect mode={mode} setMode={handleModeChange} />
//           <div className="flex-1" />

//           <div className="flex items-center gap-1 mr-1">
//             <Button
//               size="icon"
//               variant="ghost"
//               disabled={isLoading}
//               onClick={handleClipboardPaste}
//               title="Paste from clipboard"
//             >
//               {isLoading ? (
//                 <LoaderCircle className="animate-spin" />
//               ) : (
//                 <ClipboardIcon className="size-4" />
//               )}
//             </Button>
//           </div>
//         </div>

//         <Button
//           className="rounded-full"
//           size="icon"
//           variant={status === 'streaming' ? 'destructive' : 'default'}
//           onClick={status === 'streaming' ? stop : handleSubmit}
//           disabled={status === 'streaming' ? false : isSubmitDisabled}
//           title={status === 'streaming' ? 'Stop generation' : 'Send message'}
//         >
//           {status === 'streaming' ? (
//             <div
//               className="w-4 h-4 rounded-[4px] animate-spin bg-white cursor-pointer pointer-events-auto"
//               style={{ animationDuration: '3s' }}
//             />
//           ) : status === 'submitted' ? (
//             <LoaderCircle className="size-4 animate-spin " />
//           ) : (
//             <ArrowUp className="size-4" />
//           )}
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default ChatInput;
