import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonIcon,
  IonButton,
  IonBadge,
  IonToast
} from '@ionic/react';
import {
  arrowBackOutline,
  locationOutline,
  cubeOutline,
  bicycleOutline,
  businessOutline,
  checkmarkCircle,
  walletOutline,
  shieldCheckmarkOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { useApp, Order } from '../context/AppContext';
import './DetailPesanan.css';

interface DetailPesananProps {
  orderId: string;
  onBack: () => void;
}

const DetailPesanan: React.FC<DetailPesananProps> = ({ orderId, onBack }) => {
  const { orders, confirmOrderReceived } = useApp();
  const [showToast, setShowToast] = useState(false);

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <IonPage>
        <IonContent className="ion-padding text-center">
          <p>Memuat detail pesanan...</p>
        </IonContent>
      </IonPage>
    );
  }

  const handleConfirmReceived = () => {
    confirmOrderReceived(orderId);
    setShowToast(true);
  };

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
            {/* Empty div for flex spacing to balance back btn */}
            <div style={{ width: '32px' }}></div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="tracking-content">
        {/* Interactive Simulated Map */}
        <div className="simulated-map-container">
          {/* Grid background representing map blocks */}
          <div className="map-grid-bg"></div>
          
          {/* Decorative Map Features */}
          <div className="map-river"></div>
          <div className="map-park park-north"></div>
          <div className="map-park park-south"></div>
          <div className="map-forest"></div>
          
          {/* Road representation lines */}
          <div className="map-road road-h-1"></div>
          <div className="map-road road-h-2"></div>
          <div className="map-road road-h-3"></div>
          <div className="map-road road-v-1"></div>
          
          {/* SVG Route Line */}
          <svg className="map-svg-route" viewBox="0 0 400 200" preserveAspectRatio="none">
            <path
              d="M 60 50 L 200 100 L 340 140"
              fill="none"
              stroke="rgba(127, 187, 84, 0.25)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 60 50 L 200 100 L 340 140"
              fill="none"
              stroke="#7FBB54"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="6, 5"
              className="map-route-dash"
            />
          </svg>

          {/* Map Markers */}
          {/* Supplier (Origin) */}
          <div className="map-marker supplier-marker">
            <div className="marker-pin origin"></div>
            <div className="marker-label-box">Supplier</div>
          </div>

          {/* Courier (Current Position - animates depending on shipping status) */}
          {order.status === 'Dikirim' && (
            <div className="map-marker courier-marker-animated">
              <div className="courier-icon-pulse">
                <IonIcon icon={bicycleOutline} />
              </div>
              <div className="marker-label-box courier-lbl">Kurir Box</div>
            </div>
          )}

          {/* Buyer/UMKM (Destination) */}
          <div className="map-marker buyer-marker">
            <div className="marker-pin destination"></div>
            <div className="marker-label-box">Usaha Saya</div>
          </div>

          {/* Map Controls / Stats Overlay */}
          <div className="map-status-overlay">
            <div className="overlay-top-row">
              <span className="courier-badge">Active Delivery</span>
              <span className="courier-eta">Estimasi: {order.status === 'Dikirim' ? '30 Menit Lagi' : order.status === 'Selesai' ? 'Tiba' : 'Diproses'}</span>
            </div>
            <h4 className="overlay-address-title">{order.courier}</h4>
            <p className="overlay-address-text">Tujuan: {order.supplierLocation} &rarr; Semarang</p>
          </div>
        </div>

        {/* Order Details Header */}
        <div className="tracking-order-summary-card">
          <div className="summary-header">
            <div>
              <span className="order-id-lbl">ID TRANSKASI</span>
              <h3 className="order-id-val">{order.id}</h3>
            </div>
            <IonBadge color={order.status === 'Selesai' ? 'success' : 'secondary'} className="order-badge-status">
              {order.status === 'Diproses' ? 'Diproses (Dana Ditahan)' : order.status}
            </IonBadge>
          </div>

          <div className="supplier-row-info">
            <div className="supplier-lbl-grid">
              <span className="lbl-title">Supplier Utama</span>
              <span className="lbl-val">{order.supplierName}</span>
            </div>
            <div className="supplier-lbl-grid right-align">
              <span className="lbl-title">Metode Logistik</span>
              <span className="lbl-val">{order.courier}</span>
            </div>
          </div>

          {/* Escrow Status Notification */}
          <div className={`escrow-details-bar ${order.fundsReleased ? 'released' : 'held'}`}>
            <IonIcon icon={order.fundsReleased ? checkmarkCircle : shieldCheckmarkOutline} />
            <div className="escrow-bar-text">
              <strong>{order.fundsReleased ? 'DANA DICAIRKAN' : 'DANA DITAHAN (ESCROW SECURITY)'}</strong>
              <p>
                {order.fundsReleased
                  ? `Dana Rp ${order.totalAmount.toLocaleString('id-ID')} telah berhasil diteruskan ke rekening bank ${order.supplierName}.`
                  : `Dana Rp ${order.totalAmount.toLocaleString('id-ID')} berada aman di rekening bersama Tumbasna demi keandalan logistik.`}
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="section-title-tracking">Timeline Transaksi & Logistik</div>
        <div className="timeline-card">
          <div className="timeline-wrapper">
            {order.trackingTimeline.map((step, idx) => (
              <div key={idx} className={`timeline-node ${step.done ? 'done' : ''} ${!step.done && order.status === 'Diproses' && idx === 2 ? 'active' : ''}`}>
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

        {/* Spacing for button */}
        <div style={{ height: '100px' }}></div>
      </IonContent>

      {/* Action Button: Confirm Delivery */}
      {order.status !== 'Selesai' && order.status !== 'Dibatalkan' && (
        <div className="floating-action-footer">
          <div className="footer-notice-text">
            <IonIcon icon={alertCircleOutline} />
            <span>Pastikan Anda telah memeriksa kualitas komoditas pangan sebelum mengonfirmasi terima.</span>
          </div>
          <IonButton
            expand="block"
            color="tertiary"
            className="confirm-received-btn pulse-button"
            onClick={handleConfirmReceived}
          >
            Konfirmasi Barang Diterima
          </IonButton>
        </div>
      )}

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message="Transaksi Selesai! Dana telah diteruskan ke rekening Bank supplier."
        duration={3500}
        position="bottom"
        className="custom-toast"
      />
    </IonPage>
  );
};

export default DetailPesanan;
