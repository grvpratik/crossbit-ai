'use client';

import type React from 'react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';
import { getTools } from '@/lib/constant';
import { cn } from '@/lib/utils';
import { screenSize, useWindowSize } from '@/hooks/useWindowSize';
import type { ChatMode } from '@/types/chat.types';

interface ModeSelectProps {
  mode: ChatMode | null;
  setMode: (modeId: string) => void;
}

/**
 * Component for selecting chat modes/tools
 * Features both inline buttons for featured tools and dropdown for others
 */
const ModeSelect: React.FC<ModeSelectProps> = memo(({ mode, setMode }) => {
  const tools = getTools();
  const featuredTools = tools.filter((tool) => tool.featured);
  const nonFeaturedTools = tools.filter((tool) => !tool.featured);
  const screen = useWindowSize();

  const isLargeScreen = (screen.width ?? 0) > Number(screenSize.md);

  return (
    <div className="flex items-center gap-1">
      {/* Featured tools as buttons */}
      {featuredTools.map((tool) => (
        <Button
          key={tool.modeId}
          variant={mode?.modeId === tool.modeId ? 'secondary' : 'outline'}
          size={isLargeScreen ? 'sm' : 'icon'}
          onClick={() => setMode(tool.modeId)}
          className={cn(
            'flex items-center gap-2',
            tool.disabled && 'opacity-50 cursor-not-allowed',
          )}
          disabled={tool.disabled}
          aria-label={`Select ${tool.modeName} mode`}
        >
          {tool.icon && <tool.icon className="h-4 w-4" />}
          <span className="hidden md:flex">{tool.modeName}</span>
        </Button>
      ))}

      {/* Dropdown for non-featured tools */}
      {nonFeaturedTools.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="flex items-center gap-2 bg-transparent"
              aria-label="More tools"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {nonFeaturedTools.map((tool) => (
              <DropdownMenuItem
                key={tool.modeId}
                onClick={() => setMode(tool.modeId)}
                disabled={tool.disabled}
                className={cn(
                  'flex items-center gap-2 cursor-pointer',
                  mode?.modeId === tool.modeId && 'bg-secondary',
                  tool.disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {tool.icon && <tool.icon className="h-4 w-4" />}
                <span>{tool.modeName}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
});

ModeSelect.displayName = 'ModeSelect';

export default ModeSelect;
