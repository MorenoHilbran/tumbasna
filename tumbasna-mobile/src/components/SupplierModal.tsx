import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonAvatar,
  IonCard,
} from '@ionic/react';
import {
  closeOutline,
  locationOutline,
  star,
  shieldCheckmarkOutline,
  cubeOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { useApp, Product } from '../context/AppContext';
import './SupplierModal.css';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierName: string;
  onSelectProduct: (product: Product) => void;
}

const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  supplierName,
  onSelectProduct,
}) => {
  const { products } = useApp();

  // Ambil semua produk dari supplier ini
  const supplierProducts = products.filter((p) => p.supplierName === supplierName);
  
  // Ambil data supplier dari salah satu produknya
  const sampleProduct = supplierProducts[0];
  const supplierLocation = sampleProduct?.supplierLocation || 'Lokasi tidak diketahui';
  const supplierRating = sampleProduct?.supplierRating || 5.0;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="supplier-detail-modal">
      <IonHeader className="ion-no-border">
        <IonToolbar className="supplier-modal-toolbar">
          <IonTitle>Profil Penjual</IonTitle>
          <IonButtons slot="end">
            <button className="close-modal-btn" onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="supplier-modal-content">
        {/* Header Profil Penjual */}
        <div className="supplier-header-banner">
          <div className="supplier-avatar-wrapper">
            <IonAvatar className="modal-supplier-avatar">
              <div className="modal-avatar-initial">{supplierName.charAt(0)}</div>
            </IonAvatar>
            <div className="verified-badge-icon">
              <IonIcon icon={shieldCheckmarkOutline} />
            </div>
          </div>
          
          <h2 className="modal-supplier-name">{supplierName}</h2>
          <p className="modal-supplier-location">
            <IonIcon icon={locationOutline} /> {supplierLocation}
          </p>

          <div className="modal-supplier-stats">
            <div className="stat-badge">
              <IonIcon icon={star} />
              <span>{supplierRating} Rating Toko</span>
            </div>
            <div className="stat-badge total-products">
              <IonIcon icon={cubeOutline} />
              <span>{supplierProducts.length} Komoditas</span>
            </div>
          </div>
        </div>

        {/* Daftar Barang yang Dijual */}
        <div className="supplier-products-section">
          <h3 className="section-title-label">Komoditas yang Dijual</h3>
          
          <div className="supplier-products-list">
            {supplierProducts.map((product) => (
              <div
                key={product.id}
                className="supplier-product-row-card"
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
                }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="row-card-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
                  }}
                />
                
                <div className="row-card-info">
                  <h4 className="row-card-title">{product.name}</h4>
                  <div className="row-card-price-row">
                    <span className="row-card-price">Rp {product.price.toLocaleString('id-ID')}</span>
                    <span className="row-card-unit">/kg</span>
                  </div>
                  <p className="row-card-stock">Stok: <strong>{product.stock} kg</strong></p>
                </div>

                <div className="row-card-action">
                  <IonIcon icon={chevronForwardOutline} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default SupplierModal;
