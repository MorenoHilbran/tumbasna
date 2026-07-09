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
  shieldCheckmarkOutline,
  chevronForwardOutline,
  downloadOutline,
  copyOutline,
  alertCircleOutline,
  phonePortraitOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { QRCodeSVG } from 'qrcode.react';
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
  const { orders, refreshOrders, payOrder } = useApp();
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'qris' | 'gpn'>('qris');
  const [qrLoaded, setQrLoaded] = useState(false);

  const paymentMode = import.meta.env.VITE_PAYMENT_MODE || 'demo'; // 'demo' | 'midtrans'
  const order = orders.find((o) => o.id === orderId);

  // Timer
  useEffect(() => {
    if (isSuccess || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, isSuccess]);

  // Sync jika status berubah dari luar
  useEffect(() => {
    if (order && order.status !== 'Menunggu Pembayaran') {
      setIsSuccess(true);
    }
  }, [order]);

  const handleMidtransPay = async () => {
    if (!order) return;
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.tumbasna.my.id';
      const response = await fetch(`${API_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.token) {
        (window as any).snap.pay(data.token, {
          onSuccess: () => { 
            setIsSuccess(true); 
            payOrder(order.id); 
            refreshOrders(); 
          },
          onPending: () => { 
            setToastMessage('Menunggu pembayaran...'); 
            setShowToast(true); 
          },
          onError: () => { 
            setToastMessage('Terjadi kesalahan pembayaran.'); 
            setShowToast(true); 
          },
          onClose: () => { 
            setToastMessage('Popup ditutup. Silakan klik tombol untuk bayar.'); 
            setShowToast(true); 
          }
        });
      }
    } catch (err: any) {
      setToastMessage('Gagal memproses Midtrans: ' + (err.message || err));
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulatePay = () => {
    if (!order) return;
    setIsLoading(true);
    setToastMessage('Mensimulasikan pembayaran QRIS...');
    setShowToast(true);
    setTimeout(() => {
      setIsSuccess(true);
      payOrder(order.id);
      setToastMessage('Pembayaran berhasil dikonfirmasi!');
      setShowToast(true);
      setIsLoading(false);
    }, 1500);
  };

  // Auto trigger Midtrans popup if mode is midtrans
  useEffect(() => {
    if (paymentMode === 'midtrans' && order && !isSuccess && !isLoading) {
      handleMidtransPay();
    }
  }, [order?.id]);

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

  const qrisData = `TUMBASNA-QRIS-${order.id}-Rp${order.totalAmount}`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id).catch(() => {});
    setToastMessage('ID Transaksi disalin!');
    setShowToast(true);
  };

  const timerPercent = (secondsLeft / 300) * 100;
  const isExpired = secondsLeft <= 0;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="qris-toolbar">
          <div className="qris-toolbar-inner">
            <button className="qris-back-btn" onClick={onNavigateToPesanan}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <h2 className="qris-header-title">Pembayaran</h2>
            <div style={{ width: 32 }}></div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="payment-content">
        <div className="payment-container">
          {!isSuccess ? (
            <>
              {/* ── Timer Banner ─────────────────────────────── */}
              <div className={`payment-timer-banner ${isExpired ? 'expired' : ''}`}>
                <IonIcon icon={timeOutline} />
                {isExpired ? (
                  <span><strong>Waktu habis.</strong> Silakan buat pesanan baru.</span>
                ) : (
                  <span>Selesaikan pembayaran dalam <strong>{formatTime(secondsLeft)}</strong></span>
                )}
              </div>

              {/* ── Progress bar timer ───────────────────────── */}
              <div className="timer-progress-bar-wrap">
                <div
                  className="timer-progress-bar-fill"
                  style={{
                    width: `${timerPercent}%`,
                    background: timerPercent < 20 ? '#e53935' : timerPercent < 50 ? '#F7941D' : '#8CC63F'
                  }}
                />
              </div>

              {/* ── Amount card ──────────────────────────────── */}
              <div className="payment-summary-card">
                <span className="payment-label">NOMINAL TRANSAKSI</span>
                <h2 className="payment-value">Rp {order.totalAmount.toLocaleString('id-ID')}</h2>
                <div className="payment-details-row">
                  <span>ID Transaksi: <strong>{order.id}</strong></span>
                  <button className="copy-id-btn" onClick={handleCopyId}>
                    <IonIcon icon={copyOutline} />
                  </button>
                </div>
                <div className="payment-method-badge">
                  <span>Metode: <strong>QRIS Dinamis</strong></span>
                </div>
              </div>

              {paymentMode === 'midtrans' ? (
                /* ── Midtrans Payment Card ─────────────────────── */
                <div className="midtrans-card">
                  <div className="midtrans-card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%', paddingBottom: '10px', borderBottom: '1.5px solid rgba(0, 104, 55, 0.08)' }}>
                    <img src="/logo.png" alt="Tumbasna" className="qris-card-logo" />
                    <span className="qris-card-label" style={{ fontSize: '9.5px', color: '#9EA8A2', fontWeight: 600 }}>Gerbang Pembayaran Midtrans</span>
                  </div>

                  <div className="midtrans-info-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
                    <IonIcon icon={shieldCheckmarkOutline} className="midtrans-shield-icon" style={{ fontSize: '48px', color: '#8CC63F', marginBottom: '12px' }} />
                    <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, color: '#006837', margin: '0 0 8px 0', fontSize: '16px' }}>Selesaikan Pembayaran</h3>
                    <p style={{ fontSize: '11px', color: '#6B7A6F', margin: 0, lineHeight: 1.5, textAlign: 'center', padding: '0 16px' }}>
                      Silakan tekan tombol di bawah untuk melakukan pembayaran aman menggunakan QRIS, GoPay, ShopeePay, atau Transfer Bank melalui sistem Midtrans.
                    </p>
                  </div>

                  {/* Escrow notice */}
                  <div className="payment-security-notice" style={{ width: '100%' }}>
                    <IonIcon icon={shieldCheckmarkOutline} />
                    <span>
                      Sistem menggunakan <strong>Escrow Tumbasna</strong>. Dana Anda ditahan aman oleh sistem penampung hingga barang sampai ke lokasi Anda.
                    </span>
                  </div>

                  <div className="payment-action-area" style={{ width: '100%', marginTop: '10px' }}>
                    <IonButton
                      expand="block"
                      color="primary"
                      className="simulate-pay-btn"
                      onClick={handleMidtransPay}
                      disabled={isLoading || isExpired}
                    >
                      {isLoading ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        'BAYAR SEKARANG'
                      )}
                    </IonButton>
                  </div>
                </div>
              ) : (
                /* ── Demo QRIS Card ───────────────────────────── */
                <>
                  {/* ── Tab QRIS / GPN ───────────────────────────── */}
                  <div className="payment-tab-row">
                    <button
                      className={`payment-tab-btn ${activeTab === 'qris' ? 'active' : ''}`}
                      onClick={() => setActiveTab('qris')}
                    >
                      QRIS
                    </button>
                    <button
                      className={`payment-tab-btn ${activeTab === 'gpn' ? 'active' : ''}`}
                      onClick={() => setActiveTab('gpn')}
                    >
                      GPN
                    </button>
                  </div>

                  {/* ── QR Code Display ──────────────────────────── */}
                  <div className="qris-card">
                    <div className="qris-card-header">
                      <img src="/logo.png" alt="Tumbasna" className="qris-card-logo" />
                      <span className="qris-card-label">
                        {activeTab === 'qris' ? 'Scan via M-Banking / E-Wallet' : 'Scan via GPN / ATM'}
                      </span>
                    </div>

                    <div className="qr-code-wrapper">
                      {!qrLoaded && (
                        <div className="qr-loading-placeholder">
                          <IonSpinner name="crescent" />
                          <span>Memuat kode QRIS...</span>
                        </div>
                      )}
                      <div style={{ display: qrLoaded ? 'flex' : 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <QRCodeSVG
                          value={qrisData}
                          size={200}
                          fgColor={activeTab === 'qris' ? '#000000' : '#006837'}
                          onLoad={() => setQrLoaded(true)}
                        />
                      </div>
                      {/* Pemicu loading palsu agar UI mulus */}
                      <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="" onLoad={() => setQrLoaded(true)} style={{display: 'none'}} />
                      {/* Corner decorations */}
                      <div className="qr-corner tl" />
                      <div className="qr-corner tr" />
                      <div className="qr-corner bl" />
                      <div className="qr-corner br" />
                    </div>

                    <p className="qris-scan-hint">
                      Dipindai otomatis oleh semua aplikasi M-Banking<br />
                      dan E-Wallet (GoPay, OVO, Dana, LinkAja, BCA...)
                    </p>

                    <div className="qris-brand-row">
                      {['GoPay', 'OVO', 'Dana', 'LinkAja', 'BCA', 'BRI'].map((b) => (
                        <span key={b} className="qris-brand-chip">{b}</span>
                      ))}
                    </div>
                  </div>

                  {/* ── Escrow notice ────────────────────────────── */}
                  <div className="payment-security-notice">
                    <IonIcon icon={shieldCheckmarkOutline} />
                    <span>
                      Sistem menggunakan <strong>Escrow Tumbasna</strong>. Dana akan{' '}
                      <strong>DITAHAN</strong> sementara hingga barang sampai ke lokasi Anda secara aman.
                    </span>
                  </div>

                  {/* ── How to pay hint ──────────────────────────── */}
                  <div className="payment-how-to">
                    <IonIcon icon={phonePortraitOutline} />
                    <span>
                      Tekan tombol di bawah untuk menyimulasikan transaksi pembayaran QRIS sukses dari E-Wallet Anda.
                    </span>
                  </div>

                  {/* ── Action button ────────────────────────────── */}
                  <div className="payment-action-area">
                    <IonButton
                      expand="block"
                      color="tertiary"
                      className="simulate-pay-btn"
                      onClick={handleSimulatePay}
                      disabled={isLoading || isExpired}
                    >
                      {isLoading ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        'SIMULASIKAN BAYAR SUKSES'
                      )}
                    </IonButton>
                  </div>
                </>
              )}
            </>
          ) : (
            /* ── SUCCESS STATE ──────────────────────────────── */
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
                <strong>{order.id}</strong> telah diamankan oleh sistem penampung Tumbasna.
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
