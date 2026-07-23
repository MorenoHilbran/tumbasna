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
  navigateOutline,
  timeOutline,
  chevronDownOutline,
  locationSharp
} from 'ionicons/icons';
import { useApp, CartItem } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Checkout.css';
// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CheckoutProps {
  onBack: () => void;
  onOrderCreated: (orderId: string) => void;
  supplierId?: string;
  supplierItems?: CartItem[];
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

// Calculate local courier cost based on city distance
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

const DELIVERY_TIMES = [
  { id: 'pagi', label: 'Pagi', time: '08:00 - 12:00' },
  { id: 'siang', label: 'Siang', time: '12:00 - 15:00' },
  { id: 'sore', label: 'Sore', time: '15:00 - 18:00' }
];

const PAYMENT_METHODS = [
  { id: 'qris', name: 'QRIS', desc: 'Bayar dengan QRIS / E-Wallet' },
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

const CITY_ID_MAP: Record<string, string> = {
  // Jawa Tengah
  'banyumas': '39', 'purwokerto': '39',
  'cilacap': '88',
  'purbalingga': '344',
  'banjarnegara': '33',
  'kebumen': '165',
  'tegal': '425',
  'brebes': '73',
  'magelang': '225',
  'boyolali': '71',
  'klaten': '172',
  'sukoharjo': '412',
  'wonogiri': '491',
  'karanganyar': '155',
  'sragen': '399',
  'grobogan': '131',
  'blora': '64',
  'rembang': '369',
  'pati': '317',
  'kudus': '195',
  'jepara': '144',
  'demak': '109',
  'semarang': '399',
  'salatiga': '381',
  'kendal': '168',
  'batang': '43',
  'pekalongan': '321',
  'pemalang': '326',
  'temanggung': '430',
  'wonosobo': '493',
  'purworejo': '348',
  // Jawa Barat
  'bandung': '23',
  'bogor': '66',
  'cianjur': '85',
  'bekasi': '55',
  'depok': '111',
  'sukabumi': '409',
  'cirebon': '93',
  'indramayu': '138',
  'subang': '407',
  'purwakarta': '347',
  'karawang': '157',
  'garut': '122',
  'tasikmalaya': '422',
  'ciamis': '82',
  'kuningan': '196',
  'majalengka': '229',
  'sumedang': '413',
  // Jawa Timur
  'surabaya': '444',
  'malang': '231',
  'sidoarjo': '395',
  'gresik': '131',
  'mojokerto': '254',
  'jombang': '148',
  'pasuruan': '315',
  'probolinggo': '337',
  'lumajang': '214',
  'jember': '140',
  'banyuwangi': '38',
  'situbondo': '398',
  'bondowoso': '67',
  'kediri': '162',
  'blitar': '63',
  'tulungagung': '455',
  'trenggalek': '447',
  'nganjuk': '275',
  'madiun': '222',
  'ngawi': '277',
  'bojonegoro': '68',
  'tuban': '453',
  'lamongan': '200',
  'bangkalan': '30',
  'sampang': '385',
  'pamekasan': '310',
  'sumenep': '415',
  // DKI Jakarta
  'jakarta': '152',
  // Yogyakarta
  'yogyakarta': '501', 'jogja': '501', 'bantul': '35', 'sleman': '400', 'gunungkidul': '133', 'kulonprogo': '193',
  // Sumatera
  'medan': '242',
  'binjai': '60',
  'deli serdang': '110',
  'karo': '158',
  'pematangsiantar': '329',
  'tebing tinggi': '427',
  'langkat': '202',
  'palembang': '308',
  'padang': '304',
  'pekanbaru': '320',
  'batam': '42',
  'banda aceh': '27',
  'bandar lampung': '28',
  // Kalimantan
  'balikpapan': '22',
  'samarinda': '382',
  'pontianak': '334',
  'banjarmasin': '36',
  'palangkaraya': '307',
  // Sulawesi
  'makassar': '228',
  'manado': '234',
  'palu': '309',
  'kendari': '167',
  'gorontalo': '128',
  // Bali & NTB
  'denpasar': '114',
  'badung': '21',
  'gianyar': '127',
  'mataram': '240',
  'lombok': '240',
};

function getCityId(address: string): string {
  const lower = address.toLowerCase();
  // Coba cocokkan nama kota dari yang paling spesifik (panjang) dulu
  const entries = Object.entries(CITY_ID_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [key, id] of entries) {
    if (lower.includes(key)) return id;
  }
  return '39'; // default: Banyumas
}

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

  const [step, setStep] = useState<'map' | 'summary'>('summary');
  const [buyerCoords, setBuyerCoords] = useState<[number, number]>([-7.5151, 109.2941]);
  const [buyerAddressLabel, setBuyerAddressLabel] = useState<string>('');
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [deliveryTime, setDeliveryTime] = useState('pagi');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'transfer' | 'cod'>('qris');
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [dynamicShippingCost, setDynamicShippingCost] = useState(0);
  const [isCalculatingOngkir, setIsCalculatingOngkir] = useState(false);
  const [ekspedisiExpanded, setEkspedisiExpanded] = useState(false);
  const [rajaOngkirCosts, setRajaOngkirCosts] = useState<any[]>([]);
  const [selectedEkspedisi, setSelectedEkspedisi] = useState<string>('');

  const supplierName = checkoutItems[0]?.product?.supplierName || 'Supplier';
  const supplierLocation = checkoutItems[0]?.product?.supplierLocation || 'Unknown Location';

  const supplierCoords: [number, number] = (() => {
    for (const [city, coords] of Object.entries(locationCoords)) {
      if (supplierLocation.includes(city)) return coords;
    }
    return [-7.5151, 109.2941];
  })();

  const distanceKm = haversineKm(buyerCoords[0], buyerCoords[1], supplierCoords[0], supplierCoords[1]);
  const distanceInfo = `Jarak: ${distanceKm.toFixed(1)} km dari supplier`;

  const itemsTotal = checkoutItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const serviceFee = 2000; // Fixed Rp 2.000
  const totalAmount = itemsTotal + dynamicShippingCost + serviceFee;

  const customIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  useEffect(() => {
    if (navigator.geolocation && !buyerAddressLabel) {
      navigator.geolocation.getCurrentPosition((position) => {const { latitude, longitude } = position.coords;setBuyerCoords([latitude, longitude]);reverseGeocode(latitude, longitude);}, (error) => {reverseGeocode(buyerCoords[0], buyerCoords[1]);}, { timeout: 10000, enableHighAccuracy: false });
    } else if (!buyerAddressLabel) {
      reverseGeocode(buyerCoords[0], buyerCoords[1]);
    }
  }, []);

  useEffect(() => {
    if (selectedCourier === 'cod') {
      setDynamicShippingCost(0);
    } else if (selectedCourier === 'kurir-lokal') {
      setDynamicShippingCost(calculateLocalCourierCost(buyerAddressLabel, supplierLocation));
    } else if (selectedCourier === 'ekspedisi' && selectedEkspedisi) {
      const selected = rajaOngkirCosts.find(c => c.id === selectedEkspedisi);
      setDynamicShippingCost(selected?.cost || 0);
    }
  }, [selectedCourier, buyerAddressLabel, selectedEkspedisi, rajaOngkirCosts]);

  useEffect(() => {
    if (selectedCourier === 'ekspedisi' && buyerAddressLabel && rajaOngkirCosts.length === 0) {
      fetchRajaOngkir();
    }
  }, [selectedCourier, buyerAddressLabel]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setBuyerAddressLabel(data.display_name || 'Alamat tidak ditemukan');
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setBuyerAddressLabel('Alamat tidak ditemukan');
    }
  };

  const handleGetGPS = () => {
    setIsGettingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {const { latitude, longitude } = position.coords;setBuyerCoords([latitude, longitude]);reverseGeocode(latitude, longitude);setIsGettingGps(false);}, (error) => {alert('Gagal mendapatkan lokasi GPS. Pastikan GPS Anda aktif.');setIsGettingGps(false);}, { timeout: 10000, enableHighAccuracy: false });
    } else {
      alert('Browser tidak mendukung Geolocation.');
      setIsGettingGps(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setBuyerCoords([lat, lon]);
    setBuyerAddressLabel(result.display_name);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleConfirmLocation = () => {
    setStep('summary');
  };

  const fetchRajaOngkir = async () => {
    setIsCalculatingOngkir(true);
    const weightGrams = checkoutItems.reduce((sum, item) => sum + item.quantity * 1000, 0);
    const weightKg = Math.max(1, Math.ceil(weightGrams / 1000));

    // Dynamic calculate realistic fallback shipping rates
    const baseJneReg = 12000 + (weightKg - 1) * 5000;
    const baseJntEz = 13000 + (weightKg - 1) * 5000;
    const basePosKilat = 11000 + (weightKg - 1) * 4500;
    const baseJneYes = 22000 + (weightKg - 1) * 7000;

    const defaultFallbackOptions = [
      {
        id: 'jne-reg',
        courier: 'JNE',
        service: 'REG (Reguler)',
        cost: baseJneReg,
        etd: '2-3',
        description: 'Layanan Pengiriman Reguler JNE'
      },
      {
        id: 'jnt-ez',
        courier: 'J&T',
        service: 'EZ (Express)',
        cost: baseJntEz,
        etd: '2-3',
        description: 'Layanan Pengiriman Standar J&T Express'
      },
      {
        id: 'pos-kilat',
        courier: 'POS',
        service: 'Kilat Khusus',
        cost: basePosKilat,
        etd: '2-4',
        description: 'Pos Indonesia Kilat Khusus'
      },
      {
        id: 'jne-yes',
        courier: 'JNE',
        service: 'YES (Yakin Esok Sampai)',
        cost: baseJneYes,
        etd: '1-1',
        description: 'Layanan Kilat 1 Hari Sampai'
      }
    ];

    try {
      const originCityId = getCityId(supplierLocation);
      const destinationCityId = getCityId(buyerAddressLabel);
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.tumbasna.my.id';

      const allCosts: any[] = [];

      // Try fetching JNE & JNT & POS from API backend
      try {
        const jneResponse = await fetch(`${apiUrl}/api/shipping/cost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originId: originCityId,
            destinationId: destinationCityId,
            weight: weightGrams,
            courier: 'jne'
          })
        });
        const jneData = await jneResponse.json();
        if (jneData?.success && jneData?.cost > 0) {
          allCosts.push({
            id: 'jne-reg',
            courier: 'JNE',
            service: 'REG',
            cost: jneData.cost,
            etd: jneData.estimation || '2-3 Hari',
            description: jneData.courier
          });
        }
      } catch (e) {
        console.warn('Backend JNE Shipping fetch warn:', e);
      }

      try {
        const jntResponse = await fetch(`${apiUrl}/api/shipping/cost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originId: originCityId,
            destinationId: destinationCityId,
            weight: weightGrams,
            courier: 'jnt'
          })
        });
        const jntData = await jntResponse.json();
        if (jntData?.success && jntData?.cost > 0) {
          allCosts.push({
            id: 'jnt-ez',
            courier: 'J&T',
            service: 'EZ',
            cost: jntData.cost,
            etd: jntData.estimation || '2-3 Hari',
            description: jntData.courier
          });
        }
      } catch (e) {
        console.warn('Backend JNT Shipping fetch warn:', e);
      }

      // If backend API returns costs, use them; otherwise fallback to default options
      const finalCosts = allCosts.length > 0 ? allCosts : defaultFallbackOptions;
      finalCosts.sort((a, b) => a.cost - b.cost);

      setRajaOngkirCosts(finalCosts);

      // Auto-select cheapest option
      if (finalCosts.length > 0) {
        setSelectedEkspedisi(finalCosts[0].id);
        setDynamicShippingCost(finalCosts[0].cost);
      }
    } catch (err) {
      console.error('RajaOngkir cost calculation error, fallback used:', err);
      defaultFallbackOptions.sort((a, b) => a.cost - b.cost);
      setRajaOngkirCosts(defaultFallbackOptions);
      setSelectedEkspedisi(defaultFallbackOptions[0].id);
      setDynamicShippingCost(defaultFallbackOptions[0].cost);
    } finally {
      setIsCalculatingOngkir(false);
    }
  };  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    
    // Validasi sebelum checkout
    if (checkoutItems.length === 0) {
      alert('Keranjang kosong. Silakan tambahkan produk terlebih dahulu.');
      setIsPlacingOrder(false);
      return;
    }
    
    if (!selectedCourier) {
      alert('Silakan pilih metode pengiriman terlebih dahulu.');
      setIsPlacingOrder(false);
      return;
    }
    
    if (!paymentMethod) {
      alert('Silakan pilih metode pembayaran terlebih dahulu.');
      setIsPlacingOrder(false);
      return;
    }
    
    console.log('[handlePlaceOrder] Validation passed, checkoutItems:', checkoutItems.length);
    
    try {
      const supplierCoords = checkoutItems[0]?.product?.supplierLocation 
        ? locationCoords[Object.keys(locationCoords).find(k => 
            checkoutItems[0].product.supplierLocation.toLowerCase().includes(k.toLowerCase())
          ) || 'Banyumas'] || [-7.5151, 109.2941]
        : [-7.5151, 109.2941];
      
      const supplierAddress = checkoutItems[0]?.product?.supplierLocation || '';      console.log('[handlePlaceOrder] Calling checkout with:', {
        selectedCourier,
        dynamicShippingCost,
        buyerCoords,
        supplierCoords,
        buyerAddressLabel,
        supplierAddress,
        paymentMethod
      });
      

      
      const orderId = await checkout(checkoutItems, selectedCourier,
        dynamicShippingCost,
        buyerCoords,
        supplierCoords,
        buyerAddressLabel,
        supplierAddress,
        paymentMethod
      );
      
      console.log('[handlePlaceOrder] Checkout returned orderId:', orderId);
      
      if (!orderId) {
        throw new Error('Order ID is empty or undefined');
      }
      
      onOrderCreated(orderId);
    } catch (err) {
      console.error('Order placement error:', err);
      console.error('[handlePlaceOrder] Full error:', err);
      if (err instanceof Error) {
        console.error('[handlePlaceOrder] Error message:', err.message);
        console.error('[handlePlaceOrder] Error stack:', err.stack);
      }
      alert('Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getCheapestEkspedisi = () => {
    if (isCalculatingOngkir) return { name: 'Menghitung...', cost: -1 };
    if (rajaOngkirCosts.length === 0) return { name: 'Klik untuk muat tarif', cost: -1 };
    const cheapest = rajaOngkirCosts[0];
    return {
      name: `${cheapest.courier} - ${cheapest.service}`,
      cost: cheapest.cost
    };
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="checkout-toolbar">
          <div className="checkout-toolbar-inner">
            <button className="checkout-back-btn" onClick={onBack}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <h1 className="checkout-header-title">Checkout</h1>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className={`checkout-content ${step === 'map' ? 'map-mode' : ''}`} scrollY={step !== 'map'}>
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
              {/* Fixed center pin - stays in center while map moves */}
              <div className="map-center-pin">
                <IonIcon icon={locationSharp} />
              </div>
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
                
                <MapController center={buyerCoords} onMoveEnd={(pos) => { setBuyerCoords(pos); reverseGeocode(pos[0], pos[1]); }} />
              </MapContainer>
            </div>

            <div className="map-bottom-card">
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

            <div className="checkout-section-title">Waktu Pengiriman</div>
            <IonRadioGroup value={deliveryTime} onIonChange={(e) => setDeliveryTime(e.detail.value)}>
              <div className="delivery-time-cards">
                {DELIVERY_TIMES.map((time) => (
                  <div
                    key={time.id}
                    className={`delivery-time-card ${deliveryTime === time.id ? 'active' : ''}`}
                    onClick={() => setDeliveryTime(time.id)}
                  >
                    <div className="delivery-time-header">
                      <IonIcon icon={timeOutline} className="time-icon" />
                      <IonRadio value={time.id} />
                    </div>
                    <div className="delivery-time-info">
                      <h4>{time.label}</h4>
                      <p>{time.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </IonRadioGroup>

            <div className="checkout-section-title">Metode Pembayaran</div>
            <div className="payment-method-section">
              <div
                className={`payment-method-card ${paymentMethod === 'qris' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); console.log('Payment method changed to QRIS'); setPaymentMethod('qris'); }}
              >
                <div className="payment-method-info">
                  <h4>Pembayaran Digital (Midtrans)</h4>
                  <p>QRIS, GoPay, OVO, ShopeePay, & Transfer VA Bank</p>
                </div>
                <IonRadio value="qris" checked={paymentMethod === 'qris'} />
              </div>

              <div
                className={`payment-method-card ${paymentMethod === 'cod' ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); console.log('Payment method changed to COD'); setPaymentMethod('cod'); }}
              >
                <div className="payment-method-info">
                  <h4>Bayar di Tempat (COD)</h4>
                  <p>Bayar tunai saat komoditas tiba di lokasi Anda</p>
                </div>
                <IonRadio value="cod" checked={paymentMethod === 'cod'} />
              </div>
            </div>

            <div className="checkout-section-title">Opsi Pengiriman</div>
            <div className="distance-info-bar">
              <IonIcon icon={locationOutline} />
              <span>{distanceInfo}</span>
            </div>
            <IonRadioGroup value={selectedCourier} onIonChange={(e) => setSelectedCourier(e.detail.value)}>
              <div className="shipping-methods-list">
                
                {/* COD */}
                <div
                  className={`shipping-method-card ${selectedCourier === 'cod' ? 'active' : ''}`}
                  onClick={() => setSelectedCourier('cod')}
                >
                  <div className="shipping-radio-row">
                    <div className="shipping-info-left">
                      <h4 className="shipping-method-name">COD (Cash on Delivery)</h4>
                      <p className="shipping-method-desc">Bayar saat barang tiba</p>
                    </div>
                    <div className="shipping-info-right">
                      <IonRadio value="cod" className="custom-radio" />
                    </div>
                  </div>
                </div>

                {/* Kurir Lokal */}
                <div
                  className={`shipping-method-card ${selectedCourier === 'kurir-lokal' ? 'active' : ''}`}
                  onClick={() => setSelectedCourier('kurir-lokal')}
                >
                  <div className="shipping-radio-row">
                    <div className="shipping-info-left">
                      <h4 className="shipping-method-name">Kurir Lokal</h4>
                      <p className="shipping-method-desc">Ongkir dihitung berdasarkan jarak kota</p>
                    </div>
                    <div className="shipping-info-right">
                      <span className="shipping-method-price">Rp {calculateLocalCourierCost(buyerAddressLabel, supplierLocation).toLocaleString('id-ID')}</span>
                      <IonRadio value="kurir-lokal" className="custom-radio" />
                    </div>
                  </div>
                </div>

                {/* Ekspedisi */}
                <div
                  className={`shipping-method-card ${selectedCourier === 'ekspedisi' ? 'active' : ''}`}
                  onClick={() => setSelectedCourier('ekspedisi')}
                >
                  <div className="shipping-radio-row">
                    <div className="shipping-info-left">
                      <h4 className="shipping-method-name">Ekspedisi Reguler</h4>
                      <p className="shipping-method-desc">Pilih ekspedisi yang tersedia</p>
                    </div>
                    <div className="shipping-info-right">
                      <span className="shipping-method-price" style={{ color: getCheapestEkspedisi().cost === -1 ? '#94a3b8' : undefined, fontSize: getCheapestEkspedisi().cost === -1 ? '11px' : undefined }}>
                        {getCheapestEkspedisi().cost === -1
                          ? getCheapestEkspedisi().name
                          : `Rp ${getCheapestEkspedisi().cost.toLocaleString('id-ID')}`
                        }
                      </span>
                      <IonRadio value="ekspedisi" className="custom-radio" />
                    </div>
                  </div>

                  {selectedCourier === 'ekspedisi' && (
                    <div className="ekspedisi-expand-section">
                      <button 
                        className="ekspedisi-expand-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEkspedisiExpanded(!ekspedisiExpanded);
                        }}
                      >
                        <span>{ekspedisiExpanded ? 'Tutup Pilihan Ekspedisi' : 'Lihat Pilihan Ekspedisi'}</span>
                        <IonIcon 
                          icon={chevronDownOutline} 
                          style={{ transform: ekspedisiExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                        />
                      </button>

                      {ekspedisiExpanded && rajaOngkirCosts.length > 0 && (
                        <div className="ekspedisi-options-list">
                          {rajaOngkirCosts.map((ekspedisi) => (
                            <div
                              key={ekspedisi.id}
                              className={`ekspedisi-option-item ${selectedEkspedisi === ekspedisi.id ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEkspedisi(ekspedisi.id);
                                setDynamicShippingCost(ekspedisi.cost);
                              }}
                            >
                              <div className="ekspedisi-info">
                                <h5>{ekspedisi.courier} - {ekspedisi.service}</h5>
                                <p>Estimasi: {ekspedisi.etd} hari</p>
                              </div>
                              <div className="ekspedisi-price">
                                <span>Rp {ekspedisi.cost.toLocaleString('id-ID')}</span>
                                <IonRadio value={ekspedisi.id} checked={selectedEkspedisi === ekspedisi.id} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {ekspedisiExpanded && isCalculatingOngkir && (
                        <div className="ekspedisi-loading">
                          <IonSpinner name="crescent" />
                          <span>Memuat opsi ekspedisi...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
            <div className="pricing-breakdown-wrapper">
              <div className="pricing-breakdown-card">
                <div className="breakdown-row">
                  <span>Subtotal untuk Produk</span>
                  <span>Rp {itemsTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="breakdown-row">
                  <span>Ongkos Pengiriman</span>
                  <span style={{ color: selectedCourier === 'ekspedisi' && dynamicShippingCost === 0 && !isCalculatingOngkir ? '#94a3b8' : undefined }}>
                    {isCalculatingOngkir
                      ? 'Menghitung...'
                      : selectedCourier === 'ekspedisi' && dynamicShippingCost === 0
                        ? 'Pilih ekspedisi'
                        : `Rp ${dynamicShippingCost.toLocaleString('id-ID')}`
                    }
                  </span>
                </div>
                <div className="breakdown-row">
                  <span>Biaya Layanan Aplikasi</span>
                  <span>Rp {serviceFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="breakdown-row total-row-bold">
                  <span>Total Tagihan</span>
                  <span className="total-highlight">Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="escrow-notice-hanging">
                <IonIcon icon={informationCircleOutline} />
                <span>Dana Anda akan diteruskan kepada supplier setelah barang tiba dalam kondisi baik</span>
              </div>
            </div>

            <div style={{ height: '140px' }}></div>
          </>
        )}
      </IonContent>

      {step === 'summary' && (
        <div className="checkout-footer-new">
          <div className="footer-price-section">
            <div className="footer-price-label">Total Pembayaran</div>
            <div className="footer-price-values">
              <span className="footer-price-discounted">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
            <button className="footer-summary-btn">Lihat ringkasan</button>
          </div>
          <IonButton
            className="checkout-btn-green-new"
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





























