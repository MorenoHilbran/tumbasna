import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonButton
} from '@ionic/react';
import {
  businessOutline,
  cardOutline,
  settingsOutline,
  helpCircleOutline,
  logOutOutline,
  shieldCheckmarkOutline,
  chevronForwardOutline,
  walletOutline,
  locationOutline,
  storefrontOutline,
  lockClosedOutline
} from 'ionicons/icons';
import { useApp } from '../context/AppContext';
import './Profil.css';

const Profil: React.FC = () => {
  const { user, logout } = useApp();

  if (!user) return null;

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="profile-toolbar">
          <div className="profile-toolbar-inner">
            <div className="profile-logo-row">
              <img src="/logo.png" alt="Tumbasna" className="profile-header-logo-only" />
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="profile-content">
        {/* User Card Header */}
        <div className="profile-card-header">
          <div className="profile-card-bg-glow"></div>
          
          <div className="profile-header-main">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large">
                {user.ownerName.charAt(0)}
              </div>
              <span className="profile-avatar-badge-check">
                <IonIcon icon={shieldCheckmarkOutline} />
              </span>
            </div>
            
            <div className="profile-header-details">
              <h2 className="profile-user-name">{user.ownerName}</h2>
              <span className="profile-user-email">{user.email}</span>
              <div className="profile-shield-verified">
                <span>Mitra Prioritas</span>
              </div>
            </div>
          </div>

          {/* Business Stats Grid inside Header */}
          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <span className="profile-stat-lbl">BELANJA BULAN INI</span>
              <span className="profile-stat-val">Rp {user.purchasesThisMonth.toLocaleString('id-ID')}</span>
            </div>
            <div className="profile-stat-divider"></div>
            <div className="profile-stat-box">
              <span className="profile-stat-lbl">PESANAN AKTIF</span>
              <span className="profile-stat-val">{user.activeOrdersCount} Aktif</span>
            </div>
          </div>
        </div>

        {/* Business Data Info Card */}
        <div className="profile-section-label">Informasi Usaha</div>
        <div className="profile-info-card">
          <div className="profile-info-item">
            <div className="info-icon-wrapper">
              <IonIcon icon={storefrontOutline} />
            </div>
            <div className="info-text-col">
              <span className="info-lbl">Nama Usaha / UMKM</span>
              <span className="info-val">{user.businessName}</span>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="info-icon-wrapper">
              <IonIcon icon={businessOutline} />
            </div>
            <div className="info-text-col">
              <span className="info-lbl">Jenis Usaha</span>
              <span className="info-val">{user.businessType}</span>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="info-icon-wrapper">
              <IonIcon icon={locationOutline} />
            </div>
            <div className="info-text-col">
              <span className="info-lbl">Alamat Pengiriman Usaha</span>
              <span className="info-val">{user.address}</span>
            </div>
          </div>
        </div>

        {/* Bank & Account Info Card */}
        <div className="profile-section-label">Rekening Pembayaran</div>
        <div className="profile-info-card">
          <div className="profile-info-item">
            <div className="info-icon-wrapper">
              <IonIcon icon={cardOutline} />
            </div>
            <div className="info-text-col">
              <span className="info-lbl">Nama Bank Rekening</span>
              <span className="info-val">{user.bankName}</span>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="info-icon-wrapper">
              <IonIcon icon={walletOutline} />
            </div>
            <div className="info-text-col">
              <span className="info-lbl">Nomor Rekening Tujuan</span>
              <span className="info-val">{user.bankAccount}</span>
            </div>
          </div>
        </div>

        {/* Settings & Help Center Options */}
        <div className="profile-section-label">Pengaturan & Bantuan</div>
        <div className="profile-menu-list">
          <button className="profile-menu-item">
            <div className="menu-left">
              <div className="menu-icon-wrapper settings-bg">
                <IonIcon icon={lockClosedOutline} />
              </div>
              <div className="menu-text-col">
                <span className="menu-title">Akun & Keamanan</span>
                <span className="menu-subtitle">Atur kata sandi & PIN Transaksi</span>
              </div>
            </div>
            <div className="menu-right-col">
              <span className="menu-badge-green">Aman</span>
              <IonIcon icon={chevronForwardOutline} className="menu-arrow" />
            </div>
          </button>

          <button className="profile-menu-item">
            <div className="menu-left">
              <div className="menu-icon-wrapper help-bg">
                <IonIcon icon={helpCircleOutline} />
              </div>
              <div className="menu-text-col">
                <span className="menu-title">Pusat Bantuan</span>
                <span className="menu-subtitle">Hubungi CS & Panduan Penggunaan</span>
              </div>
            </div>
            <div className="menu-right-col">
              <span className="menu-badge-gray">24/7</span>
              <IonIcon icon={chevronForwardOutline} className="menu-arrow" />
            </div>
          </button>
        </div>

        {/* Logout Button */}
        <div className="logout-wrapper">
          <button className="profile-logout-btn" onClick={logout}>
            <IonIcon icon={logOutOutline} />
            <span>Keluar dari Akun</span>
          </button>
        </div>
        
        <div className="app-version-footer">
          <p>Tumbasna Mobile v1.0.0-Agritech</p>
          <p>© 2026 PT Rantai Pangan Nusantara</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profil;
