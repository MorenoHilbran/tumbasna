import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { useApp, Product } from '../context/AppContext';
import './Home.css';

const AI_SLIDES = [
  {
    sub: 'Prediksi Harga Cabai',
    val: 'Naik 12%',
    desc: 'Disarankan untuk stok sekarang',
    badge: 'TUMBASNA AI',
    pill: 'PINTAR',
    img: '/image/produk/cabaimerah.png',
    fallbackImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
    actionText: 'Lihat Analisis'
  },
  {
    sub: 'Prediksi Bawang Merah',
    val: 'Stabil',
    desc: 'Harga diperkirakan stabil minggu ini',
    badge: 'TUMBASNA AI',
    pill: 'INFO',
    img: '/image/produk/bawangmerah.png',
    fallbackImg: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80',
    actionText: 'Lihat Analisis'
  },
  {
    sub: 'Prediksi Bawang Putih',
    val: 'Turun 5%',
    desc: 'Waktu yang tepat untuk stok tambahan',
    badge: 'TUMBASNA AI',
    pill: 'TIPS',
    img: '/image/produk/bawangputih.png',
    fallbackImg: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80',
    actionText: 'Lihat Analisis'
  }
];


interface HomeProps {
  onNavigateToPasar: () => void;
  onNavigateToPesanan: () => void;
  onNavigateToAiChat: () => void;
  onSelectProduct?: (product: Product) => void;
}

const getAiRecommendation = (productName: string) => {
  const nameLower = productName.toLowerCase();
  if (nameLower.includes('cabai')) {
    return { badge: 'Prediksi Naik 12%', cls: 'up' };
  } else if (nameLower.includes('bawang merah')) {
    return { badge: 'Stabil', cls: 'stable' };
  } else if (nameLower.includes('bawang putih')) {
    return { badge: 'Prediksi Turun 5%', cls: 'down' };
  } else if (nameLower.includes('jahe')) {
    return { badge: 'Prediksi Naik 3%', cls: 'up' };
  } else if (nameLower.includes('beras')) {
    return { badge: 'Stabil', cls: 'stable' };
  } else if (nameLower.includes('jagung')) {
    return { badge: 'Prediksi Turun 2%', cls: 'down' };
  } else {
    return { badge: 'Stabil', cls: 'stable' };
  }
};

const Home: React.FC<HomeProps> = ({ onNavigateToPasar, onNavigateToPesanan, onNavigateToAiChat, onSelectProduct }) => {
  const { user, products, addToCart } = useApp();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [cartShake, setCartShake] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % AI_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  return (
    <IonPage>
      <IonContent className="home-root">
        <div className="home-wrap">

          {/* ═══════════════════════════════════════════
              HERO — the entire dark-green zone.
              Dots are INSIDE hero (so they render on green).
              Sheet uses margin-top: -24px to hide
              its rounded top corners behind the hero.
              ═══════════════════════════════════════════ */}
          <div className="hero">
            {/* Warung/UMKM Storefront illustration — background */}
            <div className="illus" aria-hidden="true"></div>

            {/* Header */}
            <div className="hero-head">
              <img src="/logotum.png?v=2" alt="TumbasNa" className="logo-img"/>
              <div className="hero-acts">
                <button className="act-btn" onClick={onNavigateToAiChat} aria-label="Chat">
                  <i className="fa-regular fa-comment-dots"></i>
                </button>
                <button className="act-btn" aria-label="Notifikasi">
                  <i className="fa-solid fa-bell"></i>
                  <span className="n-dot"></span>
                </button>
              </div>
            </div>

            {/* Greeting */}
            <div className="greeting">
              <p className="greet-hi">Selamat Pagi,</p>
              <h1 className="greet-name">{user.ownerName}</h1>
              <div className="greet-loc">
                <i className="fa-solid fa-location-dot"></i>
                <span>{user.address || 'Bantarsoka'}</span>
              </div>
            </div>

            {/* Search */}
            <div className="search-bar" onClick={onNavigateToPasar} role="button">
              <i className="fa-solid fa-magnifying-glass"></i>
              <span>Cari produk atau supplier...</span>
            </div>

            {/* AI Banner — 100% exact split-card design match */}
            <div className="banner-wrap">
              <div className="banner-card">
                {/* Abstract Background Curves */}
                <svg className="banner-bg-curves" viewBox="0 0 300 165" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  <path d="M-20 100 C 60 140, 100 60, 220 110 C 280 130, 320 90, 340 100 L340 180 L-20 180 Z" fill="rgba(255,255,255,0.08)"/>
                  <path d="M-20 70 C 80 120, 120 30, 240 80 C 290 100, 320 70, 340 80 L340 180 L-20 180 Z" fill="rgba(255,255,255,0.04)"/>
                </svg>

                {AI_SLIDES.map((slide, index) => (
                  <div
                    key={index}
                    className={`banner-slide-item ${index === activeSlide ? 'active' : ''}`}
                  >
                    <div className="banner-body">
                      <div className="banner-badge">
                        <span className="b-ico"><i className="fa-solid fa-robot"></i></span>
                        <span className="b-lbl">{slide.badge}</span>
                        <span className="b-pill">{slide.pill}</span>
                      </div>
                      
                      <div className="banner-text-group">
                        <p className="b-sub">{slide.sub}</p>
                        <h2 className="b-val">{slide.val}</h2>
                        <p className="b-desc">{slide.desc}</p>
                      </div>
                      
                      <button className="b-cta" onClick={onNavigateToAiChat}>
                        {slide.actionText}&nbsp;<i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
                    <div className="banner-img-split">
                      <img
                        src={slide.img}
                        alt={slide.sub}
                        className="banner-split-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = slide.fallbackImg;
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots — inside hero so they appear on dark-green background */}
            <div className="dots-row">
              {AI_SLIDES.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === activeSlide ? 'on' : ''}`}
                  onClick={() => setActiveSlide(index)}
                  style={{ cursor: 'pointer' }}
                ></span>
              ))}
            </div>

          </div>
          {/* ═══ end hero ═══ */}

          {/* ═══════════════════════════════════════════
              WHITE CONTENT SHEET
              margin-top: -28px slides it behind the hero,
              creating the rounded-top peek effect.
              z-index: 1 ensures hero renders on top.
              ═══════════════════════════════════════════ */}
          <div className="sheet">

            {/* Quick Menu */}
            <div className="qmenu">
              <button className="qm" onClick={onNavigateToPasar}>
                <span className="qm-box"><i className="fa-solid fa-magnifying-glass"></i></span>
                <span className="qm-lbl">Cari Produk</span>
              </button>
              <button className="qm" onClick={onNavigateToPesanan}>
                <span className="qm-box"><i className="fa-solid fa-box"></i></span>
                <span className="qm-lbl">Pesanan</span>
              </button>
              <button className="qm" onClick={onNavigateToPasar}>
                <span className="qm-box"><i className="fa-solid fa-store"></i></span>
                <span className="qm-lbl">Supplier</span>
              </button>
              <button className="qm" onClick={onNavigateToAiChat}>
                <span className="qm-box"><i className="fa-solid fa-comment-dots"></i></span>
                <span className="qm-lbl">Pesan</span>
              </button>
              <button className="qm">
                <span className="qm-box"><i className="fa-solid fa-chart-column"></i></span>
                <span className="qm-lbl">Laporan</span>
              </button>
            </div>

            {/* Rekomendasi AI */}
            <div className="s-head">
              <h3 className="s-title">Rekomendasi AI</h3>
              <button className="s-link" onClick={onNavigateToPasar}>Lihat Semua</button>
            </div>

            <div className="p-row">
              {products.slice(0, 4).map((product) => {
                const rec = getAiRecommendation(product.name);
                return (
                  <div 
                    key={product.id} 
                    className="p-card" 
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(product);
                      } else {
                        onNavigateToPasar();
                      }
                    }}
                  >
                    <div className="p-img-wrap">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="p-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
                        }}
                      />
                      <button 
                        className="p-fav"
                        onClick={(e) => {
                          e.stopPropagation();
                          setToastMessage(`${product.name} ditambahkan ke Favorit`);
                          setShowToast(true);
                        }}
                      >
                        <i className="fa-regular fa-heart"></i>
                      </button>
                    </div>
                    <div className="p-info">
                      <p className="p-name">{product.name}</p>
                      <p className="p-price">
                        Rp {product.price.toLocaleString('id-ID')} <span className="p-unit">/ kg</span>
                      </p>
                      <div className="p-foot">
                        <span className={`p-badge ${rec.cls}`}>{rec.badge}</span>
                        <button 
                          className="p-add"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product, 1);
                            setToastMessage(`1 kg ${product.name} ditambahkan ke Keranjang`);
                            setShowToast(true);
                            setCartShake(true);
                            setTimeout(() => setCartShake(false), 600);
                          }}
                        >
                          <i className="fa-solid fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Update & Notifikasi */}
            <div className="s-head">
              <h3 className="s-title">Update &amp; Notifikasi</h3>
              <button className="s-link">Lihat Semua</button>
            </div>

            <div className="n-list">
              <div className="n-row" onClick={onNavigateToPesanan}>
                <span className="n-ico green"><i className="fa-solid fa-truck"></i></span>
                <div className="n-body">
                  <div className="n-top">
                    <span className="n-title">Pesanan #TRX-230709-001</span>
                    <span className="n-chip">Sedang Dikirim</span>
                  </div>
                  <span className="n-time">2 jam lalu</span>
                  <p className="n-desc">Supplier Makmur Tani mengirim pesanan Anda</p>
                </div>
              </div>
              <div className="n-row" onClick={onNavigateToAiChat}>
                <span className="n-ico blue"><i className="fa-solid fa-robot"></i></span>
                <div className="n-body">
                  <div className="n-top">
                    <span className="n-title">TumbasNa AI</span>
                  </div>
                  <span className="n-time">5 jam lalu</span>
                  <p className="n-desc">Harga cabai diprediksi naik dalam 3 hari ke depan</p>
                </div>
              </div>
            </div>

          </div>

          {/* FAB Cart */}
          <button 
            className={`fab-cart ${cartShake ? 'shake' : ''}`} 
            onClick={onNavigateToPasar} 
            aria-label="Keranjang"
          >
            <i className="fa-solid fa-cart-shopping"></i>
          </button>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMessage}
            duration={2000}
            position="bottom"
            className="custom-toast"
          />

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
