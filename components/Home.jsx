import React from 'react';
import { useEffect, useState } from 'react';

function Home() {
  const [recentPapers, setRecentPapers] = useState([]);
  const [error, setError] = useState("");
  const latestQuery = "latest";

  useEffect(() => {
    const fetchRecentPapers = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const res = await fetch(
          `http://127.0.0.1:8000/search/advanced`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ query: latestQuery, retmax: 5, filters: { pub_year_range: "All", article_types: [] } })
          }
        );
        if (!res.ok) {
          throw new Error(`Failed with status ${res.status}`);
        }
        const data = await res.json();
        setRecentPapers(data.results || []);
      } catch (err) {
        console.error("Failed to fetch recent papers:", err);
        setError("Could not load recent publications.");
      }
    };
    fetchRecentPapers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800">Welcome to PubMed Explorer</h1>
      <p className="mt-2 text-slate-600">
        Explore latest research, papers, and publications below.
      </p>

      <h2 className="mt-6 text-xl font-semibold text-slate-800">Recent Publications</h2>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <div className="mt-4 grid gap-4">
        {recentPapers.map((paper, index) => (
          <div key={index} className="p-4 bg-white rounded-lg shadow border border-slate-200">
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/${paper.PMID || paper.uid || ''}/`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 font-medium hover:underline"
            >
              {paper.Title || paper.title}
            </a>
            <p className="mt-1 text-sm text-slate-600"><strong>Journal:</strong> {paper.Journal || paper.journal}</p>
            <p className="mt-1 text-sm text-slate-600"><strong>Authors:</strong> {Array.isArray(paper.Authors) ? paper.Authors.join(', ') : (paper.authors ? paper.authors.map(a => a.name).join(', ') : '')}</p>
            <p className="mt-2 text-slate-700"><strong>Abstract:</strong> {(paper.Abstract || paper.abstract || "No abstract available.")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
