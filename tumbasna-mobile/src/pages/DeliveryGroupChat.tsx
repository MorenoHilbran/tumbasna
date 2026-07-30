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

const QUICK_REPLIES = [
  '📍 Di mana posisi sekarang?',
  '✅ Barang sudah saya terima',
  '☎️ Tolong hubungi saya',
  '🏠 Saya ada di rumah, tunggu ya',
  '⏱️ Perkiraan sampai berapa lama?',
];

const roleLabel: Record<string, string> = {
  buyer: 'Pembeli',
  supplier: 'Supplier',
  driver: 'Kurir',
  system: 'Sistem',
};

const roleInitial: Record<string, string> = {
  buyer: '🛒',
  supplier: '🏪',
  driver: '🚴',
  system: '🤖',
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
                <span className="dgc-role-avatar buyer-avatar">🛒</span>
                <span className="dgc-role-avatar supplier-avatar">🏪</span>
                <span className="dgc-role-avatar driver-avatar">🚴</span>
              </div>
              <div>
                <h3 className="dgc-title">Chat Pengiriman</h3>
                <p className="dgc-subtitle">{orderId}</p>
              </div>
            </div>
            <button
              className="dgc-info-btn"
              onClick={() => setShowInfo(!showInfo)}
            >
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
              <span className="dgc-info-lbl">🏪 Supplier</span>
              <span className="dgc-info-val">{group.supplierName || '-'}</span>
            </div>
            <div className="dgc-info-row">
              <span className="dgc-info-lbl">🚴 Kurir</span>
              <span className="dgc-info-val">{group.driverName || group.courier || 'Belum diisi'}</span>
            </div>
            <div className="dgc-info-row">
              <span className="dgc-info-lbl">📋 Status</span>
              <span className={`dgc-badge ${isClosed ? 'badge-closed' : 'badge-active'}`}>
                {isClosed ? 'Selesai' : 'Aktif'}
              </span>
            </div>
            {group.driverLink && !isClosed && (
              <div className="dgc-driver-link-wrap">
                <p className="dgc-driver-link-label">🔗 Link Chat untuk Kurir:</p>
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
                <span className="dgc-member-chip buyer-chip">🛒 {buyerName}</span>
                <span className="dgc-member-chip supplier-chip">🏪 {group.supplierName || 'Supplier'}</span>
                <span className="dgc-member-chip driver-chip">🚴 {group.driverName || 'Kurir'}</span>
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
                        {roleInitial[msg.senderRole] || '?'}
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
                onClick={() => setText(qr)}
              >
                {qr}
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
            ✅ Chat pengiriman ditutup
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
