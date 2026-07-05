'use client';

import { useState, useEffect } from 'react';
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
  DollarSign
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
  const [activeTab, setActiveTab] = useState<'supplier' | 'buyer'>('supplier');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [suppliers, setSuppliers] = useState<User[]>([]);
  const [buyers, setBuyers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSuppliers: 0,
    totalBuyers: 0,
    totalAdmins: 0
  });

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
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="px-6 py-4">Profil & Usaha</th>
                  <th className="px-6 py-4">Kontak</th>
                  <th className="px-6 py-4">Alamat Usaha</th>
                  <th className="px-6 py-4">Informasi Rekening</th>
                  <th className="px-6 py-4 text-center">
                    {activeTab === 'supplier' ? 'Total Listing' : 'Total Transaksi'}
                  </th>
                  <th className="px-6 py-4 text-right">Terdaftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                {(activeTab === 'supplier' ? suppliers : buyers).map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Profil & Usaha */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {user.name || 'Tidak ada nama'}
                        </p>
                        {user.businessName && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-semibold">
                            {activeTab === 'supplier' ? (
                              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Store className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            {user.businessName}
                            {user.businessType && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({user.businessType})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Kontak */}
                    <td className="px-6 py-4 space-y-1">
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
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
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {user.email}
                        </p>
                      )}
                    </td>

                    {/* Alamat Usaha */}
                    <td className="px-6 py-4 max-w-xs">
                      <p className="flex items-start gap-1.5 text-slate-500 leading-relaxed font-normal">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{user.address || 'Alamat belum diatur'}</span>
                      </p>
                    </td>

                    {/* Informasi Rekening */}
                    <td className="px-6 py-4">
                      {user.bankName && user.bankAccount ? (
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1 text-slate-700">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            {user.bankName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal pl-4.5">
                            Rek: {user.bankAccount}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-normal">Belum diatur</span>
                      )}
                    </td>

                    {/* Total Association */}
                    <td className="px-6 py-4 text-center">
                      {activeTab === 'supplier' ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                          <Package className="w-3.5 h-3.5" />
                          {user._count?.productEntries || 0} Produk
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {user._count?.orders || 0} Transaksi
                        </div>
                      )}
                    </td>

                    {/* Terdaftar */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <p className="text-slate-700">{formatDate(user.createdAt)}</p>
                        <p className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          Tumbasna ID
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
