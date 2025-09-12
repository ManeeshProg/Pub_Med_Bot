import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  show: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ children, show }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-slate-800 text-white text-sm rounded-lg shadow-lg p-4 z-20">
      <div className="relative">
        {children}
      </div>
      <div className="absolute right-3 -top-2 w-4 h-4 bg-slate-800 transform rotate-45"></div>
    </div>
  );
};

export default Tooltip;