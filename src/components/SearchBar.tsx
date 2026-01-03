import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Servant } from '../types';
import { CLASSES } from '../services/mockData';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedClassId: number | null;
  onClassChange: (classId: number | null) => void;
  allServants: Servant[];
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedClassId,
  onClassChange,
  allServants
}) => {
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onSearchChange(val);
    if (val.length >= 4) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Logic for suggestions: Must match search term AND selected class (if any)
  const suggestions = allServants.filter(s => {
    const matchesName = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.originalName && s.originalName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass = selectedClassId ? s.classId === selectedClassId : true;
    return matchesName && matchesClass;
  }).slice(0, 5); // Limit to 5 suggestions

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6" ref={wrapperRef}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input Container */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Search Servant by Name (type 4+ chars for suggestions)..."
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => { if(searchTerm.length >= 4) setShowSuggestions(true); }}
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && searchTerm.length >= 4 && (
            <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {suggestions.map((servant) => (
                <li
                  key={servant.id}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 flex items-center border-b border-gray-50 last:border-0"
                  onClick={() => {
                    navigate(`/servant/${servant.id}`);
                    setShowSuggestions(false);
                    onSearchChange(servant.name);
                  }}
                >
                  <img src={servant.face} alt="" className="h-8 w-8 rounded-full mr-3 border border-gray-200 bg-gray-100 object-cover" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <span className="block truncate font-medium text-gray-900">{servant.name}</span>
                        <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-1 rounded">★{servant.rarity}</span>
                    </div>
                    <span className="block truncate text-xs text-gray-500">{servant.className} • ID: {servant.collectionNo}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Class Filter */}
        <div className="w-full md:w-64">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            value={selectedClassId || ''}
            onChange={(e) => onClassChange(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">All Classes</option>
            {CLASSES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;