'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

interface GroupMessage {
  id: string;
  senderRole: 'buyer' | 'supplier' | 'driver' | 'system';
  senderName: string;
  text: string;
  isSystemMessage: boolean;
  timestamp: string;
}

interface OrderInfo {
  id: string;
  supplierName: string;
  supplierLocation: string;
  courier: string;
  orderStatus: string;
  buyerName: string;
  buyerAddress: string;
  buyerPhone: string;
  items: { commodity: string; qty: number }[];
}

interface GroupData {
  groupId: string;
  orderId: string;
  status: string;
  driverName: string | null;
  order: OrderInfo;
  messages: GroupMessage[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const roleColor: Record<string, string> = {
  buyer: '#16a34a',
  supplier: '#2563eb',
  driver: '#ea580c',
  system: '#6b7280',
};

const roleLabel: Record<string, string> = {
  buyer: '🛒 Pembeli',
  supplier: '🏪 Supplier',
  driver: '🚴 Kurir',
  system: '🤖 Sistem',
};

export default function DriverChatPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<GroupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load grup awal
  useEffect(() => {
    if (!token) return;
    fetchGroup();
  }, [token]);

  // Auto scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  // Polling pesan baru setiap 5 detik
  useEffect(() => {
    if (!data || !nameSet) return;
    pollingRef.current = setInterval(pollMessages, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [data?.orderId, nameSet, lastTimestamp]);

  async function fetchGroup() {
    try {
      const res = await fetch(`${API_BASE}/api/delivery-group/driver/${token}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
      if (json.data.driverName) {
        setDriverName(json.data.driverName);
        setNameSet(true);
      }
      const msgs: GroupMessage[] = json.data.messages;
      if (msgs.length > 0) {
        setLastTimestamp(msgs[msgs.length - 1].timestamp);
      }
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data. Link mungkin tidak valid.');
    } finally {
      setLoading(false);
    }
  }

  async function pollMessages() {
    if (!data?.orderId) return;
    try {
      const url = lastTimestamp
        ? `${API_BASE}/api/delivery-group/${data.orderId}/messages?since=${encodeURIComponent(lastTimestamp)}`
        : `${API_BASE}/api/delivery-group/${data.orderId}/messages`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setData((prev) =>
          prev
            ? { ...prev, messages: [...prev.messages, ...json.data] }
            : prev
        );
        const newMsgs: GroupMessage[] = json.data;
        setLastTimestamp(newMsgs[newMsgs.length - 1].timestamp);
      }
    } catch {}
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !data || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/delivery-group/driver/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverName: driverName || 'Kurir', text: message.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setData((prev) =>
          prev ? { ...prev, messages: [...prev.messages, json.data] } : prev
        );
        setLastTimestamp(json.data.timestamp);
        setMessage('');
      }
    } catch {}
    setSending(false);
  }

  const quickReplies = [
    '🚴 Saya sedang menuju lokasi pickup',
    '📦 Barang sudah saya ambil dari supplier',
    '📍 Saya sedang menuju alamat pengiriman',
    '🏠 Saya sudah tiba di lokasi tujuan',
    '☎️ Mohon angkat telepon, saya kurir',
    '❓ Mohon konfirmasi patokan/petunjuk arah',
  ];

  if (loading) {
    return (
      <div style={styles.centeredPage}>
        <div style={styles.spinner} />
        <p style={{ color: '#6b7280', marginTop: 16, fontSize: 14 }}>Memuat data pengiriman...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centeredPage}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <h2 style={{ color: '#ef4444', fontSize: 18, margin: '16px 0 8px' }}>Link Tidak Valid</h2>
        <p style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', maxWidth: 280 }}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const isClosed = data.status === 'CLOSED';

  // Step 1: Isi nama kurir jika belum
  if (!nameSet) {
    return (
      <div style={styles.centeredPage}>
        <img src="/logo.png" alt="Tumbasna" style={{ height: 44, marginBottom: 24 }} />
        <h2 style={styles.titleText}>Chat Pengiriman</h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
          Selamat datang! Silakan masukkan nama Anda untuk bergabung ke grup chat pesanan ini.
        </p>
        <div style={styles.orderCard}>
          <p style={styles.orderLabel}>ID Pesanan</p>
          <p style={styles.orderValue}>{data.orderId}</p>
          <p style={styles.orderLabel}>Supplier</p>
          <p style={styles.orderValue}>{data.order.supplierName}</p>
          <p style={styles.orderLabel}>Pembeli</p>
          <p style={styles.orderValue}>{data.order.buyerName}</p>
        </div>
        <input
          type="text"
          placeholder="Nama Anda (mis. Budi - GoSend)"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          style={styles.nameInput}
        />
        <button
          onClick={() => { if (driverName.trim()) setNameSet(true); }}
          style={{ ...styles.sendBtn, opacity: driverName.trim() ? 1 : 0.5 }}
          disabled={!driverName.trim()}
        >
          Bergabung ke Chat
        </button>
      </div>
    );
  }

  return (
    <div style={styles.chatPage}>
      {/* Header */}
      <div style={styles.header}>
        <img src="/logo.png" alt="Tumbasna" style={{ height: 28 }} />
        <div>
          <p style={styles.headerTitle}>Chat Pengiriman</p>
          <p style={styles.headerSub}>{data.orderId} · {data.order.supplierName} → {data.order.buyerName}</p>
        </div>
        <span style={{
          ...styles.statusBadge,
          background: isClosed ? '#fef2f2' : '#f0fdf4',
          color: isClosed ? '#ef4444' : '#16a34a',
          border: `1px solid ${isClosed ? '#fca5a5' : '#86efac'}`,
        }}>
          {isClosed ? 'Selesai' : 'Aktif'}
        </span>
      </div>

      {/* Order Info Card */}
      <div style={styles.infoCard}>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>📦 Barang</span>
          <span style={styles.infoVal}>{data.order.items.map(i => `${i.commodity} (${i.qty} kg)`).join(', ')}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>📍 Antar ke</span>
          <span style={styles.infoVal}>{data.order.buyerAddress || 'Alamat tidak tersedia'}</span>
        </div>
        {data.order.buyerPhone && (
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>☎️ Telp Pembeli</span>
            <a href={`tel:${data.order.buyerPhone}`} style={{ ...styles.infoVal, color: '#2563eb' }}>
              {data.order.buyerPhone}
            </a>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={styles.messagesArea}>
        {data.messages.map((msg) => {
          const isDriver = msg.senderRole === 'driver';
          const isSystem = msg.isSystemMessage;
          const time = new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

          if (isSystem) {
            return (
              <div key={msg.id} style={styles.systemMsgWrap}>
                <div style={styles.systemMsg}>
                  {msg.text.split('\n').map((line, i) => (
                    <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isDriver ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: '#9ca3af', marginBottom: 3 }}>
                {roleLabel[msg.senderRole] || msg.senderName} · {time}
              </span>
              <div style={{
                ...styles.bubble,
                background: isDriver ? '#ea580c' : roleColor[msg.senderRole] || '#4b5563',
                alignSelf: isDriver ? 'flex-end' : 'flex-start',
              }}>
                <p style={{ margin: 0, fontSize: 13 }}>{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {!isClosed && (
        <div style={styles.quickReplyBar}>
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              style={styles.quickBtn}
              onClick={() => setMessage(qr)}
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {!isClosed ? (
        <form onSubmit={handleSend} style={styles.inputBar}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis pesan ke Supplier & Pembeli..."
            style={styles.textInput}
          />
          <button type="submit" disabled={sending || !message.trim()} style={styles.sendBtn}>
            {sending ? '...' : '➤'}
          </button>
        </form>
      ) : (
        <div style={styles.closedBar}>
          ✅ Chat ditutup — Pesanan selesai
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  centeredPage: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
    background: '#f9fafb',
    fontFamily: "'Inter', sans-serif",
  },
  chatPage: {
    maxWidth: 480,
    margin: '0 auto',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f9fafb',
    fontFamily: "'Inter', sans-serif",
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e5e7eb',
    borderTopColor: '#006837',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#006837',
    color: 'white',
    padding: '12px 16px',
    flexShrink: 0,
  },
  headerTitle: { margin: 0, fontSize: 13, fontWeight: 700 },
  headerSub: { margin: 0, fontSize: 10, opacity: 0.8, marginTop: 2 },
  statusBadge: {
    marginLeft: 'auto',
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 999,
    whiteSpace: 'nowrap' as const,
  },
  infoCard: {
    background: 'white',
    margin: '8px 12px 0',
    borderRadius: 12,
    padding: '10px 14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    flexShrink: 0,
  },
  infoRow: { display: 'flex', gap: 8, marginBottom: 4 },
  infoLabel: { fontSize: 11, color: '#6b7280', minWidth: 80, flexShrink: 0 },
  infoVal: { fontSize: 11, fontWeight: 600, color: '#111827' },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 12px 4px',
  },
  systemMsgWrap: { display: 'flex', justifyContent: 'center', margin: '8px 0' },
  systemMsg: {
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: 11,
    color: '#6b7280',
    maxWidth: '90%',
    textAlign: 'center',
  },
  bubble: {
    color: 'white',
    borderRadius: 12,
    padding: '9px 13px',
    maxWidth: '80%',
  },
  quickReplyBar: {
    display: 'flex',
    gap: 6,
    padding: '6px 12px',
    overflowX: 'auto',
    flexShrink: 0,
    background: 'white',
    borderTop: '1px solid #f3f4f6',
  },
  quickBtn: {
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: 999,
    padding: '5px 11px',
    fontSize: 11,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    color: '#374151',
    flexShrink: 0,
  },
  inputBar: {
    display: 'flex',
    gap: 8,
    padding: '10px 12px',
    background: 'white',
    borderTop: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 999,
    fontSize: 13,
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
  },
  sendBtn: {
    background: '#ea580c',
    color: 'white',
    border: 'none',
    borderRadius: 999,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  closedBar: {
    background: '#f3f4f6',
    borderTop: '1px solid #e5e7eb',
    padding: '14px',
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 600,
    flexShrink: 0,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 800,
    color: '#111827',
    margin: '0 0 8px',
  },
  orderCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 20,
    width: '100%',
    maxWidth: 320,
  },
  orderLabel: { fontSize: 10, color: '#9ca3af', margin: '8px 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 },
  orderValue: { fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 },
  nameInput: {
    width: '100%',
    maxWidth: 320,
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: 12,
    fontSize: 14,
    marginBottom: 12,
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box',
  },
};
