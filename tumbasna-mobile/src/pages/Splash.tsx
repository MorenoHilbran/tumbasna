import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import './Splash.css';

const Splash: React.FC = () => {
  return (
    <IonPage>
      <IonContent scrollY={false} className="splash-content-wrapper">
        <div className="splash-container">

          {/* Top Logo & Tagline Content */}
          <div className="splash-top-content">
            {/* Vertical Logo */}
            <div className="splash-logo-vertical">
              <div className="splash-logo-icon-wrapper">
                <img src="/logotum.png" alt="Tumbasna Icon" className="splash-logo-icon" />
              </div>
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

          {/* Bottom Card for Loading */}
          <div className="splash-loading-card">
            <div className="splash-progress-bar-container">
              <div className="splash-progress-bar-fill" />
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
