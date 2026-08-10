export function LoadingSpinner({ text = 'جاري التحميل...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
      </div>
      <span className="text-slate-400 text-sm">{text}</span>
    </div>
  );
}
