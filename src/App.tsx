import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  CheckCircle2, 
  Beer, 
  BarChart3, 
  LayoutDashboard, 
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Participant } from './types';

// Pages (to be implemented)
import Dashboard from './pages/Dashboard';
import Participants from './pages/Participants';
import Attendance from './pages/Attendance';
import Consumption from './pages/Consumption';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/participants', label: 'Participantes', icon: Users },
  { path: '/attendance', label: 'Presença', icon: CheckCircle2 },
  { path: '/consumption', label: 'Consumo', icon: Beer },
  { path: '/reports', label: 'Relatórios', icon: BarChart3 },
];

function AppLayout({ children, onLogout, userType, navItems, isLightMode, onToggleTheme }: { 
  children: React.ReactNode, 
  onLogout: () => void, 
  userType: 'admin' | 'brother',
  navItems: typeof NAV_ITEMS,
  isLightMode: boolean,
  onToggleTheme: () => void
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--border-main)] bg-surface-card transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-primary flex items-center justify-center p-1">
             <div className="w-full h-full bg-primary rounded-full animate-pulse" />
          </div>
          <span className="font-bold gold-text-gradient tracking-widest text-sm uppercase">Ágape</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onToggleTheme} className="text-[var(--text-main)]">
            {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[var(--text-main)]">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-0 z-50 md:flex flex-col w-64 bg-surface-sidebar border-r border-primary/20 transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-8 hidden md:flex flex-col items-center">
          <div className="w-16 h-16 border-2 border-primary rounded-full flex items-center justify-center mb-4">
            <span className="text-primary text-2xl font-serif">G</span>
          </div>
          <h1 className="text-[10px] tracking-[0.3em] uppercase text-primary font-medium text-center">Sistema de Ágape</h1>
          <p className="text-[9px] text-[var(--text-dim)] mt-1 uppercase tracking-widest">Controle Operacional</p>
          <div className="mt-4 px-3 py-1 bg-primary/10 border border-primary/20 rounded text-[8px] uppercase tracking-widest font-black text-primary">
            Acesso: {userType === 'admin' ? 'Mestre de Banquete' : 'Irmão'}
          </div>
        </div>

        <div className="px-8 pb-4 flex justify-center md:flex hidden">
           <button 
             onClick={onToggleTheme}
             className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 text-primary hover:bg-primary/5 transition-all"
           >
             {isLightMode ? <Moon size={12} /> : <Sun size={12} />}
             <span className="text-[8px] uppercase font-bold tracking-widest">
               {isLightMode ? 'Modo Noturno' : 'Modo Diurno'}
             </span>
           </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded transition-all group border",
                location.pathname === item.path 
                  ? "bg-primary/10 text-primary border-primary/30 font-bold" 
                  : "text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--border-main)] border-transparent"
              )}
            >
              <item.icon size={16} className={cn(
                "group-hover:scale-110 transition-transform",
                location.pathname === item.path ? "text-primary" : "text-[var(--text-muted)]"
              )} />
              <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-[var(--border-main)]">
          {userType === 'admin' && (
            <Link
              to="/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-primary/5 transition-all w-full"
            >
              <SettingsIcon size={14} className="text-[var(--text-muted)]" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Configurações</span>
            </Link>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded text-rose-500/80 hover:bg-rose-500/10 transition-all w-full mt-1"
          >
            <LogOut size={14} />
            <span className="text-[10px] uppercase font-bold tracking-widest">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-surface-dark p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
             <motion.div
               key={location.pathname}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
             >
               {children}
             </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState<{ isAuthenticated: boolean, type: 'admin' | 'brother', user?: Participant } | null>(null);
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('agape-theme') !== 'dark'; // Default to light if not explicitly dark
  });

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light');
      localStorage.setItem('agape-theme', 'light');
    } else {
      document.body.classList.remove('light');
      localStorage.setItem('agape-theme', 'dark');
    }
  }, [isLightMode]);

  const handleLogout = () => {
    setAuth(null);
  };

  if (!auth?.isAuthenticated) {
    return (
      <Login 
        isLightMode={isLightMode}
        onToggleTheme={() => setIsLightMode(!isLightMode)}
        onLogin={(type, user) => setAuth({ isAuthenticated: true, type, user })} 
      />
    );
  }

  const filteredNavItems = auth.type === 'admin' 
    ? NAV_ITEMS 
    : NAV_ITEMS.filter(item => ['Dashboard', 'Consumo'].includes(item.label));

  return (
    <Router>
      <AppLayout 
        onLogout={handleLogout} 
        userType={auth.type} 
        navItems={filteredNavItems}
        isLightMode={isLightMode}
        onToggleTheme={() => setIsLightMode(!isLightMode)}
      >
        <Routes>
          <Route path="/" element={<Dashboard userType={auth.type} participantId={auth.user?.id} />} />
          {auth.type === 'admin' && (
            <>
              <Route path="/participants" element={<Participants />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </>
          )}
          <Route path="/consumption" element={<Consumption participantId={auth.user?.id} />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
