import type { PubMedArticle, FilterState } from '../types';
import axios from 'axios';
import { ADVANCED_API_BASE } from '../constants';
import { makeAuthenticatedRequest } from '../utils/auth.js';

/**
 * Sends a search request to the PubMed API backend.
 * @param query The search query string.
 * @param filters Optional filters to apply to the search.
 * @param retmax Maximum number of results to return.
 * @returns A promise that resolves to an array of PubMed articles.
 */
export async function searchPubMed(query: string, filters?: FilterState, retmax: number = 10): Promise<PubMedArticle[]> {
  console.log('Searching PubMed for query:', query);

  const token = localStorage.getItem('jwt_token');
  if (!token) {
    throw new Error('You must be logged in to search.');
  }

  const backendFilters: any = {
    pub_year_range: "All",
    article_types: filters?.publicationTypes || [],
    custom_range: filters?.fromDate && filters?.toDate ?
      [parseInt(filters.fromDate), parseInt(filters.toDate)] : null
  };

  if (filters?.fromDate && filters?.toDate) {
    backendFilters.pub_year_range = "Custom Range";
  }

  return await makeAuthenticatedRequest(async () => {
    const currentToken = localStorage.getItem('jwt_token');
    const response = await axios.post(
      `${ADVANCED_API_BASE}/search/advanced`,
      { query, retmax, filters: backendFilters },
      { headers: { Authorization: `Bearer ${currentToken}` } }
    );

    return response.data.results.map((article: any) => ({
      uid: article.PMID,
      pubdate: article.Year + '-01-01',
      title: article.Title,
      authors: article.Authors.split(', ').map((name: string) => ({ name })),
      source: article.Journal,
      abstract: article.Abstract
    }));
  });
}

export async function listCachedAdvanced(): Promise<any[]> {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    throw new Error('You must be logged in to access cached results.');
  }

  return await makeAuthenticatedRequest(async () => {
    const currentToken = localStorage.getItem('jwt_token');
    const res = await axios.get(`${ADVANCED_API_BASE}/cache/advanced`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    return res.data?.items ?? [];
  });
}

