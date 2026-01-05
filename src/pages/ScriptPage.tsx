import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

interface ScriptLine {
  type: 'dialogue' | 'action' | 'choice' | 'unknown';
  speaker?: string;
  content: string;
  original: string;
}

const ScriptPage: React.FC = () => {
  const { id, scriptId } = useParams<{ id: string; scriptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [scriptContent, setScriptContent] = useState<string>('');
  const [parsedLines, setParsedLines] = useState<ScriptLine[]>([]);
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
        setParsedLines(parseScript(text));
      } catch (err: any) {
        console.error('Error fetching script:', err);
        setError(err.message || 'Failed to load script');
      } finally {
        setLoading(false);
      }
    };

    fetchScript();
  }, [scriptLink]);

  const parseScript = (text: string): ScriptLine[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsed: ScriptLine[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
        continue;
      }

      // Parse dialogue lines (format: "Speaker: Content" or just content in quotes)
      if (trimmed.includes(':') && !trimmed.startsWith('[')) {
        const colonIndex = trimmed.indexOf(':');
        const speaker = trimmed.substring(0, colonIndex).trim().replace(/["\[\]]/g, '');
        const content = trimmed.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
        
        parsed.push({
          type: 'dialogue',
          speaker: speaker,
          content: content || trimmed,
          original: trimmed
        });
      }
      // Parse action/stage directions (format: [Action])
      else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        parsed.push({
          type: 'action',
          content: trimmed.substring(1, trimmed.length - 1).trim(),
          original: trimmed
        });
      }
      // Parse choice options
      else if (trimmed.match(/^(\d+\.|\*|\-)/)) {
        parsed.push({
          type: 'choice',
          content: trimmed.replace(/^(\d+\.|\*|\-)\s*/, ''),
          original: trimmed
        });
      }
      // Everything else
      else {
        parsed.push({
          type: 'unknown',
          content: trimmed,
          original: trimmed
        });
      }
    }

    return parsed;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 animate-pulse">Loading Script...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Error Loading Script</h1>
        <p className="text-gray-600 mb-6">{error}</p>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/quest/${id}`)}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Quest
        </button>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Quest Script</h1>
          {questName && <p className="text-blue-100">{questName}</p>}
          <p className="text-sm text-blue-200 mt-2">Script ID: {scriptId}</p>
        </div>
      </div>

      {/* Script Content */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            {parsedLines.map((line, index) => (
              <div key={index} className="script-line">
                {line.type === 'dialogue' && (
                  <div className="flex gap-4">
                    {line.speaker && (
                      <div className="font-bold text-blue-700 min-w-[120px] text-right">
                        {line.speaker}:
                      </div>
                    )}
                    <div className="flex-1 text-gray-800">{line.content}</div>
                  </div>
                )}

                {line.type === 'action' && (
                  <div className="text-center italic text-gray-600 bg-gray-50 py-2 px-4 rounded">
                    [{line.content}]
                  </div>
                )}

                {line.type === 'choice' && (
                  <div className="ml-8 pl-4 border-l-4 border-purple-400 text-purple-700 font-medium">
                    → {line.content}
                  </div>
                )}

                {line.type === 'unknown' && (
                  <div className="text-gray-700">{line.content}</div>
                )}
              </div>
            ))}
          </div>

          {parsedLines.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No script content to display</p>
            </div>
          )}
        </div>

        {/* Raw Script Toggle */}
        <details className="border-t border-gray-200">
          <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 font-medium text-gray-700">
            View Raw Script
          </summary>
          <div className="px-6 py-4 bg-gray-50">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono overflow-x-auto">
              {scriptContent}
            </pre>
          </div>
        </details>
      </div>

      {/* Download Button */}
      <div className="mt-6 flex justify-end">
        <a
          href={scriptLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Original
        </a>
      </div>
    </div>
  );
};

export default ScriptPage;
