
import React from 'react';
import type { PubMedArticle } from '../types';

interface ResultsListProps {
  articles: PubMedArticle[];
}

const ArticleCard: React.FC<{ article: PubMedArticle }> = ({ article }) => (
  <li className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all">
    <a
      href={`https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <h3 className="text-lg font-bold text-blue-800 group-hover:underline">
        {article.title}
      </h3>
      <p className="text-sm text-slate-600 mt-1 truncate">
        {article.authors.map(a => a.name).join(', ')}
      </p>
      <p className="text-sm text-slate-500 mt-2">
        <span className="font-semibold">{article.source}</span> &middot; {new Date(article.pubdate).toLocaleDateString()}
      </p>
      {article.abstract && (
        <div className="mt-3 text-sm text-slate-700 line-clamp-3">
          {article.abstract}
        </div>
      )}
    </a>
  </li>
);


const ResultsList: React.FC<ResultsListProps> = ({ articles }) => {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="mt-4 text-xl font-semibold">No Articles Found</h2>
        <p className="mt-1">Try broadening your search terms or adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div>
       <h2 className="text-xl font-semibold text-slate-800 mb-4">
        Search Results <span className="text-base font-normal text-slate-500">({articles.length} articles found)</span>
      </h2>
      <ul className="space-y-4">
        {articles.map(article => (
          <ArticleCard key={article.uid} article={article} />
        ))}
      </ul>
    </div>
  );
};

export default ResultsList;
