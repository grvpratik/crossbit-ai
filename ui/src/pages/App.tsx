import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from '@/pages/Layout';

import ChatDetailsPage from '@/pages/chat/ChatDetailsPage';
import HistoryPage from '@/pages/history/HistoryPage';
import ChatPage from '@/pages/chat/ChatPage';
import DiscoverPage from '@/pages/discover/DiscoverPage';
import NotFoundPage from '@/pages/NotFoundPage';


import { ThemeProvider } from '@/components/wrappers/theme-provider';
import WalletProvider from '@/components/wrappers/wallet-provider';

import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient();

function RoutesWrapper() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="chat/:id" element={<ChatDetailsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WalletProvider>
          <BrowserRouter>
            <RoutesWrapper />
         
            <Toaster position="top-center" richColors />
          </BrowserRouter>
        </WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
