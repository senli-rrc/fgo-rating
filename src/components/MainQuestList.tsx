import React, { useEffect, useState } from 'react';
import { War } from '../types';
import { fetchWarData } from '../services/atlasService';

interface MainQuestListProps {
    region: string;
}

const MainQuestList: React.FC<MainQuestListProps> = ({ region }) => {
    const [wars, setWars] = useState<War[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchWarData(region);
                setWars(data);
            } catch (error) {
                console.error("Failed to load war data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [region]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 animate-pulse">Loading Main Records ({region})...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-2 brand-font">Main Quests ({region})</h1>
                <p className="text-gray-500">Chronicle of the Grand Order</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wars.map((war) => (
                    <div 
                        key={war.id} 
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 group"
                    >
                        {/* Banner Image - Aspect Ratio adjusted for 450x125, background set to white */}
                        <div className="w-full aspect-[450/125] bg-white overflow-hidden relative">
                             {war.banner ? (
                                <img 
                                    src={war.banner} 
                                    alt={war.longName} 
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-200">
                                    No Banner Available
                                </div>
                             )}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                             <div className="absolute bottom-0 left-0 p-4">
                                <span className="text-xs font-bold text-yellow-400 bg-black/60 px-2 py-1 rounded backdrop-blur-sm mb-1 inline-block">
                                    ID: {war.id}
                                </span>
                             </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {war.age}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                                {war.name}
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">{war.longName}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MainQuestList;