import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonButton,
  IonBadge,
  IonToast
} from '@ionic/react';
import {
  arrowBackOutline,
  checkmarkCircle,
  shieldCheckmarkOutline,
  alertCircleOutline,
  logoWhatsapp,
  chatbubblesOutline
} from 'ionicons/icons';
import { useApp } from '../context/AppContext';
import './DetailPesanan.css';


interface DetailPesananProps {
  orderId: string;
  onBack: () => void;
  onNavigateToChat: (supplierName: string) => void;
}




const DetailPesanan: React.FC<DetailPesananProps> = ({ orderId, onBack, onNavigateToChat }) => {
  const { orders, confirmOrderReceived } = useApp();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>Memuat detail pesanan...</p>
        </IonContent>
      </IonPage>
    );
  }

  const handleConfirmReceived = async () => {
    await confirmOrderReceived(orderId);
    setToastMsg('Transaksi selesai! Dana telah diteruskan ke rekening bank supplier.');
    setShowToast(true);
  };

  const isCOD = order.courier.toLowerCase().includes('cod') ||
                order.courier.toLowerCase().includes('ambil sendiri') ||
                order.courier.toLowerCase().includes('kurir lokal');

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="order-detail-toolbar">
          <div className="order-detail-inner">
            <button className="header-back-btn" onClick={onBack}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="order-detail-logo-row">
              <img src="/logo.png" alt="Tumbasna" className="order-header-logo-only" />
            </div>
            <div style={{ width: '32px' }}></div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="tracking-content">

        {/* ── Order Summary Card ───────────────────────────── */}
        <div className="tracking-order-summary-card" style={{ marginTop: 16 }}>
          <div className="summary-header">
            <div>
              <span className="order-id-lbl">ID TRANSAKSI</span>
              <h3 className="order-id-val">{order.id}</h3>
            </div>
            <IonBadge
              color={order.status === 'Selesai' ? 'success' : 'secondary'}
              className="order-badge-status"
            >
              {order.status === 'Diproses' ? 'Diproses (Dana Ditahan)' : order.status}
            </IonBadge>
          </div>

          <div className="supplier-row-info">
            <div className="supplier-lbl-grid">
              <span className="lbl-title">Supplier</span>
              <span className="lbl-val">{order.supplierName}</span>
            </div>
            <div className="supplier-lbl-grid right-align">
              <span className="lbl-title">Metode</span>
              <span className="lbl-val">{order.courier}</span>
            </div>
          </div>

          {/* Items list */}
          <div className="order-items-list">
            {order.items.map((item, idx) => (
              <div key={idx} className="order-item-row">
                <img src={item.product.image} alt={item.product.name} className="order-item-thumb" />
                <div className="order-item-info">
                  <span className="order-item-name">{item.product.name}</span>
                  <span className="order-item-qty">{item.quantity} kg &middot; Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="order-total-row">
            <span>Total Pembayaran</span>
            <strong>Rp {order.totalAmount.toLocaleString('id-ID')}</strong>
          </div>
        </div>

        {/* ── COD: Hubungi Supplier via in-app Chat ─────────── */}
        {isCOD && (
          <div className="cod-wa-card">
            <div className="cod-wa-header">
              <IonIcon icon={chatbubblesOutline} />
              <div>
                <strong>Atur COD Langsung dengan Supplier</strong>
                <p>Kirim pesan ke supplier untuk menentukan waktu dan tempat serah terima. Balasan masuk langsung di sini.</p>
              </div>
            </div>
            <button className="wa-contact-btn" onClick={() => onNavigateToChat(order.supplierName)}>
              <IonIcon icon={logoWhatsapp} />
              <span>Chat dengan {order.supplierName}</span>
            </button>
          </div>
        )}

        {/* ── Escrow Security ──────────────────────────────── */}
        <div className={`escrow-details-bar ${order.fundsReleased ? 'released' : 'held'}`} style={{ margin: '0 14px 16px' }}>
          <IonIcon icon={order.fundsReleased ? checkmarkCircle : shieldCheckmarkOutline} />
          <div className="escrow-bar-text">
            <strong>{order.fundsReleased ? 'DANA DICAIRKAN' : 'DANA DITAHAN (ESCROW SECURITY)'}</strong>
            <p>
              {order.fundsReleased
                ? `Dana Rp ${order.totalAmount.toLocaleString('id-ID')} telah diteruskan ke ${order.supplierName}.`
                : `Dana Rp ${order.totalAmount.toLocaleString('id-ID')} aman di rekening bersama Tumbasna hingga barang diterima.`}
            </p>
          </div>
        </div>

        {/* ── Timeline ─────────────────────────────────────── */}
        <div className="section-title-tracking">Timeline Transaksi</div>
        <div className="timeline-card">
          <div className="timeline-wrapper">
            {order.trackingTimeline.map((step, idx) => (
              <div
                key={idx}
                className={`timeline-node ${step.done ? 'done' : ''} ${
                  !step.done && order.status === 'Diproses' && idx === 2 ? 'active' : ''
                }`}
              >
                <div className="timeline-indicator-col">
                  <div className="timeline-circle">
                    {step.done ? <IonIcon icon={checkmarkCircle} /> : <span>{idx + 1}</span>}
                  </div>
                  {idx < order.trackingTimeline.length - 1 && <div className="timeline-line"></div>}
                </div>
                <div className="timeline-content-col">
                  <div className="timeline-node-header">
                    <h4 className="node-title">{step.title}</h4>
                    <span className="node-time">{step.time}</span>
                  </div>
                  <p className="node-desc">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: '120px' }}></div>
      </IonContent>

      {/* ── Floating confirm button ───────────────────────── */}
      {order.status !== 'Selesai' && order.status !== 'Dibatalkan' && (
        <div className="floating-action-footer">
          <div className="footer-notice-text">
            <IonIcon icon={alertCircleOutline} />
            <span>Pastikan barang sudah diterima dan sesuai sebelum konfirmasi.</span>
          </div>
          <IonButton
            expand="block"
            color="tertiary"
            className="confirm-received-btn"
            onClick={handleConfirmReceived}
          >
            Konfirmasi Barang Diterima
          </IonButton>
        </div>
      )}

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMsg}
        duration={3000}
        position="bottom"
        className="custom-toast"
      />
    </IonPage>
  );
};

export default DetailPesanan;
