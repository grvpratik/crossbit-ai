interface LoadingPageProps {
  title?: string;
  loadingKey?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ title, loadingKey }) => {
  const displayText = title || `Loading ${loadingKey || '...'}`;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <div className="text-lg text-gray-700">{displayText}</div>
      </div>
    </div>
  );
};

export default LoadingPage;
