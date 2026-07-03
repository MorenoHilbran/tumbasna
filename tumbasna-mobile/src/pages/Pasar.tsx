import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonChip,
  IonLabel,
  IonIcon,
  IonCard,
  IonButton,
  IonToast,
  IonBadge
} from '@ionic/react';
import {
  funnelOutline,
  locationOutline,
  star,
  cartOutline,
  checkmarkCircleOutline,
  optionsOutline,
  cubeOutline
} from 'ionicons/icons';
import { useApp, Product } from '../context/AppContext';
import './Pasar.css';

interface PasarProps {
  onSelectProduct: (product: Product) => void;
}

const Pasar: React.FC<PasarProps> = ({ onSelectProduct }) => {
  const { products, addToCart } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'semua' | 'termurah' | 'terdekat' | 'terbaru'>('semua');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Filtering and Sorting logic
  const getFilteredProducts = () => {
    let result = [...products];

    // Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.supplierName.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Apply active filters
    if (activeFilter === 'termurah') {
      result.sort((a, b) => a.price - b.price);
    } else if (activeFilter === 'terdekat') {
      // Mock closest supplier sorting based on location strings
      // Magelang/Boyolali is considered closest (12km, 15km), then Brebes (25km), Dieng (30km), Cianjur, Karo
      const locationPriority: { [key: string]: number } = {
        'Selo, Boyolali': 1,
        'Magelang, Jawa Tengah': 2,
        'Brebes, Jawa Tengah': 3,
        'Dieng, Banjarnegara': 4,
        'Cianjur, Jawa Barat': 5,
        'Karo, Sumatera Utara': 6
      };
      result.sort((a, b) => {
        const priorityA = locationPriority[a.supplierLocation] || 99;
        const priorityB = locationPriority[b.supplierLocation] || 99;
        return priorityA - priorityB;
      });
    } else if (activeFilter === 'terbaru') {
      // Sort by newest products (descending id)
      result.sort((a, b) => b.id.localeCompare(a.id));
    }

    return result;
  };

  const handleQuickBuy = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (addedIds.has(product.id)) return; // prevent double-tap
    addToCart(product, 1);
    setToastMessage(`1 kg ${product.name} ditambahkan ke Keranjang`);
    setShowToast(true);

    // Tampilkan state sukses pada tombol selama 1.5 detik
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  };

  const filtered = getFilteredProducts();

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="market-toolbar">
          <div className="market-header-row">
            <div className="market-logo-row">
              <img src="/logo.png" alt="Tumbasna" className="market-header-logo-only" />
            </div>
            <IonIcon icon={optionsOutline} style={{ color: '#006837', fontSize: '22px' }} />
          </div>
        </IonToolbar>

        {/* Search + Filter Area */}
        <div className="market-search-bar">
          <div className="market-search-input">
            <IonIcon icon={funnelOutline} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari cabai, bawang, beras..."
            />
          </div>
        </div>

      </IonHeader>

      {/* Content */}
      <IonContent className="pasar-content">
        {/* Filter chips */}
        <div className="filter-chips-row">
          {(['semua', 'termurah', 'terdekat', 'terbaru'] as const).map((f) => (
            <button
              key={f}
              className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f === 'semua' ? 'Semua' : f === 'termurah' ? 'Harga Termurah' : f === 'terdekat' ? 'Terdekat' : 'Terbaru'}
            </button>
          ))}
        </div>

        <div className="products-grid">
          {filtered.length > 0 ? (
            filtered.map((product) => (
              <IonCard
                key={product.id}
                className="product-card"
                onClick={() => onSelectProduct(product)}
              >
                {/* Image Container with Badges */}
                <div className="product-image-wrapper">
                  <img src={product.image} alt={product.name} className="product-image" />
                  <span className="product-category-badge">{product.category}</span>
                  <div className="product-rating-badge">
                    <IonIcon icon={star} />
                    <span>{product.supplierRating}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="product-info-container">
                  <h3 className="product-title">{product.name}</h3>
                  
                  <div className="product-price-section">
                    <span className="price-value">Rp {product.price.toLocaleString('id-ID')}</span>
                    <span className="price-unit">/kg</span>
                  </div>

                  {/* Stock & Supplier info */}
                  <div className="product-meta-row">
                    <div className="product-meta-item">
                      <IonIcon icon={cubeOutline} />
                      <span>Stok: <strong>{product.stock} kg</strong></span>
                    </div>
                  </div>

                  <div className="product-supplier-info">
                    <h4 className="supplier-name">{product.supplierName}</h4>
                    <p className="supplier-location">
                      <IonIcon icon={locationOutline} /> {product.supplierLocation}
                    </p>
                  </div>

                  <div className="product-action-row">
                    <button
                      className={`buy-now-btn-native ${addedIds.has(product.id) ? 'added' : ''}`}
                      onClick={(e) => handleQuickBuy(e, product)}
                    >
                      <IonIcon icon={addedIds.has(product.id) ? checkmarkCircleOutline : cartOutline} />
                      <span>{addedIds.has(product.id) ? 'Ditambahkan!' : 'Beli'}</span>
                    </button>
                  </div>
                </div>
              </IonCard>
            ))
          ) : (
            <div className="empty-search-container">
              <div className="empty-search-icon">
                <IonIcon icon={funnelOutline} />
              </div>
              <h3>Komoditas Tidak Ditemukan</h3>
              <p>Coba gunakan kata kunci lain atau bersihkan filter pencarian.</p>
            </div>
          )}
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
          className="custom-toast"
        />
      </IonContent>
    </IonPage>
  );
};

export default Pasar;
