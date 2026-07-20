import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import {
  arrowForwardOutline,
  arrowBackOutline
} from 'ionicons/icons';
import './Welcome.css';

interface WelcomeProps {
  onGetStarted: (mode: 'login' | 'register') => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onGetStarted('login');
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <IonPage>
      <IonContent className="welcome-content" scrollY={false}>
        {/* Main layout container */}
        <div className="welcome-layout-container">
          
          {/* Header */}
          <div className="welcome-header">
            {currentSlide > 0 ? (
              <button className="welcome-back-btn" onClick={handlePrev}>
                <IonIcon icon={arrowBackOutline} />
              </button>
            ) : (
              <div className="welcome-header-placeholder"></div>
            )}
            
            <img src="/logo.png" alt="Tumbasna" className="welcome-logo" />
            
            <button className="welcome-skip-btn" onClick={() => onGetStarted('login')}>
              Lewati
            </button>
          </div>

          {/* Slider Body */}
          <div className="welcome-slider-body">
            
            {/* Slide 1: Belanja Langsung */}
            <div className={`welcome-slide-item ${currentSlide === 0 ? 'active' : ''}`}>
              {/* Background SVGs */}
              <svg viewBox="0 0 24 24" className="bg-svg-floating bg-svg-top-left" fill="none">
                <path d="M2 22C2 22 10 18 14 14C18 10 22 2 22 2C22 2 14 6 10 10C6 14 2 22 2 22Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 15L15 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <path d="M12 18C12 18 8 20 6 20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <path d="M18 12C18 12 20 8 20 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              
              <svg viewBox="0 0 24 24" className="bg-svg-floating bg-svg-bottom-right" fill="none">
                <path d="M12 22V12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <path d="M12 12C12 12 15 9 19 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <path d="M12 15C12 15 7 12 5 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <path d="M12 12C12 12 9 6 12 3C15 6 12 12 12 12Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
              </svg>

              <div className="welcome-text-wrapper">
                <span className="slide-eyebrow">BELANJA LANGSUNG</span>
                <h2 className="welcome-slide-title">
                  Segar Dari Kebun, <br />
                  <span className="font-serif-italic title-accent">Langsung ke Dapur Anda</span>
                </h2>
                <p className="welcome-slide-desc">
                  Pasokan cabai, bawang, beras, dan sayuran segar langsung dari petani terbaik dengan jaminan harga transparan.
                </p>
              </div>
            </div>

            {/* Slide 2: Escrow System */}
            <div className={`welcome-slide-item ${currentSlide === 1 ? 'active' : ''}`}>
              {/* Background SVGs */}
              <svg viewBox="0 0 24 24" className="bg-svg-floating bg-svg-top-left" fill="none">
                <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
              </svg>
              
              <svg viewBox="0 0 24 24" className="bg-svg-floating bg-svg-bottom-right" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1" />
                <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>

              <div className="welcome-text-wrapper">
                <span className="slide-eyebrow">KEAMANAN DANA</span>
                <h2 className="welcome-slide-title">
                  Transaksi Tenang, <br />
                  <span className="font-serif-italic title-accent">Uang Dijamin Aman</span>
                </h2>
                <p className="welcome-slide-desc">
                  Dana transaksi ditahan aman di sistem kami dan baru dilepaskan setelah Anda mengonfirmasi barang diterima dengan baik.
                </p>
              </div>
            </div>

            {/* Slide 3: WhatsApp integration */}
            <div className={`welcome-slide-item ${currentSlide === 2 ? 'active' : ''}`}>
              {/* Background SVGs */}
              <svg viewBox="0 0 24 24" className="bg-svg-floating bg-svg-top-left" fill="none">
                <path d="M21 15C21 16.1 20.1 17 19 17H7L3 21V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V15Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
              </svg>
              
              <svg viewBox="0 0 24 24" className="bg-svg-floating bg-svg-bottom-right" fill="none">
                <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.9027 3.59393 15.6683 4.6052 17.1102L3.5 20.5L7.0163 19.467C8.42398 20.4431 10.1454 21 12 21Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
              </svg>

              <div className="welcome-text-wrapper">
                <span className="slide-eyebrow">NOTIFIKASI INSTAN</span>
                <h2 className="welcome-slide-title">
                  Pembaruan Cepat, <br />
                  <span className="font-serif-italic title-accent">Terintegrasi WhatsApp</span>
                </h2>
                <p className="welcome-slide-desc">
                  Terima update pengiriman, bukti bayar QRIS, dan komunikasi langsung dengan supplier otomatis di WhatsApp.
                </p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="welcome-footer">
            <div className="welcome-indicators">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <div 
                  key={index} 
                  className={`welcome-dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                ></div>
              ))}
            </div>

            {currentSlide === totalSlides - 1 ? (
              <div className="welcome-action-buttons">
                <button 
                  className="welcome-btn-primary"
                  onClick={() => onGetStarted('register')}
                >
                  <span>Mulai Belanja Sekarang</span>
                  <IonIcon icon={arrowForwardOutline} />
                </button>
                <button 
                  className="welcome-btn-secondary"
                  onClick={() => onGetStarted('login')}
                >
                  Sudah punya akun? Masuk
                </button>
              </div>
            ) : (
              <button className="welcome-btn-primary" onClick={handleNext}>
                <span>Lanjut</span>
                <IonIcon icon={arrowForwardOutline} />
              </button>
            )}
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Welcome;
