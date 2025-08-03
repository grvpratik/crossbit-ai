import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  SkipForward,
  ArrowRight,
} from 'lucide-react';

// Define the types for our component
const statusIcons = {
  waiting: <Clock className="text-gray-400" />,
  processing: (
    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  ),
  completed: <CheckCircle className="text-green-500" />,
  skipped: <SkipForward className="text-yellow-500" />,
  failed: <XCircle className="text-red-500" />,
};

const statusColors = {
  waiting: 'bg-gray-100',
  processing: 'bg-blue-100',
  completed: 'bg-green-100',
  skipped: 'bg-yellow-100',
  failed: 'bg-red-100',
};

export default function TokenResearchUI({
  toolCallId,
  toolName,
  steps,
  currentStep,
  overallProgress,
  completed,
  summary,
}) {
  const [mintAddress, setMintAddress] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchData, setResearchData] = useState(null);

  // When completed is true and we have summary data, update the researchData
  useEffect(() => {
    if (completed && summary) {
      setResearchData(summary);
      setIsResearching(false);
    }
  }, [completed, summary]);

  const handleStartResearch = () => {
    if (!mintAddress) return;
    setIsResearching(true);
    // This would trigger your tool execution
    // Replace with your actual tool triggering logic
    console.log(`Starting research for: ${mintAddress}`);
  };

  if (!isResearching && !steps) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Token Research Tool</h2>
        <p className="mb-4">
          Enter a token mint address to perform a comprehensive analysis:
        </p>

        <div className="flex space-x-2 mb-6">
          <input
            type="text"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            placeholder="Enter mint address"
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleStartResearch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Research
          </button>
        </div>

        {researchData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">
              Previous Research Results
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Token:</span> {researchData.name}{' '}
                ({researchData.symbol})
              </div>
              <div>
                <span className="font-medium">Market Cap:</span>{' '}
                {researchData.marketCap}
              </div>
              <div>
                <span className="font-medium">Sentiment:</span>{' '}
                {researchData.sentiment}
              </div>
              <div>
                <span className="font-medium">Risk Level:</span>{' '}
                {researchData.riskLevel}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Token Research: {mintAddress}</h2>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mt-3">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="text-right text-sm text-gray-600 mt-1">
          {overallProgress}% Complete
        </div>
      </div>

      {/* Steps Progress */}
      <div className="space-y-3">
        {steps &&
          steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-3 rounded-lg ${statusColors[step.status]} transition-all duration-300`}
            >
              <div className="flex items-center">
                <div className="mr-3">{statusIcons[step.status]}</div>
                <div className="flex-1">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                  {step.message && (
                    <p className="text-sm italic mt-1">{step.message}</p>
                  )}
                </div>
                {step.status === 'completed' && step.result && (
                  <button
                    className="ml-2 px-3 py-1 bg-white rounded-md text-blue-600 text-sm hover:bg-blue-50"
                    onClick={() =>
                      console.log(`View details of ${step.id}`, step.result)
                    }
                  >
                    Details
                  </button>
                )}
              </div>

              {/* Show result preview if completed */}
              {step.status === 'completed' && step.result && (
                <div className="mt-2 ml-8 text-sm">
                  {typeof step.result === 'object' && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {Object.entries(step.result)
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center">
                            <span className="text-gray-500 mr-1">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Summary when completed */}
      {completed && summary && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <CheckCircle className="text-green-500 mr-2" />
            Research Complete
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="font-medium">Token:</span> {summary.name} (
              {summary.symbol})
            </div>
            <div>
              <span className="font-medium">Market Cap:</span>{' '}
              {summary.marketCap}
            </div>
            <div>
              <span className="font-medium">Sentiment:</span>{' '}
              {summary.sentiment}
            </div>
            <div>
              <span className="font-medium">Risk Level:</span>{' '}
              {summary.riskLevel}
            </div>
          </div>
          <div className="mt-4">
            <span className="font-medium">Recommendation:</span>{' '}
            {summary.recommendedAction}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              onClick={() => console.log('View full report')}
            >
              View Full Report <ArrowRight className="ml-1 w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
