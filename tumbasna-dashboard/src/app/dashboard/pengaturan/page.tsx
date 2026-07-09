'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Zap,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Search,
  Check,
  Smartphone,
  MessageSquare,
  ShieldAlert,
  Loader2,
  Save,
  Sprout,
  DollarSign,
  MapPin,
  Clock,
  Plus
} from 'lucide-react';

interface Config {
  buyer: {
    midtransActive: boolean;
    codActive: boolean;
    bankTransferActive: boolean;
    maxCodRadius: number;
    minOrderKg: number;
    minOrderAmount: number;
    adminFee: number;
  };
  supplier: {
    aiBotActive: boolean;
    aiModel: string;
    jamKerjaMulai: string;
    jamKerjaSelesai: string;
    whitelistCommodities: string[];
  };
}

interface Product {
  id: string;
  commodity: string;
  qty: number;
  price: number;
  location: string;
  image: string | null;
  createdAt: string;
  status: string;
  supplierName: string;
  supplierPhone: string;
  safetyAnalysis: {
    safetyScore: number;
    isSafe: boolean;
    isAgricultural: boolean;
    flags: string[];
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState<'sistem' | 'moderasi' | 'chat'>('sistem');
  
  // Settings Config State
  const [config, setConfig] = useState<Config | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [newCommodity, setNewCommodity] = useState('');

  // Moderation State
  const [products, setProducts] = useState<Product[]>([]);
  const [modLoading, setModLoading] = useState(true);
  const [modError, setModError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [modifyingId, setModifyingId] = useState<string | null>(null);

  // Chat Monitoring State
  const [sessions, setSessions] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setChatLoading(true);
      const res = await fetch('/api/session');
      if (!res.ok) throw new Error('Gagal memuat sesi chat');
      const json = await res.json();
      if (json.success) {
        setSessions(json.data);
        if (json.data.length > 0 && !selectedSessionId) {
          setSelectedSessionId(json.data[0].phoneNumber);
        }
      }
    } catch (err: any) {
      setChatError(err.message || 'Terjadi kesalahan');
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearSession = async (phone: string) => {
    if (!confirm(`Apakah Anda yakin ingin mereset sesi chat untuk nomor ${phone}? Riwayat percakapan dengan bot AI akan dihapus bersih.`)) {
      return;
    }
    
    try {
      setDeletingSessionId(phone);
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'DELETE' })
      });
      if (!res.ok) throw new Error('Gagal mereset sesi');
      const json = await res.json();
      if (json.success) {
        setSessions(prev => prev.filter(s => s.phoneNumber !== phone));
        if (selectedSessionId === phone) {
          setSelectedSessionId(null);
        }
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setDeletingSessionId(null);
    }
  };

  // Fetch configs
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/dashboard/settings');
      if (!res.ok) throw new Error('Gagal memuat pengaturan');
      const json = await res.json();
      if (json.success) {
        setConfig(json.data);
      }
    } catch (err: any) {
      setConfigError(err.message || 'Terjadi kesalahan');
    }
  };

  // Fetch products for moderation
  const fetchProducts = async () => {
    try {
      setModLoading(true);
      const res = await fetch('/api/dashboard/products/moderate');
      if (!res.ok) throw new Error('Gagal memuat produk moderasi');
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      }
    } catch (err: any) {
      setModError(err.message || 'Terjadi kesalahan');
    } finally {
      setModLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchProducts();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchSessions();
    }
  }, [activeTab]);

  // Save Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setSaveLoading(true);
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!res.ok) throw new Error('Gagal memperbarui pengaturan');
      const json = await res.json();
      if (json.success) {
        setConfig(json.data);
        setSuccessMsg('Pengaturan platform berhasil disimpan!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setConfigError(err.message || 'Gagal menyimpan');
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete product (Moderation)
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini dari database? Produk ini tidak akan terlihat lagi di aplikasi pembeli.')) {
      return;
    }

    try {
      setModifyingId(id);
      const res = await fetch(`/api/dashboard/products/moderate?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal memoderasi produk');
      const json = await res.json();
      if (json.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setModifyingId(null);
    }
  };

  // Add commodity tag
  const handleAddCommodity = () => {
    if (!newCommodity.trim() || !config) return;
    const cleanTag = newCommodity.trim();
    if (config.supplier.whitelistCommodities.includes(cleanTag)) {
      setNewCommodity('');
      return;
    }
    setConfig({
      ...config,
      supplier: {
        ...config.supplier,
        whitelistCommodities: [...config.supplier.whitelistCommodities, cleanTag]
      }
    });
    setNewCommodity('');
  };

  // Remove commodity tag
  const handleRemoveCommodity = (tag: string) => {
    if (!config) return;
    setConfig({
      ...config,
      supplier: {
        ...config.supplier,
        whitelistCommodities: config.supplier.whitelistCommodities.filter(c => c !== tag)
      }
    });
  };

  // Filter and search products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterRisk === 'ALL') return matchesSearch;
    return matchesSearch && p.safetyAnalysis.riskLevel === filterRisk;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-emerald-600" />
            Pengaturan Sistem & Keamanan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Atur parameter operasional aplikasi pembeli, konfigurasi bot asisten WhatsApp, dan lakukan moderasi konten produk ilegal.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('sistem')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'sistem'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Konfigurasi Platform & AI
        </button>
        <button
          onClick={() => setActiveTab('moderasi')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 relative ${
            activeTab === 'moderasi'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Analisis & Moderasi Produk
          {products.some(p => p.safetyAnalysis.riskLevel === 'HIGH') && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Monitoring Chat AI
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'sistem' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {successMsg}
            </div>
          )}

          {configError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              {configError}
            </div>
          )}

          {!config ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Memuat konfigurasi sistem...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Buyer Configuration Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-850">Pengaturan Aplikasi Mobile (Buyer)</h2>
                </div>

                {/* Gateway Toggles */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metode Pembayaran</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-700">Midtrans QRIS</span>
                      <input
                        type="checkbox"
                        checked={config.buyer.midtransActive}
                        onChange={(e) => setConfig({
                          ...config,
                          buyer: { ...config.buyer, midtransActive: e.target.checked }
                        })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-700">Bayar COD</span>
                      <input
                        type="checkbox"
                        checked={config.buyer.codActive}
                        onChange={(e) => setConfig({
                          ...config,
                          buyer: { ...config.buyer, codActive: e.target.checked }
                        })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-700">Transfer Bank</span>
                      <input
                        type="checkbox"
                        checked={config.buyer.bankTransferActive}
                        onChange={(e) => setConfig({
                          ...config,
                          buyer: { ...config.buyer, bankTransferActive: e.target.checked }
                        })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                    </label>
                  </div>
                </div>

                {/* Shipping & Limits */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logistik & Limitasi Transaksi</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Radius Maksimal COD (KM)
                      </label>
                      <input
                        type="number"
                        value={config.buyer.maxCodRadius}
                        onChange={(e) => setConfig({
                          ...config,
                          buyer: { ...config.buyer, maxCodRadius: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <Sprout className="w-3.5 h-3.5 text-slate-400" />
                        Min. Kuantitas Order (KG)
                      </label>
                      <input
                        type="number"
                        value={config.buyer.minOrderKg}
                        onChange={(e) => setConfig({
                          ...config,
                          buyer: { ...config.buyer, minOrderKg: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        Min. Belanja (Rp)
                      </label>
                      <input
                        type="number"
                        value={config.buyer.minOrderAmount}
                        onChange={(e) => setConfig({
                          ...config,
                          buyer: { ...config.buyer, minOrderAmount: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        Biaya Admin / Fee Layanan (Rp)
                      </label>
                      <input
                        type="number"
                        value={config.buyer.adminFee}
                        onChange={(e) => setConfig({
                          ...config,
                          buyer: { ...config.buyer, adminFee: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Whatsapp Bot Config Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-850">Pengaturan WhatsApp AI Bot (Supplier)</h2>
                </div>

                {/* AI Active toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Balas Otomatis AI (Auto-Reply)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Nyalakan/matikan respon asisten AI secara penuh di WhatsApp.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.supplier.aiBotActive}
                    onChange={(e) => setConfig({
                      ...config,
                      supplier: { ...config.supplier, aiBotActive: e.target.checked }
                    })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                  />
                </div>

                {/* Model and operational hour */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-slate-400" />
                      Model AI Utama
                    </label>
                    <select
                      value={config.supplier.aiModel}
                      onChange={(e) => setConfig({
                        ...config,
                        supplier: { ...config.supplier, aiModel: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none text-slate-800 font-medium"
                    >
                      <option value="llama-3.1-8b-instant">Groq - Llama 3.1 8B (Respons Instan)</option>
                      <option value="gemini-1.5-flash">Google - Gemini 1.5 Flash (Kapasitas Besar)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Mulai Kerja
                      </label>
                      <input
                        type="time"
                        value={config.supplier.jamKerjaMulai}
                        onChange={(e) => setConfig({
                          ...config,
                          supplier: { ...config.supplier, jamKerjaMulai: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Selesai Kerja
                      </label>
                      <input
                        type="time"
                        value={config.supplier.jamKerjaSelesai}
                        onChange={(e) => setConfig({
                          ...config,
                          supplier: { ...config.supplier, jamKerjaSelesai: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Whitelist commodities */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Daftar Putih (Whitelist) Komoditas Sah
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Masukkan komoditas baru (misal: Beras Premium)"
                      value={newCommodity}
                      onChange={(e) => setNewCommodity(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCommodity(); } }}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none text-slate-800 font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddCommodity}
                      className="px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center border border-emerald-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 max-h-40 overflow-y-auto">
                    {config.supplier.whitelistCommodities.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100/50">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveCommodity(tag)}
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-emerald-200 text-emerald-600"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Action button bar */}
          {config && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                {saveLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan Perubahan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Pengaturan
                  </>
                )}
              </button>
            </div>
          )}

        </form>
      )}

      {activeTab === 'moderasi' && (
        
        /* Product Moderation Feed (Analisis & Moderasi) */
        <div className="space-y-6 animate-in">
          
          {/* Controls bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Filter Tabs by Risk */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl w-fit">
              {[
                { value: 'ALL', label: 'Semua Produk' },
                { value: 'HIGH', label: '🔴 Bahaya Tinggi' },
                { value: 'MEDIUM', label: '🟡 Waspada' },
                { value: 'LOW', label: '🟢 Aman' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilterRisk(opt.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterRisk === opt.value
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari komoditas, lokasi, petani..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none transition-all placeholder:text-slate-400 text-slate-800 font-medium"
              />
            </div>

          </div>

          {/* Moderation Grid */}
          {modLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Melakukan analisis keamanan produk...</p>
            </div>
          ) : modError ? (
            <div className="p-16 flex flex-col items-center justify-center text-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <Shield className="w-12 h-12 text-slate-300" />
              <h4 className="text-sm font-bold text-slate-800">Gagal Memproses Moderasi</h4>
              <p className="text-xs text-slate-400">{modError}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <Check className="w-12 h-12 text-emerald-500 bg-emerald-50 p-3 rounded-full border border-emerald-100" />
              <h4 className="text-sm font-bold text-slate-800">Konten Bersih & Aman</h4>
              <p className="text-xs text-slate-400">Tidak ada produk terdeteksi mencurigakan untuk kriteria filter ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const analysis = product.safetyAnalysis;
                const cardBorderColor = analysis.riskLevel === 'HIGH' 
                  ? 'border-rose-300 bg-rose-50/20' 
                  : analysis.riskLevel === 'MEDIUM' 
                    ? 'border-amber-300 bg-amber-50/20' 
                    : 'border-slate-200/80 bg-white';

                return (
                  <div
                    key={product.id}
                    className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${cardBorderColor}`}
                  >
                    <div>
                      {/* Safety Banner */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          analysis.riskLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : analysis.riskLevel === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          <Shield className="w-3.5 h-3.5" />
                          Risk: {analysis.riskLevel}
                        </span>

                        <span className={`text-xs font-bold ${
                          analysis.safetyScore < 50 ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                          Skor: {analysis.safetyScore}%
                        </span>
                      </div>

                      {/* Product Details */}
                      <div className="flex gap-4 items-start mb-4 relative">
                        {product.image && product.image.trim() !== '' ? (
                          <img
                            src={product.image}
                            alt={product.commodity}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-100 bg-slate-50 flex-shrink-0"
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement?.classList.add('fallback-triggered');
                            }}
                          />
                        ) : null}
                        <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 font-bold text-xs" style={{ display: product.image && product.image.trim() !== '' ? 'none' : 'flex' }} id="fallback-img">
                          No Img
                        </div>
                        <style jsx>{`
                          .fallback-triggered #fallback-img {
                            display: flex !important;
                          }
                        `}</style>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-slate-900 truncate uppercase">{product.commodity}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Harga: <span className="font-bold text-slate-800">Rp {product.price.toLocaleString('id-ID')}/kg</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Stok: {product.qty} kg</p>
                        </div>
                      </div>

                      {/* Warning Flags */}
                      {analysis.flags.length > 0 && (
                        <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl mb-4 space-y-1">
                          <p className="text-[10px] font-bold text-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            TERDETEKSI KATA TERLARANG:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.flags.map(flag => (
                              <span key={flag} className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-250">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Agricultural Category Check */}
                      {!analysis.isAgricultural && (
                        <div className="bg-amber-50 border border-amber-150 p-3 rounded-xl mb-4 space-y-0.5">
                          <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            KATEGORI NON-PANGAN / MENCURIGAKAN
                          </p>
                          <p className="text-[9px] text-amber-600 leading-normal font-medium">
                            Komoditas tidak cocok dengan kamus produk pertanian/peternakan/perikanan Tumbasna.
                          </p>
                        </div>
                      )}

                      {/* Supplier Info */}
                      <div className="border-t border-slate-100 pt-3 mt-3 space-y-1 text-[11px] text-slate-500 font-semibold">
                        <p className="flex items-center justify-between">
                          <span>Supplier:</span>
                          <span className="text-slate-800">{product.supplierName}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span>No. Telp:</span>
                          <span className="text-slate-800">+{product.supplierPhone}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span>Lokasi:</span>
                          <span className="text-slate-800">{product.location}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action Block */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 justify-end">
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={modifyingId === product.id}
                        className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 disabled:opacity-50 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        {modifyingId === product.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Menghapus...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus & Ban Produk
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200/80 rounded-2xl shadow-md overflow-hidden min-h-[600px] max-h-[750px] animate-in" style={{ height: 'calc(100vh - 250px)' }}>
          {/* Sidebar Sesi Aktif */}
          <div className="lg:col-span-4 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
            <div className="p-4 border-b border-slate-200 bg-white">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Sesi Chat Aktif
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Pantau interaksi real-time mitra tani dengan AI</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {chatLoading && sessions.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                  <p className="text-[10px] text-slate-400">Memuat sesi...</p>
                </div>
              ) : chatError ? (
                <p className="text-[10px] text-rose-500 text-center p-4">{chatError}</p>
              ) : sessions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-400 font-medium">Tidak ada sesi chat aktif</p>
                  <p className="text-[10px] text-slate-300 mt-1">Bot WA belum berinteraksi hari ini</p>
                </div>
              ) : (
                sessions.map(s => {
                  const lastMsg = s.history[s.history.length - 1];
                  const hasMeta = s.history.some((m: any) => m.role === 'metadata');
                  
                  return (
                    <div
                      key={s.phoneNumber}
                      onClick={() => setSelectedSessionId(s.phoneNumber)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 group ${
                        selectedSessionId === s.phoneNumber
                          ? 'bg-emerald-50/50 border-emerald-300 shadow-sm'
                          : 'bg-white border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-slate-800 truncate">
                            {s.userName || 'Petani Baru'}
                          </p>
                          {hasMeta && (
                            <span className="px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[8px] font-bold">
                              MAPPED
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          +{s.phoneNumber}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-1 italic font-medium">
                          {lastMsg?.role === 'user' ? '👤 ' : '🤖 '}
                          {lastMsg?.content && lastMsg.content.startsWith('{') ? '[Analisis System]' : lastMsg?.content}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearSession(s.phoneNumber);
                        }}
                        disabled={deletingSessionId === s.phoneNumber}
                        className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 disabled:opacity-50 transition-colors flex-shrink-0"
                        title="Reset sesi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel Chat View */}
          <div className="lg:col-span-8 flex flex-col h-full bg-slate-50">
            {selectedSessionId ? (
              (() => {
                const activeSession = sessions.find(s => s.phoneNumber === selectedSessionId);
                if (!activeSession) return null;

                return (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm">
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          {activeSession.userName || 'Belum Terdaftar'}
                          <span className="text-xs font-normal text-slate-400">
                            (+{activeSession.phoneNumber})
                          </span>
                        </h4>
                        {activeSession.mappedPhone && (
                          <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                            <Smartphone className="w-3 h-3" />
                            Terpetakan ke HP Mitra: +{activeSession.mappedPhone}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleClearSession(activeSession.phoneNumber)}
                        className="px-3.5 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Reset Percakapan
                      </button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col">
                      {activeSession.history.map((msg: any, idx: number) => {
                        if (msg.role === 'metadata') {
                          return (
                            <div key={idx} className="flex justify-center my-1.5">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-[9px] font-bold shadow-sm">
                                {msg.mappedPhone && `🔗 Terhubung ke HP: +${msg.mappedPhone}`}
                                {msg.lastImageUrl && (
                                  <>
                                    🖼️ Gambar Terunggah: 
                                    <a href={msg.lastImageUrl} target="_blank" rel="noreferrer" className="text-emerald-700 underline ml-1 hover:text-emerald-950 font-bold">
                                      Lihat Foto
                                    </a>
                                  </>
                                )}
                              </span>
                            </div>
                          );
                        }

                        const isUser = msg.role === 'user';
                        const bubbleBg = isUser 
                          ? 'bg-white text-slate-800 border border-slate-200 rounded-tr-none' 
                          : 'bg-emerald-600 text-white rounded-tl-none';
                        const alignment = isUser ? 'justify-end' : 'justify-start';

                        return (
                          <div key={idx} className={`flex ${alignment}`}>
                            <div className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm text-xs ${bubbleBg}`}>
                              <p className="text-[9px] font-bold mb-1 opacity-60">
                                {isUser ? '👤 SENDER' : '🤖 BOT AI'}
                              </p>
                              {isUser ? (
                                <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                              ) : (
                                (() => {
                                  // Render JSON intent secara elegan
                                  const text = msg.content || '';
                                  if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
                                    try {
                                      const parsed = JSON.parse(text);
                                      return (
                                        <div className="bg-slate-900/90 text-slate-100 p-3 rounded-xl font-mono text-[10px] space-y-1.5 min-w-[280px]">
                                          <p className="font-bold text-emerald-400 flex items-center gap-1 text-[10px] uppercase border-b border-slate-800 pb-1">
                                            <Zap className="w-3 h-3 fill-emerald-500/20" />
                                            Analisis Intensi AI
                                          </p>
                                          <div className="grid grid-cols-2 gap-y-0.5">
                                            <span className="text-slate-400">Intent:</span>
                                            <span className="font-bold text-emerald-300 uppercase">{parsed.intent}</span>
                                            <span className="text-slate-400">Status:</span>
                                            <span className="font-bold text-slate-300 uppercase">{parsed.status}</span>
                                            {parsed.supplier_name && (
                                              <>
                                                <span className="text-slate-400">Nama:</span>
                                                <span>{parsed.supplier_name}</span>
                                              </>
                                            )}
                                            {parsed.supplier_location && (
                                              <>
                                                <span className="text-slate-400">Lokasi:</span>
                                                <span className="truncate">{parsed.supplier_location}</span>
                                              </>
                                            )}
                                            {parsed.contact_phone && (
                                              <>
                                                <span className="text-slate-400">Kontak:</span>
                                                <span>{parsed.contact_phone}</span>
                                              </>
                                            )}
                                          </div>
                                          {parsed.items && parsed.items.length > 0 && (
                                            <div className="mt-1.5 pt-1.5 border-t border-slate-800 space-y-1">
                                              <p className="font-bold text-[9px] text-slate-400">DAFTAR ITEM:</p>
                                              {parsed.items.map((item: any, itemIdx: number) => (
                                                <div key={itemIdx} className="bg-slate-950 p-1.5 rounded border border-slate-800 text-[9px] space-y-0.5">
                                                  <p className="font-bold text-emerald-400 uppercase">{item.commodity}</p>
                                                  <p className="text-slate-300">{item.weight_kg} kg | Rp {item.price.toLocaleString('id-ID')}/kg</p>
                                                  {item.location && <p className="text-slate-500 truncate">Lokasi: {item.location}</p>}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    } catch (e) {}
                                  }
                                  return <p className="leading-relaxed break-words whitespace-pre-wrap">{text}</p>;
                                })()
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="w-16 h-16 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-800">Pilih Sesi Percakapan</h4>
                <p className="text-xs text-slate-400 mt-1">Pilih salah satu sesi di sidebar untuk memantau detail chat</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
