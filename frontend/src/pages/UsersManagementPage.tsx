import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api/authService';
import type { UserResponseDto } from '../types';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const UsersManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل تحميل المستخدمين.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchUsers();
    }
  }, [user]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      await authService.createUser({ username, password, displayName, role });
      setSuccessMessage('تم إنشاء المستخدم بنجاح.');
      setUsername('');
      setDisplayName('');
      setPassword('');
      setRole('Employee');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل إنشاء المستخدم.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من تعطيل هذا المستخدم؟')) return;

    try {
      setError('');
      await authService.deleteUser(id);
      setSuccessMessage('تم تعطيل المستخدم بنجاح.');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل تعطيل المستخدم.');
    }
  };

  if (user?.role !== 'Admin') {
    return (
      <div className="p-8 text-center text-slate-400">
        <h2 className="text-xl font-bold text-red-400 mb-2">غير مصرح لك بالوصول</h2>
        <p>هذه الصفحة مخصصة لمديري النظام (Admin) فقط.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">إدارة المستخدمين</h1>
        <p className="text-sm text-slate-400 mt-1">إنشاء ومتابعة حسابات مستخدمي النظام والصلاحيات</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
          {successMessage}
        </div>
      )}

      {/* Create User Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">إضافة مستخدم جديد</h2>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">اسم المستخدم</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="اسم المستخدم"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">الاسم الظاهري</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="الاسم الظاهري"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="كلمة المرور"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">الصلاحية (الدور)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="Employee">موظف (Employee)</option>
              <option value="Admin">مدير (Admin)</option>
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {submitting ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-200">قائمة المستخدمين</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">اسم المستخدم</th>
                <th className="px-6 py-3 font-medium">الاسم الظاهري</th>
                <th className="px-6 py-3 font-medium">الدور</th>
                <th className="px-6 py-3 font-medium">الحالة</th>
                <th className="px-6 py-3 font-medium">تاريخ الإنشاء</th>
                <th className="px-6 py-3 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u, index) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="px-6 py-4 text-slate-400">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-slate-200">{u.username}</td>
                  <td className="px-6 py-4 text-slate-300">{u.displayName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {u.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-4">
                    {u.isActive && u.id !== user.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-400 hover:text-red-300 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20"
                      >
                        تعطيل
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
