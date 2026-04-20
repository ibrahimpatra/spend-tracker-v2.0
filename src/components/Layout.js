import React from "react";
import { useLocation, Link } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

// ─── Icon library ────────────────────────────────────────────────────────────
const Icon = ({ path, className = "w-5 h-5", filled = false }) => (
  <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const ICONS = {
  dashboard:  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  records:    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  accounts:   "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  categories: "M4 6h6v6H4V6zm10 0h6v6h-6V6zM4 14h6v6H4v-6zm10 3h6m-3-3v6",
  logout:     "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
};

const NAV_LINKS = [
  { path: "/",           label: "Dashboard", icon: ICONS.dashboard  },
  { path: "/records",    label: "Records",   icon: ICONS.records    },
  { path: "/accounts",   label: "Accounts",  icon: ICONS.accounts   },
  { path: "/categories", label: "Categories",icon: ICONS.categories },
];

const PAGE_TITLES = {
  "/":           "Dashboard",
  "/records":    "Records",
  "/accounts":   "Accounts",
  "/categories": "Categories",
};

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function Layout({ children, user }) {
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname] || "MyVault";

  const isActive = (path) => pathname === path;

  return (
    <div className="flex min-h-screen bg-bank-50 font-sans text-bank-900 overflow-x-hidden">

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col bg-white border-r border-gray-100 sticky top-0 h-screen z-30 shadow-sm">

        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-money-600 flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-sm tracking-tight">MV</span>
          </div>
          <span className="font-extrabold text-bank-900 text-lg tracking-tight">MyVault</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {NAV_LINKS.map(({ path, label, icon }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                  active
                    ? "bg-money-50 text-money-600"
                    : "text-bank-500 hover:bg-gray-50 hover:text-bank-900"
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  active ? "bg-money-100 text-money-600" : "text-bank-500 group-hover:text-bank-900"
                }`}>
                  <Icon path={icon} className="w-4.5 h-4.5" />
                </span>
                {label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-money-600" />}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-4 pb-6 pt-4 border-t border-gray-100 mt-2">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-money-100 text-money-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-bank-900 truncate">
                {user?.displayName || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[10px] text-bank-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition"
          >
            <Icon path={ICONS.logout} className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile + Content area ───────────────────────── */}
      <div className="flex-1 flex flex-col pb-20 md:pb-0 overflow-x-hidden">

        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-money-600 flex items-center justify-center">
              <span className="text-white font-extrabold text-xs">MV</span>
            </div>
            <span className="font-extrabold text-bank-900">{pageTitle}</span>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="p-1.5 rounded-lg text-bank-500 hover:bg-gray-100 transition"
          >
            <Icon path={ICONS.logout} className="w-4.5 h-4.5" />
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-7 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-30 pb-safe shadow-[0_-1px_0_rgba(0,0,0,0.06)]">
          <div className="flex justify-around px-2 py-1.5">
            {NAV_LINKS.map(({ path, label, icon }) => {
              const active = isActive(path);
              return (
                <Link key={path} to={path}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0 ${
                    active ? "text-money-600" : "text-bank-500"
                  }`}
                >
                  <Icon path={icon} className="w-5 h-5" filled={active} />
                  <span className={`text-[10px] font-semibold ${active ? "text-money-600" : "text-bank-500"}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
}
