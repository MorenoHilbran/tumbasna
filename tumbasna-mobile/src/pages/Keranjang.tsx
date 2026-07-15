import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonButton,
} from '@ionic/react';
import {
  trashOutline,
  addOutline,
  removeOutline,
  cartOutline,
  arrowBackOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { useApp, CartItem } from '../context/AppContext';
import './Keranjang.css';

interface KeranjangProps {
  onNavigateToPasar: () => void;
  onCheckout: (supplierId: string, supplierItems: CartItem[]) => void;
  onBack: () => void;
}

const Keranjang: React.FC<KeranjangProps> = ({ onNavigateToPasar, onCheckout, onBack }) => {
  const { cart, updateCartQuantity, removeFromCart } = useApp();

  // Group cart items by supplier
  const groupedBySupplier = cart.reduce((acc, item) => {
    const supplierId = item.product.supplierName;
    if (!acc[supplierId]) {
      acc[supplierId] = {
        supplierName: item.product.supplierName,
        supplierCity: item.product.supplierLocation,
        items: []
      };
    }
    acc[supplierId].items.push(item);
    return acc;
  }, {} as Record<string, { supplierName: string; supplierCity: string; items: CartItem[] }>);

  const suppliers = Object.values(groupedBySupplier);

  return (
    <IonPage>
      {/* Header with Back Button */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="cart-toolbar">
          <div className="cart-toolbar-inner">
            <button className="cart-back-btn" onClick={onBack}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <h1 className="cart-header-title">Keranjang Belanja</h1>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="cart-content">
        {cart.length > 0 ? (
          <>
            {/* Group by Supplier Cards */}
            <div className="supplier-groups">
              {suppliers.map((supplier, index) => {
                const supplierTotal = supplier.items.reduce(
                  (acc, item) => acc + item.product.price * item.quantity, 
                  0
                );

                return (
                  <div key={index} className="supplier-card">
                    {/* Supplier Header */}
                    <div className="supplier-header">
                      <div className="supplier-info">
                        <h3 className="supplier-name">{supplier.supplierName}</h3>
                        <p className="supplier-location">{supplier.supplierCity}</p>
                      </div>
                    </div>

                    {/* Items in this supplier */}
                    <div className="supplier-items">
                      {supplier.items.map((item) => (
                        <div key={item.product.id} className="cart-item-card">
                          <div className="cart-item-img-wrapper">
                            <img src={item.product.image} alt={item.product.name} />
                          </div>

                          <div className="cart-item-details">
                            <h3 className="cart-item-name">{item.product.name}</h3>
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

                    {/* Supplier Total & Checkout */}
                    <div className="supplier-footer">
                      <div className="supplier-total">
                        <span>Subtotal ({supplier.items.length} item)</span>
                        <span className="supplier-total-price">Rp {supplierTotal.toLocaleString('id-ID')}</span>
                      </div>
                      <IonButton
                        color="tertiary"
                        expand="block"
                        className="supplier-checkout-btn"
                        onClick={() => onCheckout(supplier.supplierName, supplier.items)}
                      >
                        Lanjut ke Checkout <IonIcon icon={arrowForwardOutline} slot="end" />
                      </IonButton>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Spacing for bottom */}
            <div style={{ height: '40px' }}></div>
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
    </IonPage>
  );
};

export default Keranjang;
