import React, { useState, useEffect } from 'react';
import { IonApp, IonIcon } from '@ionic/react';
import { 
  homeOutline, home, 
  storefrontOutline, storefront, 
  receiptOutline, receipt, 
  chatbubblesOutline, chatbubbles, 
  personOutline, person, 
  cartOutline 
} from 'ionicons/icons';

import { useApp, Product } from './context/AppContext';

import Home from './pages/Home';
import Pasar from './pages/Pasar';
import Pesanan from './pages/Pesanan';
import Chat from './pages/Chat';
import Profil from './pages/Profil';
import Keranjang from './pages/Keranjang';
import Checkout from './pages/Checkout';
import DetailProduk from './pages/DetailProduk';
import DetailPesanan from './pages/DetailPesanan';
import PembayaranQris from './pages/PembayaranQris';
import LoginRegister from './pages/LoginRegister';
import Welcome from './pages/Welcome';

import './MainAppShell.css';

type TabState = 'beranda' | 'pasar' | 'pesanan' | 'chat' | 'profil';
type ViewState = 'tabs' | 'detail_produk' | 'keranjang' | 'checkout' | 'pembayaran_qris' | 'detail_pesanan';

const TABS: { id: TabState; label: string; iconActive: string; iconInactive: string }[] = [
  { id: 'beranda', label: 'Beranda', iconActive: home, iconInactive: homeOutline },
  { id: 'pasar', label: 'Pasar', iconActive: storefront, iconInactive: storefrontOutline },
  { id: 'pesanan', label: 'Pesanan', iconActive: receipt, iconInactive: receiptOutline },
  { id: 'chat', label: 'Chat', iconActive: chatbubbles, iconInactive: chatbubblesOutline },
  { id: 'profil', label: 'Profil', iconActive: person, iconInactive: personOutline },
];

const MainAppShell: React.FC = () => {
  const { user } = useApp();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabState>('beranda');
  const [viewState, setViewState] = useState<ViewState>('tabs');
  
  // Selected Data State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedChatPartner, setSelectedChatPartner] = useState<string | null>(null);

  // Auth Onboarding Navigation State
  const [showWelcome, setShowWelcome] = useState(true);
  const [initialLoginMode, setInitialLoginMode] = useState<'login' | 'register'>('login');

  // Reset tab to beranda on user login or reset onboarding on logout
  useEffect(() => {
    if (user) {
      setActiveTab('beranda');
      setViewState('tabs');
    } else {
      setShowWelcome(true);
    }
  }, [user?.email]);

  // If user is not logged in, show Welcome page or LoginRegister page
  if (!user) {
    if (showWelcome) {
      return (
        <Welcome 
          onGetStarted={(mode) => {
            setInitialLoginMode(mode);
            setShowWelcome(false);
          }} 
        />
      );
    }
    return (
      <LoginRegister 
        initialIsLogin={initialLoginMode === 'login'} 
        onBackToWelcome={() => setShowWelcome(true)} 
      />
    );
  }

  // Render the current sub-page or tab content
  const renderContent = () => {
    switch (viewState) {
      case 'detail_produk':
        if (selectedProduct) {
          return (
            <DetailProduk
              product={selectedProduct}
              onBack={() => setViewState('tabs')}
              onNavigateToCart={() => setViewState('keranjang')}
            />
          );
        }
        setViewState('tabs');
        return null;

      case 'keranjang':
        return (
          <Keranjang
            onNavigateToPasar={() => {
              setViewState('tabs');
              setActiveTab('pasar');
            }}
            onNavigateToCheckout={() => setViewState('checkout')}
          />
        );

      case 'checkout':
        return (
          <Checkout
            onBack={() => setViewState('keranjang')}
            onOrderCreated={(orderId) => {
              setSelectedOrderId(orderId);
              setViewState('pembayaran_qris');
            }}
          />
        );

      case 'pembayaran_qris':
        if (selectedOrderId) {
          return (
            <PembayaranQris
              orderId={selectedOrderId}
              onNavigateToPesanan={() => {
                setViewState('tabs');
                setActiveTab('pesanan');
              }}
              onNavigateToTracking={(id) => {
                setSelectedOrderId(id);
                setViewState('detail_pesanan');
              }}
            />
          );
        }
        setViewState('tabs');
        return null;

      case 'detail_pesanan':
        if (selectedOrderId) {
          return (
            <DetailPesanan
              orderId={selectedOrderId}
              onBack={() => {
                setViewState('tabs');
                setActiveTab('pesanan');
              }}
            />
          );
        }
        setViewState('tabs');
        return null;

      case 'tabs':
      default:
        // Render Active Tab Content
        switch (activeTab) {
          case 'pasar':
            return (
              <Pasar
                onSelectProduct={(product) => {
                  setSelectedProduct(product);
                  setViewState('detail_produk');
                }}
              />
            );
          case 'pesanan':
            return (
              <Pesanan
                onSelectOrder={(id) => {
                  setSelectedOrderId(id);
                  setViewState('detail_pesanan');
                }}
                onNavigateToPayment={(id) => {
                  setSelectedOrderId(id);
                  setViewState('pembayaran_qris');
                }}
              />
            );
          case 'chat':
            return (
              <Chat
                initialPartner={selectedChatPartner}
                onClearInitialPartner={() => setSelectedChatPartner(null)}
              />
            );
          case 'profil':
            return <Profil />;
          case 'beranda':
          default:
            return (
              <Home
                onNavigateToPasar={() => setActiveTab('pasar')}
                onNavigateToPesanan={() => setActiveTab('pesanan')}
                onNavigateToAiChat={() => {
                  setSelectedChatPartner('Tumbasna AI Pintar');
                  setActiveTab('chat');
                  setViewState('tabs');
                }}
              />
            );
        }
    }
  };

  const activeTabIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <IonApp style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Active Screen Area */}
      <div 
        key={`${viewState}-${activeTab}`}
        className="page-transition-wrapper"
        style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%' }}
      >
        {renderContent()}
      </div>

      {/* Global Cart FAB Overlay (only visible on main home/pasar/profile views when cart has items) */}
      {viewState === 'tabs' && (activeTab === 'beranda' || activeTab === 'pasar') && (
        <button className="floating-cart-fab" onClick={() => setViewState('keranjang')}>
          <IonIcon icon={cartOutline} />
        </button>
      )}

      {/* Magic Animated Tab Navigation Bar */}
      {viewState === 'tabs' && (
        <div className="magic-nav">
          <ul className="magic-nav-list">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <li 
                  key={tab.id}
                  className={`magic-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="magic-nav-icon">
                    <IonIcon icon={isActive ? tab.iconActive : tab.iconInactive} />
                  </span>
                  <span className="magic-nav-text">{tab.label}</span>
                </li>
              );
            })}
            
            {/* The animated sliding indicator */}
            <div 
              className="magic-indicator" 
              style={{ transform: `translateX(${activeTabIndex * 100}%)` }}
            >
              <div className="magic-indicator-circle"></div>
            </div>
          </ul>
        </div>
      )}
    </IonApp>
  );
};

export default MainAppShell;
