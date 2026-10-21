import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Map,
  ClipboardList,
  LogOut,
  Bell,
  Search,
  Box
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cx(...args: (string | undefined | null | false)[]) {
  return twMerge(clsx(args));
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Mapa de Almacén', path: '/map', icon: Map },
  { name: 'Salidas de Inventario', path: '/orders', icon: ClipboardList },
];

export default function RootLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-[#f8fafc] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-[#1e293b] border-r border-slate-700/50 shadow-xl z-20 transition-all duration-300">
        <div className="flex items-center gap-3 p-6 h-20 border-b border-slate-700/50">
          <div className="bg-gradient-to-br from-[#0ea5e9] to-[#14b8a6] p-2 rounded-lg shadow-lg shadow-cyan-500/20">
            <Box className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
            OrganiRack+
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="mb-4 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Módulos Principales
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-slate-700/50 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#0ea5e9] rounded-r-md" />
                  )}
                  <item.icon className={cx("w-5 h-5 transition-colors", isActive ? "text-[#0ea5e9]" : "group-hover:text-slate-300")} />
                  <span className="font-medium text-sm">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative">
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-700/50 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#0ea5e9] transition-colors" />
              <input
                type="text"
                placeholder="Buscar SKUs, ubicaciones o pedidos..."
                className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 focus:border-[#0ea5e9] transition-all placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0f172a]"></span>
            </button>
            <div className="w-px h-6 bg-slate-700/50"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-200">Operador Z1</p>
                <p className="text-xs text-slate-500">Turno Mañana</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#14b8a6] flex items-center justify-center text-sm font-bold text-white shadow-md">
                O1
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
