import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonItem,
  IonLabel,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonLoading
} from '@ionic/react';
import {
  arrowBackOutline,
  callOutline,
  lockClosedOutline,
  personOutline,
  businessOutline,
  mailOutline,
  mapOutline,
  checkmarkCircleOutline,
  eyeOutline,
  eyeOffOutline,
  helpCircleOutline,
  locationOutline
} from 'ionicons/icons';
import { useGoogleLogin } from '@react-oauth/google';
import { useApp } from '../context/AppContext';
import './LoginRegister.css';

interface LoginRegisterProps {
  initialIsLogin?: boolean;
  onBackToWelcome?: () => void;
}

const LoginRegister: React.FC<LoginRegisterProps> = ({ initialIsLogin = true, onBackToWelcome }) => {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isGoogleRegister, setIsGoogleRegister] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleGetCurrentLocation = async () => {
    setLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true });
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
      if (!res.ok) throw new Error('Gagal memuat alamat');
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        setToastMessage('Lokasi Anda berhasil dideteksi!');
        setShowToast(true);
      } else {
        setAddress(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
      }
    } catch (err: any) {
      setToastMessage(`Gagal mendeteksi lokasi: ${err.message || 'Pastikan izin GPS aktif'}`);
      setShowToast(true);
    } finally {
      setLocating(false);
    }
  };

  // Sync isLogin if initialIsLogin prop changes
  React.useEffect(() => {
    setIsLogin(initialIsLogin);
  }, [initialIsLogin]);

  // Form Fields
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');

  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        if (!phoneOrEmail || !password) {
          setToastMessage('Silakan masukkan nomor telepon/email dan password.');
          setShowToast(true);
          setLoading(false);
          return;
        }
        const success = await login(phoneOrEmail);
        if (success) {
          setToastMessage('Selamat Datang Kembali!');
          setShowToast(true);
        } else {
          setToastMessage('Login gagal. Periksa kembali kredensial Anda.');
          setShowToast(true);
        }
      } else {
        if (!ownerName || !businessName || !phone || !email || !password || !address || !businessType || !bankName || !bankAccount) {
          setToastMessage('Semua kolom pendaftaran wajib diisi.');
          setShowToast(true);
          setLoading(false);
          return;
        }
        const success = await register({
          ownerName,
          businessName,
          phone,
          email,
          address,
          businessType,
          bankName,
          bankAccount
        });
        if (success) {
          setToastMessage('Registrasi berhasil! Silakan masuk dengan akun Anda.');
          setShowToast(true);
          setIsLogin(true);
        }
      }
    } catch (err) {
      setToastMessage('Terjadi kesalahan. Silakan coba lagi.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        // Populate the registration fields from real Google data
        setOwnerName(userInfo.name || '');
        setEmail(userInfo.email || '');
        setPassword('google-oauth-linked');

        setIsGoogleRegister(true);
        setIsLogin(false);
        setToastMessage('Berhasil Otorisasi Google. Silakan lengkapi data usaha Anda.');
        setShowToast(true);
      } catch (err) {
        setToastMessage('Gagal mengambil data dari Google.');
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setToastMessage('Proses login Google dibatalkan atau gagal.');
      setShowToast(true);
    },
  });

  return (
    <IonPage>
      {/* Dynamic Header based on Login / Register */}
      <div className="auth-header-bar">
        <button
          className="auth-header-back-btn"
          onClick={() => {
            if (!isLogin) {
              setIsLogin(true);
            } else if (onBackToWelcome) {
              onBackToWelcome();
            } else {
              setToastMessage('Silakan masuk atau daftar terlebih dahulu.');
              setShowToast(true);
            }
          }}
        >
          <IonIcon icon={arrowBackOutline} />
        </button>
        {isLogin ? (
          <img src="/logo.png" alt="Tumbasna" className="auth-header-logo-centered" />
        ) : (
          <span className="auth-header-title-centered">
            {isGoogleRegister ? 'Lengkapi Profil' : 'Informasi Akun'}
          </span>
        )}
        <div className="auth-header-placeholder"></div>
      </div>

      <IonContent className="auth-content">
        {isLogin ? (
          /* LOGIN SCREEN */
          <form onSubmit={handleAuth} className="login-screen-form">
            <div className="login-welcome-section">
              <h1 className="login-welcome-title">Selamat Datang, Pembeli</h1>
              <p className="login-welcome-subtitle">
                Silakan masuk untuk mulai bertransaksi komoditas pertanian segar bebas cengkeraman tengkulak.
              </p>
            </div>

            <div className="login-field-group">
              <label className="login-field-label">NOMOR HANDPHONE AKTIF</label>
              <div className="login-input-row">
                <span className="login-phone-prefix">+62</span>
                <div className="login-phone-divider"></div>
                <input
                  type="text"
                  placeholder="81234567890"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="login-input-field"
                  required
                />
                <IonIcon icon={callOutline} className="login-field-icon" />
              </div>
            </div>

            <div className="login-field-group">
              <label className="login-field-label">PASSWORD</label>
              <div className="login-input-row">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input-field no-prefix"
                  required
                />
                <IonIcon
                  icon={showPassword ? eyeOffOutline : eyeOutline}
                  className="login-field-icon toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn-dark">
              MASUK KE AKUN ANDA
            </button>

            <div className="login-alternative-separator">
              <div className="sep-line"></div>
              <span className="sep-text">LALUAN ALTERNATIF</span>
              <div className="sep-line"></div>
            </div>

            <button
              type="button"
              className="login-google-btn"
              onClick={() => handleGoogleLogin()}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google"
                className="google-btn-logo"
              />
              <span>OTORISASI DENGAN GOOGLE</span>
            </button>

            <div className="login-register-redirect">
              Belum terdaftar sebagai pedagang?{' '}
              <span className="register-highlight-btn" onClick={() => setIsLogin(false)}>
                Registrasi Akun Baru
              </span>
            </div>

            <div className="login-help-center-wrapper">
              <button
                type="button"
                className="login-help-btn-pill"
                onClick={() => {
                  setToastMessage('Hubungi customer service kami di 0812-3456-7890');
                  setShowToast(true);
                }}
              >
                <IonIcon icon={helpCircleOutline} />
                <span>BUTUH BANTUAN?</span>
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION SCREEN */
          <div className="register-screen-container">
            <div className="register-card-float">
              <div className="register-card-logo-row">
                <img src="/logo.png" alt="Tumbasna" className="register-card-logo" />
              </div>
              <h2 className="register-card-title">
                {isGoogleRegister ? 'Lengkapi Data Usaha' : 'Daftar Akun Buyer'}
              </h2>

              <form onSubmit={handleAuth} className="register-card-form">
                <div className="reg-input-group">
                  <label className="reg-field-label">Nama Pemilik Usaha / Bisnis</label>
                  <div className="reg-input-wrapper">
                    <input
                      type="text"
                      placeholder="Tani Maju Sejahtera"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      readOnly={isGoogleRegister}
                      required
                    />
                    <IonIcon icon={personOutline} className="reg-input-icon" />
                  </div>
                </div>

                <div className="reg-input-group">
                  <label className="reg-field-label">Nama Usaha / UMKM</label>
                  <div className="reg-input-wrapper">
                    <input
                      type="text"
                      placeholder="Contoh: Warung Selera / Katering Berkah"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                    <IonIcon icon={businessOutline} className="reg-input-icon" />
                  </div>
                </div>

                <div className="reg-input-group">
                  <label className="reg-field-label">Nomor Handphone</label>
                  <div className="reg-input-wrapper-phone">
                    <span className="phone-prefix">+62</span>
                    <div className="phone-prefix-divider"></div>
                    <input
                      type="tel"
                      placeholder="81234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="reg-input-group">
                  <label className="reg-field-label">Email (Opsional)</label>
                  <div className="reg-input-wrapper">
                    <input
                      type="email"
                      placeholder="budi.santoso@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      readOnly={isGoogleRegister}
                    />
                    <IonIcon icon={mailOutline} className="reg-input-icon" />
                  </div>
                </div>

                {!isGoogleRegister && (
                  <div className="reg-input-group">
                    <label className="reg-field-label">Password</label>
                    <div className="reg-input-wrapper">
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="reg-input-group">
                  <label className="reg-field-label">Jenis Usaha</label>
                  <div className="reg-select-wrapper">
                    <IonSelect
                      value={businessType}
                      onIonChange={(e) => setBusinessType(e.detail.value)}
                      className="reg-native-select"
                      placeholder="Pilih Kategori Usaha"
                      interface="action-sheet"
                    >
                      <IonSelectOption value="Rumah Makan / Restoran">Rumah Makan / Restoran</IonSelectOption>
                      <IonSelectOption value="Katering">Katering / Jasa Boga</IonSelectOption>
                      <IonSelectOption value="Warung Sembako / Toko Kelontong">Warung Sembako</IonSelectOption>
                      <IonSelectOption value="Pedagang Sayur Pasar">Pedagang Pasar / Sayur Keliling</IonSelectOption>
                      <IonSelectOption value="Usaha Olahan Makanan">Usaha Olahan Makanan (Home Industry)</IonSelectOption>
                    </IonSelect>
                  </div>
                </div>

                <div className="reg-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="reg-field-label" style={{ margin: 0 }}>Alamat Lengkap Usaha</label>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={locating}
                      style={{
                        background: '#f0fdf4',
                        color: '#16a34a',
                        border: '1px solid #dcfce7',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {locating ? 'Mencari...' : (
                        <>
                          <IonIcon icon={locationOutline} style={{ fontSize: '14px' }} />
                          Gunakan Lokasi
                        </>
                      )}
                    </button>
                  </div>
                  <div className="reg-input-wrapper">
                    <input
                      type="text"
                      placeholder="Nama jalan, nomor, kecamatan, kota"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                    <IonIcon icon={mapOutline} className="reg-input-icon" />
                  </div>
                </div>

                <div className="reg-input-grid">
                  <div className="reg-input-group">
                    <label className="reg-field-label">Nama Bank</label>
                    <div className="reg-select-wrapper">
                      <IonSelect
                        value={bankName}
                        onIonChange={(e) => setBankName(e.detail.value)}
                        className="reg-native-select"
                        placeholder="Pilih Bank"
                        interface="action-sheet"
                      >
                        <IonSelectOption value="Bank Central Asia (BCA)">BCA</IonSelectOption>
                        <IonSelectOption value="Bank Rakyat Indonesia (BRI)">BRI</IonSelectOption>
                        <IonSelectOption value="Bank Mandiri">Mandiri</IonSelectOption>
                        <IonSelectOption value="Bank Negara Indonesia (BNI)">BNI</IonSelectOption>
                      </IonSelect>
                    </div>
                  </div>

                  <div className="reg-input-group">
                    <label className="reg-field-label">No. Rekening</label>
                    <div className="reg-input-wrapper">
                      <input
                        type="number"
                        placeholder="Nomor rekening"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <p className="agri-shield-notice-simple">
                  <IonIcon icon={checkmarkCircleOutline} />
                  <span>Data rekening tujuan diperlukan untuk memproses penarikan saldo/refund secara aman.</span>
                </p>

                <button type="submit" className="register-submit-btn-orange">
                  Daftar Sekarang
                </button>

                <div className="register-redirect-back">
                  Sudah punya akun?{' '}
                  <span className="login-highlight-btn" onClick={() => setIsLogin(true)}>
                    Masuk Sekarang
                  </span>
                </div>
              </form>
            </div>
          </div>
        )}

        <IonLoading isOpen={loading} message={'Memproses data...'} />
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

export default LoginRegister;
