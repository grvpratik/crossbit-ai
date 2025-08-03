import type { SIWXStorage } from '@reown/appkit-siwx';
import type { SIWXSession } from '@reown/appkit/react';
import { api, isSuccess } from './api';

export class BackendStorage implements SIWXStorage {
  private url: string;

  constructor(url = '/api/auth/sessions') {
    this.url = url;
  }

  async add(session: SIWXSession): Promise<void> {
    try {
      const response = await api.post(this.url, JSON.stringify(session));
      if (!isSuccess(response)) {
        throw new Error(`Failed to add session: ${response.error.message}`);
      }
    } catch (error) {
      console.error('Error adding session:', error);
      throw error;
    }
  }

  async set(sessions: SIWXSession[]): Promise<void> {
    try {
      const response = await api.put(this.url, JSON.stringify(sessions));
      if (!isSuccess(response)) {
        throw new Error(`Failed to set sessions: ${response.error.message}`);
      }
    } catch (error) {
      console.error('Error setting sessions:', error);
      throw error;
    }
  }

  async get(chainId: string, address: string): Promise<SIWXSession[]> {
    try {
      const response = await api.get<SIWXSession[]>(
        `/api/auth/sessions?chainId=${encodeURIComponent(chainId)}&address=${encodeURIComponent(address)}`,
      );
      if (!isSuccess(response)) {
        console.error(
          `Unexpected error fetching sessions: ${response.error.message}`,
        );
        return [];
      }
      return await response.result;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  async delete(chainId: string, address: string): Promise<void> {
    try {
      const response = await api.delete(
        `/api/auth/sessions?chainId=${encodeURIComponent(chainId)}&address=${encodeURIComponent(address)}`,
      );
      if (!isSuccess(response)) {
        throw new Error(`Failed to delete sessions: ${response.error.message}`);
      }
    } catch (error) {
      console.error('Error deleting sessions:', error);
      throw error;
    }
  }
}

// import type { SIWXStorage } from '@reown/appkit-siwx';
// import type { SIWXSession } from '@reown/appkit/react';
// import { api, isSuccess } from './api';

// export class BackendStorage implements SIWXStorage {
//   private url: string;

//   constructor(url = '/api/auth/sessions'.trim()) {
//     this.url = url;
//   }

//   async add(session: SIWXSession): Promise<void> {
//     console.log('add ', session);
//     const response = await api.post(this.url, JSON.stringify(session));

//     if (!isSuccess(response)) {
//       return Promise.reject(`Failed to add session: ${response.error}`);
//     }

//     return Promise.resolve();
//   }

//   async set(sessions: SIWXSession[]): Promise<void> {
//     console.log('set',sessions);
//     const response = await api.put(this.url, JSON.stringify(sessions));
//     console.log(response,"put ")
//     if (!isSuccess(response)) {

//       return Promise.reject();
//     }

//     return Promise.resolve();
//   }

//   async get(chainId: string, address: string): Promise<SIWXSession[]> {
//     console.log('get',chainId,address)
//     try {
//       const response = await api.get<SIWXSession[]>(
//         `/api/auth/sessions?chainId=${encodeURIComponent(
//           chainId,
//         )}&address=${encodeURIComponent(address)}`,
//       );
//       if (!isSuccess(response)) {
//         console.error(
//           `Unexpected error fetching sessions: ${response.error.message}`,
//         );
//         return [];
//       }

//       const sessions: SIWXSession[] = await response.result;
//       console.log(sessions, 'client-side getSessions');
//       return sessions;
//     } catch (error) {
//       console.error('Error fetching sessions:', error);
//       return [];
//     }
//   }

//   async delete(chainId: string, address: string): Promise<void> {
//     console.log('delete');
//     const response = await api.delete(
//       `/api/auth/sessions?chainId=${encodeURIComponent(
//         chainId,
//       )}&address=${encodeURIComponent(address)}`,
//     );
//     if (!isSuccess(response)) {
//       return Promise.reject(
//         `Failed to delete sessions: ${response.error.message}`,
//       );
//     }

//     return Promise.resolve();
//   }
// }
