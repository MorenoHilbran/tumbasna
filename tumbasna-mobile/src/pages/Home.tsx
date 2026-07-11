import React, { useState, useMemo } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon
} from '@ionic/react';
import {
  locationOutline,
  documentTextOutline,
  cardOutline,
  sparkles,
  refreshOutline,
  alertCircleOutline,
  arrowForwardOutline,
  searchOutline,
  cubeOutline,
  chatbubbleEllipsesOutline,
  chevronForwardOutline,
  trendingDownOutline,
  busOutline,
  walletOutline,
  bicycleOutline,
  timeOutline,
  chatbubblesOutline,
  trendingUpOutline,
  starOutline,
  peopleOutline,
  checkmarkCircleOutline,
  flashOutline,
} from 'ionicons/icons';
import { useApp } from '../context/AppContext';
import './Home.css';

interface HomeProps {
  onNavigateToPasar: () => void;
  onNavigateToPesanan: () => void;
  onNavigateToAiChat: () => void;
  onNavigateToChat?: () => void;
}

function getDynamicGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

const Home: React.FC<HomeProps> = ({ onNavigateToPasar, onNavigateToPesanan, onNavigateToAiChat, onNavigateToChat }) => {
  const { user, products, orders } = useApp();
  const [activeAiTab, setActiveAiTab] = useState<'tren' | 'supplier' | 'beli'>('tren');

  // ── Compute dynamic stats from orders ─────────────────────────────────────
  const { purchasesThisMonth, activeOrdersCount } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let purchases = 0;
    let activeCount = 0;

    orders.forEach(order => {
      const orderDate = new Date(order.date);
      const isThisMonth = orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      const isCompleted = order.status === 'Selesai';
      const isActive = ['Diproses', 'Dikirim', 'Menunggu Pembayaran'].includes(order.status);

      if (isThisMonth && isCompleted) {
        purchases += order.totalAmount;
      }
      if (isActive) {
        activeCount++;
      }
    });

    // Fallback to user state if orders haven't loaded yet
    if (orders.length === 0 && user) {
      return {
        purchasesThisMonth: user.purchasesThisMonth,
        activeOrdersCount: user.activeOrdersCount,
      };
    }

    return { purchasesThisMonth: purchases, activeOrdersCount: activeCount };
  }, [orders, user]);

  // ── Latest active order for live tracking banner ───────────────────────────
  const latestActiveOrder = useMemo(() => {
    return orders.find(o => ['Diproses', 'Dikirim'].includes(o.status)) || null;
  }, [orders]);

  // ── Dynamic AI recommendations from real products ──────────────────────────
  const aiRecommendations = useMemo(() => {
    const liveProducts = products.length > 0 ? products : [];

    // Tren: find most expensive item (price spike candidate)
    const priciest = [...liveProducts].sort((a, b) => b.price - a.price)[0];
    // Supplier: highest rated
    const bestSupplier = [...liveProducts].sort((a, b) => b.supplierRating - a.supplierRating)[0];
    // Beli: lowest stock (urgent buy)
    const urgentBuy = [...liveProducts].sort((a, b) => a.stock - b.stock)[0];

    return { priciest, bestSupplier, urgentBuy };
  }, [products]);

  // ── Top 5 products for horizontal scroll ──────────────────────────────────
  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => b.supplierRating - a.supplierRating)
      .slice(0, 6);
  }, [products]);

  // ── Dynamic notifications from product data ────────────────────────────────
  const dynamicNotifs = useMemo(() => {
    const notifs = [];
    const liveProducts = products.length > 0 ? products : [];

    // Notif 1: cheapest available product
    const cheapest = [...liveProducts].sort((a, b) => a.price - b.price)[0];
    if (cheapest) {
      notifs.push({
        icon: trendingDownOutline,
        iconBg: 'pink-bg',
        title: `Harga Terbaik: ${cheapest.name}`,
        desc: `Rp ${cheapest.price.toLocaleString('id-ID')}/kg dari ${cheapest.supplierName}`,
      });
    } else {
      notifs.push({
        icon: trendingDownOutline,
        iconBg: 'pink-bg',
        title: 'Perubahan Harga Komoditas',
        desc: 'Harga Cabai Merah turun 5% hari ini',
      });
    }

    // Notif 2: newest supplier (last product added)
    const newest = liveProducts[0];
    if (newest) {
      notifs.push({
        icon: busOutline,
        iconBg: 'gray-bg',
        title: `Supplier Baru: ${newest.supplierName}`,
        desc: `Menjual ${newest.name} dari ${newest.supplierLocation}`,
      });
    } else {
      notifs.push({
        icon: busOutline,
        iconBg: 'gray-bg',
        title: 'Info Supplier Baru',
        desc: 'Supplier Pupuk Organik tersedia di Cianjur',
      });
    }

    return notifs;
  }, [products]);

  if (!user) return null;

  const greeting = getDynamicGreeting();

  return (
    <IonPage>
      <IonContent className="dash-content">
        {/* Top Header Greetings */}
        <div className="dash-header">
          <div className="dash-brand-bar">
            <img src="/logo.png" alt="Tumbasna" className="dash-logo" />
          </div>
          <h1 className="dash-greeting">
            {greeting}, <span className="dash-username-italic">{user.ownerName}</span>
          </h1>
          <div className="dash-location-row">
            <IonIcon icon={locationOutline} className="dash-loc-pin" />
            <span className="dash-location-txt">{user.address ? user.address.toUpperCase() : 'CIANJUR'}</span>
          </div>
        </div>

        {/* LIVE ORDER TRACKING BANNER — hanya muncul jika ada pesanan aktif */}
        {latestActiveOrder && (
          <div className="dash-live-order-banner" onClick={onNavigateToPesanan}>
            <div className="dash-live-order-left">
              <div className="dash-live-pulse-dot" />
              <div className="dash-live-order-info">
                <span className="dash-live-order-status">
                  {latestActiveOrder.status === 'Dikirim' ? '🚚 Sedang Dikirim' : '⚙️ Sedang Diproses'}
                </span>
                <span className="dash-live-order-id">Pesanan {latestActiveOrder.id}</span>
                <span className="dash-live-order-supplier">via {latestActiveOrder.courier}</span>
              </div>
            </div>
            <div className="dash-live-order-cta">
              <span>LACAK</span>
              <IonIcon icon={chevronForwardOutline} />
            </div>
          </div>
        )}

        {/* 1. Stats Row: Pesanan Aktif + Saldo */}
        <div className="dash-stats-row">
          {/* Pesanan Aktif Card */}
          <div className="dash-active-orders-card" onClick={onNavigateToPesanan}>
            <div className="dash-card-left">
              <span className="dash-card-label-gold">PESANAN TERDAFTAR</span>
              <h2 className="dash-card-title-serif">{activeOrdersCount} Aktif</h2>
              <button className="dash-cta-btn" onClick={(e) => { e.stopPropagation(); onNavigateToPesanan(); }}>
                <IonIcon icon={documentTextOutline} />
                <span>PANTAU STATUS</span>
              </button>
            </div>
            <div className="dash-box-wireframe">
              <IonIcon icon={cubeOutline} />
            </div>
          </div>

          {/* Saldo & Pengeluaran Column */}
          <div className="dash-right-stats-col">
            {/* Saldo Card */}
            <div className="dash-stat-mini-card saldo-card">
              <div className="dash-stat-mini-icon">
                <IonIcon icon={walletOutline} />
              </div>
              <div className="dash-stat-mini-info">
                <span className="dash-stat-mini-lbl">SALDO</span>
                <span className="dash-stat-mini-val">Rp {user.balance.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Pengeluaran Card */}
            <div className="dash-stat-mini-card expense-card">
              <div className="dash-stat-mini-icon expense-icon">
                <IonIcon icon={cardOutline} />
              </div>
              <div className="dash-stat-mini-info">
                <span className="dash-stat-mini-lbl">BULAN INI</span>
                <span className="dash-stat-mini-val">Rp {purchasesThisMonth.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Quick Action Menu Grid — 4 items */}
        <div className="dash-quick-grid">
          <div className="dash-quick-card" onClick={onNavigateToPasar}>
            <div className="dash-quick-icon-black">
              <IonIcon icon={searchOutline} />
            </div>
            <span className="dash-quick-lbl">PASAR</span>
          </div>
          <div className="dash-quick-card" onClick={onNavigateToPesanan}>
            <div className="dash-quick-icon-black">
              <IonIcon icon={cubeOutline} />
            </div>
            <span className="dash-quick-lbl">PESANAN</span>
          </div>
          <div className="dash-quick-card" onClick={onNavigateToAiChat}>
            <div className="dash-quick-icon-black ai-icon">
              <IonIcon icon={sparkles} />
            </div>
            <span className="dash-quick-lbl">TANYA AI</span>
          </div>
          <div className="dash-quick-card" onClick={onNavigateToChat ?? onNavigateToAiChat}>
            <div className="dash-quick-icon-black chat-icon">
              <IonIcon icon={chatbubblesOutline} />
            </div>
            <span className="dash-quick-lbl">SUPPLIER</span>
          </div>
        </div>

        {/* 3. Top Products Horizontal Scroll */}
        {topProducts.length > 0 && (
          <div className="dash-products-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Komoditas Populer</h3>
              <span className="dash-section-see-all" onClick={onNavigateToPasar}>LIHAT SEMUA</span>
            </div>
            <div className="dash-products-scroll">
              {topProducts.map((product) => (
                <div key={product.id} className="dash-product-card" onClick={onNavigateToPasar}>
                  <div className="dash-product-img-wrapper">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="dash-product-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=70';
                      }}
                    />
                    <div className="dash-product-rating-badge">
                      <IonIcon icon={starOutline} />
                      <span>{product.supplierRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="dash-product-card-body">
                    <span className="dash-product-name">{product.name}</span>
                    <span className="dash-product-price">Rp {product.price.toLocaleString('id-ID')}/kg</span>
                    <span className="dash-product-stock">
                      {product.stock > 0 ? `Stok: ${product.stock} kg` : 'Stok Habis'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Tumbasna AI Card — Dinamis */}
        <div className="dash-ai-container-card">
          <div className="dash-ai-header">
            <div className="dash-ai-brand-col">
              <div className="dash-ai-logo-black">
                <IonIcon icon={sparkles} />
              </div>
              <div className="dash-ai-brand-text">
                <div className="dash-ai-title-row">
                  <h4>TUMBASNA AI</h4>
                  <span className="dash-ai-badge-pintar">PINTAR</span>
                </div>
                <p className="dash-ai-subtext">Rekomendasi Rantai Pasok UMKM</p>
              </div>
            </div>
            <button className="dash-ai-refresh-btn" onClick={() => {
              if (activeAiTab === 'tren') setActiveAiTab('supplier');
              else if (activeAiTab === 'supplier') setActiveAiTab('beli');
              else setActiveAiTab('tren');
            }}>
              <IonIcon icon={refreshOutline} />
            </button>
          </div>

          {/* AI Segment Tabs */}
          <div className="dash-ai-tabs-row">
            <button
              className={`dash-ai-tab-btn ${activeAiTab === 'tren' ? 'active' : ''}`}
              onClick={() => setActiveAiTab('tren')}
            >
              Tren Harga
            </button>
            <button
              className={`dash-ai-tab-btn ${activeAiTab === 'supplier' ? 'active' : ''}`}
              onClick={() => setActiveAiTab('supplier')}
            >
              Supplier Terbaik
            </button>
            <button
              className={`dash-ai-tab-btn ${activeAiTab === 'beli' ? 'active' : ''}`}
              onClick={() => setActiveAiTab('beli')}
            >
              Beli Bersama
            </button>
          </div>

          {/* Inner Recommendation Card */}
          <div className="dash-ai-inner-card">
            {activeAiTab === 'tren' && (
              <>
                <div className="dash-ai-inner-title-row">
                  <IonIcon icon={trendingUpOutline} className="dash-ai-warn-icon" />
                  <h5>
                    {aiRecommendations.priciest
                      ? `Pantau Harga: ${aiRecommendations.priciest.name}`
                      : 'Prediksi Harga Komoditas'}
                  </h5>
                </div>
                <p className="dash-ai-inner-text">
                  {aiRecommendations.priciest
                    ? `${aiRecommendations.priciest.name} dari ${aiRecommendations.priciest.supplierLocation} saat ini dihargai Rp ${aiRecommendations.priciest.price.toLocaleString('id-ID')}/kg. Pantau perubahan harga secara berkala dan amankan stok sebelum harga naik lebih tinggi.`
                    : 'Harga Kentang Dieng Super diprediksi naik sebesar 12% dalam 7 hari ke depan karena penurunan pasokan regional di Jawa Barat. Disarankan mengamankan stok sekarang via Tani Jaya Mandiri.'}
                </p>
                <button className="dash-ai-inner-cta-btn" onClick={onNavigateToPasar}>
                  <span>BELI KOMODITAS SEKARANG</span>
                  <IonIcon icon={arrowForwardOutline} />
                </button>
              </>
            )}

            {activeAiTab === 'supplier' && (
              <>
                <div className="dash-ai-inner-title-row">
                  <IonIcon icon={starOutline} className="dash-ai-warn-icon info-blue" />
                  <h5>
                    {aiRecommendations.bestSupplier
                      ? `Supplier Terpercaya: ${aiRecommendations.bestSupplier.supplierName}`
                      : 'Supplier Komoditas Terpercaya'}
                  </h5>
                </div>
                <p className="dash-ai-inner-text">
                  {aiRecommendations.bestSupplier
                    ? `${aiRecommendations.bestSupplier.supplierName} dari ${aiRecommendations.bestSupplier.supplierLocation} terpilih sebagai Supplier Terbaik minggu ini dengan rating ${aiRecommendations.bestSupplier.supplierRating.toFixed(1)}/5. Menjual ${aiRecommendations.bestSupplier.name} dengan harga Rp ${aiRecommendations.bestSupplier.price.toLocaleString('id-ID')}/kg.`
                    : 'Grosir Bumbu Nusantara di Semarang terpilih sebagai Supplier Terbaik minggu ini dengan tingkat kepuasan 99% dan pengiriman tepat waktu 100%.'}
                </p>
                <button className="dash-ai-inner-cta-btn" onClick={onNavigateToPasar}>
                  <span>KUNJUNGI SUPPLIER</span>
                  <IonIcon icon={arrowForwardOutline} />
                </button>
              </>
            )}

            {activeAiTab === 'beli' && (
              <>
                <div className="dash-ai-inner-title-row">
                  <IonIcon icon={peopleOutline} className="dash-ai-warn-icon action-orange" />
                  <h5>
                    {aiRecommendations.urgentBuy
                      ? `Program Beli Bersama: ${aiRecommendations.urgentBuy.name}`
                      : 'Program Beli Bersama'}
                  </h5>
                </div>
                <p className="dash-ai-inner-text">
                  {aiRecommendations.urgentBuy
                    ? `Stok ${aiRecommendations.urgentBuy.name} dari ${aiRecommendations.urgentBuy.supplierName} tinggal ${aiRecommendations.urgentBuy.stock} kg. Gabung dengan UMKM lain di wilayah Anda untuk membeli dalam jumlah besar dan dapatkan potongan harga hingga 20%.`
                    : 'Gabung dengan 4 UMKM lain di Cianjur untuk membeli Cabai Rawit Merah Super dalam jumlah besar untuk mendapatkan potongan harga hingga 20%.'}
                </p>
                <button className="dash-ai-inner-cta-btn" onClick={onNavigateToPasar}>
                  <span>GABUNG KELOMPOK</span>
                  <IonIcon icon={arrowForwardOutline} />
                </button>
              </>
            )}
          </div>

          {/* Bottom Q&A Footer */}
          <div className="dash-ai-qa-footer">
            <div className="dash-ai-qa-left">
              <IonIcon icon={chatbubbleEllipsesOutline} className="dash-ai-bot-icon" />
              <span>Punya pertanyaan strategis bisnis kuliner mendalam?</span>
            </div>
            <button className="dash-ai-qa-btn" onClick={onNavigateToAiChat}>TANYA AI</button>
          </div>
        </div>

        {/* 5. Notifikasi & Buletin — Dinamis */}
        <div className="dash-notif-section">
          <div className="dash-notif-header">
            <h3 className="dash-notif-title-serif">Notifikasi & Buletin</h3>
            <span className="dash-notif-archive-btn">ARSIP</span>
          </div>

          <div className="dash-notif-list">
            {dynamicNotifs.map((notif, idx) => (
              <div key={idx} className="dash-notif-item">
                <div className={`dash-notif-icon-box ${notif.iconBg}`}>
                  <IonIcon icon={notif.icon} />
                </div>
                <div className="dash-notif-info">
                  <h4>{notif.title}</h4>
                  <p>{notif.desc}</p>
                </div>
                <IonIcon icon={chevronForwardOutline} className="dash-notif-arrow" />
              </div>
            ))}

            {/* Order summary notif jika ada pesanan */}
            {activeOrdersCount > 0 && (
              <div className="dash-notif-item" onClick={onNavigateToPesanan}>
                <div className="dash-notif-icon-box green-bg">
                  <IonIcon icon={checkmarkCircleOutline} />
                </div>
                <div className="dash-notif-info">
                  <h4>Pesanan Sedang Berjalan</h4>
                  <p>{activeOrdersCount} pesanan aktif sedang diproses. Ketuk untuk pantau.</p>
                </div>
                <IonIcon icon={chevronForwardOutline} className="dash-notif-arrow" />
              </div>
            )}
          </div>
        </div>

        {/* Extra spacing at the bottom */}
        <div style={{ height: '30px' }}></div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
