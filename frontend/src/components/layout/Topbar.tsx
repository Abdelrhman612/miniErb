import React from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

const routeNames: Record<string, string> = {
  '/dashboard': 'لوحة المؤشرات المالية',
  '/products': 'إدارة المنتجات',
  '/categories': 'إدارة الفئات',
  '/warehouses': 'المخازن والمستودعات',
  '/chart-of-accounts': 'دليل الحسابات',
  '/treasury': 'الخزنة والحسابات النقدية',
  '/customers': 'إدارة العملاء',
  '/suppliers': 'إدارة الموردين',
  '/purchase-invoices': 'فواتير المشتريات',
  '/sales-invoices': 'فواتير المبيعات',
  '/receipt-vouchers': 'سندات القبض',
  '/payment-vouchers': 'سندات الصرف',
  '/journal-vouchers': 'سندات القيود المزدوجة',
  '/users': 'إدارة المستخدمين',
};

export const Topbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const currentTitle = routeNames[location.pathname] || 'نظام الإدارة المتكامل';

  return (
    <header className="h-18 bg-[#09090B]/90 backdrop-blur-md border-b border-zinc-800/80 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-zinc-400">MiniERP</span>
        </div>
        <span className="text-zinc-700">/</span>
        <h1 className="text-base font-bold text-zinc-100">{currentTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* System Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>متصل بالسيرفر الآمن</span>
        </div>

        {/* User Mini Profile */}
        {user && (
          <div className="flex items-center gap-3 ps-3 border-s border-zinc-800">
            <div className="text-start">
              <p className="text-xs font-bold text-zinc-200">{user.displayName}</p>
              <p className="text-[10px] text-zinc-400 font-mono">@{user.username}</p>
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
      </div>
    </header>
  );
};
