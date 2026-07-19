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
        return prev + 4;
      });
    }, 70);

    return () => clearInterval(timer);
  }, []);

  return (
    <IonPage>
      <IonContent scrollY={false} className="splash-content-wrapper">
        <div className="splash-container">
          
          {/* Main Top/Center Content */}
          <div className="splash-main-content">
            {/* Logo Icon (Cropped to show 3D Shopping Bag Icon only) */}
            <div className="splash-logo-icon-wrap">
              <img src="/logotum.png" alt="TumbasNa Icon" className="splash-logo-img" />
            </div>

            {/* Title */}
            <h1 className="splash-title">
              Tumbas<span>Na</span>
            </h1>

            {/* Diamond Divider */}
            <div className="splash-divider">
              <div className="splash-divider-line"></div>
              <div className="splash-divider-diamond"></div>
              <div className="splash-divider-line"></div>
            </div>

            {/* Tagline */}
            <p className="splash-tagline">
              Pasar Digital Terpercaya<br />
              untuk <span>UMKM Indonesia</span>
            </p>
          </div>

          {/* Bottom Card Progress Area */}
          <div className="splash-bottom-card">
            <div className="splash-progress-track">
              <div
                className="splash-progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="splash-progress-text">
              Memuat pengalaman terbaik untuk Anda...
            </p>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
