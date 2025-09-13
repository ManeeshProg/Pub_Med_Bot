import axios from 'axios';
import { SEMANTIC_SEARCH_API_BASE } from '../constants';
import { makeAuthenticatedRequest } from '../utils/auth.js';

export interface SemanticSearchResultItem {
  article: {
    pmid?: string;
    title?: string;
    abstract?: string;
    journal?: string;
    link?: string;
    [key: string]: any;
  };
  score: number;
}

export async function semanticSearch(query: string, top_k: number = 10, threshold: number = 0.7, signal?: AbortSignal): Promise<SemanticSearchResultItem[]> {
  const url = `${SEMANTIC_SEARCH_API_BASE}/search/semantic`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

  if (!token) {
    throw new Error('You must be logged in to search.');
  }

  return await makeAuthenticatedRequest(async () => {
    const currentToken = localStorage.getItem('jwt_token');
    const res = await axios.post(
      url,
      { query, top_k, threshold },
      {
        timeout: 600000,
        signal,
        headers: { Authorization: `Bearer ${currentToken}` }
      }
    );
    const raw = res.data?.results ?? [];

    const normalized: SemanticSearchResultItem[] = raw.map((item: any) => {
      if (Array.isArray(item) && item.length >= 2) {
        return { article: item[0] || {}, score: Number(item[1]) || 0 };
      }
      if (item && typeof item === 'object' && ('article' in item || 'score' in item)) {
        return { article: item.article || {}, score: Number(item.score) || 0 };
      }
      if (item && typeof item === 'object') {
        return { article: item, score: 0 };
      }
      return { article: {}, score: 0 };
    });

    return normalized;
  });
}
