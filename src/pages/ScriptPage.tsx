import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ScriptRenderer from '../components/ScriptRenderer';
import { parseScript, ScriptInfo, Region } from '../utils/scriptParser';

const ScriptPage: React.FC = () => {
  const { id, scriptId } = useParams<{ id: string; scriptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [scriptContent, setScriptContent] = useState<string>('');
  const [scriptInfo, setScriptInfo] = useState<ScriptInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const { scriptLink, questName } = (location.state as any) || {};

  useEffect(() => {
    const fetchScript = async () => {
      if (!scriptLink) {
        setError('No script link provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(scriptLink);
        if (!response.ok) throw new Error('Failed to fetch script');

        const text = await response.text();
        setScriptContent(text);

        // Identify Region (simplified logic or default)
        // Could infer from URL if needed: scriptLink.includes('/NA/') ? Region.NA : Region.JP
        let region = Region.JP;
        if (scriptLink.includes('/NA/')) region = Region.NA;
        else if (scriptLink.includes('/CN/')) region = Region.CN;
        else if (scriptLink.includes('/KR/')) region = Region.KR;
        else if (scriptLink.includes('/TW/')) region = Region.TW;

        const parsed = parseScript(region, text);
        setScriptInfo(parsed);

      } catch (err: any) {
        console.error('Error fetching script:', err);
        setError(err.message || 'Failed to load script');
      } finally {
        setLoading(false);
      }
    };

    fetchScript();
  }, [scriptLink]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-400 animate-pulse">Loading Script...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center bg-gray-900 min-h-screen">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Error Loading Script</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => navigate(`/quest/${id}`)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Quest
        </button>
      </div>
    );
  }

  return (
    <div className=" bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <button
          onClick={() => navigate(`/quest/${id}`)}
          className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Quest
        </button>

        <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white p-6 rounded-lg shadow-lg border border-gray-700 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1">Quest Script</h1>
            {questName && <p className="text-blue-200 text-lg font-medium">{questName}</p>}
            <p className="text-xs text-gray-400 mt-2 font-mono">ID: {scriptId}</p>
          </div>
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </div>
      </div>

      {/* Script Renderer */}
      {scriptInfo && (
        <ScriptRenderer
          script={scriptInfo}
          region={scriptLink?.includes('/NA/') ? Region.NA : Region.JP} // Redundant check for prop passing
        />
      )}

      {/* Raw Script Toggle */}
      <div className="max-w-5xl mx-auto px-4 pb-12 mt-8">
        <details className="border border-gray-700 rounded-lg overflow-hidden bg-gray-950">
          <summary className="px-6 py-4 cursor-pointer hover:bg-gray-900 font-medium text-gray-400 select-none">
            View Raw Script
          </summary>
          <div className="px-6 py-4 bg-black/50 border-t border-gray-800">
            <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono overflow-x-auto h-[500px] overflow-y-auto custom-scrollbar">
              {scriptContent}
            </pre>
          </div>
        </details>

        {/* Download Button */}
        <div className="mt-6 flex justify-end">
          <a
            href={scriptLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2 text-sm border border-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Original
          </a>
        </div>
      </div>
    </div>
  );
};

export default ScriptPage;
