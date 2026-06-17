import React, { useState } from 'react';
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
  busOutline
} from 'ionicons/icons';
import { useApp } from '../context/AppContext';
import './Home.css';

interface HomeProps {
  onNavigateToPasar: () => void;
  onNavigateToPesanan: () => void;
  onNavigateToAiChat: () => void;
}

const Home: React.FC<HomeProps> = ({ onNavigateToPasar, onNavigateToPesanan, onNavigateToAiChat }) => {
  const { user } = useApp();
  const [activeAiTab, setActiveAiTab] = useState<'tren' | 'supplier' | 'beli'>('tren');

  if (!user) return null;

  return (
    <IonPage>
      <IonContent className="dash-content">
        {/* Top Header Greetings */}
        <div className="dash-header">
          <div className="dash-brand-bar">
            <img src="/logo.png" alt="Tumbasna" className="dash-logo" />
          </div>
          <h1 className="dash-greeting">
            Selamat Pagi, <span className="dash-username-italic">{user.ownerName}</span>
          </h1>
          <div className="dash-location-row">
            <IonIcon icon={locationOutline} className="dash-loc-pin" />
            <span className="dash-location-txt">{user.address ? user.address.toUpperCase() : 'CIANJUR'}</span>
          </div>
        </div>

        {/* 1. Pesanan Terdaftar Card */}
        <div className="dash-active-orders-card">
          <div className="dash-card-left">
            <span className="dash-card-label-gold">PESANAN TERDAFTAR</span>
            <h2 className="dash-card-title-serif">{user.activeOrdersCount} Pesanan Aktif</h2>
            <button className="dash-cta-btn" onClick={onNavigateToPesanan}>
              <IonIcon icon={documentTextOutline} />
              <span>PANTAU STATUS</span>
            </button>
          </div>
          
          {/* Subtle Wireframe Box Overlay */}
          <div className="dash-box-wireframe">
            <IonIcon icon={cubeOutline} />
          </div>
        </div>

        {/* 2. Pengeluaran Bulan Ini Card */}
        <div className="dash-expense-card">
          <div className="dash-expense-icon-wrapper">
            <IonIcon icon={cardOutline} />
          </div>
          <div className="dash-expense-info">
            <span className="dash-expense-lbl">PENGELUARAN BULAN INI</span>
            <h3 className="dash-expense-val">Rp {user.purchasesThisMonth.toLocaleString('id-ID')}</h3>
          </div>
        </div>

        {/* 3. Tumbasna AI Card */}
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
              // Cycle through tabs on refresh click
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
                  <IonIcon icon={alertCircleOutline} className="dash-ai-warn-icon" />
                  <h5>Prediksi Harga Cabai & Kentang</h5>
                </div>
                <p className="dash-ai-inner-text">
                  Harga Kentang Dieng Super diprediksi naik sebesar 12% dalam 7 hari ke depan karena penurunan pasokan regional di Jawa Barat. Disarankan mengamankan stok sekarang via Tani Jaya Mandiri.
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
                  <IonIcon icon={alertCircleOutline} className="dash-ai-warn-icon info-blue" />
                  <h5>Supplier Bawang Putih Terpercaya</h5>
                </div>
                <p className="dash-ai-inner-text">
                  Grosir Bumbu Nusantara di Semarang terpilih sebagai Supplier Terbaik minggu ini dengan tingkat kepuasan 99% dan pengiriman tepat waktu 100%.
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
                  <IonIcon icon={alertCircleOutline} className="dash-ai-warn-icon action-orange" />
                  <h5>Program Beli Bersama Cabai Rawit</h5>
                </div>
                <p className="dash-ai-inner-text">
                  Gabung dengan 4 UMKM lain di Cianjur untuk membeli Cabai Rawit Merah Super dalam jumlah besar untuk mendapatkan potongan harga hingga 20%.
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

        {/* 4. Quick Action Menu Grid */}
        <div className="dash-quick-grid">
          <div className="dash-quick-card" onClick={onNavigateToPasar}>
            <div className="dash-quick-icon-black">
              <IonIcon icon={searchOutline} />
            </div>
            <span className="dash-quick-lbl">CARI PRODUK</span>
          </div>
          <div className="dash-quick-card" onClick={onNavigateToPesanan}>
            <div className="dash-quick-icon-black">
              <IonIcon icon={cubeOutline} />
            </div>
            <span className="dash-quick-lbl">DAFTAR PESANAN</span>
          </div>
        </div>

        {/* 5. Notifikasi & Buletin */}
        <div className="dash-notif-section">
          <div className="dash-notif-header">
            <h3 className="dash-notif-title-serif">Notifikasi & Buletin</h3>
            <span className="dash-notif-archive-btn">ARSIP</span>
          </div>

          <div className="dash-notif-list">
            <div className="dash-notif-item">
              <div className="dash-notif-icon-box gray-bg">
                <IonIcon icon={busOutline} />
              </div>
              <div className="dash-notif-info">
                <h4>Info Supplier Baru</h4>
                <p>Supplier Pupuk Organik tersedia di Cianjur</p>
              </div>
              <IonIcon icon={chevronForwardOutline} className="dash-notif-arrow" />
            </div>

            <div className="dash-notif-item">
              <div className="dash-notif-icon-box pink-bg">
                <IonIcon icon={trendingDownOutline} />
              </div>
              <div className="dash-notif-info">
                <h4>Perubahan Harga Komoditas</h4>
                <p>Harga Cabai Merah turun 5% hari ini</p>
              </div>
              <IonIcon icon={chevronForwardOutline} className="dash-notif-arrow" />
            </div>
          </div>
        </div>

        {/* Extra spacing at the bottom */}
        <div style={{ height: '30px' }}></div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
