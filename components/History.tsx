import React, { useEffect, useState } from 'react';
import ResultsList from './ResultsList';

interface CachedItem {
  query: string;
  results: any[];
  timestamp?: string;
}

const History: React.FC = () => {
  const [items, setItems] = useState<CachedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('jwt_token');
        const res = await fetch('http://127.0.0.1:8000/cache/advanced', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const data = await res.json();
        const raw: CachedItem[] = Array.isArray(data.items) ? data.items : [];
        const sorted = raw.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setItems(sorted);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800">Cached Searches</h1>
      {loading && <p className="mt-2 text-slate-600">Loading...</p>}
      {error && <p className="mt-2 text-red-600">{error}</p>}

      <div className="mt-4 grid gap-2">
        {items.map((it, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded">
            <button
              onClick={() => toggle(idx)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex justify-between items-center"
            >
              <div>
                <div className="font-medium text-slate-800">{it.query}</div>
                <div className="text-xs text-slate-500">{it.timestamp ? new Date(it.timestamp).toLocaleString() : ''} • {it.results?.length || 0} results</div>
              </div>
              <span className="text-slate-500">{openIndex === idx ? '−' : '+'}</span>
            </button>
            {openIndex === idx && (
              <div className="px-4 pb-4">
                <ResultsList articles={(it.results || []).map((article: any) => ({
                  uid: article.PMID,
                  pubdate: (article.Year || 'N/A') + '-01-01',
                  title: article.Title,
                  authors: (article.Authors || '').split(', ').map((name: string) => ({ name })),
                  source: article.Journal,
                  abstract: article.Abstract
                }))} />
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && !loading && (
          <p className="text-slate-600">No cached searches found.</p>
        )}
      </div>
    </div>
  );
};

export default History;
