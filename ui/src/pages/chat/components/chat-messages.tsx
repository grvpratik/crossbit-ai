import { type Message, type UseChatHelpers } from '@ai-sdk/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MessageContent } from './message-content';
import { ArrowDown, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import ChatHeader from './chat-header';

interface ChatMessagesProps {
  messages: Message[];
  data: UseChatHelpers['data'];
  status: UseChatHelpers['status'];
  error: UseChatHelpers['error'];
  reload: UseChatHelpers['reload'];
  onSourceClick?: (message: Message) => void;
  avatarSrc?: string;
  userIcon?: ReactNode;
  assistantIcon?: ReactNode;
  sourceButtonText?: string;
  id?: string;
  title?: string;
  createNewChat: () => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  data,
  messages,
  status,
  error,
  reload,
  onSourceClick,
  avatarSrc,
  userIcon,
  assistantIcon,
  sourceButtonText,
  id,
  title,
  createNewChat,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // // Auto-scroll to bottom when new messages arrive or when streaming stops
  // useEffect(() => {
  //   const container = containerRef.current;
  //   if (container) {
  //     container.scrollTo({
  //       top: container.scrollHeight,
  //       behavior: 'smooth',
  //     });
  //   }
  // }, [messages, status]);

  // // Handle scroll to bottom button visibility
  // const handleScroll = () => {
  //   const container = containerRef.current;
  //   if (container) {
  //     const { scrollTop, scrollHeight, clientHeight } = container;
  //     const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // Threshold
  //     setShowScrollToBottom(!isAtBottom);
  //   }
  // };

  // useEffect(() => {
  //   const container = containerRef.current;
  //   if (container) {
  //     container.addEventListener('scroll', handleScroll);
  //     handleScroll(); // Initial check
  //     return () => container.removeEventListener('scroll', handleScroll);
  //   }
  // }, []);

  // const scrollToBottom = () => {
  //   const container = containerRef.current;
  //   if (container) {
  //     container.scrollTo({
  //       top: container.scrollHeight,
  //       behavior: 'smooth',
  //     });
  //   }
  // };

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      {/* <ChatHeader
        id={id}
        title={title}
        createNewChat={createNewChat}
        messagesCount={messages.length}
      /> */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 mx-auto max-w-3xl w-full flex flex-col gap-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {messages.map((message, index) => {
          const isStreaming =
            index === messages.length - 1 &&
            message.role === 'assistant' &&
            isLoading;

          const lastMessage = index === messages.length - 1;
          const hasToolInvocations =
            message.parts?.some((part) => part.type === 'tool-invocation') ||
            false;

          return (
            <MessageContent
              key={message.id || `msg-${index}`}
              message={message}
              isStreaming={isStreaming}
              lastMessage={lastMessage}
              hasToolInvocations={hasToolInvocations}
              data={data}
              // onSourceClick={onSourceClick}
              avatarSrc={avatarSrc}
              userIcon={userIcon}
              assistantIcon={assistantIcon}
              sourceButtonText={sourceButtonText}
            />
          );
        })}

        {/* Thinking/Typing Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 sm:gap-4 pb-4">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-500 text-white">
              <Sparkles className="h-5 w-5 animate-bounce" />
            </div>
            <div className="flex-1 p-3 rounded-lg bg-gray-100 text-gray-500 text-sm md:text-base">
              {status === 'submitted' ? 'Thinking...' : 'Typing...'}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            variant="destructive"
            className="w-full max-w-3xl mx-auto mb-4 bg-red-50"
          >
            <Sparkles className="h-4 w-4 text-red-500" />{' '}
            {/* Changed icon for consistency */}
            <AlertDescription className="flex justify-between items-center text-red-700">
              <p className="flex-1">
                {error.message ||
                  'An unexpected error occurred. Please try again.'}
              </p>
              <Button
                className="text-red-700 border-red-300 hover:bg-red-100"
                onClick={async () => await reload()}
                size="sm"
                variant="outline"
              >
                Reload
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <motion.button
          className="absolute bottom-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors z-10"
          onClick={scrollToBottom}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5 text-gray-600" />
        </motion.button>
      )}
    </div>
  );
};

export default ChatMessages;
