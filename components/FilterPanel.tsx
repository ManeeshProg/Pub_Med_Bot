import React from 'react';
import { PUBLICATION_TYPES } from '../constants';
import type { FilterState } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange }) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, [e.target.name]: e.target.value });
  };

  const handlePubTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const currentTypes = filters.publicationTypes;
    if (checked) {
      onFilterChange({ ...filters, publicationTypes: [...currentTypes, value] });
    } else {
      onFilterChange({ ...filters, publicationTypes: currentTypes.filter(pt => pt !== value) });
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Search Filters
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-md font-medium text-black mb-2 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Publication Date
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="fromDate" className="block text-sm font-medium text-black mb-1">From</label>
              <div className="relative">
                <input
                  type="date"
                  id="fromDate"
                  name="fromDate"
                  value={filters.fromDate}
                  onChange={handleDateChange}
                  className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                  placeholder="yyyy-mm-dd"
                />
              </div>
            </div>
            <div className="flex-1">
              <label htmlFor="toDate" className="block text-sm font-medium text-black mb-1">To</label>
               <div className="relative">
                <input
                  type="date"
                  id="toDate"
                  name="toDate"
                  value={filters.toDate}
                  onChange={handleDateChange}
                  className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                  placeholder="yyyy-mm-dd"
                />
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-md font-medium text-black mb-2">Publication Type</h3>
          <div className="grid grid-cols-2 gap-2">
            {PUBLICATION_TYPES.map(pt => (
              <label key={pt} className="flex items-center space-x-2 text-sm text-black">
                <input
                  type="checkbox"
                  value={pt}
                  checked={filters.publicationTypes.includes(pt)}
                  onChange={handlePubTypeChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white"
                  style={{ colorScheme: 'light' }}
                />
                <span>{pt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;