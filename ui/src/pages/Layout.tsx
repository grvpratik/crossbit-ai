import { Outlet } from 'react-router';

import SidebarWrapper from '@/components/nav/sidebar-wrapper';
import { defaultNavigationConfig } from '@/config/navigation';



const Layout = () => {
 
  return (
    <main className="w-full h-full flex flex-col lg:flex-row min-h-screen ">
      <SidebarWrapper config={defaultNavigationConfig}>
        <Outlet />
      </SidebarWrapper>
    </main>
  );
};

export default Layout;







// function WalletInfo() {
//   const { address, isConnected } = useAppKitAccount();
//   const { chainId } = useAppKitNetwork();
//   const { walletProvider } = useAppKitProvider('solana');

//   useEffect(() => {
//     const onAccountsChanged = (accounts) => {
//       // Handle wallet address change
//       console.log('Wallet address changed:', accounts);
//     };

//     const onChainChanged = (newChainId) => {
//       // Handle network change
//       console.log('Network changed:', newChainId);
//     };

//     // Listen for accountsChanged events
//     if (walletProvider! && walletProvider.on) {
//       walletProvider.on('accountsChanged', onAccountsChanged);
//       walletProvider.on('chainChanged', onChainChanged);
//     }

//     return () => {
//       // Clean up listeners when the component unmounts
//       if (walletProvider && walletProvider.off) {
//         walletProvider.off('accountsChanged', onAccountsChanged);
//         walletProvider.off('chainChanged', onChainChanged);
//       }
//     };
//   }, [walletProvider]);

//   return (
//     <div>
//       <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
//       <p>Address: {address}</p>
//       <p>Chain ID: {chainId}</p>
//     </div>
//   );
// }
