'use client';

import type React from 'react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Search, TrendingUp } from 'lucide-react';

interface ChatSuggestionsProps {
  onSuggestionClick?: (suggestion: string) => void;
}

/**
 * Predefined chat suggestions for user convenience
 */
const SUGGESTIONS = [
  {
    id: 'token-analysis',
    text: 'Analyze a token',
    icon: TrendingUp,
    prompt: 'Help me analyze a specific token',
  },
  {
    id: 'market-research',
    text: 'Market research',
    icon: Search,
    prompt: 'I want to research market trends',
  },
  {
    id: 'general-help',
    text: 'General help',
    icon: MessageSquare,
    prompt: 'What can you help me with?',
  },
];

/**
 * Component for displaying chat suggestions to help users get started
 */
const ChatSuggestions: React.FC<ChatSuggestionsProps> = memo(
  ({ onSuggestionClick }) => {
    const handleSuggestionClick = (prompt: string) => {
      onSuggestionClick?.(prompt);
    };

    return (
      <Card className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Try these suggestions:
          </h3>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((suggestion) => {
              const IconComponent = suggestion.icon;
              return (
                <Button
                  key={suggestion.id}
                  variant="ghost"
                  className="justify-start h-auto p-3 text-left hover:bg-white/60 transition-colors"
                  onClick={() => handleSuggestionClick(suggestion.prompt)}
                >
                  <IconComponent className="h-4 w-4 mr-3 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-800">
                      {suggestion.text}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  },
);

ChatSuggestions.displayName = 'ChatSuggestions';

export default ChatSuggestions;
