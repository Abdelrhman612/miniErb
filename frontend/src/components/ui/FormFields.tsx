import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, id, ...rest }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-2.5 rounded-xl bg-slate-800 border text-slate-100 placeholder-slate-500
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all
          ${error ? 'border-rose-500/60' : 'border-slate-700/60 hover:border-slate-600'}`}
        {...rest}
      />
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextareaField({ label, error, id, ...rest }: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className={`w-full px-4 py-2.5 rounded-xl bg-slate-800 border text-slate-100 placeholder-slate-500
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none
          ${error ? 'border-rose-500/60' : 'border-slate-700/60 hover:border-slate-600'}`}
        {...rest}
      />
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function SelectField({ label, error, id, children, ...rest }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <select
        id={id}
        className={`w-full px-4 py-2.5 rounded-xl bg-slate-800 border text-slate-100
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all
          ${error ? 'border-rose-500/60' : 'border-slate-700/60 hover:border-slate-600'}`}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}
