import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonIcon,
  IonButton,
  IonBadge,
  IonToast
} from '@ionic/react';
import {
  arrowBackOutline,
  checkmarkCircle,
  shieldCheckmarkOutline,
  alertCircleOutline,
  logoWhatsapp,
  chatbubblesOutline,
  star,
  starOutline
} from 'ionicons/icons';
import { useApp } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './DetailPesanan.css';

interface DetailPesananProps {
  orderId: string;
  onBack: () => void;
  onNavigateToChat: (supplierName: string) => void;
  onNavigateToPayment?: (orderId?: string) => void;
}

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

const MapResizeTrigger: React.FC = () => {
  const map = useMap();
  React.useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [map]);
  return null;
};

const MapBoundsController: React.FC<{ supplierLoc: [number, number], buyerLoc: [number, number] }> = ({ supplierLoc, buyerLoc }) => {
  const map = useMap();
  React.useEffect(() => {
    if (supplierLoc && buyerLoc) {
      setTimeout(() => {
        map.fitBounds([supplierLoc, buyerLoc], { padding: [40, 40] });
      }, 200);
    }
  }, [map, supplierLoc, buyerLoc]);
  return null;
};

const DetailPesanan: React.FC<DetailPesananProps> = ({ orderId, onBack, onNavigateToChat, onNavigateToPayment }) => {
  const { user, orders, confirmOrderReceived } = useApp();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  // States for Rating & Review
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  const order = orders.find((o) => o.id === orderId);

  // ── Resolve supplier and buyer coordinates ──
  const getCoordsByLocationName = (loc: string): [number, number] | null => {
    if (!loc) return null;
    const key = Object.keys(locationCoords).find(k => loc.toLowerCase().includes(k.toLowerCase()));
    return key ? (locationCoords[key] as [number, number]) : null;
  };

  let supplierLocation: [number, number] = [-7.5151, 109.2941]; // Default Banyumas
  let buyerLocation: [number, number] = [-7.4244, 109.2300]; // Default Purwokerto

  // Try to parse coordinates from notes, or fallback to profile/city defaults
  let hasParsedFromNotes = false;
  if (order && order.notes) {
    try {
      const parsed = JSON.parse(order.notes);
      if (parsed.supplierCoords && Array.isArray(parsed.supplierCoords) && parsed.supplierCoords.length === 2) {
        supplierLocation = parsed.supplierCoords as [number, number];
        hasParsedFromNotes = true;
      }
      if (parsed.buyerCoords && Array.isArray(parsed.buyerCoords) && parsed.buyerCoords.length === 2) {
        buyerLocation = parsed.buyerCoords as [number, number];
        hasParsedFromNotes = true;
      }
    } catch (e) {
      // notes is not JSON or has different format
    }
  }

  if (!hasParsedFromNotes && order) {
    const resolvedSupplier = getCoordsByLocationName(order.supplierLocation);
    if (resolvedSupplier) {
      supplierLocation = resolvedSupplier;
    }

    const resolvedBuyer = user?.address ? getCoordsByLocationName(user.address) : null;
    if (resolvedBuyer) {
      buyerLocation = resolvedBuyer;
    } else {
      buyerLocation = [supplierLocation[0] - 0.012, supplierLocation[1] + 0.015];
    }
  }

  const midpoint: [number, number] = [
    (supplierLocation[0] + buyerLocation[0]) / 2,
    (supplierLocation[1] + buyerLocation[1]) / 2
  ];

  // ── Courier Position & Map States ──
  const [courierCoords, setCourierCoords] = useState<[number, number]>(supplierLocation);
  const [etaText, setEtaText] = useState('15 Menit');
  const [statusText, setStatusText] = useState('Kurir menunggu pembayaran...');

  // Parse waybill info dari notes order
  let waybillNumber: string | null = null;
  let waybillCourier: string = 'jne';
  if (order && order.notes) {
    try {
      const parsedNotes = JSON.parse(order.notes);
      waybillNumber = parsedNotes.waybillNumber || null;
      waybillCourier = parsedNotes.waybillCourier || 'jne';
    } catch {}
  }

  React.useEffect(() => {
    if (!order) return;
    
    if (order.status === 'Menunggu Pembayaran') {
      setCourierCoords(supplierLocation);
      setEtaText('Menunggu Bayar');
      setStatusText('Menunggu pembayaran QRIS dari pembeli.');
    } else if (order.status === 'Diproses') {
      setCourierCoords(supplierLocation);
      setEtaText('Diproses');
      setStatusText('Supplier sedang menyiapkan barang.');
    } else if (order.status === 'Selesai') {
      setCourierCoords(buyerLocation);
      setEtaText('Tiba');
      setStatusText('Barang sudah sampai dan diterima pembeli.');
    } else if (order.status === 'Dibatalkan') {
      setCourierCoords(supplierLocation);
      setEtaText('Batal');
      setStatusText('Pesanan dibatalkan.');
    } else {
      // Status: 'Dikirim'
      if (waybillNumber) {
        // Mode riil: fetch posisi dari RajaOngkir tracking API
        const fetchTracking = async () => {
          try {
            const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://dashboard.tumbasna.id';
            const res = await fetch(`${API_BASE}/api/shipping/track?waybill=${waybillNumber}&courier=${waybillCourier}`);
            const data = await res.json();
            if (data.success && data.lastCity) {
              const cityCoords = (() => {
                const key = Object.keys(locationCoords).find(k => data.lastCity.toLowerCase().includes(k.toLowerCase()));
                return key ? locationCoords[key] : null;
              })();
              if (cityCoords) {
                setCourierCoords(cityCoords as [number, number]);
              }
              const lastManifest = data.manifests?.[data.manifests.length - 1];
              const lastDesc = lastManifest?.description || data.statusDescription || 'Dalam perjalanan.';
              setStatusText(`[${waybillCourier.toUpperCase()}] Resi: ${waybillNumber} — ${lastDesc}`);
              setEtaText(data.status === 'DELIVERED' ? 'Tiba' : 'Dalam Perjalanan');
            } else {
              setStatusText(`Resi ${waybillNumber} (${waybillCourier.toUpperCase()}) — Dalam perjalanan.`);
              setEtaText('Dalam Perjalanan');
            }
          } catch {
            setStatusText(`Resi ${waybillNumber} — Tidak dapat memuat status saat ini.`);
          }
        };
        fetchTracking();
      } else {
        // Mode simulasi animasi (tidak ada resi)
        let progress = 0;
        const interval = setInterval(() => {
          progress = (progress + 1) % 101;
          
          let lat = supplierLocation[0];
          let lng = supplierLocation[1];
          
          if (progress <= 50) {
            const pct = progress / 50;
            lat = supplierLocation[0] + pct * (buyerLocation[0] - supplierLocation[0]);
            lng = supplierLocation[1];
          } else {
            const pct = (progress - 50) / 50;
            lat = buyerLocation[0];
            lng = supplierLocation[1] + pct * (buyerLocation[1] - supplierLocation[1]);
          }
          
          setCourierCoords([lat, lng] as [number, number]);
          const remainingMinutes = Math.max(1, Math.round((100 - progress) * 0.15));
          setEtaText(`${remainingMinutes} Menit`);
          setStatusText('Kurir lokal sedang menuju alamat pengiriman.');
        }, 300);
        
        return () => clearInterval(interval);
      }
    }
  }, [order?.status, waybillNumber]);

  // Fetch existing review on mount
  React.useEffect(() => {
    if (!orderId) return;
    const fetchReview = async () => {
      try {
        const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://api.tumbasna.my.id';
        const res = await fetch(`${API_BASE}/api/reviews?orderId=${orderId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setRating(json.data.rating);
          setReviewText(json.data.comment || '');
          setHasReviewed(true);
        }
      } catch (err) {
        console.warn('Failed to load existing review:', err);
      }
    };
    fetchReview();
  }, [orderId]);

  const submitReview = async () => {
    if (rating === 0) {
      setToastMsg('Silakan pilih bintang penilaian terlebih dahulu.');
      setShowToast(true);
      return;
    }
    
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://api.tumbasna.my.id';
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order?.id || orderId,
          rating,
          comment: reviewText,
          buyerUserId: user?.id || null,
          supplierName: order?.supplierName || '',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setHasReviewed(true);
        setToastMsg('Ulasan berhasil dikirim! Terima kasih atas penilaian Anda.');
      } else {
        setToastMsg(json.error || 'Gagal mengirim ulasan.');
      }
    } catch (err) {
      console.error('Submit review error:', err);
      setHasReviewed(true);
      setToastMsg('Ulasan tersimpan.');
    }
    setShowToast(true);
  };

  if (!order) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>Memuat detail pesanan...</p>
        </IonContent>
      </IonPage>
    );
  }

  const handleConfirmReceived = async () => {
    if (order.status === 'Menunggu Pembayaran') {
      setToastMsg('Selesaikan pembayaran terlebih dahulu sebelum mengonfirmasi barang diterima.');
      setShowToast(true);
      return;
    }
    await confirmOrderReceived(orderId);
    setToastMsg('Transaksi selesai! Dana telah diteruskan ke rekening bank supplier.');
    setShowToast(true);
  };

  const isCOD = order.courier.toLowerCase().includes('cod') ||
                order.courier.toLowerCase().includes('ambil sendiri') ||
                order.courier.toLowerCase().includes('kurir lokal');

  // Custom divIcons with SVG vectors for maximum compatibility
  const supplierIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:#006837;color:white;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 18h6v-4H9v4z"/><path d="M9 10h2v2H9v-2z"/><path d="M13 10h2v2h-2v-2z"/></svg></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  const buyerIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:#ea580c;color:white;border-radius:50%;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  const courierIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:#2563eb;color:white;border-radius:50%;border:2.5px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);animation:pulse-ring 1.5s infinite;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="ion-no-border">
        <IonToolbar className="order-detail-toolbar">
          <div className="order-detail-inner">
            <button className="header-back-btn" onClick={onBack}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="order-detail-logo-row">
              <img src="/logo.png" alt="Tumbasna" className="order-header-logo-only" />
            </div>
            <div style={{ width: '32px' }}></div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="tracking-content">

        {/* ── Real Leaflet Tracking Map ────────────────────────── */}
        <div className="simulated-map-container" style={{ height: '240px', position: 'relative' }}>
          <MapContainer
            center={midpoint}
            zoom={12}
            style={{ width: '100%', height: '100%', zIndex: 1 }}
            zoomControl={false}
            dragging={true}
            doubleClickZoom={false}
            scrollWheelZoom={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapResizeTrigger />
            <MapBoundsController supplierLoc={supplierLocation} buyerLoc={buyerLocation} />
            
            {/* Dashed Route Path */}
            <Polyline
              positions={[supplierLocation, [buyerLocation[0], supplierLocation[1]] as [number, number], buyerLocation]}
              color="#006837"
              weight={3}
              dashArray="6, 6"
            />

            {/* Supplier Marker */}
            <Marker position={supplierLocation} icon={supplierIcon} />

            {/* Buyer Marker */}
            <Marker position={buyerLocation} icon={buyerIcon} />

            {/* Courier Marker */}
            <Marker position={courierCoords} icon={courierIcon} />
          </MapContainer>

          {/* Map Status Overlay */}
          <div className="map-status-overlay" style={{ zIndex: 10 }}>
            <div className="overlay-top-row">
              <span className="courier-badge">{order.courier}</span>
              <span className="courier-eta">{etaText}</span>
            </div>
            <h4 className="overlay-address-title">Status Pengiriman</h4>
            <p className="overlay-address-text">{statusText}</p>
          </div>
        </div>

        {/* ── Order Summary Card ───────────────────────────── */}
        <div className="tracking-order-summary-card" style={{ marginTop: 12 }}>
          <div className="summary-header">
            <div>
              <span className="order-id-lbl">ID TRANSAKSI</span>
              <h3 className="order-id-val">{order.id}</h3>
            </div>
            <IonBadge
              color={order.status === 'Selesai' ? 'success' : 'secondary'}
              className="order-badge-status"
            >
              {order.status === 'Diproses' ? 'Diproses (Dana Ditahan)' : order.status}
            </IonBadge>
          </div>

          <div className="supplier-row-info">
            <div className="supplier-lbl-grid">
              <span className="lbl-title">Supplier</span>
              <span className="lbl-val">{order.supplierName}</span>
            </div>
            <div className="supplier-lbl-grid right-align">
              <span className="lbl-title">Metode</span>
              <span className="lbl-val">{order.courier}</span>
            </div>
          </div>

          {/* Items list */}
          <div className="order-items-list">
            {order.items.map((item, idx) => (
              <div key={idx} className="order-item-row">
                <img 
                  src={item.product.image || '/logotum.png'} 
                  alt={item.product.name} 
                  className="order-item-thumb" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logotum.png';
                  }}
                />
                <div className="order-item-info">
                  <span className="order-item-name">{item.product.name}</span>
                  <span className="order-item-qty">{item.quantity} kg &middot; Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="order-total-row">
            <span>Total Pembayaran</span>
            <strong>Rp {order.totalAmount.toLocaleString('id-ID')}</strong>
          </div>

          {/* Bukti Resi / Foto Pengiriman */}
          {(waybillNumber || (() => { try { return JSON.parse(order.notes || '{}').waybillImageUrl; } catch { return null; } })()) && (
            <div style={{
              margin: '12px 0 0',
              padding: '12px 14px',
              background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
              borderRadius: 14,
              border: '1px solid #bbf7d0'
            }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                📦 Bukti Pengiriman
              </p>
              {waybillNumber && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nomor Resi</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', fontFamily: 'monospace', marginTop: 2 }}>{waybillNumber}</p>
                  {waybillCourier && (
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#059669', marginTop: 2, textTransform: 'uppercase' }}>{waybillCourier}</p>
                  )}
                </div>
              )}
              {(() => {
                try {
                  const imgUrl = JSON.parse(order.notes || '{}').waybillImageUrl;
                  if (!imgUrl) return null;
                  return (
                    <div>
                      <p style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Foto Bukti Resi</p>
                      <img
                        src={imgUrl}
                        alt="Foto Bukti Resi"
                        style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, border: '1px solid #d1fae5' }}
                      />
                    </div>
                  );
                } catch { return null; }
              })()}
            </div>
          )}
        </div>

        {/* ── COD: Hubungi Supplier via in-app Chat ─────────── */}
        {isCOD && (
          <div className="cod-wa-card">
            <div className="cod-wa-header">
              <IonIcon icon={chatbubblesOutline} />
              <div>
                <strong>Atur COD Langsung dengan Supplier</strong>
                <p>Kirim pesan ke supplier untuk menentukan waktu dan tempat serah terima. Balasan masuk langsung di sini.</p>
              </div>
            </div>
            <button className="wa-contact-btn" onClick={() => onNavigateToChat(order.supplierName)}>
              <IonIcon icon={logoWhatsapp} />
              <span>Chat dengan {order.supplierName}</span>
            </button>
          </div>
        )}

        {/* ── Escrow Security ─────────────────────────────── */}
        <div className={`escrow-details-bar ${order.fundsReleased ? 'released' : 'held'}`} style={{ margin: '0 14px 16px' }}>
          <IonIcon icon={order.fundsReleased ? checkmarkCircle : shieldCheckmarkOutline} />
          <div className="escrow-bar-text">
            <strong>{order.fundsReleased ? 'DANA DICAIRKAN' : 'DANA DITAHAN (ESCROW SECURITY)'}</strong>
            <p>
              {order.fundsReleased
                ? `Dana Rp ${order.totalAmount.toLocaleString('id-ID')} telah diteruskan ke ${order.supplierName}.`
                : `Dana Rp ${order.totalAmount.toLocaleString('id-ID')} aman di rekening bersama Tumbasna hingga barang diterima.`}
            </p>
          </div>
        </div>

        {/* ── Timeline ────────────────────────────────────── */}
        <div className="section-title-tracking">Timeline Transaksi</div>
        <div className="timeline-card">
          <div className="timeline-wrapper">
            {order.trackingTimeline.map((step, idx) => (
              <div
                key={idx}
                className={`timeline-node ${step.done ? 'done' : ''} ${
                  !step.done && order.status === 'Diproses' && idx === 2 ? 'active' : ''
                }`}
              >
                <div className="timeline-indicator-col">
                  <div className="timeline-circle">
                    {step.done ? <IonIcon icon={checkmarkCircle} /> : <span>{idx + 1}</span>}
                  </div>
                  {idx < order.trackingTimeline.length - 1 && <div className="timeline-line"></div>}
                </div>
                <div className="timeline-content-col">
                  <div className="timeline-node-header">
                    <h4 className="node-title">{step.title}</h4>
                    <span className="node-time">{step.time}</span>
                  </div>
                  <p className="node-desc">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Rating & Review Card (Tampil jika Selesai) ── */}
        {order.status === 'Selesai' && (
          <div style={{ margin: '20px 14px' }}>
            <div className="section-title-tracking">Beri Nilai Supplier</div>
            <div className="tracking-order-summary-card" style={{ padding: '20px', textAlign: 'center' }}>
              {!hasReviewed ? (
                <>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Bagaimana kualitas komoditas dari {order.supplierName}?</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <IonIcon 
                        key={starIdx}
                        icon={starIdx <= rating ? star : starOutline} 
                        style={{ fontSize: '32px', color: starIdx <= rating ? '#fbbf24' : '#cbd5e1', cursor: 'pointer', transition: 'color 0.2s' }}
                        onClick={() => setRating(starIdx)}
                      />
                    ))}
                  </div>
                  <textarea 
                    placeholder="Tulis pengalaman belanja Anda di sini..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '12px', color: '#334155', marginBottom: '16px', outline: 'none' }}
                  />
                  <button 
                    onClick={submitReview}
                    style={{ width: '100%', background: '#006837', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '12px', fontSize: '13px' }}
                  >
                    Kirim Ulasan
                  </button>
                </>
              ) : (
                <div style={{ padding: '10px 0' }}>
                  <IonIcon icon={checkmarkCircle} style={{ fontSize: '48px', color: '#10b981', marginBottom: '12px' }} />
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>Ulasan Terkirim</h4>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', margin: '8px 0' }}>
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <IonIcon 
                        key={starIdx}
                        icon={starIdx <= rating ? star : starOutline} 
                        style={{ fontSize: '20px', color: starIdx <= rating ? '#fbbf24' : '#cbd5e1' }}
                      />
                    ))}
                  </div>
                  {reviewText && <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#334155', fontStyle: 'italic' }}>"{reviewText}"</p>}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ height: '120px' }}></div>
      </IonContent>

      {/* ── Floating confirm button ──────────────────────── */}
      {order.status !== 'Selesai' && order.status !== 'Dibatalkan' && (
        <div className="floating-action-footer">
          {order.status === 'Menunggu Pembayaran' ? (
            <>
              <div className="footer-notice-text" style={{ background: '#FFF3CD', border: '1px solid #FFEBAA', color: '#856404' }}>
                <IonIcon icon={alertCircleOutline} style={{ color: '#856404' }} />
                <span>Selesaikan pembayaran terlebih dahulu sebelum mengonfirmasi barang diterima.</span>
              </div>
              {onNavigateToPayment && (
                <IonButton
                  expand="block"
                  color="warning"
                  style={{ fontWeight: 800, marginBottom: '8px' }}
                  onClick={() => onNavigateToPayment(order.id)}
                >
                  Bayar Sekarang
                </IonButton>
              )}
              <IonButton
                expand="block"
                color="tertiary"
                className="confirm-received-btn button-disabled-custom"
                disabled={true}
              >
                Konfirmasi Barang Diterima
              </IonButton>
            </>
          ) : (
            <>
              <div className="footer-notice-text">
                <IonIcon icon={alertCircleOutline} />
                <span>Pastikan barang sudah diterima dan sesuai sebelum konfirmasi.</span>
              </div>
              <IonButton
                expand="block"
                color="tertiary"
                className="confirm-received-btn"
                onClick={handleConfirmReceived}
              >
                Konfirmasi Barang Diterima
              </IonButton>
            </>
          )}
        </div>
      )}

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMsg}
        duration={3000}
        position="bottom"
        className="custom-toast"
      />
    </IonPage>
  );
};

export default DetailPesanan;
