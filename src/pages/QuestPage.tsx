import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { War } from '../types';
import { dbService } from '../services/dbService';

type QuestType = 'main' | 'free' | 'interlude';

const QuestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [war, setWar] = useState<War | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<QuestType>('main');

  useEffect(() => {
    const loadWar = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const wars = await dbService.getAllWars();
        const foundWar = wars.find(w => w.id === parseInt(id));
        setWar(foundWar || null);
      } catch (error) {
        console.error('Failed to load war data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWar();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 animate-pulse">Loading Quest Details...</p>
        </div>
      </div>
    );
  }

  if (!war) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Quest Not Found</h1>
        <p className="text-gray-600 mb-6">The quest you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/mainquests')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Main Quests
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate('/mainquests')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Main Quests
      </button>

      {/* Header Image */}
      {/* {war.headerImage && (
        <div className="w-full mb-8 rounded-lg overflow-hidden shadow-lg flex justify-center bg-gray-100">
          <img
            src={war.headerImage}
            alt={war.longName}
            width={325}
            height={70}
            className="object-contain"
          />
        </div>
      )} */}

      {/* Quest Details Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        {/* Banner Section */}
        {/* {war.banner && (
          <div className="w-full bg-white flex justify-center">
            <img
              src={war.banner}
              alt={war.longName}
              width={450}
              height={139}
              className="object-contain"
            />
          </div>
        )} */}

        {/* Content Section */}
        <div className="p-8">
          {/* Age Tag */}
          {war.age && (
            <div className="mb-4">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold text-sm uppercase tracking-wider">
                {war.age}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2 brand-font">
            {war.name}
          </h1>

          {/* Long Name */}
          <p className="text-xl text-gray-600 font-medium mb-6">
            {war.longName}
          </p>

          {/* Quest Info Grid */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-200">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Quest ID</div>
              <div className="text-2xl font-bold text-gray-900">{war.id}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Priority</div>
              <div className="text-2xl font-bold text-gray-900">{war.priority}</div>
            </div>
          </div> */}

          {/* Additional Info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Main Quests</h2>

            {war.quests && war.quests.length > 0 ? (
              <div>
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                  {(['main', 'free', 'interlude'] as QuestType[]).map(tab => {
                    const count = war.quests?.filter(q => q.type === tab).length || 0;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                          activeTab === tab
                            ? 'bg-white text-blue-600 shadow'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Quest Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scripts</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {war.quests
                        .filter(quest => quest.type === activeTab)
                        .sort((a, b) => a.id - b.id)
                        .map((quest, index) => (
                          <tr key={`${quest.section}-${quest.id}-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-mono">{quest.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{quest.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{quest.spot}</td>
                            <td className="px-6 py-4 text-sm">
                              {quest.scripts && quest.scripts.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {quest.scripts.map((script, idx) => (
                                    <button
                                      key={`${script.scriptId}-${idx}`}
                                      onClick={() => navigate(`/quest/${war.id}/script/${script.scriptId}`, {
                                        state: { scriptLink: script.scriptLink, questName: quest.name }
                                      })}
                                      className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-xs font-medium transition-colors"
                                    >
                                      {idx + 1}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {war.quests.filter(q => q.type === activeTab).length === 0 && (
                    <div className="text-center py-8 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-500">No {activeTab} quests available for this war.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-600">
                  No quest information available. Please contact admin to update quest data from the Atlas Academy API.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestPage;
