import type { Account } from '../../types';

interface AccountSelectorProps {
  accounts: Account[];
  value: number | undefined;
  onChange: (accountId: number) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function AccountSelector({
  accounts,
  value,
  onChange,
  label = 'الحساب المحاسبي',
  required = false,
  disabled = false,
  className = '',
  placeholder = 'اختر الحساب...',
}: AccountSelectorProps) {
  // Filter posting accounts (non-group, active) or all accounts with visual distinction
  const postingAccounts = accounts.filter(a => !a.isGroup && a.isActive);

  return (
    <div className={`space-y-1 text-right ${className}`} dir="rtl">
      {label && (
        <label className="block text-xs font-semibold text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        required={required}
        disabled={disabled}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {postingAccounts.map((acc) => {
          const typeName =
            acc.accountType === 'Asset'
              ? 'أصول'
              : acc.accountType === 'Liability'
              ? 'التزامات'
              : acc.accountType === 'Equity'
              ? 'حقوق ملكية'
              : acc.accountType === 'Revenue'
              ? 'إيرادات'
              : acc.accountType === 'Expense'
              ? 'مصروفات'
              : acc.accountType === 'Treasury'
              ? 'خزنة'
              : acc.accountType === 'Customer'
              ? 'عميل'
              : acc.accountType === 'Supplier'
              ? 'مورد'
              : acc.accountType;

          return (
            <option key={acc.id} value={acc.id}>
              {acc.code} - {acc.name} ({typeName})
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default AccountSelector;
