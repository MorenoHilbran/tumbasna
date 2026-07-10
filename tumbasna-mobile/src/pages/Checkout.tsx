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

const locationCoords: Record<string, [number, number]> = {
  'Banyumas': [-7.5151, 109.2941],
  'Cilacap': [-7.7150, 108.9767],
  'Purbalingga': [-7.3884, 109.3641],
  'Banjarnegara': [-7.3884, 109.6939],
  'Kebumen': [-7.6701, 109.6524],
  'Tegal': [-6.8694, 109.1250],
  'Brebes': [-6.8703, 109.0378],
  'Magelang': [-7.4797, 110.2178],
  'Boyolali': [-7.5306, 110.5964],
  'Cianjur': [-6.8224, 107.1394],
  'Karo': [3.1167, 98.5000]
};

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
  
  // Workflow States (Skip prompt, go straight to map)
  const [step, setStep] = useState<'map' | 'summary'>('map');
  
  // Location States
  const [buyerCoords, setBuyerCoords] = useState<[number, number]>([-7.4244, 109.2300]); // Default to Purwokerto/Banyumas
  const [buyerAddressLabel, setBuyerAddressLabel] = useState('');
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Summary States
  const [selectedCourier, setSelectedCourier] = useState(SHIPPING_METHODS[0].id);
  const [dynamicShippingCost, setDynamicShippingCost] = useState(SHIPPING_METHODS[0].price);
  const [isCalculatingOngkir, setIsCalculatingOngkir] = useState(false);
  
  // COD Radius / Distance States
  const [codAvailable, setCodAvailable] = useState(true);
  const [distanceInfo, setDistanceInfo] = useState('Mendeteksi jarak lokasi...');
  const [distance, setDistance] = useState<number>(10); // Default 10km fallback
  const [supplierCoords, setSupplierCoords] = useState<[number, number] | null>(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Geocode profile address on mount
  useEffect(() => {
    if (user && user.address) {
      setBuyerAddressLabel(user.address);
      const geocodeProfileAddress = async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(user.address)}`);
          const data = await res.json();
          if (data && data.length > 0) {
            setBuyerCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          }
        } catch (err) {
          console.warn('Geocoding profile address failed, using default coords.', err);
        }
      };
      geocodeProfileAddress();
    }
  }, [user]);

  if (!user || cart.length === 0) return null;

  const itemsTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const activeShipping = SHIPPING_METHODS.find((m) => m.id === selectedCourier) || SHIPPING_METHODS[0];

  // =================================================================
  // 1. LOCATION STEP HANDLERS
  // =================================================================

  const handleGetGpsAndShowMap = async () => {
    setIsGettingGps(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true });
      });
      setBuyerCoords([position.coords.latitude, position.coords.longitude]);
      
      // Reverse geocode GPS location
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
        const data = await res.json();
        if (data && data.display_name) {
          setBuyerAddressLabel(data.display_name);
        } else {
          setBuyerAddressLabel(`Lokasi GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        }
      } catch {
        setBuyerAddressLabel(`Lokasi GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
      }
    } catch (err: any) {
      // Fallback to default coordinates (Magelang) if GPS fails or permission denied
      console.warn("GPS Error:", err);
      const fallbackLat = -7.4705;
      const fallbackLng = 110.2178;
      setBuyerCoords([fallbackLat, fallbackLng]);
      setBuyerAddressLabel("Magelang, Jawa Tengah (Lokasi Default karena GPS tidak aktif)");
      alert("Gagal mengambil GPS perangkat. Pastikan izin lokasi aktif di browser Anda. Menggunakan lokasi perkiraan sementara.");
    } finally {
      setIsGettingGps(false);
    }
  };

  const handleConfirmMapLocation = async () => {
    // Reverse geocode buyerCoords for final confirmation
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${buyerCoords[0]}&lon=${buyerCoords[1]}`);
      const data = await res.json();
      if (data && data.display_name) {
        setBuyerAddressLabel(data.display_name);
      } else {
        setBuyerAddressLabel(`Pin Peta (${buyerCoords[0].toFixed(4)}, ${buyerCoords[1].toFixed(4)})`);
      }
    } catch {
      setBuyerAddressLabel(`Pin Peta (${buyerCoords[0].toFixed(4)}, ${buyerCoords[1].toFixed(4)})`);
    }
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
    setSearchResults([]);
    setSearchQuery('');
  };

  // =================================================================
  // 2. CHECKOUT SUMMARY EFFECTS & SHIPPING CALCULATIONS
  // =================================================================

  const getMethodPrice = (methodId: string) => {
    const totalWeightGrams = cart.reduce((acc, item) => acc + (item.quantity * 1000), 0);
    const weightKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
    if (methodId === 'kurir-lokal') {
      return Math.round(distance * 5000);
    } else if (methodId === 'cod') {
      return Math.max(15000, Math.round(distance * 2500));
    } else if (methodId === 'ekspedisi') {
      if (selectedCourier === 'ekspedisi') return dynamicShippingCost;
      return 25000 + (weightKg * 5000);
    }
    return 0;
  };

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
          setSupplierCoords([supplierLat, supplierLng]);

          const dist = haversineKm(buyerCoords[0], buyerCoords[1], supplierLat, supplierLng);
          setDistance(dist);
          
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
          const key = Object.keys(locationCoords).find(k => supplierLocationStr.toLowerCase().includes(k.toLowerCase()));
          const fallback = key ? locationCoords[key] : [-7.5151, 109.2941];
          setSupplierCoords(fallback as [number, number]);
          setDistance(12.5);
          setCodAvailable(true);
          setDistanceInfo('Jarak ke supplier: ~12.5 km (Estimasi)');
        }
      } catch (err) {
        const key = Object.keys(locationCoords).find(k => supplierLocationStr.toLowerCase().includes(k.toLowerCase()));
        const fallback = key ? locationCoords[key] : [-7.5151, 109.2941];
        setSupplierCoords(fallback as [number, number]);
        setDistance(12.5);
        setCodAvailable(true);
        setDistanceInfo('Jarak ke supplier: ~12.5 km (Estimasi)');
      }
    };
    checkDistance();
  }, [step, cart, buyerCoords, selectedCourier]);

  useEffect(() => {
    if (step !== 'summary') return;

    const fetchShipping = async () => {
      if (selectedCourier === 'ekspedisi') {
        setIsCalculatingOngkir(true);
        try {
          const totalWeightGrams = cart.reduce((acc, item) => acc + (item.quantity * 1000), 0);
          const weightKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
          const API_URL = import.meta.env.VITE_API_URL || 'https://api.tumbasna.my.id';
          const res = await fetch(`${API_URL}/api/shipping/cost`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              courier: selectedCourier, 
              weight: totalWeightGrams,
              originId: '501',
              destinationId: '114' 
            })
          });
          const data = await res.json();
          if (data.success) {
            setDynamicShippingCost(data.cost);
          } else {
            setDynamicShippingCost(25000 + (weightKg * 5000));
          }
        } catch {
          const totalWeightGrams = cart.reduce((acc, item) => acc + (item.quantity * 1000), 0);
          const weightKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
          setDynamicShippingCost(25000 + (weightKg * 5000));
        } finally {
          setIsCalculatingOngkir(false);
        }
      } else {
        setDynamicShippingCost(getMethodPrice(selectedCourier));
      }
    };
    fetchShipping();
  }, [selectedCourier, cart, step, distance]);

  const serviceFee = 2000;
  const totalAmount = itemsTotal + dynamicShippingCost + serviceFee;

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const getCityLabel = (fullAddress: string) => {
        if (!fullAddress) return '';
        const parts = fullAddress.split(',');
        const match = parts.find(p => p.toLowerCase().includes('kabupaten') || p.toLowerCase().includes('kota'));
        if (match) return match.replace(/kabupaten|kota/gi, '').trim();
        return parts[0].trim();
      };

      const bAddrLabel = getCityLabel(buyerAddressLabel);
      const sLocLabel = getCityLabel(cart[0]?.product.supplierLocation || '');

      const orderId = await checkout(
        activeShipping.name, 
        dynamicShippingCost, 
        buyerCoords, 
        supplierCoords || undefined,
        bAddrLabel,
        sLocLabel
      );
      if (orderId) {
        onOrderCreated(orderId);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setIsPlacingOrder(false);
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
              if (step === 'map') onBack();
              else if (step === 'summary') setStep('map');
            }}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="checkout-logo-row">
              <h2 className="checkout-header-title">
                {step === 'map' ? 'Pilih Lokasi' : 'Checkout'}
              </h2>
            </div>
            <div style={{width: 32}}></div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className={`checkout-content ${step === 'map' ? 'no-scroll' : ''}`}>
        
        {/* ==================================================== */}
        {/* VIEW 1: MAP PICKER WITH SEARCH OVERLAY & GPS FAB    */}
        {/* ==================================================== */}
        {step === 'map' && (
          <div className="map-picker-wrapper">
            <div className="map-search-overlay">
              <div className="search-bar-wrapper">
                <IonIcon icon={searchOutline} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Cari jalan atau area di Banyumas..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                  className="loc-search-input"
                />
                {isSearching && <IonSpinner name="dots" className="search-spinner" />}
              </div>

              {/* Gunakan Lokasi Saat Ini Button */}
              <button 
                type="button"
                className="current-loc-inline-btn"
                onClick={handleGetGpsAndShowMap}
                disabled={isGettingGps}
              >
                {isGettingGps ? (
                  <>
                    <IonSpinner name="crescent" className="btn-spinner" />
                    <span>Mengambil lokasi GPS...</span>
                  </>
                ) : (
                  <>
                    <IonIcon icon={locateOutline} />
                    <span>Gunakan Lokasi Saat Ini (GPS)</span>
                  </>
                )}
              </button>

              {searchResults.length > 0 && (
                <div className="search-results-list-overlay">
                  {searchResults.map((res, idx) => (
                    <div key={idx} className="search-result-item" onClick={() => handleSelectSearchResult(res)}>
                      <IonIcon icon={locationOutline} className="result-icon" />
                      <span>{res.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
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

              {/* GPS FAB Button */}
              <button 
                className="gps-fab"
                onClick={handleGetGpsAndShowMap}
                disabled={isGettingGps}
              >
                {isGettingGps ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} /> : <IonIcon icon={locateOutline} />}
              </button>
            </div>
            
            <div className="map-picker-footer">
              <IonButton expand="block" className="loc-btn-primary" onClick={handleConfirmMapLocation}>
                <IonIcon icon={checkmarkCircle} slot="start" />
                Konfirmasi Lokasi Pengiriman
              </IonButton>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 2: CHECKOUT SUMMARY                             */}
        {/* ==================================================== */}
        {step === 'summary' && (
          <>
            {/* Shipping Address */}
            <div className="checkout-section-title">Alamat Pengiriman</div>
            <div className="checkout-address-card" onClick={() => setStep('map')}>
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
                        <span className="shipping-method-price">Rp {getMethodPrice(method.id).toLocaleString('id-ID')}</span>
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
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? (
              <IonSpinner name="crescent" />
            ) : (
              <>
                <IonIcon icon={walletOutline} slot="start" />
                Bayar dengan QRIS
              </>
            )}
          </IonButton>
        </div>
      )}
    </IonPage>
  );
};

export default Checkout;
