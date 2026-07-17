import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonButton,
  IonSpinner,
  IonToast
} from '@ionic/react';
import {
  arrowBackOutline,
  timeOutline,
  copyOutline,
  cardOutline,
  walletOutline,
  cashOutline
} from 'ionicons/icons';
import { useApp } from '../context/AppContext';

import './OrderDetail.css';

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

const PAYMENT_TIMEOUT = 900; // 15 menit = 900 detik

const MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'Mid-client-PjI0Nu76GIkFIqVR';
const IS_PRODUCTION = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
const SNAP_JS_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';

const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onBack, onPaymentSuccess }) => {
  const { orders, payOrder } = useApp();
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_TIMEOUT);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'qris' | 'va_bca' | 'gopay' | 'transfer' | 'cod'>('qris');
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [snapError, setSnapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snapScriptReady, setSnapScriptReady] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const order = orders.find((o) => o.id === orderId);
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.tumbasna.my.id';
  const paymentMode = import.meta.env.VITE_PAYMENT_MODE || 'demo';

  const isExpired = secondsLeft <= 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // Inject Midtrans Snap.js script once
  useEffect(() => {
    if (paymentMode !== 'api') return;
    const existing = document.getElementById('midtrans-snap-js');
    if (existing) { setSnapScriptReady(true); return; }
    const script = document.createElement('script');
    script.id = 'midtrans-snap-js';
    script.src = SNAP_JS_URL;
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.onload = () => setSnapScriptReady(true);
    script.onerror = () => console.error('[Snap] Failed to load snap.js');
    document.body.appendChild(script);
  }, [paymentMode]);

  useEffect(() => {
    if (order?.paymentMethod) {
      setSelectedPaymentMethod(order.paymentMethod as any);
    }
  }, [order]);

  useEffect(() => {
    if (order && paymentMode === 'api') {
      fetchSnapPayment();
    }
  }, [order?.id]);

  useEffect(() => {
    if (secondsLeft > 0) {
      const timer = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [secondsLeft]);

  const fetchSnapPayment = async () => {
    if (!order) return;
    setIsLoading(true);
    setSnapError(null);
    try {
      const res = await fetch(`${API_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat pembayaran');
      setSnapToken(data.snapToken);
    } catch (err: any) {
      console.error('Snap payment error:', err);
      setSnapToken(null);
      setSnapError(err.message || 'Gagal menyiapkan pembayaran');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSnap = () => {
    if (!snapToken || !(window as any).snap) return;
    (window as any).snap.pay(snapToken, {
      onSuccess: (result: any) => {
        console.log('[Snap] Payment success:', result);
        payOrder(order!.id);
        setToastMessage('Pembayaran berhasil! Pesanan sedang diproses.');
        setShowToast(true);
        setTimeout(() => onPaymentSuccess(), 1500);
      },
      onPending: (result: any) => {
        console.log('[Snap] Payment pending:', result);
        setToastMessage('Pembayaran sedang diproses. Kami akan konfirmasi segera.');
        setShowToast(true);
      },
      onError: (result: any) => {
        console.error('[Snap] Payment error:', result);
        setToastMessage('Pembayaran gagal. Silakan coba lagi.');
        setShowToast(true);
      },
      onClose: () => {
        console.log('[Snap] Popup closed by user.');
      },
    });
  };

  const handleSimulatePay = () => {
    if (!order) return;
    setIsLoading(true);
    setTimeout(() => {
      payOrder(order.id);
      setToastMessage('Pembayaran berhasil! (Demo)');
      setShowToast(true);
      setIsLoading(false);
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }, 1500);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(order?.id || '').catch(() => {});
    setToastMessage('ID Transaksi disalin!');
    setShowToast(true);
  };

  const handleChangePaymentMethod = (method: 'qris' | 'va_bca' | 'gopay' | 'transfer' | 'cod') => {
    setSelectedPaymentMethod(method);
    setShowPaymentMethodModal(false);
    setToastMessage(`Metode pembayaran diubah ke ${getPaymentMethodName(method)}`);
    setShowToast(true);
  };

  const getPaymentMethodName = (method: string) => {
    const names: Record<string, string> = {
      'qris': 'QRIS',
      'va_bca': 'Virtual Account BCA',
      'gopay': 'GoPay',
      'transfer': 'Transfer Bank',
      'cod': 'Cash on Delivery'
    };
    return names[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      'qris': cardOutline,
      'va_bca': walletOutline,
      'gopay': cashOutline,
      'transfer': walletOutline,
      'cod': cashOutline
    };
    return icons[method] || cardOutline;
  };

  if (!order) {
    return (
      <IonPage>
        <IonContent className="order-detail-content">
          <div style={{ padding: 20, textAlign: 'center' }}>
            <IonSpinner name="crescent" />
            <p style={{ marginTop: 20 }}>Memuat detail pesanan...</p>
            <p style={{ fontSize: 12, color: '#666' }}>Order ID: {orderId}</p>
            <IonButton onClick={onBack} style={{ marginTop: 20 }}>Kembali</IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const totalAmount = order.totalAmount || 0;

  return (
    <IonPage>
      <IonHeader className="order-detail-header">
        <IonToolbar className="order-detail-toolbar">
          <div className="order-detail-toolbar-inner">
            <button className="order-detail-back-btn" onClick={onBack}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <h2 className="order-detail-header-title">Detail Pesanan</h2>
            <div style={{ width: 32 }}></div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="order-detail-content">
        <div className="order-detail-container">
          {/* Countdown Timer */}
          <div className={`order-timer-banner ${isExpired ? 'expired' : ''}`}>
            <IonIcon icon={timeOutline} />
            <span>
              {isExpired ? (
                'Waktu pembayaran telah habis'
              ) : (
                <>
                  Selesaikan pembayaran dalam <strong>{minutes}:{seconds.toString().padStart(2, '0')}</strong>
                </>
              )}
            </span>
          </div>

          <div className="order-timer-progress-wrap">
            <div
              className="order-timer-progress-fill"
              style={{
                width: `${(secondsLeft / PAYMENT_TIMEOUT) * 100}%`,
                background: secondsLeft < 300 ? '#E53935' : secondsLeft < 600 ? '#F7941D' : '#8CC63F'
              }}
            ></div>
          </div>

          {/* Total Pembayaran */}
          <div className="order-total-payment-card">
            <div className="order-total-label">Total Pembayaran</div>
            <div className="order-total-amount">Rp {totalAmount.toLocaleString('id-ID')}</div>
            
            {/* Payment Method Badge */}
            <div className="payment-method-badge">
              <IonIcon icon={getPaymentMethodIcon(selectedPaymentMethod)} />
              <span>{getPaymentMethodName(selectedPaymentMethod)}</span>
            </div>
          </div>

          {/* Payment via Midtrans Snap Popup */}
          {paymentMode === 'api' && (
            <div className="payment-instruction-card">
              <h3 className="section-title">Cara Pembayaran</h3>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <IonSpinner name="crescent" />
                  <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>Menyiapkan pembayaran...</p>
                </div>
              ) : snapToken ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #006837, #00A651)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 28
                  }}>🔒</div>
                  <p style={{ fontSize: 13, color: '#374151', marginBottom: 20, lineHeight: 1.6 }}>
                    Pembayaran disiapkan. Pilih metode yang Anda inginkan — QRIS, Transfer Bank, GoPay, OVO, dan lainnya.
                  </p>
                  <IonButton
                    expand="block"
                    disabled={!snapScriptReady || isExpired}
                    style={{ '--background': '#006837', '--border-radius': '14px', '--padding-top': '14px', '--padding-bottom': '14px', fontWeight: 700, fontSize: 15 }}
                    onClick={handleOpenSnap}
                  >
                    {snapScriptReady ? `💳  Bayar Rp ${totalAmount.toLocaleString('id-ID')}` : 'Memuat...'}
                  </IonButton>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12 }}>Popup pembayaran Midtrans akan terbuka</p>
                </div>
              ) : snapError ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                  <p style={{ color: '#E53935', fontSize: 13, marginBottom: 16 }}>{snapError}</p>
                  <IonButton size="small" onClick={fetchSnapPayment} style={{ '--background': '#006837' }}>Coba Lagi</IonButton>
                </div>
              ) : null}
            </div>
          )}

          {paymentMode !== 'api' && selectedPaymentMethod === 'qris' && (
            <div className="payment-instruction-card">
              <h3 className="section-title">Cara Pembayaran</h3>
              <div className="instruction-steps">
                <div className="instruction-step">
                  <div className="step-number">1</div>
                  <div className="step-text">Buka aplikasi e-wallet atau m-banking</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">2</div>
                  <div className="step-text">Pilih menu Scan QR / QRIS</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">3</div>
                  <div className="step-text">Scan kode QRIS dari merchant</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">4</div>
                  <div className="step-text">Konfirmasi pembayaran</div>
                </div>
              </div>
            </div>
          )}

          {selectedPaymentMethod === 'va_bca' && (
            <div className="payment-instruction-card">
              <h3 className="section-title">Cara Pembayaran</h3>
              <div className="va-number-display">
                <div className="va-label">Nomor Virtual Account</div>
                <div className="va-number">8808 {order.id.slice(4, 16)}</div>
                <button className="copy-va-btn" onClick={() => {
                  navigator.clipboard.writeText(8808);
                  setToastMessage('Nomor VA disalin!');
                  setShowToast(true);
                }}>
                  <IonIcon icon={copyOutline} /> Salin
                </button>
              </div>

              <div className="instruction-steps">
                <div className="instruction-step">
                  <div className="step-number">1</div>
                  <div className="step-text">Buka aplikasi BCA Mobile atau M-BCA</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">2</div>
                  <div className="step-text">Pilih menu "m-Transfer"</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">3</div>
                  <div className="step-text">Pilih "BCA Virtual Account"</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">4</div>
                  <div className="step-text">Masukkan nomor VA di atas</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">5</div>
                  <div className="step-text">Pastikan nominal sesuai dan konfirmasi dengan PIN</div>
                </div>
              </div>
            </div>
          )}

          {selectedPaymentMethod === 'gopay' && (
            <div className="payment-instruction-card">
              <h3 className="section-title">Cara Pembayaran</h3>
              <div className="instruction-steps">
                <div className="instruction-step">
                  <div className="step-number">1</div>
                  <div className="step-text">Buka aplikasi Gojek</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">2</div>
                  <div className="step-text">Pilih menu "Bayar"</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">3</div>
                  <div className="step-text">Masukkan kode: {order.id.slice(4, 14)}</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">4</div>
                  <div className="step-text">Pastikan nominal sesuai dan konfirmasi dengan PIN</div>
                </div>
              </div>
            </div>
          )}

          {selectedPaymentMethod === 'transfer' && (
            <div className="payment-instruction-card">
              <h3 className="section-title">Cara Pembayaran</h3>
              <div className="va-number-display">
                <div className="va-label">Rekening Tujuan</div>
                <div className="va-number">BCA 1234567890</div>
                <div className="va-label" style={{ marginTop: 10 }}>Atas Nama</div>
                <div className="va-number" style={{ fontSize: 16 }}>PT Tumbasna Indonesia</div>
              </div>

              <div className="instruction-steps">
                <div className="instruction-step">
                  <div className="step-number">1</div>
                  <div className="step-text">Transfer ke rekening di atas</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">2</div>
                  <div className="step-text">Pastikan nominal Rp {totalAmount.toLocaleString('id-ID')} sesuai</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">3</div>
                  <div className="step-text">Simpan bukti transfer</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">4</div>
                  <div className="step-text">Pembayaran akan dikonfirmasi otomatis</div>
                </div>
              </div>
            </div>
          )}

          {selectedPaymentMethod === 'cod' && (
            <div className="payment-instruction-card">
              <h3 className="section-title">Cara Pembayaran</h3>
              <div className="instruction-steps">
                <div className="instruction-step">
                  <div className="step-number">1</div>
                  <div className="step-text">Pesanan akan diproses setelah konfirmasi supplier</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">2</div>
                  <div className="step-text">Siapkan uang tunai Rp {totalAmount.toLocaleString('id-ID')}</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">3</div>
                  <div className="step-text">Bayar saat barang tiba di lokasi Anda</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">4</div>
                  <div className="step-text">Pastikan barang dalam kondisi baik sebelum bayar</div>
                </div>
              </div>
            </div>
          )}

          {/* ID Transaksi */}
          <div className="order-info-simple">
            <div className="order-info-row">
              <span className="order-info-label">ID Transaksi</span>
              <div className="order-info-value-wrap">
                <span className="order-info-value">{order.id}</span>
                <button className="copy-btn" onClick={handleCopyId}>
                  <IonIcon icon={copyOutline} />
                </button>
              </div>
            </div>
          </div>

          {paymentMode === 'demo' && (
            <div className="order-action-area">
              <p className="demo-note">Mode Demo: Tekan tombol untuk simulasi pembayaran</p>
              <IonButton
                expand="block"
                className="simulate-pay-btn"
                onClick={handleSimulatePay}
                disabled={isLoading || isExpired}
              >
                {isLoading ? <IonSpinner name="crescent" /> : 'SIMULASIKAN BAYAR SUKSES'}
              </IonButton>
            </div>
          )}

          {/* Ubah Metode Pembayaran Button */}
          <div className="change-payment-method-section">
            <IonButton
              expand="block"
              fill="outline"
              className="change-payment-btn"
              onClick={() => setShowPaymentMethodModal(true)}
            >
              Ubah Metode Pembayaran
            </IonButton>
          </div>

          <div style={{ height: 40 }}></div>
        </div>
      </IonContent>

      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
        <div className="payment-method-modal-overlay" onClick={() => setShowPaymentMethodModal(false)}>
          <div className="payment-method-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pilih Metode Pembayaran</h3>
              <button className="modal-close-btn" onClick={() => setShowPaymentMethodModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="payment-method-list">
                <button
                  className={`payment-method-item ${selectedPaymentMethod === 'qris' ? 'active' : ''}`} onClick={() => handleChangePaymentMethod('qris')}
                >
                  <IonIcon icon={cardOutline} />
                  <div className="payment-method-info">
                    <div className="payment-method-name">QRIS</div>
                    <div className="payment-method-desc">Bayar dengan QRIS / E-Wallet</div>
                  </div>
                </button>
                <button
                  className={`payment-method-item ${selectedPaymentMethod === 'va_bca' ? 'active' : ''}`} onClick={() => handleChangePaymentMethod('va_bca')}
                >
                  <IonIcon icon={walletOutline} />
                  <div className="payment-method-info">
                    <div className="payment-method-name">Virtual Account BCA</div>
                    <div className="payment-method-desc">Transfer via VA BCA</div>
                  </div>
                </button>
                <button
                  className={`payment-method-item ${selectedPaymentMethod === 'gopay' ? 'active' : ''}`} onClick={() => handleChangePaymentMethod('gopay')}
                >
                  <IonIcon icon={cashOutline} />
                  <div className="payment-method-info">
                    <div className="payment-method-name">GoPay</div>
                    <div className="payment-method-desc">Bayar dengan GoPay</div>
                  </div>
                </button>
                <button
                  className={`payment-method-item ${selectedPaymentMethod === 'transfer' ? 'active' : ''}`} onClick={() => handleChangePaymentMethod('transfer')}
                >
                  <IonIcon icon={walletOutline} />
                  <div className="payment-method-info">
                    <div className="payment-method-name">Transfer Bank</div>
                    <div className="payment-method-desc">Transfer ke rekening Tumbasna</div>
                  </div>
                </button>
                <button
                  className={`payment-method-item ${selectedPaymentMethod === 'cod' ? 'active' : ''}`} onClick={() => handleChangePaymentMethod('cod')}
                >
                  <IonIcon icon={cashOutline} />
                  <div className="payment-method-info">
                    <div className="payment-method-name">Cash on Delivery (COD)</div>
                    <div className="payment-method-desc">Bayar saat barang tiba</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />
    </IonPage>
  );
};

export default OrderDetail;






