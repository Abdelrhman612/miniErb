interface AlertProps {
  type: 'error' | 'success' | 'info';
  message: string;
}

export function Alert({ type, message }: AlertProps) {
  const styles = {
    error: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  };

  const icons = {
    error: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${styles[type]}`}>
      {icons[type]}
      <p>{message}</p>
    </div>
  );
}
