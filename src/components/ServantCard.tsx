import React from 'react';
import { Link } from 'react-router-dom';
import { Servant } from '../types';

interface ServantCardProps {
  servant: Servant;
}

const ServantCard: React.FC<ServantCardProps> = ({ servant }) => {
  const getRarityStars = (rarity: number) => {
    return "★".repeat(rarity);
  };

  const getClassColor = (className: string) => {
    switch (className.toLowerCase()) {
      case 'saber': return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'archer': return 'text-red-600 border-red-200 bg-red-50';
      case 'lancer': return 'text-green-600 border-green-200 bg-green-50';
      case 'rider': return 'text-purple-600 border-purple-200 bg-purple-50';
      case 'caster': return 'text-indigo-600 border-indigo-200 bg-indigo-50';
      case 'assassin': return 'text-gray-600 border-gray-200 bg-gray-50';
      case 'berserker': return 'text-red-800 border-red-300 bg-red-100';
      default: return 'text-gray-700 border-gray-200 bg-gray-50';
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-gray-200 text-gray-500';
    if (score >= 8) return 'bg-green-500 text-white';
    if (score >= 5) return 'bg-yellow-400 text-white';
    if (score >= 1) return 'bg-red-500 text-white';
    return 'bg-gray-200 text-gray-500';
  };

  const classStyle = getClassColor(servant.className);
  const scoreColor = getScoreColor(servant.averageScore);

  return (
    <Link
      to={`/servant/${servant.collectionNo}`}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden group"
    >
      <div className="relative w-full flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="relative w-32 h-32">
          <img
            src={servant.face}
            alt={servant.name}
            className="w-full h-full object-cover rounded-lg shadow-sm transform group-hover:scale-105 transition-transform duration-500"
          />
          {/* Rarity */}
          <div className="absolute -top-1 -left-1 bg-black/80 text-yellow-400 px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm shadow-sm">
            {getRarityStars(servant.rarity)}
          </div>

          {/* Score Badge (Square) */}
          <div className={`absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center font-bold text-xs shadow-md rounded-sm ${scoreColor}`}>
            {servant.averageScore && servant.averageScore >= 1 ? servant.averageScore : <span className="text-[9px]">TBD</span>}
          </div>

          {/* Class Name at bottom left */}
          <div className={`absolute -bottom-1 -left-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shadow-sm ${classStyle}`}>
            {servant.className}
          </div>

          {/* ID at bottom right */}
          <div className="absolute -bottom-1 -right-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
            ID: {servant.collectionNo}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ServantCard;