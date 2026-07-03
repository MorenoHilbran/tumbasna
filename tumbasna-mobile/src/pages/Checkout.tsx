import React, { useState } from 'react';
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
  IonButtons,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import {
  arrowBackOutline,
  locationOutline,
  chevronForwardOutline,
  calendarOutline,
  cubeOutline,
  walletOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { useApp } from '../context/AppContext';
import './Checkout.css';

interface CheckoutProps {
  onBack: () => void;
  onOrderCreated: (orderId: string) => void;
}

const SHIPPING_METHODS = [
  { id: 'kurir-lokal', name: 'Kurir Lokal (L300 / Pribadi)', price: 0, desc: 'Tarif ongkir dinegosiasikan dengan supplier' },
  { id: 'ekspedisi', name: 'Ekspedisi Logistik Kilat (Next Day)', price: 25000, desc: 'Estimasi tiba dalam 2-3 Hari' },
  { id: 'cod', name: 'Cash on Delivery (COD - Sesuai Ketentuan)', price: 0, desc: 'Bayar ongkos kirim saat barang tiba (Rp 0 di sistem)' }
];

const Checkout: React.FC<CheckoutProps> = ({ onBack, onOrderCreated }) => {
  const { cart, user, checkout } = useApp();
  const [selectedCourier, setSelectedCourier] = useState(SHIPPING_METHODS[0].id);
  const [dynamicShippingCost, setDynamicShippingCost] = useState(SHIPPING_METHODS[0].price);
  const [isCalculatingOngkir, setIsCalculatingOngkir] = useState(false);

  if (!user || cart.length === 0) return null;

  const itemsTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const activeShipping = SHIPPING_METHODS.find((m) => m.id === selectedCourier) || SHIPPING_METHODS[0];
  
  React.useEffect(() => {
    const fetchShipping = async () => {
      setIsCalculatingOngkir(true);
      try {
        const totalWeightGrams = cart.reduce((acc, item) => acc + (item.quantity * 1000), 0);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/shipping/cost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courier: selectedCourier, weight: totalWeightGrams })
        });
        const data = await res.json();
        if (data.success) {
          setDynamicShippingCost(data.cost);
        } else {
          setDynamicShippingCost(activeShipping.price);
        }
      } catch {
        setDynamicShippingCost(activeShipping.price);
      } finally {
        setIsCalculatingOngkir(false);
      }
    };
    fetchShipping();
  }, [selectedCourier, cart, activeShipping.price]);

  const serviceFee = 2000; // Layanan Aplikasi
  const totalAmount = itemsTotal + dynamicShippingCost + serviceFee;

  const handlePlaceOrder = async () => {
    const orderId = await checkout(activeShipping.name, dynamicShippingCost);
    if (orderId) {
      onOrderCreated(orderId);
    }
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="checkout-toolbar">
          <div className="checkout-toolbar-inner">
            <button className="checkout-back-btn" onClick={onBack}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="checkout-logo-row">
              <img src="/logo.png" alt="Tumbasna" className="checkout-header-logo-only" />
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="checkout-content">
        {/* Shipping Address */}
        <div className="checkout-section-title">Alamat Pengiriman Usaha</div>
        <div className="checkout-address-card">
          <div className="address-icon-bg">
            <IonIcon icon={locationOutline} />
          </div>
          <div className="address-details">
            <h4 className="address-business-name">{user.businessName} ({user.ownerName})</h4>
            <p className="address-phone">{user.phone}</p>
            <p className="address-text">{user.address}</p>
          </div>
        </div>

        {/* Shipping Methods Selection */}
        <div className="checkout-section-title">Metode Pengiriman</div>
        <IonRadioGroup value={selectedCourier} onIonChange={(e) => setSelectedCourier(e.detail.value)}>
          <div className="shipping-methods-list">
            {SHIPPING_METHODS.map((method) => (
              <div
                key={method.id}
                className={`shipping-method-card ${selectedCourier === method.id ? 'active' : ''}`}
                onClick={() => setSelectedCourier(method.id)}
              >
                <div className="shipping-radio-row">
                  <div className="shipping-info-left">
                    <h4 className="shipping-method-name">{method.name}</h4>
                    <p className="shipping-method-desc">{method.desc}</p>
                  </div>
                  <div className="shipping-info-right">
                    <span className="shipping-method-price">Rp {method.price.toLocaleString('id-ID')}</span>
                    <IonRadio value={method.id} className="custom-radio" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </IonRadioGroup>

        {/* Order Items Summary */}
        <div className="checkout-section-title">Ringkasan Pesanan</div>
        <div className="checkout-items-summary-card">
          {cart.map((item) => (
            <div key={item.product.id} className="summary-item-row">
              <div className="summary-item-img">
                <img src={item.product.image} alt={item.product.name} />
              </div>
              <div className="summary-item-details">
                <h4 className="summary-item-title">{item.product.name}</h4>
                <p className="summary-item-qty">{item.quantity} kg x Rp {item.product.price.toLocaleString('id-ID')}</p>
              </div>
              <div className="summary-item-total">
                Rp {(item.quantity * item.product.price).toLocaleString('id-ID')}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Detail breakdown */}
        <div className="checkout-section-title">Rincian Pembayaran</div>
        <div className="pricing-breakdown-card">
          <div className="breakdown-row">
            <span>Subtotal untuk Produk</span>
            <span>Rp {itemsTotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="breakdown-row">
            <span>Ongkos Pengiriman {isCalculatingOngkir && '(Menghitung...)'}</span>
            <span>Rp {dynamicShippingCost.toLocaleString('id-ID')}</span>
          </div>
          <div className="breakdown-row">
            <span>Biaya Layanan Aplikasi</span>
            <span>Rp {serviceFee.toLocaleString('id-ID')}</span>
          </div>
          <div className="breakdown-row total-row-bold">
            <span>Total Tagihan</span>
            <span className="total-highlight">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>

          <div className="escrow-notice">
            <IonIcon icon={informationCircleOutline} />
            <span>Tumbasna Rekening Bersama (Escrow): Dana Anda dilindungi sistem dan hanya diteruskan ke supplier setelah barang tiba dalam kondisi baik.</span>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ height: '120px' }}></div>
      </IonContent>

      {/* Checkout Footer Actions */}
      <div className="checkout-footer">
        <div className="checkout-footer-amount-column">
          <span className="footer-amount-label">Total Pembayaran</span>
          <span className="footer-amount-val">Rp {totalAmount.toLocaleString('id-ID')}</span>
        </div>
        <IonButton
          color="tertiary"
          className="pay-qris-btn pulse-button"
          onClick={handlePlaceOrder}
        >
          <IonIcon icon={walletOutline} slot="start" />
          Bayar dengan QRIS
        </IonButton>
      </div>
    </IonPage>
  );
};

export default Checkout;
