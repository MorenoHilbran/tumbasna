import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButton,
  IonCard,
  IonToast,
  IonItem,
  IonList,
  IonLabel,
  IonThumbnail
} from '@ionic/react';
import {
  trashOutline,
  addOutline,
  removeOutline,
  cartOutline,
  arrowForwardOutline,
  walletOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { useApp, CartItem } from '../context/AppContext';
import './Keranjang.css';

interface KeranjangProps {
  onNavigateToPasar: () => void;
  onNavigateToCheckout: () => void;
}

const Keranjang: React.FC<KeranjangProps> = ({ onNavigateToPasar, onNavigateToCheckout }) => {
  const { cart, updateCartQuantity, removeFromCart } = useApp();

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="cart-toolbar">
          <div className="cart-toolbar-inner">
            <div className="cart-logo-row">
              <img src="/logo.png" alt="Tumbasna" className="cart-header-logo-only" />
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="cart-content">
        {cart.length > 0 ? (
          <>
            {/* Safe transaction banner */}
            <div className="safe-badge-banner">
              <IonIcon icon={shieldCheckmarkOutline} />
              <span>Transaksi Dijamin Aman: Dana ditahan hingga barang Anda terima.</span>
            </div>

            {/* List of Cart Items */}
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.product.id} className="cart-item-card">
                  <div className="cart-item-img-wrapper">
                    <img src={item.product.image} alt={item.product.name} />
                  </div>

                  <div className="cart-item-details">
                    <h3 className="cart-item-name">{item.product.name}</h3>
                    <p className="cart-item-supplier">{item.product.supplierName}</p>
                    <div className="cart-item-price">Rp {item.product.price.toLocaleString('id-ID')}/kg</div>
                    
                    <div className="cart-item-actions-row">
                      {/* Quantity Modifier */}
                      <div className="cart-qty-selector">
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        >
                          <IonIcon icon={removeOutline} />
                        </button>
                        <span className="cart-qty-val">{item.quantity} kg</span>
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        >
                          <IonIcon icon={addOutline} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        className="cart-delete-btn"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <IonIcon icon={trashOutline} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Spacing for floating footer */}
            <div style={{ height: '180px' }}></div>
          </>
        ) : (
          /* Empty State */
          <div className="empty-cart-container">
            <div className="empty-cart-illustration">
              <IonIcon icon={cartOutline} />
            </div>
            <h2>Keranjang Anda Kosong</h2>
            <p>Anda belum menambahkan komoditas pangan apapun ke dalam keranjang belanja.</p>
            <IonButton
              color="primary"
              className="start-shopping-btn"
              onClick={onNavigateToPasar}
            >
              Mulai Cari Komoditas
            </IonButton>
          </div>
        )}
      </IonContent>

      {/* Floating Summary Footer */}
      {cart.length > 0 && (
        <div className="cart-footer">
          <div className="cart-summary-row">
            <div className="summary-label">
              <span>Subtotal Pembelian</span>
              <p>({cart.length} Komoditas)</p>
            </div>
            <div className="summary-value">
              Rp {subtotal.toLocaleString('id-ID')}
            </div>
          </div>

          <IonButton
            color="tertiary"
            expand="block"
            className="checkout-btn pulse-button"
            onClick={onNavigateToCheckout}
          >
            Lanjut ke Checkout <IonIcon icon={arrowForwardOutline} slot="end" />
          </IonButton>
        </div>
      )}
    </IonPage>
  );
};

export default Keranjang;
