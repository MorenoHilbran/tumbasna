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

import { useApp, Product, CartItem } from './context/AppContext';

import Home from './pages/Home';
import Pasar from './pages/Pasar';
import Pesanan from './pages/Pesanan';
import Chat from './pages/Chat';
import Profil from './pages/Profil';
import Keranjang from './pages/Keranjang';
import Checkout from './pages/Checkout';
import DetailProduk from './pages/DetailProduk';
import DetailPesanan from './pages/DetailPesanan';
import OrderDetail from './pages/OrderDetail';
import LoginRegister from './pages/LoginRegister';
import Welcome from './pages/Welcome';
import Splash from './pages/Splash';

import './MainAppShell.css';

type TabState = 'beranda' | 'pasar' | 'pesanan' | 'chat' | 'profil';
type ViewState = 'tabs' | 'detail_produk' | 'keranjang' | 'checkout' | 'order_detail_payment' | 'detail_pesanan';

const TABS: { id: TabState; label: string; iconActive: string; iconInactive: string }[] = [
  { id: 'beranda', label: 'Beranda', iconActive: home, iconInactive: homeOutline },
  { id: 'pasar', label: 'Pasar', iconActive: storefront, iconInactive: storefrontOutline },
  { id: 'pesanan', label: 'Transaksi', iconActive: receipt, iconInactive: receiptOutline },
  { id: 'chat', label: 'Pesan', iconActive: chatbubbles, iconInactive: chatbubblesOutline },
  { id: 'profil', label: 'Profil', iconActive: person, iconInactive: personOutline },
];

const MainAppShell: React.FC = () => {
  const { user, refreshProducts } = useApp();

  const [activeTab, setActiveTab] = useState<TabState>('beranda');
  const [viewState, setViewState] = useState<ViewState>('tabs');
  
  useEffect(() => {
    if (activeTab === 'pasar') {
      refreshProducts();
    }
  }, [activeTab]);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedChatPartner, setSelectedChatPartner] = useState<string | null>(null);
  const [selectedChatPartnerPhone, setSelectedChatPartnerPhone] = useState<string | null>(null);
  
  const [checkoutSupplierId, setCheckoutSupplierId] = useState<string | null>(null);
  const [checkoutSupplierItems, setCheckoutSupplierItems] = useState<CartItem[]>([]);

  const [showSplash, setShowSplash] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [initialLoginMode, setInitialLoginMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      setActiveTab('beranda');
      setViewState('tabs');
    } else {
      setShowWelcome(true);
    }
  }, [user?.phone]);

  if (showSplash) {
    return <Splash />;
  }

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

  const renderContent = () => {
    switch (viewState) {
      case 'detail_produk':
        if (selectedProduct) {
          return (
            <DetailProduk
              product={selectedProduct}
              onBack={() => setViewState('tabs')}
              onNavigateToCart={() => setViewState('keranjang')}
              onNavigateToChat={(supplierName, supplierPhone) => {
                setSelectedChatPartner(supplierName);
                setSelectedChatPartnerPhone(supplierPhone);
                setViewState('tabs');
                setActiveTab('chat');
              }}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          );
        }
        setViewState('tabs');
        return null;

      case 'keranjang':
        return (
          <Keranjang
            onBack={() => setViewState('tabs')}
            onNavigateToPasar={() => {
              setViewState('tabs');
              setActiveTab('pasar');
            }}
            onCheckout={(supplierId, items) => {
              setCheckoutSupplierId(supplierId);
              setCheckoutSupplierItems(items);
              setViewState('checkout');
            }}
          />
        );

      case 'checkout':
        return (
          <Checkout
            onBack={() => setViewState('keranjang')}
            onOrderCreated={(orderId) => {
              setSelectedOrderId(orderId);
              setViewState('order_detail_payment');
            }}
            supplierId={checkoutSupplierId || undefined}
            supplierItems={checkoutSupplierItems.length > 0 ? checkoutSupplierItems : undefined}
          />
        );

      case 'order_detail_payment':
        if (selectedOrderId) {
          return (
            <OrderDetail
              orderId={selectedOrderId}
              onBack={() => {
                setViewState('detail_pesanan');
              }}
              onPaymentSuccess={() => {
                setViewState('tabs');
                setActiveTab('pesanan');
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
              onNavigateToChat={(supplierName) => {
                setSelectedChatPartner(supplierName);
                setViewState('tabs');
                setActiveTab('chat');
              }}
              onNavigateToPayment={() => {
                setViewState('order_detail_payment');
              }}
            />
          );
        }
        setViewState('tabs');
        return null;

      case 'tabs':
      default:
        switch (activeTab) {
          case 'pasar':
            return (
              <Pasar
                onNavigateToCart={() => setViewState('keranjang')}
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
                  setViewState('order_detail_payment');
                }}
              />
            );
          case 'chat':
            return (
              <Chat
                initialPartner={selectedChatPartner}
                initialPartnerPhone={selectedChatPartnerPhone}
                onClearInitialPartner={() => {
                  setSelectedChatPartner(null);
                  setSelectedChatPartnerPhone(null);
                }}
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
                onSelectProduct={(product) => {
                  setSelectedProduct(product);
                  setViewState('detail_produk');
                }}
                onNavigateToChat={() => {
                  setSelectedChatPartner(null);
                  setActiveTab('chat');
                  setViewState('tabs');
                }}
              />
            );
        }
    }
  };

  const pageKey = viewState + '-' + activeTab;
  const navClass = 'bottom-nav-item' + (activeTab === 'active' ? ' active' : '');

  return (
    <IonApp style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div 
        key={pageKey}
        className="page-transition-wrapper"
        style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%' }}
      >
        {renderContent()}
      </div>

      {viewState === 'tabs' && (
        <div className="bottom-nav">
          <ul className="bottom-nav-list">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const itemClass = isActive ? 'bottom-nav-item active' : 'bottom-nav-item';
              return (
                <li 
                  key={tab.id}
                  className={itemClass}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="bottom-nav-icon-wrapper">
                    <IonIcon icon={isActive ? tab.iconActive : tab.iconInactive} className="bottom-nav-icon" />
                  </div>
                  <span className="bottom-nav-text">{tab.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </IonApp>
  );
};

export default MainAppShell;




