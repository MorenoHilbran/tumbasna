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

// ── Tumbasna brand colors ────────────────────────────────────────────────────
// Primary: #006837 (green)
// Buyer:   #16a34a (green)
// Supplier:#2563eb (blue)
// Driver:  #ea580c (orange)
// System:  #6b7280 (gray)

const roleColor: Record<string, string> = {
  buyer: '#006837',
  supplier: '#2563eb',
  driver: '#ea580c',
  system: '#6b7280',
};

const roleLabel: Record<string, string> = {
  buyer: 'Pembeli',
  supplier: 'Supplier',
  driver: 'Kurir',
  system: 'Sistem',
};

// ── Inline SVG Icons ─────────────────────────────────────────────────────────

function IconCart({ size = 14, color = '#16a34a' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function IconStore({ size = 14, color = '#2563eb' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconBike({ size = 14, color = '#ea580c' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 0 0-1-1h-1l-5 9.5" />
      <path d="M12 6h4l-3.5 5.5" />
      <path d="M5.5 17.5L9 10l4.5 7.5" />
    </svg>
  );
}

function IconInfo({ size = 16, color = '#006837' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconCheck({ size = 16, color = '#006837' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconMapPin({ size = 13, color = '#006837' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconPackage({ size = 13, color = '#ea580c' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconPhone({ size = 13, color = '#2563eb' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.39a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
    </svg>
  );
}

function IconHome({ size = 13, color = '#006837' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconQuestion({ size = 13, color = '#4b5563' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconSend({ size = 16, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconAlert({ size = 48, color = '#9ca3af' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ── Quick Replies ────────────────────────────────────────────────────────────

const quickReplies = [
  { icon: <IconBike size={12} color="#ea580c" />, text: 'Saya sedang menuju lokasi pickup' },
  { icon: <IconPackage size={12} color="#ea580c" />, text: 'Barang sudah saya ambil dari supplier' },
  { icon: <IconMapPin size={12} color="#006837" />, text: 'Saya sedang menuju alamat pengiriman' },
  { icon: <IconHome size={12} color="#006837" />, text: 'Saya sudah tiba di lokasi tujuan' },
  { icon: <IconPhone size={12} color="#2563eb" />, text: 'Mohon angkat telepon, saya kurir' },
  { icon: <IconQuestion size={12} color="#4b5563" />, text: 'Mohon konfirmasi patokan/petunjuk arah' },
];

// ── Role Badge Component ─────────────────────────────────────────────────────

function RoleBadge({ role, name }: { role: string; name: string }) {
  const iconSize = 11;
  let icon: React.ReactNode = null;
  if (role === 'buyer') icon = <IconCart size={iconSize} color="#16a34a" />;
  else if (role === 'supplier') icon = <IconStore size={iconSize} color="#2563eb" />;
  else if (role === 'driver') icon = <IconBike size={iconSize} color="#ea580c" />;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon}{roleLabel[role] || name}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (!token) return;
    fetchGroup();
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

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
      if (msgs.length > 0) setLastTimestamp(msgs[msgs.length - 1].timestamp);
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
        setData((prev) => prev ? { ...prev, messages: [...prev.messages, ...json.data] } : prev);
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
        setData((prev) => prev ? { ...prev, messages: [...prev.messages, json.data] } : prev);
        setLastTimestamp(json.data.timestamp);
        setMessage('');
      }
    } catch {}
    setSending(false);
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.centeredPage}>
        <div style={s.spinner} />
        <p style={{ color: '#6b7280', marginTop: 16, fontSize: 14 }}>Memuat data pengiriman...</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={s.centeredPage}>
        <IconAlert size={56} color="#ef4444" />
        <h2 style={{ color: '#ef4444', fontSize: 18, margin: '16px 0 8px' }}>Link Tidak Valid</h2>
        <p style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', maxWidth: 280 }}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const isClosed = data.status === 'CLOSED';

  // ── Step 1: Isi nama kurir ───────────────────────────────────────────────
  if (!nameSet) {
    return (
      <div style={s.centeredPage}>
        <img src="/logo.png" alt="Tumbasna" style={{ height: 44, marginBottom: 24 }} />
        <h2 style={s.titleText}>Chat Pengiriman</h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
          Selamat datang! Silakan masukkan nama Anda untuk bergabung ke grup chat pesanan ini.
        </p>
        <div style={s.orderCard}>
          <p style={s.orderLabel}>ID Pesanan</p>
          <p style={s.orderValue}>{data.orderId}</p>
          <p style={s.orderLabel}>Supplier</p>
          <p style={s.orderValue}>{data.order.supplierName}</p>
          <p style={s.orderLabel}>Pembeli</p>
          <p style={s.orderValue}>{data.order.buyerName}</p>
        </div>
        <input
          type="text"
          placeholder="Nama Anda (mis. Budi - GoSend)"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          style={s.nameInput}
        />
        <button
          onClick={() => { if (driverName.trim()) setNameSet(true); }}
          style={{ ...s.joinBtn, opacity: driverName.trim() ? 1 : 0.5 }}
          disabled={!driverName.trim()}
        >
          <IconBike size={16} color="white" />
          Bergabung ke Chat
        </button>
      </div>
    );
  }

  // ── Main chat view ───────────────────────────────────────────────────────
  return (
    <div style={s.chatPage}>
      {/* Header */}
      <div style={s.header}>
        <img src="/logo.png" alt="Tumbasna" style={{ height: 28, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={s.headerTitle}>Chat Pengiriman</p>
          <p style={s.headerSub}>{data.orderId} · {data.order.supplierName} → {data.order.buyerName}</p>
        </div>
        <span style={{
          ...s.statusBadge,
          background: isClosed ? '#fef2f2' : '#f0fdf4',
          color: isClosed ? '#ef4444' : '#16a34a',
          border: `1px solid ${isClosed ? '#fca5a5' : '#86efac'}`,
        }}>
          {isClosed ? 'Selesai' : 'Aktif'}
        </span>
      </div>

      {/* Order Info Card */}
      <div style={s.infoCard}>
        <div style={s.infoRow}>
          <span style={s.infoLabel}><IconPackage size={12} color="#ea580c" /> Barang</span>
          <span style={s.infoVal}>{data.order.items.map(i => `${i.commodity} (${i.qty} kg)`).join(', ')}</span>
        </div>
        <div style={s.infoRow}>
          <span style={s.infoLabel}><IconMapPin size={12} color="#006837" /> Antar ke</span>
          <span style={s.infoVal}>{data.order.buyerAddress || 'Alamat tidak tersedia'}</span>
        </div>
        {data.order.buyerPhone && (
          <div style={s.infoRow}>
            <span style={s.infoLabel}><IconPhone size={12} color="#2563eb" /> Telp</span>
            <a href={`tel:${data.order.buyerPhone}`} style={{ ...s.infoVal, color: '#2563eb' }}>
              {data.order.buyerPhone}
            </a>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={s.messagesArea}>
        {data.messages.map((msg) => {
          const isDriver = msg.senderRole === 'driver';
          const isSystem = msg.isSystemMessage;
          const time = new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

          if (isSystem) {
            return (
              <div key={msg.id} style={s.systemMsgWrap}>
                <div style={s.systemMsg}>
                  <IconInfo size={13} color="#006837" />
                  <div style={{ marginLeft: 6 }}>
                    {msg.text.split('\n').map((line, i) => (
                      <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br />}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isDriver ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: '#9ca3af', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <RoleBadge role={msg.senderRole} name={msg.senderName} /> · {time}
              </span>
              <div style={{
                ...s.bubble,
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
        <div style={s.quickReplyBar}>
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              style={s.quickBtn}
              onClick={() => setMessage(qr.text)}
            >
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{qr.icon}</span>
              {qr.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {!isClosed ? (
        <form onSubmit={handleSend} style={s.inputBar}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis pesan ke Supplier & Pembeli..."
            style={s.textInput}
          />
          <button type="submit" disabled={sending || !message.trim()} style={{ ...s.sendBtnMain, opacity: (sending || !message.trim()) ? 0.5 : 1 }}>
            {sending ? '...' : <IconSend size={16} color="white" />}
          </button>
        </form>
      ) : (
        <div style={s.closedBar}>
          <IconCheck size={16} color="#16a34a" /> Chat ditutup — Pesanan selesai
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
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
    width: 40, height: 40,
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
  headerSub: { margin: 0, fontSize: 10, opacity: 0.75, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statusBadge: {
    marginLeft: 'auto',
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 999,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  infoCard: {
    background: 'white',
    margin: '8px 12px 0',
    borderRadius: 12,
    padding: '10px 14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    flexShrink: 0,
  },
  infoRow: { display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' },
  infoLabel: {
    fontSize: 11, color: '#6b7280', minWidth: 82, flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600,
  },
  infoVal: { fontSize: 11, fontWeight: 600, color: '#111827' },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 12px 4px',
  },
  systemMsgWrap: { display: 'flex', justifyContent: 'center', margin: '8px 0' },
  systemMsg: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: 11,
    color: '#166534',
    maxWidth: '90%',
    display: 'flex',
    alignItems: 'flex-start',
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
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer',
    color: '#374151',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
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
  sendBtnMain: {
    background: '#006837',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: 42,
    height: 42,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,104,55,0.35)',
  },
  closedBar: {
    background: '#f0fdf4',
    borderTop: '1px solid #bbf7d0',
    padding: '14px',
    textAlign: 'center' as const,
    fontSize: 12,
    color: '#166534',
    fontWeight: 600,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  titleText: { fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 8px' },
  orderCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 20,
    width: '100%',
    maxWidth: 320,
  },
  orderLabel: { fontSize: 10, color: '#9ca3af', margin: '8px 0 2px', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  orderValue: { fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 },
  nameInput: {
    width: '100%',
    maxWidth: 320,
    padding: '12px 16px',
    border: '1.5px solid #d1d5db',
    borderRadius: 12,
    fontSize: 14,
    marginBottom: 12,
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box' as const,
  },
  joinBtn: {
    background: '#006837',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    padding: '13px 28px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 14px rgba(0,104,55,0.3)',
  },
};
