import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import './Splash.css';

const Splash: React.FC = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Preload logo image
    const img = new Image();
    img.src = '/logotum.png';
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true); // Fallback if image fails
  }, []);

  return (
    <IonPage>
      <IonContent scrollY={false} className="splash-content-wrapper">
        <div className="splash-container">
          
          {/* Glow Orbs */}
          <div className="splash-orb splash-orb-top"></div>
          <div className="splash-orb splash-orb-bottom"></div>

          {/* Floating Leaves */}
          <div className="splash-leaf splash-leaf-1">
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
              <path d="M25 5C15 15 10 25 10 35C10 40 12 45 25 45C38 45 40 40 40 35C40 25 35 15 25 5Z" fill="#8CC63F" opacity="0.3"/>
            </svg>
          </div>
          <div className="splash-leaf splash-leaf-2">
            <svg width="65" height="65" viewBox="0 0 65 65" fill="none">
              <path d="M32 8C20 20 13 33 13 45C13 52 16 58 32 58C48 58 51 52 51 45C51 33 44 20 32 8Z" fill="#F7941D" opacity="0.25"/>
            </svg>
          </div>
          <div className="splash-leaf splash-leaf-3">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C8 8 5 13 5 18C5 21 7 24 14 24C21 24 23 21 23 18C23 13 20 8 14 3Z" fill="#8CC63F" opacity="0.35"/>
            </svg>
          </div>

          {/* Center Content */}
          <div className="splash-content">
            {/* Logo with Glow */}
            <div className="splash-logo-wrapper">
              <div className="splash-logo-glow"></div>
              {imageLoaded ? (
                <img src="/logotum.png" alt="Tumbasna" className="splash-logo" />
              ) : (
                <div className="splash-logo-placeholder"></div>
              )}
            </div>

            {/* Vertical Logo Text */}
            <div className="splash-logo-vertical">
              <h1 className="splash-logo-title">
                Tumbas<span>Na</span>
              </h1>
            </div>

            {/* Ornamental Divider */}
            <div className="splash-divider">
              <div className="splash-divider-line" />
              <div className="splash-divider-diamond" />
              <div className="splash-divider-line" />
            </div>

            {/* Tagline */}
            <p className="splash-tagline">
              Pasar Digital Terpercaya<br />
              untuk <span>UMKM Indonesia</span>
            </p>
          </div>

          {/* Loading Dots */}
          <div className="splash-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>

          {/* Bottom Gradient Fade */}
          <div className="splash-bottom-fade"></div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
