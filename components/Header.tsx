
import React from 'react';
import { BookIcon } from './icons/BookIcon';
import { FilterIcon } from './icons/FilterIcon';

interface HeaderProps {
  onFilterToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onFilterToggle }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-3 flex justify-between items-center ml-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BookIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">PubMed Semantic Search</h1>
            <p className="text-sm text-slate-500">Enhanced biomedical literature discovery</p>
          </div>
        </div>
        
      </div>
    </header>
  );
};

export default Header;
