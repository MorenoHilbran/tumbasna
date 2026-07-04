import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonToast,
  IonBadge,
  IonItem,
  IonAvatar,
  IonLabel
} from '@ionic/react';
import {
  arrowBackOutline,
  cartOutline,
  locationOutline,
  timeOutline,
  star,
  sparkles,
  trendingUpOutline,
  addOutline,
  removeOutline,
  checkmarkCircleOutline,
  shieldCheckmarkOutline,
  chatbubblesOutline
} from 'ionicons/icons';
import { useApp, Product } from '../context/AppContext';
import './DetailProduk.css';

interface DetailProdukProps {
  product: Product;
  onBack: () => void;
  onNavigateToCart: () => void;
  onNavigateToChat: (supplierName: string, supplierPhone: string) => void;
}

const DetailProduk: React.FC<DetailProdukProps> = ({ product, onBack, onNavigateToCart, onNavigateToChat }) => {
  const { addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Find max price for chart scale
  const prices = product.priceHistory.map((p) => p.price);
  const maxPrice = Math.max(...prices);

  const incrementQty = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setToastMessage(`Berhasil menambahkan ${quantity} kg ${product.name} ke Keranjang`);
    setShowToast(true);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    onNavigateToCart();
  };

  // Custom AI Advice text
  const getAIAdvice = () => {
    const trend = product.priceHistory[5].price > product.priceHistory[4].price ? 'NAIK' : 'TURUN';
    if (trend === 'NAIK') {
      return {
        status: 'Sangat Direkomendasikan Membeli Sekarang',
        text: `Tren harga diprediksi terus MERANGKAK NAIK sebesar 10-15% hingga akhir bulan akibat penurunan curah hujan di wilayah hulu. Membeli saat ini menghemat sekitar Rp${(product.price * 0.12).toFixed(0)}/kg.`,
        color: '#F7941D'
      };
    } else {
      return {
        status: 'Rekomendasi Pembelian Moderat',
        text: 'Tren harga diprediksi stabil turun tipis 3% minggu depan karena panen raya di tingkat lokal mulai merata. Jika kebutuhan mendesak, silakan lakukan pembelian bertahap.',
        color: '#009245'
      };
    }
  };

  const aiAdvice = getAIAdvice();

  return (
    <IonPage>
      {/* Custom Header */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="detail-toolbar">
          <div className="detail-toolbar-inner">
            <button className="detail-back-btn" onClick={onBack}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="detail-logo-row">
              <img src="/logo.png" alt="Tumbasna" className="detail-header-logo-only" />
            </div>
            <div className="detail-right-action">
              <button className="detail-cart-btn" onClick={onNavigateToCart}>
                <IonIcon icon={cartOutline} />
              </button>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="detail-content" fullscreen>
        {/* Large Product Image */}
        <div className="detail-image-container">
          <img src={product.image} alt={product.name} className="detail-large-image" />
          <div className="detail-category-badge">{product.category}</div>
        </div>

        {/* Info Card */}
        <div className="detail-info-sheet">
          <div className="title-price-row">
            <h1 className="detail-title">{product.name}</h1>
            <div className="detail-price-box">
              <span className="detail-price">Rp {product.price.toLocaleString('id-ID')}</span>
              <span className="detail-unit">/kg</span>
            </div>
          </div>

          <div className="stock-rating-row">
            <div className="detail-rating">
              <IonIcon icon={star} />
              <span>{product.supplierRating} Rating Supplier</span>
            </div>
            <div className="detail-stock">
              <span>Stok: <strong>{product.stock} kg tersedia</strong></span>
            </div>
          </div>

          {/* Shipping Info Banner */}
          <div className="delivery-info-grid">
            <div className="delivery-info-item">
              <IonIcon icon={locationOutline} />
              <div>
                <span className="info-label">Asal Komoditas</span>
                <span className="info-val">{product.supplierLocation}</span>
              </div>
            </div>
            <div className="delivery-info-item">
              <IonIcon icon={timeOutline} />
              <div>
                <span className="info-label">Estimasi Tiba</span>
                <span className="info-val">{product.shippingEstimate}</span>
              </div>
            </div>
          </div>

          {/* AI Insight Panel */}
          <div className="ai-insight-panel">
            <div className="ai-insight-header">
              <div className="ai-insight-title">
                <IonIcon icon={sparkles} />
                <span>AI Insight & Tren Harga</span>
              </div>
              <IonBadge color="secondary" className="ai-insight-badge">Active Predictor</IonBadge>
            </div>

            <div className="ai-insight-body">
              {/* Simple Chart */}
              <div className="price-chart-container">
                <div className="price-chart-title">Grafik Tren Harga (6 Bulan Terakhir)</div>
                <div className="chart-bars">
                  {product.priceHistory.map((item, index) => {
                    const heightPercent = (item.price / maxPrice) * 100;
                    return (
                      <div key={index} className="chart-bar-wrapper">
                        <div className="chart-bar-value">Rp {Math.round(item.price / 1000)}k</div>
                        <div
                          className={`chart-bar-fill ${index === 5 ? 'active-fill' : ''}`}
                          style={{ height: `${heightPercent * 0.7}%` }}
                        ></div>
                        <div className="chart-bar-label">{item.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendation Details */}
              <div className="ai-recommendation-details">
                <h4 className="advice-status" style={{ color: aiAdvice.color }}>
                  <IonIcon icon={trendingUpOutline} /> {aiAdvice.status}
                </h4>
                <p className="advice-description">
                  {aiAdvice.text}
                </p>
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div className="detail-section">
            <h3 className="section-subtitle">Deskripsi Produk</h3>
            <p className="detail-desc-text">
              {product.description}
            </p>
          </div>

          {/* Supplier Profile */}
          <div className="detail-section supplier-profile-section">
            <h3 className="section-subtitle">Profil Supplier</h3>
            <div className="supplier-profile-card">
              <IonAvatar className="supplier-avatar">
                <div className="avatar-initial">{product.supplierName.charAt(0)}</div>
              </IonAvatar>
              <div className="supplier-profile-info">
                <h4>{product.supplierName}</h4>
                <p>{product.supplierLocation}</p>
                <div className="supplier-badge-row">
                  <span className="badge-verified">
                    <IonIcon icon={shieldCheckmarkOutline} /> Verified Supplier
                  </span>
                </div>
              </div>
              <button 
                className="chat-supplier-btn"
                onClick={() => onNavigateToChat(product.supplierName, product.supplierPhone || '')}
              >
                <IonIcon icon={chatbubblesOutline} />
                <span>Chat Penjual</span>
              </button>
            </div>
          </div>

          {/* Spacing for floating buttons */}
          <div style={{ height: '80px' }}></div>
        </div>
      </IonContent>

      {/* Sticky Bottom Actions */}
      <div className="detail-bottom-bar">
        <div className="qty-selector">
          <button className="qty-btn" onClick={decrementQty}>
            <IonIcon icon={removeOutline} />
          </button>
          <span className="qty-val">{quantity} <small>kg</small></span>
          <button className="qty-btn" onClick={incrementQty}>
            <IonIcon icon={addOutline} />
          </button>
        </div>

        <div className="action-buttons-wrapper">
          <IonButton
            fill="outline"
            color="primary"
            className="add-cart-btn-full"
            onClick={handleAddToCart}
          >
            <IonIcon icon={cartOutline} slot="start" />
            + Keranjang
          </IonButton>

          <IonButton
            color="tertiary"
            className="buy-now-btn-full"
            onClick={handleBuyNow}
          >
            Beli Sekarang
          </IonButton>
        </div>
      </div>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2500}
        position="bottom"
        className="custom-toast"
      />
    </IonPage>
  );
};

export default DetailProduk;
