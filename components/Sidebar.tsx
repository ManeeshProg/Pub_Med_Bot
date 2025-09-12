import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState<{ search: boolean; history: boolean; chatbot: boolean }>({ search: false, history: false, chatbot: false });

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('loggedInUser');
    window.dispatchEvent(new Event('user-auth-change'));
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-md ${isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-200'}`;

  return (
    <aside className="fixed top-16 left-0 w-56 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 p-4 flex flex-col gap-2 overflow-hidden">
      <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
      <NavLink to="/home" className={linkClass}>Home</NavLink>

      <button onClick={() => setOpen(o => ({ ...o, search: !o.search }))} className="text-left px-4 py-2 rounded-md text-slate-700 hover:bg-slate-200">Search</button>
      {open.search && (
        <div className="ml-4 flex flex-col gap-1">
          <NavLink to="/search" className={linkClass}>Advanced Search</NavLink>
          <NavLink to="/groq" className={linkClass}>Groq Search</NavLink>
        </div>
      )}

      <button onClick={() => setOpen(o => ({ ...o, history: !o.history }))} className="text-left px-4 py-2 rounded-md text-slate-700 hover:bg-slate-200">History</button>
      {open.history && (
        <div className="ml-4 flex flex-col gap-1">
          <NavLink to="/history" className={linkClass}>Advanced History</NavLink>
          <NavLink to="/history/groq" className={linkClass}>Groq History</NavLink>
        </div>
      )}

      

      <NavLink to="/profile" className={linkClass}>Profile</NavLink>
      <button onClick={handleLogout} className="mt-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Logout</button>
    </aside>
  );
};

export default Sidebar;
