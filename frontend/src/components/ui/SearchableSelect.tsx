import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string | number;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'اختر...',
  disabled = false,
  error,
  loading = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optValue: string | number) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="w-full relative text-right" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          {label} {required && <span className="text-emerald-400">*</span>}
        </label>
      )}

      <div
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 rounded-xl bg-slate-950 border text-sm flex items-center justify-between cursor-pointer transition-all ${
          error
            ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
            : isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-800 hover:border-slate-700'
        } ${disabled || loading ? 'opacity-50 cursor-not-allowed bg-slate-900/50' : ''}`}
      >
        <span className={selectedOption ? 'text-slate-100 truncate' : 'text-slate-500 truncate'}>
          {loading ? 'جاري التحميل...' : selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && !disabled && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-slate-800">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">لا توجد نتائج مطابقة</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.subLabel && <span className="text-[10px] text-slate-500 font-mono ms-2 shrink-0">{opt.subLabel}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-rose-400 text-[11px] mt-1">{error}</p>}
    </div>
  );
};
