import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  Lock,
  Mail,
  Plus,
  Power,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { apiClient } from '../../services/apiClient.js';
import { AdminPetugasItem, AdminRole } from '../../types/index.js';
import { ToastAlert } from '../../components/feedback/ToastAlert.js';

export const ManajemenPetugas: React.FC = () => {
  const { admin } = useAuth();
  const [petugasList, setPetugasList] = useState<AdminPetugasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal Tambah Petugas
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    role: 'counselor' as AdminRole,
  });
  const [adding, setAdding] = useState(false);

  // Modal Edit Peran
  const [editingPetugas, setEditingPetugas] = useState<AdminPetugasItem | null>(null);
  const [newRole, setNewRole] = useState<AdminRole>('counselor');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Dialog Konfirmasi Ubah Status
  const [statusConfirmPetugas, setStatusConfirmPetugas] = useState<AdminPetugasItem | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchPetugas = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getPetugasList();
      setPetugasList(data);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Gagal memuat daftar petugas.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetugas();
  }, []);

  // Filter list by search query
  const filteredList = petugasList.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.full_name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.role.toLowerCase().includes(q)
    );
  });

  // Handler Submit Tambah Petugas
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.full_name.trim() || !addForm.email.trim()) {
      setToast({ type: 'error', message: 'Nama lengkap dan email wajib diisi.' });
      return;
    }

    setAdding(true);
    try {
      const created = await apiClient.createPetugas(addForm);
      setToast({
        type: 'success',
        message: `Petugas ${created.full_name} (${created.email}) berhasil ditambahkan.`,
      });
      setIsAddModalOpen(false);
      setAddForm({ full_name: '', email: '', role: 'counselor' });
      fetchPetugas();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Gagal menambahkan petugas baru.',
      });
    } finally {
      setAdding(false);
    }
  };

  // Handler Submit Ubah Peran
  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPetugas) return;

    setUpdatingRole(true);
    try {
      await apiClient.updatePetugasRole(editingPetugas.id, newRole);
      setToast({
        type: 'success',
        message: `Peran ${editingPetugas.full_name} berhasil diubah menjadi ${getRoleLabel(newRole)}.`,
      });
      setEditingPetugas(null);
      fetchPetugas();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Gagal memperbarui peran petugas.',
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  // Handler Konfirmasi Toggle Status
  const handleToggleStatus = async () => {
    if (!statusConfirmPetugas) return;

    setUpdatingStatus(true);
    const targetStatus = !statusConfirmPetugas.is_active;
    try {
      await apiClient.updatePetugasStatus(statusConfirmPetugas.id, targetStatus);
      setToast({
        type: 'success',
        message: `Akun ${statusConfirmPetugas.full_name} berhasil ${
          targetStatus ? 'diaktifkan' : 'dinonaktifkan'
        }.`,
      });
      setStatusConfirmPetugas(null);
      fetchPetugas();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Gagal mengubah status petugas.',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getRoleLabel = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'case_manager':
        return 'Case Manager';
      case 'counselor':
        return 'Guru BK / Konselor';
      default:
        return role;
    }
  };

  const isProtectedAdmin = (target: AdminPetugasItem) => {
    // Akun Yandri Utama atau diri sendiri tidak boleh dideaktivasi / didemosikan sembarangan
    const isYandri = target.email.toLowerCase().includes('yandri');
    const isSelf = admin?.id === target.id;
    return isYandri || isSelf;
  };

  // Guard jika bukan super_admin
  if (admin?.role !== 'super_admin') {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 rounded-3xl bg-white border border-rose-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#17324D]">Akses Dibatasi Khusus Super Admin</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Halaman Manajemen Petugas hanya dapat diakses oleh Super Admin untuk mengelola akun petugas Satgas PPKSP dan Guru BK.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <ToastAlert
          type={toast.type}
          title={toast.type === 'success' ? 'Berhasil' : 'Terjadi Kesalahan'}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#0F9F91] border border-emerald-200">
              <Shield className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-black text-[#17324D] tracking-tight">
              Manajemen Akun Petugas
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola petugas Satgas PPKSP dan Guru BK, izin peran penanganan kasus, serta status tautan Google OAuth.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPetugas}
            className="p-2.5 rounded-xl text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-lg hover:shadow-[#0F9F91]/25 transition-all shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Petugas</span>
          </button>
        </div>
      </div>

      {/* Info Card: Cara Kerja Autentikasi Google */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-950">Prinsip Keamanan Akun Petugas:</p>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Petugas baru didaftarkan dengan alamat email Google tanpa memerlukan kata sandi.
            Saat petugas masuk via <strong>Google OAuth</strong> pertama kali, sistem akan memverifikasi email dan
            secara atomik menautkan akun Google ke profil petugas. Pengguna luar yang tidak terdaftar di tabel ini
            otomatis ditolak dari panel penanganan kasus.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau peran..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0F9F91] outline-hidden bg-slate-50/50 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-400 self-start sm:self-auto">
          Menampilkan <strong className="text-slate-700">{filteredList.length}</strong> petugas terdaftar
        </div>
      </div>

      {/* Table Petugas */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 sm:px-6">Petugas</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4">Tautan Google OAuth</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0F9F91] border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data petugas...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada petugas yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isYandri = item.email.toLowerCase().includes('yandri');
                  const isSelf = admin?.id === item.id;
                  const isLinked = Boolean(item.auth_user_id);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Email */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-[#0F9F91]">
                            {item.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                              <span>{item.full_name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                                  Anda
                                </span>
                              )}
                              {isYandri && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800">
                                  Utama
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">{item.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            item.role === 'super_admin'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.role === 'case_manager'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{getRoleLabel(item.role)}</span>
                        </span>
                      </td>

                      {/* Status Akun */}
                      <td className="py-4 px-4">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <UserX className="w-3 h-3" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>

                      {/* Status Google OAuth */}
                      <td className="py-4 px-4">
                        {isLinked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <Check className="w-3.5 h-3.5" />
                            <span>Terhubung</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Menunggu Login</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Edit Role Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPetugas(item);
                              setNewRole(item.role);
                            }}
                            disabled={isYandri}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                            title={isYandri ? 'Peran Super Admin utama terkunci' : 'Ubah Peran'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active Button */}
                          <button
                            type="button"
                            onClick={() => setStatusConfirmPetugas(item)}
                            disabled={isProtectedAdmin(item)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.is_active
                                ? 'text-rose-500 hover:bg-rose-50 disabled:opacity-40'
                                : 'text-emerald-600 hover:bg-emerald-50 disabled:opacity-40'
                            }`}
                            title={
                              isProtectedAdmin(item)
                                ? 'Akun ini dilindungi dari penonaktifan'
                                : item.is_active
                                ? 'Nonaktifkan Akun'
                                : 'Aktifkan Akun'
                            }
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === MODAL TAMBAH PETUGAS === */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0F9F91]" />
                <h3 className="font-bold text-base text-[#17324D]">Tambah Petugas Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={addForm.full_name}
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                    placeholder="Contoh: Dra. Siti Rahmawati, M.Pd"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0F9F91] outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Email Akun Google (Wajib Google)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="nama.petugas@gmail.com atau email sekolah"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0F9F91] outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Email ini harus sama persis dengan akun Google yang digunakan saat login.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Peran &amp; Hak Akses</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as AdminRole })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0F9F91] outline-hidden bg-white"
                >
                  <option value="counselor">Guru BK / Konselor (Akses terbatas laporan ditugaskan)</option>
                  <option value="case_manager">Case Manager (Investigasi, verifikasi &amp; disposisi laporan)</option>
                  <option value="super_admin">Super Admin (Akses penuh + manajemen petugas)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                Petugas tidak memerlukan kata sandi. Setelah disimpan, petugas dapat langsung masuk via tombol <strong>Masuk dengan Google</strong>.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-md disabled:opacity-50 transition-all"
                >
                  {adding ? 'Menyimpan...' : 'Simpan Petugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL EDIT PERAN === */}
      {editingPetugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0F9F91]" />
                <h3 className="font-bold text-base text-[#17324D]">Ubah Peran Petugas</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPetugas(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <p className="font-bold text-slate-800">{editingPetugas.full_name}</p>
              <p className="text-[11px] text-slate-500 font-mono">{editingPetugas.email}</p>
            </div>

            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Pilih Peran Baru</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="counselor"
                      checked={newRole === 'counselor'}
                      onChange={() => setNewRole('counselor')}
                      className="mt-0.5 text-[#0F9F91] focus:ring-[#0F9F91]"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Guru BK / Konselor</span>
                      <span className="text-[11px] text-slate-500">
                        Hanya dapat membaca dan menangani laporan yang ditugaskan secara khusus kepadanya.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="case_manager"
                      checked={newRole === 'case_manager'}
                      onChange={() => setNewRole('case_manager')}
                      className="mt-0.5 text-[#0F9F91] focus:ring-[#0F9F91]"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Case Manager</span>
                      <span className="text-[11px] text-slate-500">
                        Dapat melihat semua laporan, memperbarui status, dan menugaskan kasus ke konselor.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="super_admin"
                      checked={newRole === 'super_admin'}
                      onChange={() => setNewRole('super_admin')}
                      className="mt-0.5 text-[#0F9F91] focus:ring-[#0F9F91]"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Super Admin</span>
                      <span className="text-[11px] text-slate-500">
                        Akses penuh ke seluruh sistem, audit log, dan hak manajemen akun petugas.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPetugas(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updatingRole}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#0F9F91] to-[#0B7A6F] hover:shadow-md disabled:opacity-50 transition-all"
                >
                  {updatingRole ? 'Memperbarui...' : 'Simpan Peran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === DIALOG KONFIRMASI STATUS (AKTIF / NONAKTIF) === */}
      {statusConfirmPetugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-sm w-full space-y-4 text-center">
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                statusConfirmPetugas.is_active
                  ? 'bg-rose-50 border border-rose-200 text-rose-500'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
              }`}
            >
              <Power className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#17324D]">
                {statusConfirmPetugas.is_active ? 'Nonaktifkan Akun Petugas?' : 'Aktifkan Akun Petugas?'}
              </h3>
              <p className="text-xs text-slate-500">
                {statusConfirmPetugas.is_active
                  ? `Petugas ${statusConfirmPetugas.full_name} tidak akan dapat login lagi dan semua sesi aktifnya akan segera dicabut.`
                  : `Petugas ${statusConfirmPetugas.full_name} akan dapat masuk kembali menggunakan Google OAuth.`}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusConfirmPetugas(null)}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={updatingStatus}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white transition-all ${
                  statusConfirmPetugas.is_active
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#0F9F91] hover:bg-[#0B7A6F]'
                }`}
              >
                {updatingStatus
                  ? 'Memproses...'
                  : statusConfirmPetugas.is_active
                  ? 'Ya, Nonaktifkan'
                  : 'Ya, Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
