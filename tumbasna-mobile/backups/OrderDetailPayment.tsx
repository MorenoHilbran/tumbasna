import React, { useEffect, useState, useRef } from 'react';
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
  shieldCheckmarkOutline,
  chevronForwardOutline,
  copyOutline,
  arrowBackOutline,
  refreshOutline
} from 'ionicons/icons';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import './OrderDetailPayment.css';

interface OrderDetailPaymentProps {
  orderId: string;
  onNavigateToPesanan: () => void;
  onNavigateToPesanan: () => void;
}

const PAYMENT_TIMEOUT = 300; // 5 menit
const POLL_INTERVAL_MS = 5000; // polling setiap 5 detik

const OrderDetailPayment: React.FC<OrderDetailPaymentProps> = ({
  orderId,
  onNavigateToPesanan,
  onNavigateToTracking
}) => {
  const { orders, refreshOrders, payOrder } = useApp();
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_TIMEOUT);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // QRIS state
  const [qrString, setQrString] = useState<string | null>(null);
  const [midtransOrderId, setMidtransOrderId] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const paymentMode = import.meta.env.VITE_PAYMENT_MODE || 'demo';
  const order = orders.find((o) => o.id === orderId);
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.tumbasna.my.id';

  // â”€â”€ Buat / ambil QR dari backend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchQris = async () => {
    if (!order) return;
    setIsLoading(true);
    setQrError(null);
    try {
      const res = await fetch(`${API_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat QRIS');

      if (paymentMode === 'midtrans') {
        setQrString(data.qrString);
        setMidtransOrderId(data.midtransOrderId);
      } else {
        // Demo mode: gunakan string dummy agar QR tetap tampil
        setQrString(`TUMBASNA-DEMO-${order.id}-Rp${order.totalAmount}`);
        setMidtransOrderId(data.midtransOrderId || null);
      }
    } catch (err: any) {
      if (paymentMode !== 'midtrans') {
        // Fallback: Jika offline atau backend bermasalah, tetap tampilkan QR demo
        setQrString(`TUMBASNA-DEMO-${order.id}-Rp${order.totalAmount}`);
      } else {
        setQrError(err.message || 'Gagal memuat QRIS');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // â”€â”€ Polling status pembayaran â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const startPolling = () => {
    if (!midtransOrderId || paymentMode !== 'midtrans') return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/payments/status?midtransOrderId=${midtransOrderId}`);
        const data = await res.json();
        if (data.isPaid) {
          clearInterval(pollRef.current!);
          setIsSuccess(true);
          payOrder(orderId);
          await refreshOrders();
        }
      } catch (_) {}
    }, POLL_INTERVAL_MS);
  };

  // Simulasi bayar (Demo Mode)
  const handleSimulatePay = () => {
    if (!order) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsSuccess(true);
      payOrder(order.id);
      setToastMessage('Pembayaran berhasil dikonfirmasi! (Demo)');
      setShowToast(true);
      setIsLoading(false);
    }, 1500);
  };

  // â”€â”€ Salin ID Transaksi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCopyId = () => {
    navigator.clipboard.writeText(order?.id || '').catch(() => {});
    setToastMessage('ID Transaksi disalin!');
    setShowToast(true);
  };

  // â”€â”€ Efek awal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    fetchQris();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [orderId]);

  useEffect(() => {
    if (midtransOrderId && paymentMode === 'midtrans' && !isSuccess) {
      startPolling();
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [midtransOrderId]);

  // â”€â”€ Timer mundur â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (isSuccess || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, isSuccess]);

  // â”€â”€ Sync dari context jika status berubah dari luar â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (order && order.status !== 'Menunggu Pembayaran') {
      setIsSuccess(true);
    }
  }, [order]);

  if (!order) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>Memuat rincian transaksi...</p>
        </IonContent>
      </IonPage>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timerPercent = (secondsLeft / PAYMENT_TIMEOUT) * 100;
  const isExpired = secondsLeft <= 0;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="qris-toolbar">
          <div className="qris-toolbar-inner">
            <button className="qris-back-btn" onClick={onNavigateToPesanan}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <h2 className="qris-header-title">Bayar via QRIS</h2>
            <div style={{ width: 32 }}></div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="payment-content">
        <div className="payment-container">
          {!isSuccess ? (
            <>
              {/* â”€â”€ Timer Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              <div className={`payment-timer-banner ${isExpired ? 'expired' : ''}`}>
                <IonIcon icon={timeOutline} />
                {isExpired ? (
                  <span><strong>Waktu habis.</strong> Silakan buat pesanan baru.</span>
                ) : (
                  <span>Selesaikan pembayaran dalam <strong>{formatTime(secondsLeft)}</strong></span>
                )}
              </div>

              {/* â”€â”€ Progress bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              <div className="timer-progress-bar-wrap">
                <div
                  className="timer-progress-bar-fill"
                  style={{
                    width: `${timerPercent}%`,
                    background: timerPercent < 20 ? '#e53935' : timerPercent < 50 ? '#F7941D' : '#8CC63F'
                  }}
                />
              </div>

              {/* â”€â”€ Amount card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              <div className="payment-summary-card">
                <span className="payment-label">NOMINAL TRANSAKSI</span>
                <h2 className="payment-value">Rp {order.totalAmount.toLocaleString('id-ID')}</h2>
                <div className="payment-details-row">
                  <span>ID: <strong>{order.id}</strong></span>
                  <button className="copy-id-btn" onClick={handleCopyId}>
                    <IonIcon icon={copyOutline} />
                  </button>
                </div>
                <div className="payment-method-badge">
                  <span>Metode: <strong>QRIS {paymentMode === 'midtrans' ? '(Live)' : '(Demo)'}</strong></span>
                </div>
              </div>

              {/* â”€â”€ QR Code Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              <div className="qris-card">
                <div className="qris-card-header">
                  <img src="/logo.png" alt="Tumbasna" className="qris-card-logo" />
                  <span className="qris-card-label">Scan via M-Banking / E-Wallet Apa Saja</span>
                </div>

                <div className="qr-code-wrapper">
                  {isLoading ? (
                    <div className="qr-loading-placeholder">
                      <IonSpinner name="crescent" />
                      <span>Memuat kode QRIS...</span>
                    </div>
                  ) : qrError ? (
                    <div className="qr-loading-placeholder" style={{ flexDirection: 'column', gap: 8 }}>
                      <span style={{ color: '#e53935', fontSize: 12, textAlign: 'center' }}>{qrError}</span>
                      <button
                        onClick={fetchQris}
                        style={{ fontSize: 12, color: '#006837', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <IonIcon icon={refreshOutline} /> Coba Lagi
                      </button>
                    </div>
                  ) : qrString ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      <QRCodeSVG value={qrString} size={200} fgColor="#000000" />
                    </div>
                  ) : null}

                  {/* Corner decorations */}
                  <div className="qr-corner tl" />
                  <div className="qr-corner tr" />
                  <div className="qr-corner bl" />
                  <div className="qr-corner br" />
                </div>

                <p className="qris-scan-hint">
                  Dipindai oleh semua M-Banking & E-Wallet<br />
                  (GoPay, OVO, Dana, LinkAja, ShopeePay, BCA, BRIâ€¦)
                </p>

                <div className="qris-brand-row">
                  {['GoPay', 'OVO', 'Dana', 'LinkAja', 'ShopeePay', 'BCA', 'BRI', 'Mandiri'].map((b) => (
                    <span key={b} className="qris-brand-chip">{b}</span>
                  ))}
                </div>
              </div>

              {/* â”€â”€ Escrow notice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              <div className="payment-security-notice">
                <IonIcon icon={shieldCheckmarkOutline} />
                <span>
                  Sistem menggunakan <strong>Escrow Tumbasna</strong>. Dana akan{' '}
                  <strong>DITAHAN</strong> aman hingga barang sampai ke lokasi Anda.
                </span>
              </div>

              {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              {paymentMode === 'midtrans' ? (
                <div className="payment-action-area">
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#6B7A6F', marginBottom: 8 }}>
                    <IonSpinner name="dots" style={{ width: 16, height: 16, marginRight: 4 }} />
                    Menunggu konfirmasi pembayaran secara otomatis...
                  </div>
                  <IonButton
                    expand="block"
                    fill="outline"
                    color="medium"
                    className="simulate-pay-btn"
                    onClick={fetchQris}
                    disabled={isLoading}
                  >
                    <IonIcon icon={refreshOutline} slot="start" />
                    Perbarui QR Code
                  </IonButton>
                </div>
              ) : (
                <div className="payment-action-area">
                  <p style={{ textAlign: 'center', fontSize: 11, color: '#6B7A6F', margin: '0 0 8px' }}>
                    Mode Demo: Tekan tombol di bawah untuk mensimulasikan pembayaran sukses.
                  </p>
                  <IonButton
                    expand="block"
                    color="tertiary"
                    className="simulate-pay-btn"
                    onClick={handleSimulatePay}
                    disabled={isLoading || isExpired}
                  >
                    {isLoading ? <IonSpinner name="crescent" /> : 'SIMULASIKAN BAYAR SUKSES'}
                  </IonButton>
                </div>
              )}
            </>
          ) : (
            /* â”€â”€ SUCCESS STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
            <div className="payment-success-card">
              <div className="success-icon-wrapper">
                <IonIcon icon={checkmarkCircle} />
              </div>
              <h2>Pembayaran Berhasil!</h2>
              <IonBadge color="success" className="status-badge-held">
                Status: DANA DITAHAN (ESCROW)
              </IonBadge>

              <p className="success-message">
                Dana sebesar <strong>Rp {order.totalAmount.toLocaleString('id-ID')}</strong> untuk transaksi{' '}
                <strong>{order.id}</strong> telah diamankan oleh sistem escrow Tumbasna.
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
                    <span className="step-text">Dana Ditahan &amp; Supplier Mengirimkan Barang (Sedang Berlangsung)</span>
                  </div>
                  <div className="process-step">
                    <span className="step-num">3</span>
                    <span className="step-text">Buyer Konfirmasi Terima &amp; Dana Dicairkan ke Supplier</span>
                  </div>
                </div>
              </div>

              <div className="success-action-buttons">
                <IonButton
                  expand="block"
                  color="primary"
                  className="action-btn-primary"
                  onClick={() => onNavigateToPesanan()}
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

export default OrderDetailPayment;


