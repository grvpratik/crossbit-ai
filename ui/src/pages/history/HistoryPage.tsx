import { useChatHistory } from '@/hooks/queries/useChatQueries';
import { useAppKitEvents } from '@reown/appkit/react';

import React from 'react';
import { Link } from 'react-router';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';

const HistoryPage = () => {
  const events = useAppKitEvents().data.event;
  const { connection } = useAppKitConnection();

  console.log({ events, connection });
  const { data, error, isLoading } = useChatHistory();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="title-h2 p-5">History</div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      {data &&
        data?.result &&
        data.result.map((chat) => {
          return (
            <Link
              to={`/chat/${chat.id}`}
              className=" bg-blue-300 rounded-2xl py-3 px-2 m-12"
              key={chat.id}
            >
              {chat.title}
            </Link>
          );
        })}{' '}
    </div>
  );
};

export default HistoryPage;
