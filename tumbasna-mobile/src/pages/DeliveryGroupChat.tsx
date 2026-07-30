import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonToast,
  IonSpinner,
} from '@ionic/react';
import {
  arrowBackOutline,
  sendOutline,
  copyOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { useApp, DeliveryGroup, DeliveryGroupMessage } from '../context/AppContext';
import './DeliveryGroupChat.css';

interface DeliveryGroupChatProps {
  orderId: string;
  onBack: () => void;
}

// ── SVG Icon Components ─────────────────────────────────────────────────────

const IconCart = ({ size = 14, color = '#15803d' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const IconStore = ({ size = 14, color = '#1d4ed8' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconBike = ({ size = 14, color = '#c2410c' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6a1 1 0 0 0-1-1h-1l-5 9.5"/><path d="M12 6h4l-3.5 5.5"/>
    <path d="M5.5 17.5L9 10l4.5 7.5"/>
  </svg>
);

const IconBot = ({ size = 14, color = '#4b5563' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <path d="M12 11V5"/><circle cx="12" cy="4" r="1"/>
    <path d="M8 15h.01M16 15h.01M9 19h6"/>
  </svg>
);

const IconMapPin = ({ size = 13, color = '#006837' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconCheck = ({ size = 13, color = '#006837' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconPhone = ({ size = 13, color = '#006837' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.39a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16l.19.92z"/>
  </svg>
);

const IconHome = ({ size = 13, color = '#006837' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconClock = ({ size = 13, color = '#006837' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconLink = ({ size = 13, color = '#2563eb' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const IconChat = ({ size = 20, color = 'white' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

// ── Quick Replies (text only, no emoji) ─────────────────────────────────────

interface QuickReply {
  icon: React.ReactNode;
  text: string;
}

const QUICK_REPLIES: QuickReply[] = [
  { icon: <IconMapPin />, text: 'Di mana posisi sekarang?' },
  { icon: <IconCheck />, text: 'Barang sudah saya terima' },
  { icon: <IconPhone />, text: 'Tolong hubungi saya' },
  { icon: <IconHome />, text: 'Saya ada di rumah, tunggu ya' },
  { icon: <IconClock />, text: 'Perkiraan sampai berapa lama?' },
];

const roleLabel: Record<string, string> = {
  buyer: 'Pembeli',
  supplier: 'Supplier',
  driver: 'Kurir',
  system: 'Sistem',
};

const RoleAvatar: React.FC<{ role: string }> = ({ role }) => {
  if (role === 'buyer') return <IconCart size={15} color="#15803d" />;
  if (role === 'supplier') return <IconStore size={15} color="#1d4ed8" />;
  if (role === 'driver') return <IconBike size={15} color="#c2410c" />;
  return <IconBot size={15} color="#4b5563" />;
};

const DeliveryGroupChat: React.FC<DeliveryGroupChatProps> = ({ orderId, onBack }) => {
  const { user, deliveryGroups, fetchDeliveryGroup, sendDeliveryGroupMessage } = useApp();
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const group: DeliveryGroup | undefined = deliveryGroups[orderId];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchDeliveryGroup(orderId);
      setLoading(false);
    };
    load();
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [group?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending || group?.status === 'CLOSED') return;
    setSending(true);
    const sent = await sendDeliveryGroupMessage(orderId, text.trim());
    if (!sent) {
      setToastMsg('Gagal mengirim pesan. Coba lagi.');
      setShowToast(true);
    }
    setText('');
    setSending(false);
  };

  const copyDriverLink = () => {
    if (group?.driverLink) {
      navigator.clipboard.writeText(group.driverLink);
      setToastMsg('Link kurir berhasil disalin!');
      setShowToast(true);
    }
  };

  const isClosed = group?.status === 'CLOSED';
  const buyerName = user?.businessName || user?.ownerName || 'Saya';

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="dgc-toolbar">
          <div className="dgc-header">
            <button className="dgc-back-btn" onClick={onBack}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="dgc-header-info">
              <div className="dgc-avatar-row">
                <span className="dgc-role-avatar buyer-avatar"><IconCart size={14} color="#15803d" /></span>
                <span className="dgc-role-avatar supplier-avatar"><IconStore size={14} color="#1d4ed8" /></span>
                <span className="dgc-role-avatar driver-avatar"><IconBike size={14} color="#c2410c" /></span>
              </div>
              <div>
                <h3 className="dgc-title">Chat Pengiriman</h3>
                <p className="dgc-subtitle">{orderId}</p>
              </div>
            </div>
            <button className="dgc-info-btn" onClick={() => setShowInfo(!showInfo)}>
              <IonIcon icon={informationCircleOutline} />
            </button>
            <div className={`dgc-status-dot ${isClosed ? 'closed' : 'active'}`} />
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dgc-content" scrollY={false}>
        {/* Info Panel (toggle) */}
        {showInfo && group && (
          <div className="dgc-info-panel">
            <div className="dgc-info-row">
              <span className="dgc-info-lbl">
                <IconStore size={13} color="#1d4ed8" /> Supplier
              </span>
              <span className="dgc-info-val">{group.supplierName || '-'}</span>
            </div>
            <div className="dgc-info-row">
              <span className="dgc-info-lbl">
                <IconBike size={13} color="#c2410c" /> Kurir
              </span>
              <span className="dgc-info-val">{group.driverName || group.courier || 'Belum diisi'}</span>
            </div>
            <div className="dgc-info-row">
              <span className="dgc-info-lbl">
                <IconBot size={13} color="#4b5563" /> Status
              </span>
              <span className={`dgc-badge ${isClosed ? 'badge-closed' : 'badge-active'}`}>
                {isClosed ? 'Selesai' : 'Aktif'}
              </span>
            </div>
            {group.driverLink && !isClosed && (
              <div className="dgc-driver-link-wrap">
                <p className="dgc-driver-link-label">
                  <IconLink size={12} color="#2563eb" /> Link Chat untuk Kurir:
                </p>
                <div className="dgc-driver-link-row">
                  <span className="dgc-driver-link-url">{group.driverLink}</span>
                  <button className="dgc-copy-btn" onClick={copyDriverLink}>
                    <IonIcon icon={copyOutline} />
                  </button>
                </div>
                <p className="dgc-driver-link-hint">Kirimkan link ini ke kurir via WhatsApp agar mereka bisa bergabung ke chat.</p>
              </div>
            )}
          </div>
        )}

        {/* Messages area */}
        <div className="dgc-messages-wrapper">
          {loading ? (
            <div className="dgc-loading">
              <IonSpinner name="crescent" />
              <p>Memuat percakapan...</p>
            </div>
          ) : !group ? (
            <div className="dgc-empty-state">
              <IonIcon icon={alertCircleOutline} className="dgc-empty-icon" />
              <h4>Grup Chat Belum Tersedia</h4>
              <p>Grup chat akan otomatis terbuka saat status pesanan berubah menjadi <strong>Dikirim</strong>.</p>
            </div>
          ) : (
            <>
              {/* Members header */}
              <div className="dgc-members-bar">
                <span className="dgc-member-chip buyer-chip">
                  <IconCart size={12} color="#15803d" /> {buyerName}
                </span>
                <span className="dgc-member-chip supplier-chip">
                  <IconStore size={12} color="#1d4ed8" /> {group.supplierName || 'Supplier'}
                </span>
                <span className="dgc-member-chip driver-chip">
                  <IconBike size={12} color="#c2410c" /> {group.driverName || 'Kurir'}
                </span>
              </div>

              {/* Messages */}
              {group.messages.map((msg: DeliveryGroupMessage) => {
                const isMine = msg.senderRole === 'buyer';
                const isSystem = msg.isSystemMessage;
                const time = new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                if (isSystem) {
                  return (
                    <div key={msg.id} className="dgc-system-msg-wrap">
                      <div className="dgc-system-bubble">
                        <IonIcon icon={informationCircleOutline} className="dgc-sys-icon" />
                        <span>{msg.text}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`dgc-msg-wrap ${isMine ? 'mine' : 'theirs'}`}>
                    {!isMine && (
                      <div className={`dgc-sender-avatar ${msg.senderRole}-avatar`}>
                        <RoleAvatar role={msg.senderRole} />
                      </div>
                    )}
                    <div className={`dgc-bubble-col ${isMine ? 'mine' : ''}`}>
                      {!isMine && (
                        <span className="dgc-sender-label">
                          {roleLabel[msg.senderRole]} · {msg.senderName}
                        </span>
                      )}
                      <div className={`dgc-bubble ${msg.senderRole}-bubble ${isMine ? 'mine-bubble' : ''}`}>
                        <p className="dgc-bubble-text">{msg.text}</p>
                        <span className="dgc-bubble-time">{time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isClosed && (
                <div className="dgc-closed-notice">
                  <IonIcon icon={checkmarkCircleOutline} />
                  <span>Chat ditutup — Pesanan selesai</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Quick Replies */}
        {group && !isClosed && (
          <div className="dgc-quick-replies">
            {QUICK_REPLIES.map((qr, idx) => (
              <button
                key={idx}
                className="dgc-quick-chip"
                onClick={() => setText(qr.text)}
              >
                <span className="dgc-quick-icon">{qr.icon}</span>
                {qr.text}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        {group && !isClosed ? (
          <form onSubmit={handleSend} className="dgc-input-bar">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis pesan ke Supplier & Kurir..."
              className="dgc-text-input"
              disabled={sending}
            />
            <button type="submit" disabled={sending || !text.trim()} className="dgc-send-btn">
              {sending ? <IonSpinner name="crescent" className="dgc-send-spinner" /> : <IonIcon icon={sendOutline} />}
            </button>
          </form>
        ) : group && isClosed ? (
          <div className="dgc-closed-bar">
            <IonIcon icon={checkmarkCircleOutline} /> Chat pengiriman ditutup
          </div>
        ) : null}
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMsg}
        duration={2500}
        position="bottom"
      />
    </IonPage>
  );
};

export default DeliveryGroupChat;
