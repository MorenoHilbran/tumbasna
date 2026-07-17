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
  checkmarkCircle,
  searchOutline,
  navigateOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { useApp, CartItem } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Checkout.css';

interface CheckoutProps {
  onBack: () => void;
  onOrderCreated: (orderId: string) => void;
  supplierId?: string;
  supplierItems?: CartItem[];
}

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

function calculateLocalCourierCost(buyerCity: string, supplierCity: string): number {
  const extractCity = (address: string): string => {
    const lower = address.toLowerCase();
    const cities = ['banyumas', 'cilacap', 'purbalingga', 'banjarnegara', 'kebumen', 'tegal', 'brebes', 'magelang', 'boyolali', 'cianjur', 'karo'];
    for (const city of cities) {
      if (lower.includes(city)) return city;
    }
    return 'unknown';
  };

  const buyerKota = extractCity(buyerCity);
  const supplierKota = extractCity(supplierCity);

  if (buyerKota === supplierKota) return 2500;
  if (buyerKota === 'unknown' || supplierKota === 'unknown') return 5000;

  const cityOrder = ['banyumas', 'cilacap', 'purbalingga', 'banjarnegara', 'kebumen', 'tegal', 'brebes', 'magelang', 'boyolali'];
  const buyerIdx = cityOrder.indexOf(buyerKota);
  const supplierIdx = cityOrder.indexOf(supplierKota);

  if (buyerIdx !== -1 && supplierIdx !== -1) {
    const distance = Math.abs(buyerIdx - supplierIdx);
    if (distance === 1) return 5000;
    if (distance >= 2) return 7500;
  }

  return 5000;
}

const SHIPPING_METHODS = [
  { id: 'kurir-lokal', name: 'Kurir Lokal', price: 0, desc: 'Ongkir dihitung berdasarkan jarak kota' },
  { id: 'ekspedisi', name: 'Ekspedisi Logistik Kilat (Next Day)', price: 0, desc: 'Estimasi tiba 2-3 hari (harga dari RajaOngkir)' }
];

const DELIVERY_TIMES = [
  { id: 'dini-hari', label: 'Dini Hari 05:00 - 08:00', price: 2500, originalPrice: 5000 },
  { id: 'pagi', label: 'Pagi 09:00 - 12:00', price: 2500, originalPrice: 5000 },
  { id: 'siang', label: 'Siang 12:00 - 15:00', price: 3000, originalPrice: 5000 }
];

const PAYMENT_METHODS = [
  { id: 'qris', name: 'VA BCA', desc: 'Transfer ke rekening bank VA BCA.', icon: 'bca' },
  { id: 'transfer', name: 'Transfer Bank', desc: 'Transfer ke rekening Tumbasna' },
  { id: 'cod', name: 'Cash on Delivery (COD)', desc: 'Bayar saat barang tiba' }
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
    if (dist > 10) {
      map.setView(center, 16, { animate: true });
    }
  }, [center, map]);

  return null;
};

const Checkout: React.FC<CheckoutProps> = ({ onBack, onOrderCreated, supplierId, supplierItems }) => {
  const { cart, user, checkout } = useApp();

  const checkoutItems = supplierItems || (supplierId 
    ? cart.filter(item => item.product.supplierName === supplierId)
    : cart);

  const supplierName = checkoutItems[0]?.product.supplierName || '';
  const supplierLocation = checkoutItems[0]?.product.supplierLocation || '';

  const [step, setStep] = useState<'map' | 'summary'>('map');
  const [buyerCoords, setBuyerCoords] = useState<[number, number]>([-7.4244, 109.2300]);
  const [buyerAddressLabel, setBuyerAddressLabel] = useState('');
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(SHIPPING_METHODS[0].id);
  const [dynamicShippingCost, setDynamicShippingCost] = useState(0);
  const [isCalculatingOngkir, setIsCalculatingOngkir] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState('Mendeteksi jarak lokasi...');
  const [distance, setDistance] = useState<number>(10);
  const [supplierCoords, setSupplierCoords] = useState<[number, number] | null>(null);
  const [deliveryTime, setDeliveryTime] = useState(DELIVERY_TIMES[0].id);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'transfer' | 'cod'>('qris');
  const [showAllPaymentMethods, setShowAllPaymentMethods] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (user && user.address) {
      setBuyerAddressLabel(user.address);
      const geocodeProfileAddress = async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(user.address)}`);
          const data = await res.json();
          if (data && data[0]) {
            setBuyerCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          }
        } catch (err) {
          console.error('Geocode error:', err);
        }
      };
      geocodeProfileAddress();
    }
  }, [user]);

  useEffect(() => {
    if (checkoutItems.length > 0 && checkoutItems[0].product.lat && checkoutItems[0].product.lng) {
      setSupplierCoords([checkoutItems[0].product.lat, checkoutItems[0].product.lng]);
    } else {
      const supplierLoc = checkoutItems[0]?.product.supplierLocation || '';
      for (const [city, coords] of Object.entries(locationCoords)) {
        if (supplierLoc.includes(city)) {
          setSupplierCoords(coords);
          break;
        }
      }
    }
  }, [checkoutItems]);

  useEffect(() => {
    if (supplierCoords) {
      const dist = haversineKm(buyerCoords[0], buyerCoords[1], supplierCoords[0], supplierCoords[1]);
      setDistance(dist);
      setDistanceInfo(`Jarak: ${dist.toFixed(1)} km dari ${supplierName}`);
    }
  }, [buyerCoords, supplierCoords, supplierName]);

  useEffect(() => {
    if (selectedCourier === 'kurir-lokal') {
      const cost = calculateLocalCourierCost(buyerAddressLabel, supplierLocation);
      setDynamicShippingCost(cost);
    } else if (selectedCourier === 'ekspedisi') {
      setIsCalculatingOngkir(true);
      setTimeout(() => {
        setDynamicShippingCost(15000);
        setIsCalculatingOngkir(false);
      }, 1500);
    }
  }, [selectedCourier, buyerAddressLabel, supplierLocation]);

  const handleConfirmLocation = async () => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${buyerCoords[0]}&lon=${buyerCoords[1]}`);
      const data = await res.json();
      if (data && data.display_name) {
        setBuyerAddressLabel(data.display_name);
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setBuyerAddressLabel(`Lat: ${buyerCoords[0].toFixed(4)}, Lng: ${buyerCoords[1].toFixed(4)}`);
    }
    setStep('summary');
  };

  const handleGetGPS = () => {
    setIsGettingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setBuyerCoords([position.coords.latitude, position.coords.longitude]);
          setIsGettingGps(false);
        },
        (error) => {
          console.error('GPS error:', error);
          setIsGettingGps(false);
          alert('Tidak dapat mengakses GPS. Pastikan izin lokasi diaktifkan.');
        }
      );
    } else {
      setIsGettingGps(false);
      alert('Browser tidak mendukung geolokasi.');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.slice(0, 5));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    setBuyerCoords([parseFloat(result.lat), parseFloat(result.lon)]);
    setBuyerAddressLabel(result.display_name);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const orderId = await checkout(
        selectedCourier,
        dynamicShippingCost,
        buyerCoords,
        supplierCoords || undefined,
        buyerAddressLabel,
        supplierLocation
      );
      onOrderCreated(orderId);
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const selectedDeliveryTime = DELIVERY_TIMES.find(t => t.id === deliveryTime) || DELIVERY_TIMES[0];
  const itemsTotal = checkoutItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const serviceFee = 1000;
  const deliveryTimeCost = selectedDeliveryTime.price;
  const totalBeforeDiscount = itemsTotal + dynamicShippingCost + serviceFee + deliveryTimeCost;
  const discount = 1700;
  const totalAmount = totalBeforeDiscount - discount;
  const neededForFreeShipping = 66100;

  const customIcon = L.divIcon({
    html: `
      <div style="position: relative;">
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          background: #F7941D;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg) translateX(-50%);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <ion-icon name="location" style="
            font-size: 24px;
            color: white;
            transform: rotate(45deg);
          "></ion-icon>
        </div>
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 8px;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%);
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'custom-pin-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `Pengiriman Besok ${tomorrow.getDate()} ${months[tomorrow.getMonth()]} ${tomorrow.getFullYear()}`;
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="checkout-toolbar">
          <div className="checkout-toolbar-inner">
            <button className="checkout-back-btn" onClick={onBack}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <h1 className="checkout-header-title">
              {step === 'map' ? 'Pilih Lokasi Pengiriman' : 'Konfirmasi Pesanan'}
            </h1>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="checkout-content">
        {step === 'map' ? (
          <>
            <div className="map-search-bar">
              <input
                type="text"
                placeholder="Cari alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="map-search-input"
              />
              <button onClick={handleSearch} disabled={isSearching} className="map-search-btn">
                {isSearching ? <IonSpinner name="crescent" /> : <IonIcon icon={searchOutline} />}
              </button>
              <button onClick={handleGetGPS} disabled={isGettingGps} className="map-gps-btn">
                {isGettingGps ? <IonSpinner name="crescent" /> : <IonIcon icon={navigateOutline} />}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="map-search-results">
                {searchResults.map((result, idx) => (
                  <div key={idx} className="search-result-item" onClick={() => handleSelectSearchResult(result)}>
                    <IonIcon icon={locationOutline} />
                    <span>{result.display_name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="map-container-wrapper">
              <MapContainer
                center={buyerCoords}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={buyerCoords} icon={customIcon} />
                <MapController center={buyerCoords} onMoveEnd={(pos) => setBuyerCoords(pos)} />
              </MapContainer>
            </div>

            <div className="map-address-display">
              <IonIcon icon={locationOutline} />
              <p>{buyerAddressLabel || 'Geser peta untuk memilih lokasi'}</p>
            </div>

            <div className="map-confirm-footer">
              <IonButton expand="block" color="primary" onClick={handleConfirmLocation} className="confirm-location-btn">
                <IonIcon icon={checkmarkCircle} slot="start" />
                Konfirmasi Lokasi Ini
              </IonButton>
            </div>
          </>
        ) : (
          <>
            <div className="checkout-section-title">Supplier</div>
            <div className="supplier-info-card">
              <h3>{supplierName}</h3>
              <p>{supplierLocation}</p>
            </div>

            <div className="checkout-section-title">Alamat Pengiriman</div>
            <div className="address-summary-card" onClick={() => setStep('map')}>
              <div className="address-icon-text">
                <IonIcon icon={locationOutline} />
                <p className="address-text">{buyerAddressLabel}</p>
              </div>
              <div className="address-change-btn">Ubah</div>
            </div>

            <div className="checkout-section-title">Pilih Waktu Pengiriman</div>
            <div className="delivery-time-header">{getTomorrowDate()}</div>
            <div className="delivery-time-cards">
              {DELIVERY_TIMES.map((time) => (
                <div
                  key={time.id}
                  className={`delivery-time-card ${deliveryTime === time.id ? 'active' : ''}`}
                  onClick={() => setDeliveryTime(time.id)}
                >
                  <div className="delivery-time-left">
                    <div className="delivery-time-label">{time.label}</div>
                    <IonRadio value={time.id} />
                  </div>
                  <div className="delivery-time-right">
                    <div className="delivery-time-price">Rp{time.price.toLocaleString('id-ID')}</div>
                    <div className="delivery-time-original-price">Rp{time.originalPrice.toLocaleString('id-ID')}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-section-title">Metode Pembayaran</div>
            <div className="payment-method-section">
              <div className="payment-method-card active">
                <div className="payment-method-info">
                  <div className="payment-icon-wrapper">
                    <span className="payment-icon-bca">BCA</span>
                  </div>
                  <div>
                    <h4>{PAYMENT_METHODS[0].name}</h4>
                    <p>{PAYMENT_METHODS[0].desc}</p>
                  </div>
                </div>
                <IonRadio value="qris" checked />
              </div>
              
              {!showAllPaymentMethods && (
                <button 
                  className="payment-expand-button"
                  onClick={() => setShowAllPaymentMethods(true)}
                >
                  <span>Metode Pembayaran Lainnya</span>
                  <IonIcon icon={chevronForwardOutline} />
                </button>
              )}

              {showAllPaymentMethods && PAYMENT_METHODS.slice(1).map((method) => (
                <div
                  key={method.id}
                  className={`payment-method-card ${paymentMethod === method.id ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method.id as any)}
                >
                  <div className="payment-method-info">
                    <h4>{method.name}</h4>
                    <p>{method.desc}</p>
                  </div>
                  <IonRadio value={method.id} />
                </div>
              ))}
            </div>

            <div className="checkout-section-title">Metode Pengiriman</div>
            <div className="distance-info-bar">
              <IonIcon icon={locationOutline} />
              <span>{distanceInfo}</span>
            </div>
            <IonRadioGroup value={selectedCourier} onIonChange={(e) => setSelectedCourier(e.detail.value)}>
              <div className="shipping-methods-list">
                {SHIPPING_METHODS.map((method) => (
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
                        <span className="shipping-method-price">Rp {dynamicShippingCost.toLocaleString('id-ID')}</span>
                        <IonRadio value={method.id} className="custom-radio" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </IonRadioGroup>

            <div className="checkout-section-title">Ringkasan Pesanan</div>
            <div className="checkout-items-summary-card">
              {checkoutItems.map((item) => (
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

            <div className="checkout-section-title">Rincian Pembayaran</div>
            <div className="pricing-breakdown-card">
              <div className="breakdown-row">
                <span>Subtotal ({checkoutItems.length} Produk)</span>
                <span>Rp {itemsTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="breakdown-row">
                <span>Biaya Pemesanan</span>
                <span>Rp {serviceFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="breakdown-row">
                <span>Biaya Kemasan</span>
                <span>Rp {serviceFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="breakdown-row">
                <span>Ongkos Kirim</span>
                <span>Rp {dynamicShippingCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="breakdown-row orange-text">
                <span>Belanja Rp{neededForFreeShipping.toLocaleString('id-ID')} lagi untuk dapat gratis ongkir</span>
              </div>
              <div className="breakdown-row total-row-bold">
                <span>Total Pembayaran</span>
                <span className="total-highlight">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="escrow-notice-yellow">
              <div className="escrow-yellow-content">
                <span className="escrow-yellow-text">Yeay selamat kamu hemat Rp{discount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div style={{ height: '140px' }}></div>
          </>
        )}
      </IonContent>

      {step === 'summary' && (
        <div className="checkout-footer-new">
          <div className="checkout-footer-left">
            <div className="footer-total-label">Total</div>
            <div className="footer-price-strikethrough">Rp{totalBeforeDiscount.toLocaleString('id-ID')}</div>
            <button className="footer-summary-link" onClick={() => setShowSummary(!showSummary)}>
              Lihat ringkasan
            </button>
          </div>
          <div className="checkout-footer-right">
            <div className="footer-final-price">Rp{totalAmount.toLocaleString('id-ID')}</div>
          </div>
          <IonButton
            className="checkout-btn-green-full"
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? <IonSpinner name="crescent" /> : 'Pesan Sekarang'}
          </IonButton>
        </div>
      )}
    </IonPage>
  );
};

export default Checkout;
