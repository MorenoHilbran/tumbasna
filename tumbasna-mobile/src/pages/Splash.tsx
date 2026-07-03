import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import './Splash.css';

const Splash: React.FC = () => {
  return (
    <IonPage>
      <IonContent scrollY={false} className="splash-content-wrapper">
        <div className="splash-container">
          <div className="splash-background-pattern"></div>
          
          {/* Leaves */}
          <div className="splash-leaf splash-leaf-1">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8CC63F" />
                  <stop offset="100%" stopColor="#006837" />
                </linearGradient>
              </defs>
              <path d="M50 0 C 80 20, 100 50, 90 80 C 60 100, 20 80, 10 50 C 0 20, 20 0, 50 0 Z" fill="url(#leafGrad)" />
              <path d="M50 0 C 45 40, 20 60, 10 50" stroke="#009245" strokeWidth="2" fill="none" />
            </svg>
          </div>

          <div className="splash-leaf splash-leaf-2">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0 C 80 20, 100 50, 90 80 C 60 100, 20 80, 10 50 C 0 20, 20 0, 50 0 Z" fill="url(#leafGrad)" />
              <path d="M50 0 C 45 40, 20 60, 10 50" stroke="#009245" strokeWidth="2" fill="none" />
            </svg>
          </div>

          <div className="splash-content">
            <img src="/logo.png" alt="Logo" className="splash-logo" />
            
            <h1 className="splash-brand-text">
              <span className="splash-brand-tumbas">Tumbas</span>
              <span className="splash-brand-na">Na</span>
            </h1>
            
            <div className="splash-divider">
              <div className="splash-divider-left"></div>
              <div className="splash-divider-right"></div>
            </div>
            
            <div className="splash-tagline">
              Pasar Digital Terpercaya <br />
              untuk <span>UMKM Indonesia</span>
            </div>
          </div>

          {/* Bottom Waves */}
          <div className="splash-waves-container">
            {/* Orange Wave */}
            <svg className="splash-wave splash-wave-orange" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="#F7941D" d="M0,192L48,208C96,224,192,256,288,245.3C384,235,480,181,576,144C672,107,768,85,864,106.7C960,128,1056,192,1152,224C1248,256,1344,256,1392,256L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
            {/* Light Green Wave */}
            <svg className="splash-wave splash-wave-green-light" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="#009245" d="M0,224L60,234.7C120,245,240,267,360,250.7C480,235,600,181,720,149.3C840,117,960,107,1080,128C1200,149,1320,203,1380,229.3L1440,256L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
            </svg>
            {/* Dark Green Wave */}
            <svg className="splash-wave splash-wave-green-dark" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="#006837" d="M0,288L80,282.7C160,277,320,267,480,240C640,213,800,171,960,165.3C1120,160,1280,192,1360,208L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
            </svg>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
