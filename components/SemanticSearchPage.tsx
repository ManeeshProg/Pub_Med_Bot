import React, { useState, useRef } from 'react';
import { semanticSearch, SemanticSearchResultItem } from '../services/semanticSearchService';

const SemanticSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState<number>(10);
  const [threshold, setThreshold] = useState<number>(0.7);
  const [results, setResults] = useState<SemanticSearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = async () => {
    setError('');
    setResults([]);
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const data = await semanticSearch(query, topK, threshold, controller.signal);
      setResults(data);
    } catch (e: any) {
      if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') {
        // request was canceled; do nothing
      } else if (e?.code === 'ECONNABORTED') {
        setError('Request timed out. Try lowering top_k.');
      } else {
        setError(e?.message || 'Failed to run semantic search');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800">Semantic Search</h1>
      <div className="mt-4 grid gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your semantic query..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-md"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-700">
            top_k
            <input
              type="number"
              min={1}
              max={50}
              value={topK}
              onChange={(e) => setTopK(Math.max(1, Math.min(50, Number(e.target.value))))}
              className="ml-2 w-24 px-2 py-1 border border-slate-300 rounded-md"
            />
          </label>
          <label className="text-sm text-slate-700 flex items-center gap-2">
            threshold
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <span className="w-10 text-right tabular-nums">{threshold.toFixed(2)}</span>
          </label>
          <button onClick={handleSearch} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <div className="mt-4 grid gap-3">
        {results.map((r, idx) => {
          const a = r.article || {} as any;
          const title = a.title || a.Title || 'Untitled';
          const journal = a.journal || a.Journal || '';
          const abstract = a.abstract || a.Abstract || '';
          const link = a.link || a.Link || (a.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/` : '#');
          return (
            <div key={idx} className="p-4 bg-white border border-slate-200 rounded">
              <a href={link} target="_blank" rel="noreferrer" className="text-blue-700 font-medium hover:underline">
                {title}
              </a>
              <div className="text-xs text-slate-500 mt-1">Score: {Number(r.score).toFixed(3)}{journal ? ` • Journal: ${journal}` : ''}</div>
              <p className="mt-2 text-slate-700">{abstract || 'No abstract available.'}</p>
            </div>
          );
        })}
        {results.length === 0 && !loading && !error && (
          <p className="text-slate-600">No results yet. Try a search.</p>
        )}
      </div>
    </div>
  );
};

export default SemanticSearchPage;
