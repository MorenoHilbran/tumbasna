'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Search, 
  Store, 
  Sprout, 
  ShieldAlert, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Calendar,
  Package,
  ShoppingCart,
  DollarSign,
  Trash2,
  Loader2,
  ShieldCheck,
  FileText,
  XCircle,
  CheckCircle2,
  ExternalLink,
  X
} from 'lucide-react';

interface UserCount {
  productEntries: number;
  orders: number;
}

interface User {
  id: string;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  role: 'PETANI' | 'PEDAGANG' | 'ADMIN';
  address: string | null;
  businessName: string | null;
  businessType: string | null;
  bankName: string | null;
  bankAccount: string | null;
  nibUrl: string | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  balance: string;
  createdAt: string;
  _count: UserCount;
}

interface DashboardStats {
  totalUsers: number;
  totalSuppliers: number;
  totalBuyers: number;
  totalAdmins: number;
}

export default function PenggunaPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'supplier' | 'buyer'>('supplier');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [suppliers, setSuppliers] = useState<User[]>([]);
  const [buyers, setBuyers] = useState<User[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [selectedNibUser, setSelectedNibUser] = useState<User | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSuppliers: 0,
    totalBuyers: 0,
    totalAdmins: 0
  });

  const handleVerifySupplier = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setVerifyLoading(true);
      const res = await fetch('/api/admin/verify-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses verifikasi NIB');
      }
      setSelectedNibUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, nameOrPhone: string) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus pengguna "${nameOrPhone}" beserta seluruh produk, transaksi, dan riwayat chat bot AI mereka secara permanen?`);
    if (!confirmDelete) return;

    try {
      setDeleteLoading(id);
      const res = await fetch(`/api/dashboard/users?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menghapus pengguna');
      }

      // Refresh list
      fetchUsers();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/users?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Gagal memuat data pengguna');
      const json = await res.json();
      if (json.success) {
        setSuppliers(json.data.suppliers || []);
        setBuyers(json.data.buyers || []);
        setStats(json.data.stats || {
          totalUsers: 0,
          totalSuppliers: 0,
          totalBuyers: 0,
          totalAdmins: 0
        });
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            Manajemen Pengguna
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lihat, cari, dan kelola supplier (petani) dan buyer (pedagang) yang terdaftar di platform Tumbasna.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">TOTAL PENGGUNA</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalUsers}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Termasuk admin platform</p>
          </div>
        </div>

        {/* Suppliers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">SUPPLIER (PETANI)</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalSuppliers}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Penyuplai bahan pangan utama</p>
          </div>
        </div>

        {/* Buyers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">BUYER (PEDAGANG)</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalBuyers}</h3>
            <p className="text-[10px] text-blue-600 font-medium mt-0.5">Pemilik usaha & warung retail</p>
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab switchers */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('supplier')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'supplier'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sprout className="w-4 h-4" />
            Supplier (Petani)
          </button>
          <button
            onClick={() => setActiveTab('buyer')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'buyer'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            Buyer (Pedagang)
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, toko, atau HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none transition-all placeholder:text-slate-400 text-slate-800 font-medium"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Memuat data pengguna terdaftar...</p>
          </div>
        ) : error ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-850">Gagal Memuat Data</h4>
            <p className="text-xs text-slate-400 max-w-sm">{error}</p>
          </div>
        ) : (activeTab === 'supplier' ? suppliers : buyers).length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Tidak Ada Pengguna</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              {search ? 'Tidak ada pengguna yang cocok dengan kriteria pencarian Anda.' : `Belum ada ${activeTab === 'supplier' ? 'supplier' : 'buyer'} yang terdaftar.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="px-5 py-4 min-w-[230px]">Profil & Usaha</th>
                  <th className="px-5 py-4 min-w-[160px] whitespace-nowrap">Kontak</th>
                  <th className="px-5 py-4 min-w-[180px]">Alamat Usaha</th>
                  <th className="px-5 py-4 min-w-[150px] whitespace-nowrap">Status QC / NIB</th>
                  <th className="px-5 py-4 min-w-[160px] whitespace-nowrap">Informasi Rekening</th>
                  <th className="px-5 py-4 text-center min-w-[130px] whitespace-nowrap">
                    {activeTab === 'supplier' ? 'Total Listing' : 'Total Transaksi'}
                  </th>
                  <th className="px-5 py-4 text-right min-w-[150px] whitespace-nowrap">Terdaftar</th>
                  <th className="px-5 py-4 text-center min-w-[80px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                {(activeTab === 'supplier' ? suppliers : buyers).map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Profil & Usaha */}
                    <td className="px-5 py-4 min-w-[230px]">
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-snug">
                          {user.businessName || user.name || 'Tidak ada nama'}
                        </p>
                        {user.name && user.businessName && user.name !== user.businessName && (
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                            {activeTab === 'supplier' ? (
                              <Sprout className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <Store className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            )}
                            <span className="truncate">Pemilik: <strong className="text-slate-700 font-semibold">{user.name}</strong></span>
                          </div>
                        )}
                        {user.businessType && (
                          <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                            {user.businessType}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Kontak */}
                    <td className="px-5 py-4 space-y-1 min-w-[160px] whitespace-nowrap">
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <a 
                          href={`https://wa.me/${user.phoneNumber}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-emerald-600 font-bold"
                        >
                          +{user.phoneNumber}
                        </a>
                      </p>
                      {user.email && (
                        <p className="flex items-center gap-1.5 text-slate-500 font-normal">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {user.email}
                        </p>
                      )}
                    </td>

                    {/* Alamat Usaha */}
                    <td className="px-5 py-4 min-w-[180px] max-w-[240px]">
                      <p className="flex items-start gap-1.5 text-slate-500 leading-relaxed font-normal">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{user.address || 'Alamat belum diatur'}</span>
                      </p>
                    </td>

                    {/* Status QC / NIB */}
                    <td className="px-5 py-4 min-w-[150px] whitespace-nowrap">
                      {user.role === 'PETANI' ? (
                        <button
                          onClick={() => setSelectedNibUser(user)}
                          className="inline-flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer group"
                          title="Klik untuk verifikasi NIB & Quality Control"
                        >
                          {user.verificationStatus === 'APPROVED' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg group-hover:bg-emerald-100 whitespace-nowrap">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              Approved
                            </span>
                          ) : user.verificationStatus === 'REJECTED' ? (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg group-hover:bg-rose-100 whitespace-nowrap">
                              <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                              Ditolak
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg group-hover:bg-amber-100 whitespace-nowrap">
                              <FileText className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              Pending Review
                            </span>
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400 font-normal italic">-</span>
                      )}
                    </td>

                    {/* Informasi Rekening */}
                    <td className="px-5 py-4 min-w-[160px] whitespace-nowrap">
                      {user.bankName && user.bankAccount ? (
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            {user.bankName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-normal pl-5">
                            Rek: {user.bankAccount}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-normal">Belum diatur</span>
                      )}
                    </td>

                    {/* Total Association */}
                    <td className="px-5 py-4 text-center min-w-[130px] whitespace-nowrap">
                      {activeTab === 'supplier' ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] whitespace-nowrap">
                          <Package className="w-3.5 h-3.5 flex-shrink-0" />
                          {user._count?.productEntries || 0} Produk
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] whitespace-nowrap">
                          <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                          {user._count?.orders || 0} Transaksi
                        </div>
                      )}
                    </td>

                    {/* Terdaftar */}
                    <td className="px-5 py-4 text-right min-w-[150px] whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <p className="text-slate-700 font-semibold text-xs whitespace-nowrap">{formatDate(user.createdAt)}</p>
                        <p className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5 whitespace-nowrap">
                          <Calendar className="w-3 h-3 flex-shrink-0 text-slate-400" />
                          Tumbasna ID
                        </p>
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-4 text-center min-w-[80px]">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name || user.phoneNumber)}
                        disabled={deleteLoading === user.id}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all disabled:opacity-50 inline-flex items-center justify-center"
                        title="Hapus Pengguna & Sesi Bot"
                      >
                        {deleteLoading === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Verifikasi NIB / Quality Control */}
      {mounted && selectedNibUser && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex justify-center items-start sm:items-center animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-xl sm:max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-4rem)] my-auto border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 via-white to-emerald-50/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    Verifikasi NIB (Quality Control)
                    {selectedNibUser.verificationStatus === 'APPROVED' ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Approved</span>
                    ) : selectedNibUser.verificationStatus === 'REJECTED' ? (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Ditolak</span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Pending Review</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedNibUser.businessName || selectedNibUser.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNibUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs font-medium">
              {/* Box Foto Dokumen NIB */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Dokumen NIB yang Diunggah via WhatsApp
                  </p>
                  {selectedNibUser.nibUrl && (
                    <a 
                      href={selectedNibUser.nibUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      Buka Gambar Asli
                    </a>
                  )}
                </div>

                {selectedNibUser.nibUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100/80 p-2 flex items-center justify-center min-h-[180px] max-h-[250px]">
                    <img 
                      src={selectedNibUser.nibUrl} 
                      alt="Dokumen NIB Supplier"
                      className="max-h-[230px] w-auto object-contain rounded-lg shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="py-10 px-6 text-center bg-amber-50/60 rounded-xl border border-dashed border-amber-200 text-amber-900">
                    <FileText className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs font-bold">Dokumen NIB Sampel / Belum Ada Gambar</p>
                    <p className="text-[11px] text-amber-700 max-w-md mx-auto mt-1 leading-relaxed">
                      Supplier mendaftar dari WhatsApp tanpa lampiran gambar, atau menggunakan foto sampel dummy saat pengujian.
                    </p>
                  </div>
                )}
              </div>

              {/* Grid Informasi Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 flex-shrink-0 shadow-xs">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemilik Usaha</span>
                    <p className="font-bold text-slate-800 text-xs truncate mt-0.5">{selectedNibUser.name || '-'}</p>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 flex-shrink-0 shadow-xs">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor WhatsApp</span>
                    <p className="font-bold text-slate-800 text-xs truncate mt-0.5">+{selectedNibUser.phoneNumber}</p>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 flex-shrink-0 shadow-xs">
                    <MapPin className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Kebun/Gudang</span>
                    <p className="font-bold text-slate-800 text-xs line-clamp-2 mt-0.5">{selectedNibUser.address || '-'}</p>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 flex-shrink-0 shadow-xs">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rekening Pencairan</span>
                    <p className="font-bold text-slate-800 text-xs truncate mt-0.5">
                      {selectedNibUser.bankName && selectedNibUser.bankAccount
                        ? `${selectedNibUser.bankName} (${selectedNibUser.bankAccount})`
                        : 'Belum diatur'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => setSelectedNibUser(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVerifySupplier(selectedNibUser.id, 'REJECTED')}
                  disabled={verifyLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Tolak Supplier
                </button>

                <button
                  onClick={() => handleVerifySupplier(selectedNibUser.id, 'APPROVED')}
                  disabled={verifyLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Setujui Supplier (Kirim WA)
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
