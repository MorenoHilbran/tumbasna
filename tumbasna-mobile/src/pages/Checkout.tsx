import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonButton,
  IonRadioGroup,
  IonRadio,
  IonSpinner
} from '@ionic/react';
import {
  arrowBackOutline,
  locationOutline,
  walletOutline,
  informationCircleOutline,
  locateOutline,
  mapOutline,
  checkmarkCircle,
  searchOutline,
  navigateOutline
} from 'ionicons/icons';
import { useApp } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Checkout.css';

interface CheckoutProps {
  onBack: () => void;
  onOrderCreated: (orderId: string) => void;
}

// Helper: Haversine
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SHIPPING_METHODS = [
  { id: 'kurir-lokal', name: 'Kurir Lokal (L300 / Pribadi)', price: 0, desc: 'Tarif ongkir dinegosiasikan dengan supplier' },
  { id: 'ekspedisi', name: 'Ekspedisi Logistik Kilat (Next Day)', price: 25000, desc: 'Estimasi tiba dalam 2-3 Hari' },
  { id: 'cod', name: 'Cash on Delivery (COD - Sesuai Ketentuan)', price: 0, desc: 'Bayar ongkos kirim saat barang tiba (Rp 0 di sistem)' }
];

// Component Map Event
const MapController = ({ center, onMoveEnd }: { center: [number, number], onMoveEnd: (pos: [number, number]) => void }) => {
  const map = useMapEvents({
    moveend() {
      const c = map.getCenter();
      onMoveEnd([c.lat, c.lng]);
    }
  });

  React.useEffect(() => {
    const current = map.getCenter();
    const dist = map.distance(current, center);
    if (dist > 10) { // If distance > 10 meters, it was changed externally (Search/GPS)
      map.setView(center, 16, { animate: true });
    }
  }, [center, map]);

  return null;
};

const Checkout: React.FC<CheckoutProps> = ({ onBack, onOrderCreated }) => {
  const { cart, user, checkout } = useApp();
  
  // Workflow States
  const [step, setStep] = useState<'prompt' | 'map' | 'summary'>('prompt');
  
  // Location States
  const [buyerCoords, setBuyerCoords] = useState<[number, number]>([-7.4705, 110.2178]); // Default mock (Magelang)
  const [buyerAddressLabel, setBuyerAddressLabel] = useState('');
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Summary States
  const [selectedCourier, setSelectedCourier] = useState(SHIPPING_METHODS[0].id);
  const [dynamicShippingCost, setDynamicShippingCost] = useState(SHIPPING_METHODS[0].price);
  const [isCalculatingOngkir, setIsCalculatingOngkir] = useState(false);
  
  // COD Radius States
  const [codAvailable, setCodAvailable] = useState(true);
  const [distanceInfo, setDistanceInfo] = useState('Mendeteksi jarak lokasi...');

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!user || cart.length === 0) return null;

  const itemsTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const activeShipping = SHIPPING_METHODS.find((m) => m.id === selectedCourier) || SHIPPING_METHODS[0];

  // =================================================================
  // 1. LOCATION STEP HANDLERS
  // =================================================================

  const handleUseProfileAddress = () => {
    setBuyerAddressLabel(`${user.businessName} (${user.address})`);
    // Mock coord based on profile
    setBuyerCoords([-7.4705, 110.2178]); 
    setStep('summary');
  };

  const handleGetGpsAndShowMap = async () => {
    setIsGettingGps(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true });
      });
      setBuyerCoords([position.coords.latitude, position.coords.longitude]);
    } catch (err: any) {
      alert("Gagal mengambil GPS (" + err.message + "). Pastikan izin lokasi aktif.");
    } finally {
      setIsGettingGps(false);
      setStep('map');
    }
  };

  const handleConfirmMapLocation = () => {
    setBuyerAddressLabel('Lokasi Peta (Pin yang dipilih)');
    setStep('summary');
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (res: any) => {
    setBuyerCoords([parseFloat(res.lat), parseFloat(res.lon)]);
    setBuyerAddressLabel(res.display_name);
    setStep('map');
  };

  // =================================================================
  // 2. CHECKOUT SUMMARY EFFECTS
  // =================================================================

  useEffect(() => {
    if (step !== 'summary') return;
    
    const checkDistance = async () => {
      const supplierLocationStr = cart[0]?.product.supplierLocation;
      if (!supplierLocationStr) return;

      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(supplierLocationStr)}`);
        const geoData = await geoRes.json();
        
        if (geoData && geoData.length > 0) {
          const supplierLat = parseFloat(geoData[0].lat);
          const supplierLng = parseFloat(geoData[0].lon);

          const dist = haversineKm(buyerCoords[0], buyerCoords[1], supplierLat, supplierLng);
          
          if (dist <= 20) {
            setCodAvailable(true);
            setDistanceInfo(`Jarak ke supplier: ${dist.toFixed(1)} km (COD Tersedia)`);
          } else {
            setCodAvailable(false);
            setDistanceInfo(`Jarak ke supplier: ${dist.toFixed(1)} km (> 20km, COD tidak tersedia)`);
            if (selectedCourier === 'cod') {
              setSelectedCourier('ekspedisi');
            }
          }
        } else {
          setDistanceInfo('Gagal melacak lokasi supplier.');
        }
      } catch (err) {
        setDistanceInfo('Gagal menghitung jarak.');
      }
    };
    checkDistance();
  }, [step, cart, buyerCoords, selectedCourier]);

  useEffect(() => {
    if (step !== 'summary') return;

    const fetchShipping = async () => {
      setIsCalculatingOngkir(true);
      try {
        const totalWeightGrams = cart.reduce((acc, item) => acc + (item.quantity * 1000), 0);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/shipping/cost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courier: selectedCourier, weight: totalWeightGrams })
        });
        const data = await res.json();
        if (data.success) {
          setDynamicShippingCost(data.cost);
        } else {
          setDynamicShippingCost(activeShipping.price);
        }
      } catch {
        setDynamicShippingCost(activeShipping.price);
      } finally {
        setIsCalculatingOngkir(false);
      }
    };
    fetchShipping();
  }, [selectedCourier, cart, activeShipping.price, step]);

  const serviceFee = 2000;
  const totalAmount = itemsTotal + dynamicShippingCost + serviceFee;

  const handlePlaceOrder = async () => {
    const orderId = await checkout(activeShipping.name, dynamicShippingCost);
    if (orderId) {
      onOrderCreated(orderId);
    }
  };

  const availableMethods = SHIPPING_METHODS.filter(m => m.id !== 'cod' || codAvailable);

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="checkout-toolbar">
          <div className="checkout-toolbar-inner">
            <button className="checkout-back-btn" onClick={() => {
              if (step === 'map') setStep('prompt');
              else if (step === 'summary') setStep('prompt');
              else onBack();
            }}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="checkout-logo-row">
              <h2 className="checkout-header-title">
                {step === 'prompt' ? 'Pilih Lokasi' : step === 'map' ? 'Titik Lokasi' : 'Checkout'}
              </h2>
            </div>
            <div style={{width: 32}}></div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className={`checkout-content ${step === 'map' ? 'no-scroll' : ''}`}>
        
        {/* ==================================================== */}
        {/* VIEW 1: LOCATION PROMPT / SEARCH                     */}
        {/* ==================================================== */}
        {step === 'prompt' && (
          <div className="loc-search-container">
            
            <div className="search-bar-wrapper">
              <IonIcon icon={searchOutline} className="search-icon" />
              <input 
                type="text" 
                placeholder="Tulis nama jalan/tempat" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                className="loc-search-input"
              />
              {isSearching && <IonSpinner name="dots" className="search-spinner" />}
            </div>

            {searchResults.length > 0 ? (
              <div className="search-results-list">
                {searchResults.map((res, idx) => (
                  <div key={idx} className="search-result-item" onClick={() => handleSelectSearchResult(res)}>
                    <IonIcon icon={locationOutline} className="result-icon" />
                    <span>{res.display_name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="loc-options-list">
                <div className="loc-option-item" onClick={handleGetGpsAndShowMap}>
                  <div className="loc-option-icon">
                    <IonIcon icon={navigateOutline} />
                  </div>
                  <div className="loc-option-text">
                    <strong>Gunakan Lokasi Saat Ini</strong>
                    <p>Izinkan Penggunaan Lokasi</p>
                  </div>
                </div>

                <div className="loc-option-item" onClick={handleUseProfileAddress}>
                  <div className="loc-option-icon">
                    <IonIcon icon={mapOutline} />
                  </div>
                  <div className="loc-option-text">
                    <strong>Gunakan Alamat di Profil</strong>
                    <p>{user.businessName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 2: MAP PICKER                                   */}
        {/* ==================================================== */}
        {step === 'map' && (
          <div className="map-picker-wrapper">
            <div className="map-picker-instruction">
              Geser peta untuk menentukan titik akurat pengiriman Anda.
            </div>
            <div className="map-container-box" style={{ position: 'relative' }}>
              <MapContainer 
                center={buyerCoords} 
                zoom={16} 
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController center={buyerCoords} onMoveEnd={setBuyerCoords} />
              </MapContainer>

              {/* Fixed Center Pin */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -100%)',
                zIndex: 1000,
                fontSize: '42px',
                pointerEvents: 'none',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                📍
              </div>
            </div>
            <div className="map-picker-footer">
              <IonButton expand="block" className="loc-btn-primary" onClick={handleConfirmMapLocation}>
                <IonIcon icon={checkmarkCircle} slot="start" />
                Konfirmasi Lokasi
              </IonButton>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 3: CHECKOUT SUMMARY                             */}
        {/* ==================================================== */}
        {step === 'summary' && (
          <>
            {/* Shipping Address */}
            <div className="checkout-section-title">Alamat Pengiriman</div>
            <div className="checkout-address-card" onClick={() => setStep('prompt')}>
              <div className="address-icon-bg">
                <IonIcon icon={locationOutline} />
              </div>
              <div className="address-details">
                <h4 className="address-business-name">{user.businessName} ({user.ownerName})</h4>
                <p className="address-phone">{user.phone}</p>
                <p className="address-text">{buyerAddressLabel}</p>
              </div>
              <div className="address-change-btn">Ubah</div>
            </div>

            {/* Shipping Methods Selection */}
            <div className="checkout-section-title">Metode Pengiriman</div>
            <div className="distance-info-bar">
              <IonIcon icon={locationOutline} />
              <span>{distanceInfo}</span>
            </div>
            <IonRadioGroup value={selectedCourier} onIonChange={(e) => setSelectedCourier(e.detail.value)}>
              <div className="shipping-methods-list">
                {availableMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`shipping-method-card ${selectedCourier === method.id ? 'active' : ''}`}
                    onClick={() => setSelectedCourier(method.id)}
                  >
                    <div className="shipping-radio-row">
                      <div className="shipping-info-left">
                        <h4 className="shipping-method-name">{method.name}</h4>
                        <p className="shipping-method-desc">{method.desc}</p>
                      </div>
                      <div className="shipping-info-right">
                        <span className="shipping-method-price">Rp {method.price.toLocaleString('id-ID')}</span>
                        <IonRadio value={method.id} className="custom-radio" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </IonRadioGroup>

            {/* Order Items Summary */}
            <div className="checkout-section-title">Ringkasan Pesanan</div>
            <div className="checkout-items-summary-card">
              {cart.map((item) => (
                <div key={item.product.id} className="summary-item-row">
                  <div className="summary-item-img">
                    <img src={item.product.image} alt={item.product.name} />
                  </div>
                  <div className="summary-item-details">
                    <h4 className="summary-item-title">{item.product.name}</h4>
                    <p className="summary-item-qty">{item.quantity} kg x Rp {item.product.price.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="summary-item-total">
                    Rp {(item.quantity * item.product.price).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Detail breakdown */}
            <div className="checkout-section-title">Rincian Pembayaran</div>
            <div className="pricing-breakdown-card">
              <div className="breakdown-row">
                <span>Subtotal untuk Produk</span>
                <span>Rp {itemsTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="breakdown-row">
                <span>Ongkos Pengiriman {isCalculatingOngkir && '(Menghitung...)'}</span>
                <span>Rp {dynamicShippingCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="breakdown-row">
                <span>Biaya Layanan Aplikasi</span>
                <span>Rp {serviceFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="breakdown-row total-row-bold">
                <span>Total Tagihan</span>
                <span className="total-highlight">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>

              <div className="escrow-notice">
                <IonIcon icon={informationCircleOutline} />
                <span>Tumbasna Rekening Bersama (Escrow): Dana Anda dilindungi sistem dan hanya diteruskan ke supplier setelah barang tiba dalam kondisi baik.</span>
              </div>
            </div>

            <div style={{ height: '120px' }}></div>
          </>
        )}
      </IonContent>

      {/* Checkout Footer Actions (Only in Summary Step) */}
      {step === 'summary' && (
        <div className="checkout-footer">
          <div className="checkout-footer-amount-column">
            <span className="footer-amount-label">Total Pembayaran</span>
            <span className="footer-amount-val">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <IonButton
            color="tertiary"
            className="pay-qris-btn pulse-button"
            onClick={handlePlaceOrder}
          >
            <IonIcon icon={walletOutline} slot="start" />
            Bayar dengan QRIS
          </IonButton>
        </div>
      )}
    </IonPage>
  );
};

export default Checkout;
