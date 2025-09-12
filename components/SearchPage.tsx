import React, { useState, useCallback } from 'react';
import FilterPanel from './FilterPanel';
import QueryBuilder from './QueryBuilder';
import ResultsList from './ResultsList';
import ChatbotSidebar from './ChatbotSidebar';
import { SpinnerIcon } from './icons/SpinnerIcon';
import type { Query, FilterState, PubMedArticle } from '../types';
import { generatePubMedQuery } from '../services/geminiService';
import { searchPubMed } from '../services/pubmedService';

const SearchPage: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [queries, setQueries] = useState<Query[]>([{ id: 1, term: '', field: 'All Fields' }]);
  const [filters, setFilters] = useState<FilterState>({ fromDate: '', toDate: '', publicationTypes: [] });
  const [results, setResults] = useState<PubMedArticle[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    setSearched(true);
    setIsLoading(true);
    setError(null);
    setResults(null);

    const validQueries = queries.filter(q => q.term.trim() !== '');
    if (validQueries.length === 0) {
      setError("Please enter at least one search term.");
      setIsLoading(false);
      return;
    }

    try {
      const optimizedQuery = await generatePubMedQuery(validQueries, filters);
      if (!optimizedQuery) {
        throw new Error("Could not generate a valid search query.");
      }
      const articles = await searchPubMed(optimizedQuery, filters, 20);
      setResults(articles);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unknown error occurred during the search.");
    } finally {
      setIsLoading(false);
    }
  }, [queries, filters]);

  const renderContent = () => {
    if (searched) {
      if (isLoading) {
        return (
          <div className="text-center py-16 text-slate-500">
            <SpinnerIcon className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold">Searching...</h2>
            <p className="mt-1">Fetching articles from PubMed</p>
          </div>
        );
      }
      if (error) {
        return (
          <div className="text-center py-16 text-slate-500">
            <div className="mx-auto h-12 w-12 text-red-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-red-600">Error</h2>
            <p className="mt-1">{error}</p>
          </div>
        );
      }
      if (results) {
        return <ResultsList articles={results} />;
      }
    }
    return (
      <div className="text-center py-16 text-slate-500">
        <h2 className="mt-4 text-xl font-semibold">Ready to search</h2>
        <p className="mt-1">Enter your search terms above to find relevant PubMed articles</p>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className={`p-6 transition-all duration-300 ${showChatbot ? 'mr-96' : ''}`}>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Search</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowChatbot(!showChatbot)} 
              className={`px-4 py-2 rounded-md transition-colors ${
                showChatbot 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {showChatbot ? 'Hide Assistant' : 'Show Assistant'}
              </div>
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors">
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-6">
          {showFilters && <FilterPanel filters={filters} onFilterChange={setFilters} />}
          <QueryBuilder queries={queries} onQueriesChange={setQueries} onSearch={handleSearch} isLoading={isLoading} />
        </div>
        <div className="mt-8">
          {renderContent()}
        </div>
      </div>
      
      {/* Chatbot Sidebar */}
      <ChatbotSidebar isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
    </div>
  );
};

export default SearchPage;
