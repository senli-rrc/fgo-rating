import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Servant } from '../types';
import { CLASSES } from '../services/mockData';
import { dbService } from '../services/dbService';

interface RankingPageProps {
    servants: Servant[];
}

interface RankedServant extends Servant {
    topComment?: string;
    ratingCount: number;
}

const RankingPage: React.FC<RankingPageProps> = ({ servants }) => {
    const [activeCategory, setActiveCategory] = useState<number | 'ALL'>('ALL');
    const [rankedServants, setRankedServants] = useState<RankedServant[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRankingData = async () => {
            setLoading(true);

            // Filter by category
            let filtered = servants;
            if (activeCategory !== 'ALL') {
                filtered = servants.filter(s => s.classId === activeCategory);
            }

            const ratings = await dbService.getAllRatings();
            const ratingMap = new Map<number, number>(); // collectionNo -> count
            ratings.forEach(r => {
                ratingMap.set(r.collectionNo, (ratingMap.get(r.collectionNo) || 0) + 1);
            });

            const servantsWithData = filtered.map(s => ({
                ...s,
                ratingCount: ratingMap.get(s.collectionNo) || 0
            }));

            // Sort
            servantsWithData.sort((a, b) => {
                const scoreA = a.averageScore || 0;
                const scoreB = b.averageScore || 0;
                if (scoreB !== scoreA) return scoreB - scoreA;
                return b.ratingCount - a.ratingCount;
            });

            // Take top 50 for performance
            const topServants = servantsWithData.slice(0, 50);

            // Fetch top comments for these top servants
            const promises = topServants.map(async (s) => {
                const topRating = await dbService.getTopReviewForServant(s.collectionNo, 'JP');
                return {
                    ...s,
                    topComment: topRating?.comment
                };
            });

            const finalData = await Promise.all(promises);
            setRankedServants(finalData);
            setLoading(false);
        };

        fetchRankingData();
    }, [servants, activeCategory]);

    const getRankColor = (index: number) => {
        if (index === 0) return 'text-red-600';
        if (index === 1) return 'text-orange-500';
        if (index === 2) return 'text-yellow-500';
        return 'text-gray-400';
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'bg-green-500';
        if (score >= 5) return 'bg-yellow-400';
        return 'bg-red-500';
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 brand-font">Servant Rankings</h1>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">LIVE</span>
            </div>

            {/* Category Tabs (Scrollable) */}
            <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveCategory('ALL')}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === 'ALL'
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        All Classes
                    </button>
                    {CLASSES.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setActiveCategory(c.id)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === c.id
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ranking List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : rankedServants.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No ranked servants found in this category.</p>
                    </div>
                ) : (
                    rankedServants.map((servant, index) => (
                        <Link
                            key={servant.id}
                            to={`/servant/${servant.collectionNo}/reviews`}
                            className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
                        >
                            {/* Rank Number */}
                            <div className={`text-2xl font-bold italic w-8 text-center flex-shrink-0 ${getRankColor(index)}`}>
                                {index + 1}
                            </div>

                            {/* Image */}
                            <div className="relative w-16 h-16 flex-shrink-0">
                                <img
                                    src={servant.face}
                                    alt={servant.name}
                                    className="w-full h-full rounded-md object-cover border border-gray-200 group-hover:scale-105 transition-transform"
                                />
                            </div>

                            {/* Main Content */}
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                        {servant.name}
                                    </h3>
                                    <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                        {servant.className}
                                    </span>
                                </div>

                                {/* Featured Comment Bubble */}
                                <div className="relative bg-orange-50 text-orange-900 text-sm px-3 py-2 rounded-r-lg rounded-bl-lg rounded-tl-none inline-block max-w-full">
                                    {servant.topComment ? (
                                        <span className="line-clamp-1 italic">
                                            "{servant.topComment}"
                                        </span>
                                    ) : (
                                        <span className="text-orange-900/50 italic text-xs">Rating accumulating...</span>
                                    )}
                                </div>
                            </div>

                            {/* Score Section */}
                            <div className="flex flex-col items-end flex-shrink-0 ml-4 gap-1 min-w-[60px]">
                                {servant.averageScore ? (
                                    <>
                                        <div className={`w-12 h-12 rounded-md flex items-center justify-center text-white font-bold text-xl shadow-md ${getScoreColor(servant.averageScore)}`}>
                                            {servant.averageScore}
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                            {servant.ratingCount} Ratings
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-md flex items-center justify-center text-gray-400 font-bold text-xl shadow-inner bg-gray-200">
                                            -
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                            Accumulating
                                        </span>
                                    </>
                                )}
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default RankingPage;