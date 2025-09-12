import React, { useState, useRef, useEffect } from 'react';
import { SEARCH_FIELDS } from '../constants';
import type { Query } from '../types';
import { HelpIcon } from './icons/HelpIcon';
import Tooltip from './Tooltip';

interface QueryBuilderProps {
  queries: Query[];
  onQueriesChange: (newQueries: Query[]) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const QueryBuilder: React.FC<QueryBuilderProps> = ({ queries, onQueriesChange, onSearch, isLoading }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  // For navigation after logout
  // Use window.location for redirect since react-router may not be available here
  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/login';
  };

  const handleQueryChange = (id: number, field: 'term' | 'field', value: string) => {
    const newQueries = queries.map(q => (q.id === id ? { ...q, [field]: value } : q));
    onQueriesChange(newQueries);
  };

  const addQuery = () => {
    const newId = queries.length > 0 ? Math.max(...queries.map(q => q.id)) + 1 : 1;
    onQueriesChange([...queries, { id: newId, term: '', field: 'All Fields' }]);
  };

  const removeQuery = (id: number) => {
    onQueriesChange(queries.filter(q => q.id !== id));
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsTooltipVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [tooltipRef]);


  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-black">Build Your Search Query</h2>
        <div className="flex items-center gap-4">
          <div className="relative" ref={tooltipRef}>
            <button
              onClick={() => setIsTooltipVisible(!isTooltipVisible)}
              aria-label="Show search tips"
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
            >
              <HelpIcon className="h-6 w-6 text-slate-400 hover:text-slate-600" />
            </button>
            <Tooltip show={isTooltipVisible}>
              <h3 className="font-bold text-base mb-2">Search Tips:</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-200">
                  <li>Use quotation marks for exact phrases: <code>"heart disease"</code></li>
                  <li>Use asterisk (*) for truncation: <code>cardio*</code> finds cardiology, cardiovascular, etc.</li>
                  <li>Combine terms with <code>AND</code>, <code>OR</code>, <code>NOT</code> operators</li>
                  <li>Use MeSH terms for standardized medical vocabulary</li>
                  <li>Search specific fields for more precise results</li>
              </ul>
            </Tooltip>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {queries.map((query, index) => (
          <div key={query.id} className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Enter search term..."
              value={query.term}
              onChange={(e) => handleQueryChange(query.id, 'term', e.target.value)}
              className="flex-grow w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-black placeholder:text-slate-400"
            />
            <select
              value={query.field}
              onChange={(e) => handleQueryChange(query.id, 'field', e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
            >
              {SEARCH_FIELDS.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
            {queries.length > 1 && (
              <button
                onClick={() => removeQuery(query.id)}
                className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-md font-medium w-full sm:w-auto"
                aria-label="Remove query"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-slate-200 gap-4">
        <button
          onClick={addQuery}
          className="text-blue-600 font-semibold hover:text-blue-800 transition-colors self-start"
        >
          + Add Query
        </button>
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search PubMed
        </button>
      </div>
    </div>
  );
};

export default QueryBuilder;