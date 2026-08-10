import { useState } from 'react'
import { checkHealth } from './services/api'
import './index.css'

type ConnectionStatus = 'idle' | 'loading' | 'success' | 'error';

function App() {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [lastChecked, setLastChecked] = useState<string>('');

  const handleTestConnection = async () => {
    setStatus('loading');
    setErrorDetails('');
    setMessage('');
    
    try {
      // Simulate slight network delay for better UX micro-interaction
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const data = await checkHealth();
      setStatus('success');
      setMessage(data.message || 'Sewing Parts ERP API is running');
      setLastChecked(new Date().toLocaleTimeString('ar-EG'));
    } catch (err: any) {
      setStatus('error');
      console.error(err);
      setErrorDetails(err.message || 'Network Error');
      setLastChecked(new Date().toLocaleTimeString('ar-EG'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      
      {/* Decorative background grid and glowing orbs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
      
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              {/* Gear + Needle SVG */}
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Sewing Parts ERP</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              إصدار تجريبي v1.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-16 flex-grow flex flex-col items-center justify-center text-center">
        
        {/* Main Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-sm text-slate-300 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>منصة الربط والتشغيل الأساسية</span>
        </div>

        {/* Titles */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-6">
          <span className="block text-slate-100 mb-2">Sewing Parts ERP</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 py-2">
            نظام إدارة محل قطع غيار ماكينات الخياطة
          </span>
        </h1>

        {/* Short Description */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          نظام متكامل ومطور خصيصاً لإدارة قطع غيار ماكينات الخياطة، يربط بين حركة المخزن، المبيعات، الطلبيات، وحسابات الموردين في منصة موحدة فائقة السرعة.
        </p>

        {/* Testing Card (Glassmorphism) */}
        <div className="w-full max-w-xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
          
          <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center justify-center gap-2">
            <span>فحص الاتصال والربط البرمجي</span>
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </h2>

          <div className="space-y-6">
            
            {/* Connection Test Action Button */}
            <button
              onClick={handleTestConnection}
              disabled={status === 'loading'}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 transform active:scale-98 flex items-center justify-center gap-3 cursor-pointer ${
                status === 'loading'
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/10 hover:shadow-emerald-500/25 hover:-translate-y-0.5'
              }`}
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>جاري فحص الاتصال...</span>
                </>
              ) : (
                <>
                  <span>اختبار الاتصال بالسيرفر</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            {/* Displaying Connection Status */}
            <div className="border-t border-slate-800/80 pt-6">
              {status === 'idle' && (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                  <div className="w-3 h-3 rounded-full bg-slate-600 mb-2"></div>
                  <span className="text-slate-400 text-sm font-medium">لم يتم فحص الاتصال بعد</span>
                </div>
              )}

              {status === 'loading' && (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-blue-500/20 animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mb-2 animate-ping"></div>
                  <span className="text-blue-400 text-sm font-medium">جاري فحص الاتصال بالسيرفر، يرجى الانتظار...</span>
                </div>
              )}

              {status === 'success' && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold mb-2">
                      ✓
                    </div>
                    <span className="text-emerald-400 font-bold text-base">السيرفر متصل بنجاح ✓</span>
                  </div>
                  
                  {/* Detailed response */}
                  <div className="bg-slate-950/60 p-4 rounded-xl text-right text-xs space-y-2 border border-slate-800/80 font-mono">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>الرد المستلم:</span>
                      <span className="text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">200 OK</span>
                    </div>
                    <p className="text-slate-300 font-sans text-sm mt-1">{message}</p>
                    <div className="flex justify-between items-center text-slate-500 mt-2 border-t border-slate-900 pt-2">
                      <span>وقت الاستجابة:</span>
                      <span>{lastChecked}</span>
                    </div>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center p-4 bg-rose-500/10 rounded-2xl border border-rose-500/30">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold mb-2">
                      ✕
                    </div>
                    <span className="text-rose-400 font-bold text-base">فشل الاتصال بالسيرفر ✕</span>
                  </div>

                  {/* Detailed error details */}
                  <div className="bg-slate-950/60 p-4 rounded-xl text-right text-xs space-y-2 border border-slate-800/80 font-mono">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>تفاصيل الخطأ:</span>
                      <span className="text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">ERR_CONNECTION</span>
                    </div>
                    <p className="text-rose-300 text-sm mt-1 font-sans">{errorDetails}</p>
                    <p className="text-slate-500 text-[10px] leading-relaxed mt-1">
                      يرجى التأكد من تشغيل سيرفر الـ backend على المنفذ 3000 وتفعيل الـ CORS.
                    </p>
                    <div className="flex justify-between items-center text-slate-500 mt-2 border-t border-slate-900 pt-2">
                      <span>توقيت المحاولة:</span>
                      <span>{lastChecked}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Feature quick view */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-16 text-right">
          <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl">
            <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>تتبع قطع الغيار</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              إدارة مرنة للمخزون حسب أرقام الأجزاء، الموديلات، والعلامات التجارية المتوافقة (Singer, Juki, Pegasus...)
            </p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl">
            <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span>المبيعات والمشتريات</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              تسجيل المبيعات اليومية وفواتير المشتريات من الموردين وتحديث فوري للكميات المتوفرة.
            </p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl">
            <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>تقارير ذكية</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              مراقبة النواقص، مستويات إعادة الطلب، وتحديد المنتجات الأكثر طلباً والأرباح الإجمالية.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>نظام Sewing Parts ERP - جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
          <div className="flex gap-4">
            <span className="text-slate-600 hover:text-slate-400 transition-colors">بنية النظام: React 19 + ASP.NET Core 10</span>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default App
