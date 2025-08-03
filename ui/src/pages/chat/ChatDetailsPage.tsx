import { useChatDetails } from '@/hooks/queries/useChatQueries';
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import ChatArtifact from './components/chat-artifact';
import { isSuccess } from '@/lib/api';
import { useAppKitAccount } from '@reown/appkit/react';

const ChatDetailsPage: React.FC = () => {
  console.warn("CHAT DETAILS PAGE RENDER")
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, status: walletStatus } = useAppKitAccount();

  // ❗Always call hooks
  useEffect(() => {
    if (walletStatus === 'disconnected' ) {
      navigate('/');
    }
  }, [walletStatus, navigate]);

 
  const { data, isLoading, error } = useChatDetails(id ?? ''); 

  if (!id) {
    return <div>Chat not found</div>;
  }

  if (!isConnected) {
    return <div>auth required</div>;
  }
  if(isLoading) return <div>loading</div>
 
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Chat</h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'Unknown error occurred'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }


  if (!isSuccess(data)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chat Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The requested chat could not be found.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Extract data safely
  const messages = data?.result?.messages || [];
  const chatTitle = data?.result?.title;

  return (
    <ChatArtifact
      initialMessages={messages as any}
      id={id}
      title={chatTitle}
      loadingMessages={false}
    />
  );
};

export default ChatDetailsPage;




// import { useChatDetails } from '@/hooks/queries/useChatQueries';
// import React, { useEffect, useState } from 'react';
// import { Navigate, useNavigate, useParams } from 'react-router';
// import ChatArtifact from './components/chat-artifact';
// import { isSuccess } from '@/lib/api';
// import { useAppKitAccount } from '@reown/appkit/react';

// const ChatDetailsPage: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const [localQuery, setLocalQuery] = useState<string | null>(null);
//   const [checkedLocal, setCheckedLocal] = useState(false);
//   const navigate = useNavigate();
//   const { data, isLoading, error } = useChatDetails(id!);
//   const { address, isConnected, status } = useAppKitAccount();
//   useEffect(() => {
//     const checkLocalData = () => {
//       if (!isConnected) {
//         navigate('/');
//         return;
//       }
//       if (!id) return;

//       const localData = localStorage.getItem(id);
//       if (localData) {
//         setLocalQuery(localData);
//         localStorage.removeItem(id);
//       }
//       setCheckedLocal(true);
//     };

//     checkLocalData();
//   }, [id, isConnected]);

//   if (!id) {
//     return <>Not found</>;
//   }

//   if (!checkedLocal) return <div>Loading...</div>;

//   if (localQuery) {
//     return <ChatArtifact initialMessages={[]} id={id} query={localQuery} />;
//   }

//   if (isLoading) {
//     return <div>Loading chat...</div>;
//   }

//   if (error || !isSuccess(data!)) {
//     return <div>Error: {error?.message || 'Unknown error'}</div>;
//   }

//   const messages = data?.success ? data.result.messages : [];
//   const chatTitle = data?.result?.title ?? undefined;
//   return (
//     <ChatArtifact initialMessages={messages as any} id={id} title={chatTitle} />
//   );
// };

// export default ChatDetailsPage;
