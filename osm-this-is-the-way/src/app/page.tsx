// app/page.tsx
'use client';

import { useState } from 'react';
import OSMInput from '@/components/OSMInput';
import Timeline from '@/components/Timeline';
import VersionComparison from '@/components/VersionComparison';
import { OSMElement, OSMHistory } from '@/types';
import { fetchOSMHistory } from '@/utils/api';


export default function Home() {
  const [history, setHistory] = useState<OSMHistory | null>(null);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  const handleFetchHistory = async (elementType: string, elementId: string) => {
    setLoading(true);
    setError(null);

    const handleFetchHistory = async (elementType: string, elementId: string) => {
      setLoading(true);
      setError(null);

      try {
        // Store the raw API response for debugging
        const response = await fetchOSMHistory(elementType, elementId);
        setApiResponse(response);
        setHistory(response);
        // Select the latest version by default
        setSelectedVersionIndex(response.elements.length > 1 ? response.elements.length - 2 : null);
      } catch (err) {
        setError(`Failed to fetch history: ${err instanceof Error ? err.message : String(err)}`);
        setHistory(null);
        setApiResponse(null);
      } finally {
        setLoading(false);
      }
    };

    try {
      // We'll implement this function later
      const historyData = await fetchOSMHistory(elementType, elementId);
      setHistory(historyData);
      // Select the latest version by default
      setSelectedVersionIndex(historyData.elements.length > 1 ? historyData.elements.length - 2 : null);
    } catch (err) {
      setError(`Failed to fetch history: ${err instanceof Error ? err.message : String(err)}`);
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">OSM History Viewer</h1>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            {debugMode ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>

        <OSMInput onSubmit={handleFetchHistory} />

        {loading && (
          <div className="my-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="my-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {history && history.elements.length > 0 && (
          <div className="mt-8 space-y-6">
            <Timeline
              versions={history.elements}
              selectedVersionIndex={selectedVersionIndex}
              onSelectVersion={setSelectedVersionIndex}
            />

            {selectedVersionIndex !== null && selectedVersionIndex < history.elements.length - 1 && (
              <VersionComparison
                oldVersion={history.elements[selectedVersionIndex]}
                newVersion={history.elements[selectedVersionIndex + 1]}
              />
            )}
          </div>
        )}
        {/* Debug Panel */}
        {debugMode && apiResponse && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">API Response Summary</h3>
                <p>Total versions: {apiResponse.elements.length}</p>
                <p>First version: {apiResponse.elements[0]?.version}</p>
                <p>Latest version: {apiResponse.elements[apiResponse.elements.length - 1]?.version}</p>
              </div>

              <div>
                <h3 className="font-medium">Raw Response</h3>
                <pre className="mt-2 p-3 bg-gray-800 text-green-400 rounded overflow-auto max-h-96 text-xs">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

