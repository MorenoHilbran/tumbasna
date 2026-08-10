import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonToast,
  IonModal
} from '@ionic/react';
import { useApp } from '../context/AppContext';
import './Cocokkan.css';

interface CocokkanProps {
  onBack: () => void;
  onNavigateToChat?: (supplierName: string) => void;
}

interface MatchResult {
  id: string;
  supplierName: string;
  commodity: string;
  qty: number;
  price: number;
  location: string;
  distance?: number;
  score?: number;
  type: 'SUPPLY' | 'DEMAND';
  supplierPhone?: string;
}

const COMMODITIES = [
  'Cabai Merah', 'Cabai Rawit', 'Bawang Merah', 'Bawang Putih',
  'Tomat', 'Jagung', 'Beras', 'Kedelai', 'Gula Pasir',
  'Jahe', 'Kunyit', 'Kentang', 'Wortel', 'Jeruk'
];

const LOCATIONS = [
  'Banyumas', 'Cilacap', 'Purbalingga', 'Banjarnegara',
  'Kebumen', 'Tegal', 'Brebes', 'Magelang', 'Boyolali'
];

const Cocokkan: React.FC<CocokkanProps> = ({ onBack, onNavigateToChat }) => {
  const { products } = useApp();
  const [commodity, setCommodity] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Modal states for custom UI pickers
  const [showCommodityModal, setShowCommodityModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchCommodityQuery, setSearchCommodityQuery] = useState('');
  const [searchLocationQuery, setSearchLocationQuery] = useState('');

  const filteredCommodities = COMMODITIES.filter(c =>
    c.toLowerCase().includes(searchCommodityQuery.toLowerCase())
  );

  const filteredLocations = LOCATIONS.filter(l =>
    l.toLowerCase().includes(searchLocationQuery.toLowerCase())
  );

  const handleSearch = async () => {
    if (!commodity) {
      setToastMsg('Pilih komoditas terlebih dahulu');
      setShowToast(true);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://api.tumbasna.my.id';
      const params = new URLSearchParams({
        commodity,
        type: 'SUPPLY',
        ...(qty && { qty }),
        ...(price && { maxPrice: price }),
        ...(location && { location }),
      });

      const res = await fetch(`${API_BASE}/api/matching/search?${params}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setResults(json.data);
      } else {
        let filtered = products.filter(p => p.name.toLowerCase().includes(commodity.toLowerCase()));
        if (location) {
          filtered = filtered.filter(p => p.supplierLocation.toLowerCase().includes(location.toLowerCase()));
        }
        if (price) {
          filtered = filtered.filter(p => p.price <= parseFloat(price));
        }
        if (qty) {
          filtered = filtered.filter(p => p.stock >= parseFloat(qty));
        }

        const mappedResults = filtered.map(p => ({
          id: p.id,
          supplierName: p.supplierName,
          commodity: p.name,
          qty: p.stock,
          price: p.price,
          location: p.supplierLocation,
          type: 'SUPPLY' as const,
          supplierPhone: p.supplierPhone,
        }));
        setResults(mappedResults);
      }
    } catch (err) {
      let filtered = products.filter(p => p.name.toLowerCase().includes(commodity.toLowerCase()));
      if (location) {
        filtered = filtered.filter(p => p.supplierLocation.toLowerCase().includes(location.toLowerCase()));
      }
      if (price) {
        filtered = filtered.filter(p => p.price <= parseFloat(price));
      }

      const mappedResults = filtered.map(p => ({
        id: p.id,
        supplierName: p.supplierName,
        commodity: p.name,
        qty: p.stock,
        price: p.price,
        location: p.supplierLocation,
        type: 'SUPPLY' as const,
        supplierPhone: p.supplierPhone,
      }));
      setResults(mappedResults);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="cocokkan-toolbar">
          <div className="cocokkan-header-inner">
            <button className="cocokkan-back-btn" onClick={onBack} aria-label="Kembali">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className="cocokkan-header-title">
              <h1>Pencocokan Komoditas</h1>
              <p>Cari pasokan komoditas otomatis</p>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="cocokkan-root">
        {/* Form Container */}
        <div className="cocokkan-form">
          <div className="cocokkan-form-card">
            {/* Custom UI Picker Trigger: Komoditas */}
            <div className="cocokkan-field">
              <label>Komoditas yang Dicari</label>
              <div 
                className={`custom-picker-trigger ${commodity ? 'has-value' : ''}`}
                onClick={() => setShowCommodityModal(true)}
              >
                <span>{commodity || '-- Pilih Komoditas --'}</span>
                <div className="picker-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Input Row: Qty & Price */}
            <div className="cocokkan-field">
              <div className="field-row">
                <div>
                  <label>Jumlah (kg)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 500"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                  />
                </div>
                <div>
                  <label>Maks. Harga/kg</label>
                  <input
                    type="number"
                    placeholder="Contoh: 5000"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Custom UI Picker Trigger: Lokasi */}
            <div className="cocokkan-field">
              <label>Preferensi Lokasi</label>
              <div 
                className={`custom-picker-trigger ${location ? 'has-value' : ''}`}
                onClick={() => setShowLocationModal(true)}
              >
                <span>{location || '-- Semua Lokasi --'}</span>
                <div className="picker-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="cocokkan-submit"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <div className="cocokkan-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                  Mencari Pasokan...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  Cari Pasokan Komoditas
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="cocokkan-results">
            <div className="cocokkan-results-head">
              <h3>Hasil Pencocokan Pasokan</h3>
              {results.length > 0 && (
                <span className="cocokkan-results-count">{results.length} ditemukan</span>
              )}
            </div>

            {isSearching ? (
              <div className="cocokkan-loading">
                <div className="cocokkan-spinner"></div>
              </div>
            ) : results.length === 0 ? (
              <div className="cocokkan-empty">
                <div className="cocokkan-empty-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </div>
                <h4>Belum Ada Pasokan Cocok</h4>
                <p>Tidak ditemukan pasokan komoditas yang sesuai saat ini. Coba ubah filter pencarian Anda.</p>
              </div>
            ) : (
              results.map(match => (
                <div key={match.id} className="match-card">
                  <div className="match-card-top">
                    <div className="match-card-avatar">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div className="match-card-info">
                      <h4>{match.supplierName}</h4>
                      <p>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {match.location}
                        {match.distance ? ` - ${match.distance.toFixed(1)} km` : ''}
                      </p>
                    </div>
                    <span className={`match-card-score ${(match.score || 0) > 0.7 ? 'high' : 'medium'}`}>
                      {match.score ? `${Math.round(match.score * 100)}%` : 'Cocok'}
                    </span>
                  </div>

                  <div className="match-card-details">
                    <div className="match-detail-item">
                      <span>Komoditas</span>
                      <strong>{match.commodity}</strong>
                    </div>
                    <div className="match-detail-item">
                      <span>Stok</span>
                      <strong>{match.qty} kg</strong>
                    </div>
                    <div className="match-detail-item">
                      <span>Harga</span>
                      <strong>Rp {match.price.toLocaleString('id-ID')}</strong>
                    </div>
                  </div>

                  <div className="match-card-actions">
                    <button
                      className="match-action-btn secondary"
                      onClick={() => {
                        if (onNavigateToChat) {
                          onNavigateToChat(match.supplierName);
                        }
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Chat
                    </button>
                    <button
                      className="match-action-btn primary"
                      onClick={() => {
                        if (match.supplierPhone) {
                          const msg = encodeURIComponent(`Halo ${match.supplierName}, saya tertarik dengan ${match.commodity} Anda di Tumbasna.`);
                          window.open(`https://wa.me/${match.supplierPhone}?text=${msg}`, '_blank');
                        } else {
                          setToastMsg('Hubungi supplier melalui fitur Chat');
                          setShowToast(true);
                        }
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      Hubungi
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ height: 40 }}></div>

        {/* CUSTOM BOTTOM SHEET MODAL: Komoditas */}
        <IonModal
          isOpen={showCommodityModal}
          onDidDismiss={() => { setShowCommodityModal(false); setSearchCommodityQuery(''); }}
          breakpoints={[0, 0.65, 0.9]}
          initialBreakpoint={0.65}
          className="custom-picker-modal"
        >
          <div className="picker-modal-content">
            <div className="picker-modal-header">
              <div className="picker-modal-handle"></div>
              <h3>Pilih Komoditas</h3>
              <button className="picker-modal-close" onClick={() => setShowCommodityModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="picker-modal-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Cari nama komoditas..."
                value={searchCommodityQuery}
                onChange={e => setSearchCommodityQuery(e.target.value)}
              />
            </div>

            <div className="picker-modal-list">
              {filteredCommodities.map(c => {
                const isSelected = commodity === c;
                return (
                  <div
                    key={c}
                    className={`picker-modal-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setCommodity(c);
                      setShowCommodityModal(false);
                    }}
                  >
                    <span>{c}</span>
                    {isSelected && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </IonModal>

        {/* CUSTOM BOTTOM SHEET MODAL: Lokasi */}
        <IonModal
          isOpen={showLocationModal}
          onDidDismiss={() => { setShowLocationModal(false); setSearchLocationQuery(''); }}
          breakpoints={[0, 0.65, 0.9]}
          initialBreakpoint={0.65}
          className="custom-picker-modal"
        >
          <div className="picker-modal-content">
            <div className="picker-modal-header">
              <div className="picker-modal-handle"></div>
              <h3>Pilih Preferensi Lokasi</h3>
              <button className="picker-modal-close" onClick={() => setShowLocationModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="picker-modal-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Cari lokasi/kota..."
                value={searchLocationQuery}
                onChange={e => setSearchLocationQuery(e.target.value)}
              />
            </div>

            <div className="picker-modal-list">
              <div
                className={`picker-modal-item ${location === '' ? 'selected' : ''}`}
                onClick={() => {
                  setLocation('');
                  setShowLocationModal(false);
                }}
              >
                <span>-- Semua Lokasi --</span>
                {location === '' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              {filteredLocations.map(l => {
                const isSelected = location === l;
                return (
                  <div
                    key={l}
                    className={`picker-modal-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setLocation(l);
                      setShowLocationModal(false);
                    }}
                  >
                    <span>{l}</span>
                    {isSelected && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2500}
          position="bottom"
          className="custom-toast"
        />
      </IonContent>
    </IonPage>
  );
};

export default Cocokkan;
