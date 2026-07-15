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
import { QRCodeSVG } from 'qrcode.react';
import './OrderDetail.css';

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

const PAYMENT_TIMEOUT = 900; // 15 menit = 900 detik

const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onBack, onPaymentSuccess }) => {
  const { orders, payOrder } = useApp();
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_TIMEOUT);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'qris' | 'va_bca' | 'gopay'>('qris');
  const [qrString, setQrString] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const order = orders.find((o) => o.id === orderId);
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.tumbasna.my.id';
  const paymentMode = import.meta.env.VITE_PAYMENT_MODE || 'demo';

  const isExpired = secondsLeft <= 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  useEffect(() => {
    if (order && selectedPaymentMethod === 'qris') {
      generateQRIS();
    }
  }, [order, selectedPaymentMethod]);

  useEffect(() => {
    if (secondsLeft > 0) {
      const timer = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [secondsLeft]);

  const generateQRIS = async () => {
    if (!order) return;
    setIsLoading(true);
    try {
      if (paymentMode === 'demo') {
        setQrString(`TUMBASNA-DEMO-${order.id}-Rp${order.totalAmount}`);
      } else {
        const res = await fetch(`${API_URL}/api/payments/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal membuat QRIS');
        setQrString(data.qrString);
      }
    } catch (err: any) {
      if (paymentMode === 'demo') {
        setQrString(`TUMBASNA-DEMO-${order.id}-Rp${order.totalAmount}`);
      }
    } finally {
      setIsLoading(false);
    }
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

  useEffect(() => {
    console.log('[OrderDetail] orderId:', orderId);
    console.log('[OrderDetail] orders:', orders);
    console.log('[OrderDetail] order found:', order);
  }, [orderId, orders, order]);

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
                width: $%,
                background: secondsLeft < 300 ? '#E53935' : secondsLeft < 600 ? '#F7941D' : '#8CC63F'
              }}
            ></div>
          </div>

          <div className="order-summary-card">
            <div className="order-label">Total Pembayaran</div>
            <h2 className="order-value">Rp {totalAmount.toLocaleString('id-ID')}</h2>
            <div className="order-details-row">
              <span>ID Transaksi: <strong>{order.id.slice(0, 8)}</strong></span>
              <button className="copy-id-btn" onClick={handleCopyId}>
                <IonIcon icon={copyOutline} />
              </button>
            </div>
          </div>

          <div className="payment-method-section">
            <h3 className="section-title">Pilih Metode Pembayaran</h3>
            <div className="payment-method-list">
              <div
                className={`payment-method-item ${selectedPaymentMethod === 'qris' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('qris')}
              >
                <div className="payment-method-icon">
                  <IonIcon icon={cardOutline} />
                </div>
                <div className="payment-method-info">
                  <h4>QRIS</h4>
                  <p>Bayar dengan semua E-Wallet</p>
                </div>
                <div className="payment-method-radio">
                  {selectedPaymentMethod === 'qris' && <div className="radio-dot"></div>}
                </div>
              </div>

              <div
                className={`payment-method-item ${selectedPaymentMethod === 'va_bca' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('va_bca')}
              >
                <div className="payment-method-icon">
                  <IonIcon icon={walletOutline} />
                </div>
                <div className="payment-method-info">
                  <h4>Virtual Account BCA</h4>
                  <p>Transfer via ATM/M-Banking BCA</p>
                </div>
                <div className="payment-method-radio">
                  {selectedPaymentMethod === 'va_bca' && <div className="radio-dot"></div>}
                </div>
              </div>

              <div
                className={`payment-method-item ${selectedPaymentMethod === 'gopay' ? 'active' : ''}`}
                onClick={() => setSelectedPaymentMethod('gopay')}
              >
                <div className="payment-method-icon">
                  <IonIcon icon={cashOutline} />
                </div>
                <div className="payment-method-info">
                  <h4>GoPay</h4>
                  <p>Bayar langsung dengan GoPay</p>
                </div>
                <div className="payment-method-radio">
                  {selectedPaymentMethod === 'gopay' && <div className="radio-dot"></div>}
                </div>
              </div>
            </div>
          </div>

          {selectedPaymentMethod === 'qris' && (
            <div className="payment-instruction-card">
              <h3 className="section-title">Cara Pembayaran QRIS</h3>
              
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : qrString ? (
                <>
                  <div className="qr-code-container">
                    <QRCodeSVG value={qrString} size={200} level="H" />
                  </div>

                  <div className="instruction-steps">
                    <div className="instruction-step">
                      <div className="step-number">1</div>
                      <div className="step-text">Buka aplikasi e-wallet Anda (GoPay, OVO, Dana, LinkAja, dll)</div>
                    </div>
                    <div className="instruction-step">
                      <div className="step-number">2</div>
                      <div className="step-text">Pilih menu "Bayar" atau "Scan QR"</div>
                    </div>
                    <div className="instruction-step">
                      <div className="step-number">3</div>
                      <div className="step-text">Scan kode QR di atas</div>
                    </div>
                    <div className="instruction-step">
                      <div className="step-number">4</div>
                      <div className="step-text">Pastikan nominal Rp {totalAmount.toLocaleString('id-ID')} sesuai</div>
                    </div>
                    <div className="instruction-step">
                      <div className="step-number">5</div>
                      <div className="step-text">Konfirmasi pembayaran</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <p style={{ color: '#E53935', fontSize: 13 }}>Gagal memuat QR Code</p>
                  <IonButton size="small" onClick={generateQRIS}>Coba Lagi</IonButton>
                </div>
              )}
            </div>
          )}

          {selectedPaymentMethod === 'va_bca' && (
            <div className="payment-instruction-card">
              <h3 className="section-title">Cara Pembayaran Virtual Account BCA</h3>
              <div className="va-number-display">
                <div className="va-label">Nomor Virtual Account</div>
                <div className="va-number">8808 {order.id.slice(0, 12)}</div>
                <button className="copy-va-btn" onClick={() => {
                  navigator.clipboard.writeText(`8808${order.id.slice(0, 12)}`);
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
                  <div className="step-text">Masukkan nomor VA: 8808{order.id.slice(0, 12)}</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">5</div>
                  <div className="step-text">Pastikan nominal Rp {totalAmount.toLocaleString('id-ID')} sesuai</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">6</div>
                  <div className="step-text">Konfirmasi pembayaran dengan PIN</div>
                </div>
              </div>
            </div>
          )}

          {selectedPaymentMethod === 'gopay' && (
            <div className="payment-instruction-card">
              <h3 className="section-title">Cara Pembayaran GoPay</h3>
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
                  <div className="step-text">Masukkan kode pembayaran: {order.id.slice(0, 10)}</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">4</div>
                  <div className="step-text">Pastikan nominal Rp {totalAmount.toLocaleString('id-ID')} sesuai</div>
                </div>
                <div className="instruction-step">
                  <div className="step-number">5</div>
                  <div className="step-text">Konfirmasi pembayaran dengan PIN</div>
                </div>
              </div>
            </div>
          )}

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

          <div style={{ height: 40 }}></div>
        </div>
      </IonContent>

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






