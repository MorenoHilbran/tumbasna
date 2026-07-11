import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import './Splash.css';

const Splash: React.FC = () => {
  return (
    <IonPage>
      <IonContent scrollY={false} className="splash-content-wrapper">
        <div className="splash-container">

          {/* Deep Forest Background Glow Orbs */}
          <div className="splash-orb splash-orb-top" />
          <div className="splash-orb splash-orb-bottom" />

          {/* Floating Leaf — Top Right */}
          <div className="splash-leaf splash-leaf-1">
            <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="leafG1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8CC63F" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#4a8a20" stopOpacity="0.7" />
                </linearGradient>
              </defs>
              <path d="M50 5 C 85 25, 100 65, 85 100 C 65 125, 25 110, 10 75 C -5 40, 15 5, 50 5 Z" fill="url(#leafG1)" />
              <path d="M50 5 C 48 50, 30 80, 10 75" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
              <path d="M50 5 C 60 45, 75 70, 85 100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
            </svg>
          </div>

          {/* Floating Leaf — Bottom Left */}
          <div className="splash-leaf splash-leaf-2">
            <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="leafG2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#009245" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#005b30" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <path d="M50 5 C 85 25, 100 65, 85 100 C 65 125, 25 110, 10 75 C -5 40, 15 5, 50 5 Z" fill="url(#leafG2)" />
              <path d="M50 5 C 48 50, 30 80, 10 75" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
            </svg>
          </div>

          {/* Floating Leaf — Top Left Small */}
          <div className="splash-leaf splash-leaf-3">
            <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="leafG3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F7941D" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#d4831b" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path d="M50 5 C 85 25, 100 65, 85 100 C 65 125, 25 110, 10 75 C -5 40, 15 5, 50 5 Z" fill="url(#leafG3)" />
            </svg>
          </div>

          {/* Center Content */}
          <div className="splash-content">
            {/* Logo */}
            <div className="splash-logo-wrapper">
              <img src="/logo.png" alt="Tumbasna" className="splash-logo" />
              <div className="splash-logo-glow" />
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

          {/* Bottom Gradient Fade */}
          <div className="splash-bottom-fade" />

          {/* Loading dots */}
          <div className="splash-loading-dots">
            <span />
            <span />
            <span />
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
