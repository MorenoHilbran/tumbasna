'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, RefreshCw, CheckCircle2, Phone, MapPin, CreditCard, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface SupplierBalance {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  address: string;
  bankName: string;
  bankAccount: string;
  balance: number;
}

export default function SaldoPage() {
  const [data, setData] = useState<SupplierBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/saldo');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDisburse = async (supplier: SupplierBalance) => {
    setProcessingId(supplier.id);
    try {
      const res = await fetch('/api/dashboard/saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: supplier.id, note: noteInput || `Transfer manual ${new Date().toLocaleDateString('id-ID')}` }),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ msg: json.message, ok: true });
        await fetchData();
      } else {
        setToast({ msg: json.error || 'Gagal mencairkan', ok: false });
      }
    } catch (e: any) {
      setToast({ msg: e.message || 'Error', ok: false });
    } finally {
      setProcessingId(null);
      setConfirmId(null);
      setNoteInput('');
    }
  };

  const totalPending = data.reduce((sum, s) => sum + s.balance, 0);

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={20} color="#059669" />
            Manajemen Pencairan Saldo Supplier
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Daftar saldo escrow supplier yang perlu ditransfer secara manual ke rekening bank masing-masing.
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569' }}
        >
          <RefreshCw size={14} />
          Perbarui
        </button>
      </div>

      {/* Summary Card */}
      <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, color: 'white' }}>
        <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Total Saldo Menunggu Pencairan</p>
        <p style={{ fontSize: 28, fontWeight: 900, margin: '6px 0 4px' }}>
          Rp {totalPending.toLocaleString('id-ID')}
        </p>
        <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>{data.length} supplier perlu dicairkan</p>
      </div>

      {/* Info Box */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#fefce8', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
        <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
          <strong>Cara Pencairan Manual:</strong> Transfer uang ke rekening bank supplier sesuai nominal di bawah menggunakan M-Banking Anda, 
          lalu klik <em>"Tandai Sudah Cair"</em> untuk mereset saldo & mengirim notifikasi WhatsApp otomatis ke supplier.
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 13 }}>Memuat data saldo...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 16, border: '1px dashed #e2e8f0' }}>
          <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Semua Saldo Telah Dicairkan</p>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Tidak ada saldo supplier yang menunggu pencairan saat ini.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.map((s) => (
            <div key={s.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {/* Row Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#059669', flexShrink: 0 }}>
                    {(s.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{s.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 500 }}>{s.businessName}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 600 }}>Saldo</p>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: '#059669' }}>Rp {s.balance.toLocaleString('id-ID')}</p>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#475569' }}
                  >
                    {expandedId === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedId === s.id && (
                <div style={{ padding: '0 18px 16px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <Phone size={13} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>WhatsApp</p>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>+{s.phone}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <MapPin size={13} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Lokasi</p>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{s.address}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <CreditCard size={13} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Nama Bank</p>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{s.bankName || '-'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <CreditCard size={13} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>No. Rekening</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', letterSpacing: 1 }}>{s.bankAccount || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Confirm panel */}
                  {confirmId === s.id ? (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#065f46' }}>
                        Konfirmasi pencairan <strong>Rp {s.balance.toLocaleString('id-ID')}</strong> ke rekening <strong>{s.bankName} — {s.bankAccount}</strong> atas nama <strong>{s.name}</strong>?
                      </p>
                      <input
                        type="text"
                        placeholder="Catatan (opsional), misal: Transfer via BCA 10 Jul 2025"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #d1fae5', borderRadius: 8, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => { setConfirmId(null); setNoteInput(''); }}
                          style={{ flex: 1, padding: '9px 0', background: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#475569' }}
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleDisburse(s)}
                          disabled={!!processingId}
                          style={{ flex: 2, padding: '9px 0', background: '#059669', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 12, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        >
                          <CheckCircle2 size={14} />
                          {processingId === s.id ? 'Memproses...' : 'Ya, Sudah Ditransfer'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(s.id)}
                      style={{ width: '100%', padding: '10px 0', background: 'linear-gradient(135deg, #059669, #047857)', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: 13, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <CheckCircle2 size={15} />
                      Tandai Sudah Cair (Rp {s.balance.toLocaleString('id-ID')})
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          onClick={() => setToast(null)}
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: toast.ok ? '#059669' : '#dc2626',
            color: 'white', padding: '12px 20px', borderRadius: 12,
            fontSize: 13, fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            cursor: 'pointer', zIndex: 9999, maxWidth: 380, textAlign: 'center',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
