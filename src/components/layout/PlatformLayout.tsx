import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatformAuth } from '../../features/platform/context/PlatformAuthContext';
import {
  LayoutDashboard,
  Building2,
  Tag,
  Receipt,
  TrendingUp,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

interface PlatformLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/platform', label: 'داشبورد پلتفرم', icon: LayoutDashboard, exact: true },
  { path: '/platform/clinics', label: 'مدیریت کلینیک‌ها', icon: Building2 },
  { path: '/platform/plans', label: 'پلن‌های اشتراک', icon: Tag },
  { path: '/platform/invoices', label: 'فاکتورها و پرداخت‌ها', icon: Receipt },
  { path: '/platform/revenue', label: 'داشبورد درآمد', icon: TrendingUp },
];

const getNavIndex = (pathname: string): number => {
  const exactIdx = navItems.findIndex(
    (item) => (item.exact ? pathname === item.path : pathname.startsWith(item.path)),
  );
  return exactIdx >= 0 ? exactIdx : 0;
};

const pageVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -20 : 20,
    y: 6,
  }),
  center: {
    opacity: 1,
    x: 0,
    y: 0,
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 20 : -20,
    y: -6,
  }),
};

export const PlatformLayout: React.FC<PlatformLayoutProps> = ({ children }) => {
  const { user, logout } = usePlatformAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Direction calculation for page transition animation
  const prevIndexRef = useRef<number>(getNavIndex(location.pathname));
  const [direction, setDirection] = useState<number>(1);

  const currentIndex = getNavIndex(location.pathname);

  useEffect(() => {
    if (currentIndex !== prevIndexRef.current) {
      setDirection(currentIndex > prevIndexRef.current ? 1 : -1);
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex]);

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200"
      dir="rtl"
    >
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/75 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/platform" className="flex items-center gap-2.5 group">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-lg shadow-sm group-hover:border-teal-400/50 transition-colors">
                M
              </span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-100 tracking-tight">
                  MedFlow
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/25">
                  <ShieldCheck className="w-3 h-3 text-teal-400" strokeWidth={2} />
                  <span>سوپرادمین</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation with Fluid Animated Pill */}
            <nav className="hidden md:flex items-center gap-1 relative">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors relative flex items-center gap-2 ${isActive ? 'text-teal-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    {/* Shared Layout Fluid Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="activePlatformNavPill"
                        className="absolute inset-0 rounded-xl bg-teal-500/15 border border-teal-500/35 shadow-sm shadow-teal-500/10"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}

                    <span className="relative z-10 flex items-center gap-2">
                      <Icon
                        className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`}
                        strokeWidth={1.75}
                      />
                      <span>{item.label}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left hidden sm:flex flex-col items-end pl-3 border-l border-slate-800">
              <span className="text-xs font-semibold text-slate-200">
                {user?.name || 'مدیر ارشد پلتفرم'}
              </span>
              <span
                className="text-[11px] text-slate-400 font-mono tracking-wider"
                dir="ltr"
              >
                {user?.phone || '09120000000'}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => logout()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-colors"
              title="خروج از پنل سوپرادمین"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>خروج</span>
            </motion.button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors"
              aria-label="منوی کاربری"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl px-4 py-3 space-y-1 overflow-hidden"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                  >
                    <Icon className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    {user?.name || 'مدیر ارشد پلتفرم'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                    {user?.phone}
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>خروج</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area with Directional Page Transition */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={location.pathname}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>سامانه مدیریت متمرکز پلتفرم MedFlow | Enterprise Multi-Tenant Architecture</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>پلتفرم فعال و در دسترس</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
