import React, { useState, useEffect } from 'react';
import { Servant } from '../types';
import ServantCard from '../components/ServantCard';
import ServantTable from '../components/ServantTable';
import SearchBar from '../components/SearchBar';
import PageHeader from '../components/PageHeader';

interface HomePageProps {
  servants: Servant[];
  loading: boolean;
  importing: boolean;
  region: string;
  onQuickImport: () => void;
  onRegionChange: (region: string) => void;
}

const ITEMS_PER_PAGE = 20;
const TABLE_ITEMS_PER_PAGE = 15;

const HomePage: React.FC<HomePageProps> = ({
  servants,
  loading,
  importing,
  region,
  onQuickImport,
  onRegionChange
}) => {
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>(() => {
    const saved = localStorage.getItem('displayMode');
    return (saved === 'grid' || saved === 'table') ? saved : 'table';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Save display mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('displayMode', displayMode);
  }, [displayMode]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClassId, selectedRarity, displayMode]);

  // Filter Logic
  const filteredServants = servants.filter(servant => {
    const term = searchTerm.toLowerCase();
    const matchesName = servant.name.toLowerCase().includes(term) ||
      (servant.originalName && servant.originalName.toLowerCase().includes(term));
    const matchesClass = selectedClassId ? servant.classId === selectedClassId : true;
    const matchesRarity = selectedRarity ? servant.rarity === selectedRarity : true;
    return matchesName && matchesClass && matchesRarity;
  });

  const limit = displayMode === 'table' ? TABLE_ITEMS_PER_PAGE : ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filteredServants.length / limit);
  const paginatedServants = filteredServants.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Servant List"
        subtitle={`Database of Servants recorded in Chaldea (${region} Data).`}
        region={region}
        onRegionChange={onRegionChange}
        extraControls={servants.length > 0 && (
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${displayMode === 'grid'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Grid</span>
              </div>
            </button>
            <button
              onClick={() => setDisplayMode('table')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${displayMode === 'table'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Table</span>
              </div>
            </button>
          </div>
        )}
      />

      {servants.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No data found.</p>
          <button
            onClick={onQuickImport}
            disabled={importing}
            className="bg-blue-600 text-white px-6 py-3 rounded shadow hover:bg-blue-700 text-sm font-bold inline-flex items-center"
          >
            {importing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing {region} Data...
              </>
            ) : `Initialize Database with ${region} Data`}
          </button>
        </div>
      ) : (
        <>
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedClassId={selectedClassId}
            onClassChange={setSelectedClassId}
            selectedRarity={selectedRarity}
            onRarityChange={setSelectedRarity}
            allServants={servants}
          />

          {filteredServants.length === 0 ? (
            <div className="text-center py-10">
              {importing ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-gray-500">Syncing {region} Data...</p>
                </div>
              ) : (
                <p className="text-gray-500">No servants match your search criteria.</p>
              )}
            </div>
          ) : (
            <>
              {displayMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {paginatedServants.map(servant => (
                    <ServantCard
                      key={servant.id}
                      servant={servant}
                    />
                  ))}
                </div>
              ) : (
                <ServantTable
                  servants={paginatedServants}
                />
              )}
            </>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border rounded-md bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm"
                >
                  &laquo; First
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border rounded-md bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm"
                >
                  &lsaquo; Prev
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-sm font-medium">Page</span>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="block w-20 py-1.5 pl-3 pr-8 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <option key={pageNum} value={pageNum}>
                      {pageNum}
                    </option>
                  ))}
                </select>
                <span className="text-gray-600 text-sm font-medium">of {totalPages}</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border rounded-md bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm"
                >
                  Next &rsaquo;
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border rounded-md bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm"
                >
                  Last &raquo;
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;