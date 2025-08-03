import { Search, Wallet, MessageSquare, Code, LayoutGrid, Settings, HandCoins, BrainCog } from 'lucide-react';
import { AccountIdentifiers, type AccountIdentifierEnum } from "./solana";

export interface ChatMode {
  modeId: string;
  modeName: string;
  description?: string;
  disabled: boolean;
  featured: boolean;
  requiredAddress?:number
icon: React.ComponentType<any>;
  requiredTokenTypes?: AccountIdentifierEnum[];
}

export const TOOLS: ChatMode[] = [
  {
    modeId: 'token-analyser',
    modeName: 'Token Analyser',
    description: 'In-depth research on token',
    featured: true,
    disabled: false,
    icon: BrainCog,
    requiredTokenTypes: [AccountIdentifiers.TOKEN],
  },
  {
    modeId: 'wallet-research',
    modeName: 'Wallet Research',
    description: 'Research wallet transactions and data',
    featured: false,
    disabled: false,
    icon: Wallet,
    requiredTokenTypes: [AccountIdentifiers.SYSTEM],
  },
  
  {
    modeId: 'dashboard',
    modeName: 'Dashboard',
    description: 'View statistics and analytics',
    featured: false,
    disabled: false,
    icon: LayoutGrid,
  },
  {
    modeId: 'settings',
    modeName: 'Settings',
    description: 'Configure app settings',
    featured: false,
    disabled: true,
    icon: Settings,
  },
];

export const getTools = () => {
  return TOOLS;
};

export type ModeId = typeof TOOLS[number]['modeId'];