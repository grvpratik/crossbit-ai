import React from 'react';
import {
  
  createAppKit,
  type CaipNetworkId,
  type SIWXMessage,
  type SIWXSession,
} from '@reown/appkit/react';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';

import { solana } from '@reown/appkit/networks';
import {
  DefaultSIWX,
  SIWXMessenger,
  type SIWXStorage,
  SolanaVerifier,
} from '@reown/appkit-siwx';
import { BackendStorage } from '@/lib/siwx-session';

export class LocalStorage implements SIWXStorage {
  private key: string;

  constructor(params: LocalStorage.ConstructorParams) {
    this.key = params.key;
  }

  add(session: SIWXSession): Promise<void> {
    console.log('add local', { session });

    const sessions = this.getSessions();
    sessions.push(session);
    this.setSessions(sessions);

    return Promise.resolve();
  }

  set(sessions: SIWXSession[]): Promise<void> {
    console.log('set local', { sessions });
    this.setSessions(sessions);

    return Promise.resolve();
  }

  get(chainId: CaipNetworkId, address: string): Promise<SIWXSession[]> {
    console.log(' get local', { chainId, address });
    const allSessions = this.getSessions();

    const validSessions = allSessions.filter((session) => {
      const isSameChain = session.data.chainId === chainId;
      const isSameAddress = session.data.accountAddress === address;

      const startsAt = session.data.notBefore || session.data.issuedAt;
      if (startsAt && Date.parse(startsAt) > Date.now()) {
        return false;
      }

      const endsAt = session.data.expirationTime;
      if (endsAt && Date.now() > Date.parse(endsAt)) {
        return false;
      }

      return isSameChain && isSameAddress;
    });

    return Promise.resolve(validSessions);
  }

  delete(chainId: string, address: string): Promise<void> {
    console.log('delete local', { chainId, address });
    const sessions = this.getSessions().filter(
      (session) =>
        session.data.chainId !== chainId &&
        session.data.accountAddress !== address,
    );
    this.setSessions(sessions);

    return Promise.resolve();
  }

  private getSessions(): LocalStorage.Sessions {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage not available');
    }

    const stringItem = localStorage.getItem(this.key);

    return stringItem ? JSON.parse(stringItem) : [];
  }

  private setSessions(sessions: LocalStorage.Sessions): void {
    localStorage.setItem(this.key, JSON.stringify(sessions));
  }
}
export namespace LocalStorage {
  export type ConstructorParams = {
    /**
     * The key to save the sessions in the localStorage.
     */
    key: string;
  };

  export type Sessions = SIWXSession[];
}
class AppMessenger extends SIWXMessenger {
  protected readonly version = '1';

  protected override stringify(params: SIWXMessage.Data): string {
    return (
      `${params.statement || 'Sign in with your wallet'}\n` +
      `URI: ${params.uri}\n` +
      `Version: ${params.version}\n` +
      `Chain ID: ${params.chainId}\n` +
      `Nonce: ${params.nonce}\n` +
      `Issued At: ${params.issuedAt}\n` +
      `${
        params.expirationTime
          ? `Expiration Time: ${params.expirationTime}\n`
          : ''
      }` +
      `${params.requestId ? `Request ID: ${params.requestId}\n` : ''}` +
      `Address: ${params.accountAddress}`
    );
  }
}

const siwx = new DefaultSIWX({
  messenger: new AppMessenger({
    domain: 'https://upmint.ai',
    uri: 'https://upmint.ai',
    statement: 'Sign in to Upmint AI',
    resources: [],
    expiration: 24 * 60 * 60 * 1000,
    getNonce: async () => Math.random().toString(36).substring(2),
    getRequestId: async () =>
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).substring(2)}`,
  }),
  verifiers: [new SolanaVerifier()],
  storage: new BackendStorage(),
});

const solanaWeb3JsAdapter = new SolanaAdapter();

const metadata = {
  name: 'UPMINT AI',
  description: 'Your AI assistant ',
  url: 'https://upmint.ai',
  icons: ['/vite.svg'],
};

createAppKit({
  adapters: [solanaWeb3JsAdapter],
  networks: [solana],
  metadata: metadata,
  siwx,
  features: {
    email: false,
    analytics: true,
    socials: ['google', 'x', 'discord'],
  },
  projectId: 'd593c206db1515e0a5b3a31dbcc16db7',

  allWallets: 'HIDE',
  enableWalletConnect: false,
  debug: true,
});

export default function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {


  
  return <>{children}</>;
}
