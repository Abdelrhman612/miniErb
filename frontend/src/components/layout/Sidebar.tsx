import React, { useState } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

interface SubNavItem {
  to: string;
  label: string;
}

interface NavSection {
  title: string;
  icon: React.ReactNode;
  items?: SubNavItem[];
  to?: string;
}

const navSections: NavSection[] = [
  {
    title: 'لوحة المؤشرات',
    to: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 14a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
      </svg>
    ),
  },
  {
    title: 'المخزون والمستودعات',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    items: [
      { to: '/products', label: 'المنتجات' },
      { to: '/categories', label: 'الفئات' },
      { to: '/warehouses', label: 'المخازن' },
    ],
  },
  {
    title: 'المالية والحسابات',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    items: [
      { to: '/chart-of-accounts', label: 'دليل الحسابات' },
      { to: '/treasury', label: 'الخزنة والحسابات' },
    ],
  },
  {
    title: 'العملاء والموردين',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    items: [
      { to: '/customers', label: 'العملاء' },
      { to: '/suppliers', label: 'الموردين' },
    ],
  },
  {
    title: 'المبيعات والمشتريات',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
    items: [
      { to: '/sales-invoices', label: 'فواتير المبيعات' },
      { to: '/purchase-invoices', label: 'فواتير المشتريات' },
    ],
  },
  {
    title: 'السندات والقيد المزدوج',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-6 9l2 2 4-4" />
      </svg>
    ),
    items: [
      { to: '/receipt-vouchers', label: 'سندات القبض' },
      { to: '/payment-vouchers', label: 'سندات الصرف' },
      { to: '/journal-vouchers', label: 'سندات القيد' },
    ],
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'المخزون والمستودعات': true,
    'المالية والحسابات': true,
    'العملاء والموردين': true,
    'المبيعات والمشتريات': true,
    'السندات والقيد المزدوج': true,
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="w-72 shrink-0 bg-[#09090B] border-l border-zinc-800/80 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800/80 bg-[#121216]/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0 border border-emerald-500/20">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="font-bold text-sm text-zinc-100 tracking-wide">MiniERP</p>
          <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Enterprise Edition</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2">القوائم الرئيسية</p>
        
        {navSections.map((section) => {
          if (section.to) {
            return (
              <NavLink
                key={section.to}
                to={section.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#121216]'
                  }`
                }
              >
                <span className="text-zinc-400">{section.icon}</span>
                {section.title}
              </NavLink>
            );
          }

          const isOpen = openSections[section.title];

          return (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-[#121216] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">{section.icon}</span>
                  <span>{section.title}</span>
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && section.items && (
                <div className="pr-4 pl-1 space-y-1 py-1 border-r border-zinc-800/80 mr-3.5">
                  {section.items.map((subItem) => (
                    <NavLink
                      key={subItem.to}
                      to={subItem.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-r-2 border-emerald-500'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121216]/60'
                        }`
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                      {subItem.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* System Admin section */}
        {user?.role === 'Admin' && (
          <div className="pt-3 border-t border-zinc-800/80 mt-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2">الإدارة والنظام</p>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#121216]'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              إدارة المستخدمين
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer / User Profile */}
      <div className="px-4 py-4 border-t border-zinc-800/80 space-y-3 bg-[#121216]/80">
        {user && (
          <div className="flex items-center justify-between px-3 bg-[#09090B] p-2.5 rounded-xl border border-zinc-800">
            <div className="truncate">
              <p className="text-xs font-bold text-zinc-200 truncate">{user.displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-zinc-400 font-mono truncate">@{user.username}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                  user.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="تسجيل الخروج"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 border border-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
        <p className="text-[10px] text-zinc-500 text-center font-medium">Enterprise ERP v1.0 • Secure</p>
      </div>
    </aside>
  );
}
