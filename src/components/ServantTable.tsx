import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Servant } from '../types';

interface ServantTableProps {
  servants: Servant[];
}

const ServantTable: React.FC<ServantTableProps> = ({ servants }) => {
  const navigate = useNavigate();
  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-gray-200 text-gray-500';
    if (score >= 8) return 'bg-green-500 text-white';
    if (score >= 5) return 'bg-yellow-400 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Icon
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Class
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rarity
            </th>
             <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Max ATK
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Max HP
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {servants.map((servant) => (
            <tr
              key={servant.id}
              onClick={() => navigate(`/servant/${servant.collectionNo}`)}
              className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {servant.collectionNo}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-10 w-10 flex-shrink-0">
                  <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={servant.face} alt="" />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{servant.name}</div>
                <div className="text-sm text-gray-500">{servant.originalName}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800`}>
                  {servant.className}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-500 font-bold">
                {"★".repeat(servant.rarity)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap flex justify-center">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm shadow-sm rounded-sm ${getScoreColor(servant.averageScore)}`}>
                     {servant.averageScore ?? <span className="text-[10px]">TBD</span>}
                  </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 font-mono">
                {servant.atkMax.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 font-mono">
                {servant.hpMax.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServantTable;