import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonButton,
  IonBadge,
  IonToast,
  IonSpinner
} from '@ionic/react';
import {
  timeOutline,
  checkmarkCircle,
  informationCircleOutline,
  chevronForwardOutline,
  walletOutline
} from 'ionicons/icons';
import { useApp } from '../context/AppContext';
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
  const { orders, refreshOrders } = useApp();
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const order = orders.find((o) => o.id === orderId);

  // Timer Effect
  useEffect(() => {
    if (isSuccess || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, isSuccess]);

  // Sync state if order status is updated from external
  useEffect(() => {
    if (order && order.status !== 'Menunggu Pembayaran') {
      setIsSuccess(true);
    }
  }, [order]);

  const handlePayMidtrans = async () => {
    if (!order) return;
    setIsLoading(true);

    try {
      // Gunakan VITE_API_URL dari environment, fallback ke localhost (ubah IP jika testing di mobile)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat token pembayaran');
      }

      if (data.token) {
        // Panggil Midtrans Snap
        (window as any).snap.pay(data.token, {
          onSuccess: function (result: any) {
            setToastMessage("Pembayaran berhasil!");
            setShowToast(true);
            setIsSuccess(true);
            refreshOrders(); // Refresh status order dari backend
          },
          onPending: function (result: any) {
            setToastMessage("Menunggu pembayaran diselesaikan.");
            setShowToast(true);
          },
          onError: function (result: any) {
            setToastMessage("Terjadi kesalahan saat pembayaran.");
            setShowToast(true);
          },
          onClose: function () {
            setToastMessage("Anda menutup popup sebelum pembayaran selesai.");
            setShowToast(true);
          }
        });
      }
    } catch (error: any) {
      setToastMessage(error.message);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!order) {
    return (
      <IonPage>
        <IonContent className="ion-padding text-center">
          <p>Memuat rincian transaksi...</p>
        </IonContent>
      </IonPage>
    );
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <IonPage>
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
                  <span>Vendor: <strong>Midtrans</strong></span>
                </div>
              </div>

              {/* Security Banner */}
              <div className="payment-security-notice" style={{ marginTop: '20px', marginBottom: '20px' }}>
                <IonIcon icon={informationCircleOutline} />
                <span>Sistem menggunakan Escrow Tumbasna. Dana akan DITAHAN sementara hingga barang sampai ke lokasi Anda secara aman.</span>
              </div>

              {/* Midtrans Button */}
              <div className="simulation-wrapper ion-padding-horizontal">
                <IonButton
                  expand="block"
                  color="tertiary"
                  className="simulate-pay-btn pulse-button"
                  onClick={handlePayMidtrans}
                  disabled={isLoading}
                >
                  {isLoading ? <IonSpinner name="crescent" /> : (
                    <>
                      <IonIcon icon={walletOutline} slot="start" />
                      Lanjutkan ke Pembayaran
                    </>
                  )}
                </IonButton>
              </div>
            </>
          ) : (
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
                    <span className="step-text">Pembayaran Buyer (Selesai)</span>
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
        message={toastMessage}
        duration={3000}
        position="bottom"
        className="custom-toast"
      />
    </IonPage>
  );
};

export default PembayaranQris;
