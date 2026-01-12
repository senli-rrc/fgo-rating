import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ScriptRenderer from '../components/ScriptRenderer';
import { parseScript, ScriptInfo, Region } from '../utils/scriptParser';
import { dbService } from '../services/dbService';
import { User } from '../types';

interface ScriptPageProps {
  user: User | null;
}

const ScriptPage: React.FC<ScriptPageProps> = ({ user }) => {
  const { region: paramRegion, id, scriptId } = useParams<{ region: string; id: string; scriptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [scriptContent, setScriptContent] = useState<string>('');
  const [scriptInfo, setScriptInfo] = useState<ScriptInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [war, setWar] = useState<any | null>(null);
  const [prevScript, setPrevScript] = useState<any | null>(null);
  const [nextScript, setNextScript] = useState<any | null>(null);

  // Still use navigation state for initial context, but try to load specific data if missing
  const { scriptLink } = (location.state as any) || {};

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch War/Quest Data if ID is present
        let currentScriptLink = scriptLink;
        let currentQuestName = "";

        if (id) {
          const wars = await dbService.getAllWars(paramRegion);
          const foundWar = wars.find(w => w.id === parseInt(id));
          setWar(foundWar || null);

          if (foundWar && scriptId) {
            // Find the flat list of all scripts in this War to determine order
            // Note: The data structure matches QuestPage: War -> Quests -> Scripts
            const allScripts: { scriptId: string; scriptLink: string; questName: string; questId: number }[] = [];

            foundWar.quests.forEach(quest => {
              if (quest.scripts) {
                quest.scripts.forEach(s => {
                  allScripts.push({
                    scriptId: s.scriptId,
                    scriptLink: s.scriptLink,
                    questName: quest.name,
                    questId: quest.id
                  });
                });
              }
            });

            const currentIndex = allScripts.findIndex(s => s.scriptId === scriptId);

            if (currentIndex !== -1) {
              const current = allScripts[currentIndex];
              currentScriptLink = current.scriptLink;
              currentQuestName = current.questName;

              setPrevScript(allScripts[currentIndex - 1] || null);
              setNextScript(allScripts[currentIndex + 1] || null);
            }
          }
        }

        // 2. Fetch Script Content
        if (!currentScriptLink) {
          // If we still don't have a link (e.g. deep link with bad ID), error
          throw new Error('Script link not found');
        }

        const response = await fetch(currentScriptLink);
        if (!response.ok) throw new Error('Failed to fetch script');

        const text = await response.text();
        setScriptContent(text);

        // Region Check from URL
        let region = Region.JP;
        if (currentScriptLink.includes('/NA/')) region = Region.NA;
        else if (currentScriptLink.includes('/CN/')) region = Region.CN;
        else if (currentScriptLink.includes('/KR/')) region = Region.KR;
        else if (currentScriptLink.includes('/TW/')) region = Region.TW;

        const parsed = parseScript(region, text);
        setScriptInfo(parsed);

      } catch (err: any) {
        console.error('Error details:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, scriptId, scriptLink]);

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center h-[70vh] flex flex-col justify-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Error Loading Script</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate(`/${paramRegion}/quest/${id}`)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Quest
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in bg-gray-50 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/${paramRegion}/quest/${id}`)}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Quest
      </button>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900">
            {war?.name ? `${war.name} Script` : 'Script Viewer'}
          </h1>
          <p className="text-gray-500 text-sm font-mono mt-1">ID: {scriptId}</p>
        </div>

        {/* Content */}
        <div className="bg-gray-100 p-0 sm:p-4">
          {scriptInfo && (
            <ScriptRenderer
              script={scriptInfo}
              region={Region.JP} // Should be dynamic based on parsed region
              playerName={user?.username}
            />
          )}
        </div>

        {/* Footer / Navigation */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          {prevScript ? (
            <button
              onClick={() => navigate(`/${paramRegion}/quest/${id}/script/${prevScript.scriptId}`, {
                state: { scriptLink: prevScript.scriptLink }
              })}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all text-sm font-medium text-gray-700 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div>
                <span className="block text-xs text-gray-400 text-left">Previous</span>
                {/* Shorten name if needed */}
                {prevScript.questName}
              </div>
            </button>
          ) : (
            <div /> // Spacer
          )}

          {nextScript ? (
            <button
              onClick={() => navigate(`/${paramRegion}/quest/${id}/script/${nextScript.scriptId}`, {
                state: { scriptLink: nextScript.scriptLink }
              })}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all text-sm font-medium text-gray-700 shadow-sm text-right"
            >
              <div>
                <span className="block text-xs text-gray-400 text-right">Next</span>
                {nextScript.questName}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Raw Script (Hidden by default, keeping logic but removed form view as requested by "Hide raw script view") */}
      {/*
      <details className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
        ...
      </details>
      */}
    </div>
  );
};

export default ScriptPage;
