import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import './Splash.css';

const Splash: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <IonPage>
      <IonContent scrollY={false} className="splash-content-wrapper">
        <div className="splash-container">
          {/* Floating Decorative Leaves */}
          <div className="splash-leaf leaf-top-left">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#6B9B37">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.23,22.75C10.4,17.58 16.58,12 17,8Z" />
              <path d="M2,2C2,2 10,3 16,9C22,15 21,22 21,22C21,22 14,21 8,15C2,9 2,2 2,2Z" />
            </svg>
          </div>
          <div className="splash-leaf leaf-top-right">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="#8CC63F">
              <path d="M2,2C2,2 10,3 16,9C22,15 21,22 21,22C21,22 14,21 8,15C2,9 2,2 2,2Z" />
            </svg>
          </div>
          <div className="splash-leaf leaf-mid-left">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#A4D857">
              <path d="M2,2C2,2 10,3 16,9C22,15 21,22 21,22C21,22 14,21 8,15C2,9 2,2 2,2Z" />
            </svg>
          </div>
          <div className="splash-leaf leaf-mid-right">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#5E8C2B">
              <path d="M2,2C2,2 10,3 16,9C22,15 21,22 21,22C21,22 14,21 8,15C2,9 2,2 2,2Z" />
            </svg>
          </div>

          {/* Top Brand Section */}
          <div className="splash-brand-section">
            {/* Cropped Shopping Bag Logo Icon */}
            <div className="splash-logo-icon-wrapper">
              <img src="/logotum.png" alt="Tumbasna Icon" className="splash-logo-icon" />
            </div>

            {/* Brand Title */}
            <h1 className="splash-brand-title">
              Tumbas<span>Na</span>
            </h1>

            {/* Diamond Line Divider */}
            <div className="splash-divider">
              <span className="splash-divider-line" />
              <span className="splash-divider-diamond">◆</span>
              <span className="splash-divider-line" />
            </div>

            {/* Tagline */}
            <p className="splash-tagline">
              Pasar Digital Terpercaya<br />
              untuk <span>UMKM Indonesia</span>
            </p>
          </div>

          {/* Bottom Background Illustration (spsc.webp) */}
          <div className="splash-illustration" />

          {/* Floating Bottom Card with Progress Bar */}
          <div className="splash-bottom-card">
            <div className="splash-progress-track">
              <div
                className="splash-progress-fill"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <p className="splash-loading-text">
              Memuat pengalaman terbaik untuk Anda...
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
