'use client';

import type React from 'react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { MessageCirclePlus, Star } from 'lucide-react';
import LoginButton from '@/components/login-button';

interface ChatHeaderProps {
  id?: string;
  title?: string;
  createNewChat: () => void;
  messagesCount: number;
}

/**
 * Chat title view when there's an active conversation
 */
const ChatTitleView: React.FC<{
  title: string;
  onCreateNewChat: () => void;
}> = memo(({ title, onCreateNewChat }) => (
  <div className="flex w-full items-center">
    <div className="flex items-center space-x-2 flex-1 min-w-0">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-yellow-500 flex-shrink-0"
              aria-label="Favorite chat"
            >
              <Star size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add to favorites</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <h1 className="font-bold text-lg truncate flex-1 min-w-0">
        {title || 'Untitled Chat'}
      </h1>
    </div>

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCreateNewChat}
            className="flex-shrink-0 ml-2"
            aria-label="Start new chat"
          >
            <MessageCirclePlus size={20} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>New chat</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
));

ChatTitleView.displayName = 'ChatTitleView';

/**
 * Default header view showing brand and login
 */
const DefaultView: React.FC<{
  hasMessages: boolean;
  onCreateNewChat: () => void;
}> = memo(({ hasMessages, onCreateNewChat }) => (
  <div className="flex w-full items-center">
    <div className="flex items-center space-x-2">
      <h1 className="font-bold font-serif mx-2 uppercase text-lg">Upmint</h1>

      {hasMessages && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={onCreateNewChat}
                className="font-bold font-mono"
                aria-label="Start new chat"
              >
                <MessageCirclePlus size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>New chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>

    <div className="flex-1" />
    <LoginButton />
  </div>
));

DefaultView.displayName = 'DefaultView';

/**
 * Header component for the chat interface
 */
const ChatHeader: React.FC<ChatHeaderProps> = memo(
  ({  title, createNewChat, messagesCount }) => {
    const hasMessages = messagesCount > 0;
    const shouldShowChatTitle = title && hasMessages;

    return (
      <header className="sticky top-0 z-10 h-12 text-foreground bg-background/80 backdrop-blur-md left-0 right-0 flex items-center px-2 py-2">
        {shouldShowChatTitle ? (
          <ChatTitleView title={title} onCreateNewChat={createNewChat} />
        ) : (
          <DefaultView
            hasMessages={hasMessages}
            onCreateNewChat={createNewChat}
          />
        )}
      </header>
    );
  },
);

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;
