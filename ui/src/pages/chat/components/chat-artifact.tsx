'use client';

import type React from 'react';
import { useState, useCallback, memo } from 'react';
import { useChat, type Message } from '@ai-sdk/react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useLocation, useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import ChatInput from './chat-input';
import ChatMessages from './chat-messages';
import ChatSuggestions from './chat-suggestions';
import type { ChatMode } from '@/types/chat.types';
import ChatHeader from './chat-header';

interface ChatArtifactProps {
  initialMessages?: Message[];
  id?: string;
  title?: string;
  loadingMessages?: boolean;
}

/**
 * Welcome section component for new chats
 */
const WelcomeSection: React.FC = memo(() => (
  <div className="mt-48 flex items-start justify-end max-w-3xl mx-auto w-full flex-col my-8 px-4 md:px-2">
    <h1 className="text-4xl font-mono font-bold pb-2 tracking-tight">
      Hello User,
    </h1>
    <p className="text-lg leading-relaxed tracking-tight text-muted-foreground">
      Try new tools - Token Research, Onchain, Social Search
    </p>
  </div>
));

WelcomeSection.displayName = 'WelcomeSection';

/**
 * Main chat artifact component that orchestrates the entire chat experience
 */
const ChatArtifact: React.FC<ChatArtifactProps> = memo(
  ({
    initialMessages,
    id: chatId,
    title: titleProp,
    loadingMessages = false,
  }) => {
    const { address, isConnected, status: walletStatus } = useAppKitAccount();
    const navigate = useNavigate();
    const location = useLocation();

    // Local state
    const [mode, setMode] = useState<ChatMode | null>(null);
    const [chatTitle, setChatTitle] = useState<string | undefined>(titleProp);

    // Chat hook configuration
    const {
      id: currentSessionChatId,
      messages,
      setInput,
      data,
      error,
      stop,
      append,
      setMessages,
      status,
      reload,
    } = useChat({
      api: 'http://localhost:3000/api/chat',
      credentials: 'include',
      initialMessages,
      id: chatId,
      onResponse: (response) => {
        console.log('Chat response:', response);
      },
      onFinish: handleChatCompletion,
      onError: (err) => {
        console.error('Chat SDK Error:', err);
      },
    });

    // Computed values
    const hasMessages = messages.length > 0;
    const isUserConnected =
      isConnected && address && walletStatus === 'connected';
    const shouldNavigateToChat =
      isUserConnected && !location.pathname.includes('/chat/');

    /**
     * Handles chat completion and navigation
     */
    function handleChatCompletion() {
      if (shouldNavigateToChat && currentSessionChatId) {
        window.history.replaceState(null, '', `/chat/${currentSessionChatId}`);
      }
    }

    /**
     * Creates a new chat session
     */
    const createNewChat = useCallback(() => {
      setMode(null);
      setChatTitle(undefined);
      setMessages([]);
      setInput('');
      stop();

      if (window?.location.pathname.startsWith('/chat/')) {
        navigate('/');
      }
    }, [setMessages, setInput, stop, navigate]);

    /**
     * Handles suggestion clicks
     */
    const handleSuggestionClick = useCallback(
      (suggestion: string) => {
        append({
          role: 'user',
          content: suggestion,
        });
      },
      [append],
    );

    const inputContainerStyles = cn(
      'z-10 mx-auto max-w-3xl w-full px-2 md:px-0',
      (hasMessages || loadingMessages) &&
        'sticky bottom-18 md:bottom-0 left-0 right-0 w-full',
    );

    return (
      <div className="flex flex-col h-full w-full flex-1 relative min-h-svh">
        <main className="flex-1 flex flex-col">
          <ChatHeader
                  id={chatId}
                  title={chatTitle}
                  createNewChat={createNewChat}
                  messagesCount={messages.length}
                />
          {loadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-muted-foreground">Loading messages...</div>
            </div>
          ) : hasMessages ? (
            <ChatMessages
              id={chatId || currentSessionChatId}
              title={chatTitle}
              data={data}
              messages={messages}
              status={status}
              error={error}
              reload={reload}
              createNewChat={createNewChat}
            />
          ) : (
            <WelcomeSection />
          )}

          <div className={inputContainerStyles}>
            <ChatInput
              messages={messages}
              chatId={currentSessionChatId || chatId || ''}
              mode={mode}
              setMode={setMode}
              status={status}
              append={append}
              stop={stop}
            />

            {!hasMessages && (
              <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
            )}
          </div>
        </main>
      </div>
    );
  },
);

ChatArtifact.displayName = 'ChatArtifact';

export default ChatArtifact;
