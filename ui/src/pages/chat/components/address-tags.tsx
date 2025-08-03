'use client';

import type React from 'react';
import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccountIdentifierEnum } from '@/lib/solana';
import type { UserAddress } from '@/types/chat.types';

interface AddressTagsProps {
  addressTags: UserAddress[];
  onDelete: (address: string) => void;
  className?: string;
}

/**
 * Truncates an address to show only the first 6 and last 4 characters
 */
const truncateAddress = (address: string): string => {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Maps account identifier types to appropriate styling
 */
const getTypeStyles = (
  type: AccountIdentifierEnum,
): { badge: string; text: string } => {
  const styleMap = {
    SYSTEM: {
      badge: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-200',
      text: 'text-yellow-800',
    },
    TOKEN: {
      badge: 'bg-green-100 hover:bg-green-200 border-green-200',
      text: 'text-green-800',
    },
    ASSOCIATED_TOKEN: {
      badge: 'bg-blue-100 hover:bg-blue-200 border-blue-200',
      text: 'text-blue-800',
    },
    PROGRAM: {
      badge: 'bg-purple-100 hover:bg-purple-200 border-purple-200',
      text: 'text-purple-800',
    },
  };

  return (
    styleMap[type] || {
      badge: 'bg-gray-100 hover:bg-gray-200 border-gray-200',
      text: 'text-gray-800',
    }
  );
};

/**
 * Individual address tag component
 */
const AddressTag: React.FC<{
  address: string;
  type: AccountIdentifierEnum;
  onDelete: (address: string) => void;
}> = memo(({ address, type, onDelete }) => {
  const styles = getTypeStyles(type);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-full border',
              styles.badge,
              styles.text,
            )}
          >
            <span className="text-sm font-medium">
              {truncateAddress(address)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(address);
              }}
              className={cn(
                'h-4 w-4 p-0 rounded-full hover:bg-opacity-30',
                styles.text,
              )}
              aria-label={`Remove ${address}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-mono text-xs">{address}</p>
          <p className="text-xs text-primary-foreground">{type}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

AddressTag.displayName = 'AddressTag';

/**
 * Component for displaying and managing address tags
 */
const AddressTags: React.FC<AddressTagsProps> = memo(
  ({ addressTags, onDelete, className }) => {
    if (!addressTags.length) return null;

    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {addressTags.map(({ address, type }) => (
          <AddressTag
            key={address}
            address={address}
            type={type}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  },
);

AddressTags.displayName = 'AddressTags';

export default AddressTags;
