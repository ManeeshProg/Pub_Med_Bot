import type { Query, FilterState } from '../types';

/**
 * Mocks the generation of a PubMed query string from user input.
 * This is a frontend-only implementation and does not call any AI service.
 * It combines search terms, fields, and filters into a basic PubMed query format.
 */
export async function generatePubMedQuery(queries: Query[], filters: FilterState): Promise<string> {
  // Combine all valid query terms with "AND"
  const queryTerms = queries
    .filter(q => q.term.trim() !== '')
    .map(q => {
      const term = q.term.trim();
      // Use quotes for multi-word terms for exact phrase matching
      const formattedTerm = term.includes(' ') ? `"${term}"` : term;
      
      if (q.field !== 'All Fields') {
        // Map UI field to a pseudo PubMed tag. e.g., "Title/Abstract" -> [Title/Abstract]
        return `${formattedTerm}[${q.field}]`;
      }
      return formattedTerm;
    })
    .join(' AND ');

  // Handle date filters
  let dateFilter = '';
  if (filters.fromDate && filters.toDate) {
    const from = filters.fromDate.replace(/-/g, '/');
    const to = filters.toDate.replace(/-/g, '/');
    dateFilter = `(${from}[Date - Publication] : ${to}[Date - Publication])`;
  } else if (filters.fromDate) {
    const from = filters.fromDate.replace(/-/g, '/');
    dateFilter = `${from}[Date - Publication]`;
  } else if (filters.toDate) {
    const to = filters.toDate.replace(/-/g, '/');
    dateFilter = `${to}[Date - Publication]`;
  }

  // Handle publication type filters
  let pubTypeFilter = '';
  if (filters.publicationTypes.length > 0) {
    pubTypeFilter = filters.publicationTypes
      .map(pt => `"${pt}"[Publication Type]`)
      .join(' OR ');
    pubTypeFilter = `(${pubTypeFilter})`;
  }
  
  // Combine all parts into the final query string
  const finalQuery = [queryTerms, dateFilter, pubTypeFilter]
    .filter(Boolean) // Remove empty parts
    .join(' AND ');

  console.log("Generated Mock PubMed Query:", finalQuery);
  
  // Simulate a short delay, as if an AI was processing it
  await new Promise(resolve => setTimeout(resolve, 300));

  if (!finalQuery) {
    throw new Error("Please provide at least one search term.");
  }
  
  return finalQuery;
}
