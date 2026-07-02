import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButton,
  IonCard,
  IonCardContent,
  IonBadge,
  IonToast
} from '@ionic/react';
import {
  timeOutline,
  walletOutline,
  checkmarkCircle,
  informationCircleOutline,
  chevronForwardOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { useApp, Order } from '../context/AppContext';
import './PembayaranQris.css';

interface PembayaranQrisProps {
  orderId: string;
  onNavigateToPesanan: () => void;
  onNavigateToTracking: (orderId: string) => void;
}

const PembayaranQris: React.FC<PembayaranQrisProps> = ({
  orderId,
  onNavigateToPesanan,
  onNavigateToTracking
}) => {
  const { orders, payOrder } = useApp();
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes
  const [showToast, setShowToast] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const order = orders.find((o) => o.id === orderId);

  // Timer Effect
  useEffect(() => {
    if (isSuccess || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, isSuccess]);

  // Sync state if order status is updated from external (or already paid)
  useEffect(() => {
    if (order && order.status !== 'Menunggu Pembayaran') {
      setIsSuccess(true);
    }
  }, [order]);

  if (!order) {
    return (
      <IonPage>
        <IonContent className="ion-padding text-center">
          <p>Memuat rincian transaksi...</p>
        </IonContent>
      </IonPage>
    );
  }

  // Format Timer to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleSimulatePayment = async () => {
    await payOrder(orderId);
    setIsSuccess(true);
    setShowToast(true);
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="qris-toolbar">
          <div className="qris-toolbar-inner">
            <div className="qris-logo-row">
              <img src="/logo.png" alt="Tumbasna" className="qris-header-logo-only" />
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="payment-content">
        <div className="payment-container">
          {!isSuccess ? (
            /* QRIS SCAN INTERFACE */
            <>
              {/* Alert Countdown */}
              <div className="payment-timer-banner">
                <IonIcon icon={timeOutline} />
                <span>Selesaikan pembayaran dalam <strong>{formatTime(secondsLeft)}</strong></span>
              </div>

              {/* Transaction Summary Card */}
              <div className="payment-summary-card">
                <span className="payment-label">Nominal Transaksi</span>
                <h2 className="payment-value">Rp {order.totalAmount.toLocaleString('id-ID')}</h2>
                <div className="payment-details-row">
                  <span>ID Transaksi: <strong>{order.id}</strong></span>
                  <span>Metode: <strong>QRIS Dinamis</strong></span>
                </div>
              </div>

              {/* QR Code Presentation Box */}
              <div className="qris-presentation-box">
                <div className="qris-header-logo">
                  <span className="qris-text">QRIS</span>
                  <span className="gpn-text">GPN</span>
                </div>
                
                <div className="qris-code-container">
                  <img src={order.paymentQrCode} alt="QRIS Code" className="qris-image" />
                </div>

                <p className="qris-footer-desc">
                  Dipindai otomatis oleh semua aplikasi M-Banking dan E-Wallet (GoPay, OVO, Dana, LinkAja, BCA, Mandiri, dll)
                </p>
              </div>

              {/* Security Banner */}
              <div className="payment-security-notice">
                <IonIcon icon={informationCircleOutline} />
                <span>Sistem menggunakan Escrow Tumbasna. Dana akan DITAHAN sementara hingga barang sampai ke lokasi Anda secara aman.</span>
              </div>

              {/* Simulation Helper Button */}
              <div className="simulation-wrapper ion-padding-horizontal">
                <div className="simulation-note">
                  <IonIcon icon={alertCircleOutline} />
                  <span>Tekan tombol di bawah untuk menyimulasikan transaksi pembayaran QRIS sukses dari E-Wallet Anda.</span>
                </div>
                <IonButton
                  expand="block"
                  color="tertiary"
                  className="simulate-pay-btn pulse-button"
                  onClick={handleSimulatePayment}
                >
                  Simulasikan Bayar Sukses
                </IonButton>
              </div>
            </>
          ) : (
            /* PAYMENT SUCCESS SCREEN (DANA DITAHAN) */
            <div className="payment-success-card">
              <div className="success-icon-wrapper">
                <IonIcon icon={checkmarkCircle} />
              </div>
              
              <h2>Pembayaran Berhasil!</h2>
              <IonBadge color="success" className="status-badge-held">
                Status: DANA DITAHAN (ESCROW)
              </IonBadge>

              <p className="success-message">
                Dana sebesar <strong>Rp {order.totalAmount.toLocaleString('id-ID')}</strong> untuk transaksi <strong>{order.id}</strong> telah diamankan oleh sistem penampung Tumbasna.
              </p>

              <div className="escrow-process-box">
                <h4>Alur Perlindungan Dana:</h4>
                <div className="process-timeline">
                  <div className="process-step checked">
                    <span className="step-num">1</span>
                    <span className="step-text">Pembayaran QRIS Buyer (Selesai)</span>
                  </div>
                  <div className="process-step active">
                    <span className="step-num">2</span>
                    <span className="step-text">Dana Ditahan & Supplier Mengirimkan Barang (Sedang Berlangsung)</span>
                  </div>
                  <div className="process-step">
                    <span className="step-num">3</span>
                    <span className="step-text">Buyer Konfirmasi Terima & Dana Dicairkan ke Supplier</span>
                  </div>
                </div>
              </div>

              <div className="success-action-buttons">
                <IonButton
                  expand="block"
                  color="primary"
                  className="action-btn-primary"
                  onClick={() => onNavigateToTracking(order.id)}
                >
                  Lacak Pengiriman Komoditas <IonIcon icon={chevronForwardOutline} slot="end" />
                </IonButton>

                <IonButton
                  expand="block"
                  fill="clear"
                  color="medium"
                  className="action-btn-secondary"
                  onClick={onNavigateToPesanan}
                >
                  Kembali ke Riwayat Transaksi
                </IonButton>
              </div>
            </div>
          )}
        </div>
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message="Simulasi Pembayaran Berhasil! Status diubah menjadi: Dana Ditahan."
        duration={3000}
        position="bottom"
        className="custom-toast"
      />
    </IonPage>
  );
};

export default PembayaranQris;
