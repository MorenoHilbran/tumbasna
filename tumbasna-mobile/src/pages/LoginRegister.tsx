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
  helpCircleOutline
} from 'ionicons/icons';
import { useApp } from '../context/AppContext';
import './LoginRegister.css';

const LoginRegister: React.FC = () => {
  const { login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

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

  return (
    <IonPage>
      {/* Dynamic Header based on Login / Register */}
      <div className="auth-header-bar">
        <button 
          className="auth-header-back-btn" 
          onClick={() => {
            if (!isLogin) {
              setIsLogin(true);
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
          <span className="auth-header-title-centered">Informasi Akun</span>
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
              onClick={() => {
                setToastMessage('Fitur Google Sign-In sedang disiapkan.');
                setShowToast(true);
              }}
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
              <h2 className="register-card-title">Daftar Akun Buyer</h2>

              <form onSubmit={handleAuth} className="register-card-form">
                <div className="reg-input-group">
                  <label className="reg-field-label">Nama Pemilik Usaha / Bisnis</label>
                  <div className="reg-input-wrapper">
                    <input
                      type="text"
                      placeholder="Tani Maju Sejahtera"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
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
                    />
                    <IonIcon icon={mailOutline} className="reg-input-icon" />
                  </div>
                </div>

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

                <div className="reg-input-group">
                  <label className="reg-field-label">Jenis Usaha</label>
                  <div className="reg-select-wrapper">
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="reg-native-select"
                      required
                    >
                      <option value="" disabled>Pilih Kategori Usaha</option>
                      <option value="Rumah Makan / Restoran">Rumah Makan / Restoran</option>
                      <option value="Katering">Katering / Jasa Boga</option>
                      <option value="Warung Sembako / Toko Kelontong">Warung Sembako</option>
                      <option value="Pedagang Sayur Pasar">Pedagang Pasar / Sayur Keliling</option>
                      <option value="Usaha Olahan Makanan">Usaha Olahan Makanan (Home Industry)</option>
                    </select>
                  </div>
                </div>

                <div className="reg-input-group">
                  <label className="reg-field-label">Alamat Lengkap Usaha</label>
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
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="reg-native-select"
                        required
                      >
                        <option value="" disabled>Pilih Bank</option>
                        <option value="Bank Central Asia (BCA)">BCA</option>
                        <option value="Bank Rakyat Indonesia (BRI)">BRI</option>
                        <option value="Bank Mandiri">Mandiri</option>
                        <option value="Bank Negara Indonesia (BNI)">BNI</option>
                      </select>
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
