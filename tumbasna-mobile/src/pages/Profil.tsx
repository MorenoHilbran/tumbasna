import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonButton,
  IonModal,
  IonToast,
  IonButtons
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
  lockClosedOutline,
  closeOutline,
  personOutline,
  mailOutline
} from 'ionicons/icons';
import { useApp } from '../context/AppContext';
import './Profil.css';

const Profil: React.FC = () => {
  const { user, logout, updateProfile } = useApp();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // States Form
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  // Prefill data ketika modal dibuka
  useEffect(() => {
    if (user) {
      setOwnerName(user.ownerName || '');
      setBusinessName(user.businessName || '');
      setBusinessType(user.businessType || '');
      setEmail(user.email || '');
      setAddress(user.address || '');
      setBankName(user.bankName || '');
      setBankAccount(user.bankAccount || '');
    }
  }, [user, showEditModal]);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) {
      setToastMessage('Nama pemilik wajib diisi');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setLoading(true);
    const res = await updateProfile({
      ownerName,
      businessName,
      businessType,
      email,
      address,
      bankName,
      bankAccount
    });
    setLoading(false);

    if (res.success) {
      setToastMessage('Profil Anda berhasil diperbarui!');
      setToastColor('success');
      setShowToast(true);
      setShowEditModal(false);
    } else {
      setToastMessage(res.error || 'Gagal memperbarui profil');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  // Deteksi lokasi GPS & reverse geocoding via OpenStreetMap Nominatim
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setToastMessage('GPS tidak tersedia di perangkat ini');
      setToastColor('danger');
      setShowToast(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'id' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const parts = [
            addr.road,
            addr.village || addr.suburb,
            addr.city_district || addr.county,
            addr.city || addr.town,
            addr.state,
          ].filter(Boolean);
          const readableAddress = parts.join(', ');
          setAddress(readableAddress || data.display_name || '');
          setToastMessage('Lokasi berhasil dideteksi!');
          setToastColor('success');
          setShowToast(true);
        } catch {
          setToastMessage('Gagal mendapatkan nama lokasi. Coba lagi.');
          setToastColor('danger');
          setShowToast(true);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setToastMessage('Izin lokasi ditolak. Aktifkan GPS di pengaturan.');
        setToastColor('danger');
        setShowToast(true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <IonPage>
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
                {(user?.ownerName || 'U').charAt(0)}
              </div>
              <span className="profile-avatar-badge-check">
                <IonIcon icon={shieldCheckmarkOutline} />
              </span>
            </div>
            
            <div className="profile-header-details">
              <h2 className="profile-user-name">{user?.ownerName || 'User'}</h2>
              <span className="profile-user-email">{user.email || 'Belum diatur'}</span>
              <div className="profile-shield-verified">
                <span>Mitra Prioritas</span>
              </div>
            </div>
          </div>

          {/* Business Stats Grid inside Header */}
          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <span className="profile-stat-lbl">BELANJA BULAN INI</span>
              <span className="profile-stat-val">Rp {(user?.purchasesThisMonth || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="profile-stat-divider"></div>
            <div className="profile-stat-box">
              <span className="profile-stat-lbl">PESANAN AKTIF</span>
              <span className="profile-stat-val">{user?.activeOrdersCount || 0} Aktif</span>
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
              <span className="info-val">{user.businessName || 'Belum diatur'}</span>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="info-icon-wrapper">
              <IonIcon icon={businessOutline} />
            </div>
            <div className="info-text-col">
              <span className="info-lbl">Jenis Usaha</span>
              <span className="info-val">{user.businessType || 'Belum diatur'}</span>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="info-icon-wrapper">
              <IonIcon icon={locationOutline} />
            </div>
            <div className="info-text-col">
              <span className="info-lbl">Alamat Pengiriman Usaha</span>
              <span className="info-val">{user.address || 'Belum diatur'}</span>
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
              <span className="info-val">{user.bankName || 'Belum diatur'}</span>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="info-icon-wrapper">
              <IonIcon icon={walletOutline} />
            </div>
            <div className="info-text-col">
              <span className="info-lbl">Nomor Rekening Tujuan</span>
              <span className="info-val">{user.bankAccount || 'Belum diatur'}</span>
            </div>
          </div>
        </div>

        {/* Settings & Help Center Options */}
        <div className="profile-section-label">Pengaturan & Bantuan</div>
        <div className="profile-menu-list">
          <button className="profile-menu-item" onClick={() => setShowEditModal(true)}>
            <div className="menu-left">
              <div className="menu-icon-wrapper settings-bg">
                <IonIcon icon={settingsOutline} />
              </div>
              <div className="menu-text-col">
                <span className="menu-title">Ubah Profil</span>
                <span className="menu-subtitle">Ubah info UMKM, alamat & bank</span>
              </div>
            </div>
            <div className="menu-right-col">
              <span className="menu-badge-green">Atur</span>
              <IonIcon icon={chevronForwardOutline} className="menu-arrow" />
            </div>
          </button>

          <button className="profile-menu-item" onClick={() => window.open('https://wa.me/6285190943468?text=Halo%20Tumbasna,%20saya%20butuh%20bantuan', '_blank')}>`n            <div className="menu-left">`n              <div className="menu-icon-wrapper help-bg">
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

      {/* Modal Edit Profil */}
      <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)} className="edit-profile-modal">
        <IonHeader className="ion-no-border">
          <IonToolbar className="profile-modal-toolbar">
            <div className="modal-title-header">Ubah Profil Mitra</div>
            <IonButtons slot="end">
              <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>
                <IonIcon icon={closeOutline} />
              </button>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="profile-modal-content-area">
          <form onSubmit={handleSave} className="edit-profile-form">
            <div className="form-section-header">Identitas Pemilik & UMKM</div>
            
            <div className="edit-input-group">
              <label>Nama Lengkap Pemilik *</label>
              <div className="input-with-icon">
                <IonIcon icon={personOutline} />
                <input 
                  type="text" 
                  value={ownerName} 
                  onChange={(e) => setOwnerName(e.target.value)} 
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>
            </div>

            <div className="edit-input-group">
              <label>Nama Usaha / Toko</label>
              <div className="input-with-icon">
                <IonIcon icon={storefrontOutline} />
                <input 
                  type="text" 
                  value={businessName} 
                  onChange={(e) => setBusinessName(e.target.value)} 
                  placeholder="Contoh: Toko Sembako Budi"
                />
              </div>
            </div>

            <div className="edit-input-group">
              <label>Jenis Usaha</label>
              <div className="input-with-icon">
                <IonIcon icon={businessOutline} />
                <input 
                  type="text" 
                  value={businessType} 
                  onChange={(e) => setBusinessType(e.target.value)} 
                  placeholder="Contoh: Warung Kelontong / Rumah Makan"
                />
              </div>
            </div>

            <div className="edit-input-group">
              <label>Email</label>
              <div className="input-with-icon">
                <IonIcon icon={mailOutline} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Contoh: budi@gmail.com"
                />
              </div>
            </div>

            <div className="form-section-header">Alamat & Rekening</div>

            <div className="edit-input-group">
              <div className="edit-address-label-row">
                <label>Alamat Lengkap Pengiriman</label>
                <button
                  type="button"
                  className="btn-use-location"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                >
                  <IonIcon icon={locationOutline} />
                  <span>{locating ? 'Mendeteksi...' : 'Lokasi Saat Ini'}</span>
                </button>
              </div>
              <div className="input-with-icon textarea-icon">
                <IonIcon icon={locationOutline} />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Diponegoro No. 12, Magelang Tengah"
                  rows={3}
                />
              </div>
            </div>

            <div className="edit-input-group-row">
              <div className="edit-input-group flex-1">
                <label>Nama Bank</label>
                <div className="input-with-icon">
                  <IonIcon icon={cardOutline} />
                  <input 
                    type="text" 
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)} 
                    placeholder="BCA / Mandiri"
                  />
                </div>
              </div>

              <div className="edit-input-group flex-2">
                <label>Nomor Rekening</label>
                <div className="input-with-icon">
                  <IonIcon icon={walletOutline} />
                  <input 
                    type="text" 
                    value={bankAccount} 
                    onChange={(e) => setBankAccount(e.target.value)} 
                    placeholder="Nomor rekening"
                  />
                </div>
              </div>
            </div>

            <div className="edit-form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => setShowEditModal(false)}
                disabled={loading}
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="save-btn"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastColor}
        position="bottom"
      />
    </IonPage>
  );
};

export default Profil;



