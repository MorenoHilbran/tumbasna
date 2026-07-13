// Shipping Calculator for Tumbasna - Banyumas Raya Region
// Zone-based pricing system

export interface ShippingZone {
  label: string;
  price: number;
  description: string;
  examples: string[];
}

export const DELIVERY_ZONES: Record<string, ShippingZone> = {
  same_city: {
    label: 'Dalam Kota',
    price: 2500,
    description: 'Pengiriman dalam 1 kota/kabupaten',
    examples: ['Purwokerto ke Purwokerto', 'Cilacap ke Cilacap']
  },
  near_city: {
    label: 'Antar Kota Dekat',
    price: 5000,
    description: 'Pengiriman ke kota/kabupaten tetangga',
    examples: [
      'Banyumas ↔ Purbalingga',
      'Banyumas ↔ Cilacap',
      'Purbalingga ↔ Banjarnegara'
    ]
  },
  far_city: {
    label: 'Antar Kota Jauh',
    price: 10000,
    description: 'Pengiriman antar kota dalam Barlingmascakeb',
    examples: [
      'Banyumas ↔ Kebumen',
      'Cilacap ↔ Tegal',
      'Banjarnegara ↔ Tegal'
    ]
  }
};

// City zone mapping
export const CITY_ZONES: Record<string, number> = {
  // Zone 1 - Banyumas area
  'Banyumas': 1,
  'Purwokerto': 1,
  'Sokaraja': 1,
  'Sumbang': 1,
  'Baturaden': 1,
  
  // Zone 2 - Nearby cities
  'Purbalingga': 2,
  'Bobotsari': 2,
  'Bukateja': 2,
  
  // Zone 2 - Cilacap area
  'Cilacap': 2,
  'Majenang': 2,
  'Sidareja': 2,
  'Kroya': 2,
  
  // Zone 3 - Far cities
  'Banjarnegara': 3,
  'Dieng': 3,
  'Klampok': 3,
  
  // Zone 3 - Kebumen area
  'Kebumen': 3,
  'Gombong': 3,
  'Karanganyar': 3,
  
  // Zone 4 - Tegal (furthest)
  'Tegal': 4,
  'Slawi': 4,
  'Adiwerna': 4,
};

// City name variations mapping
const CITY_ALIASES: Record<string, string> = {
  'purwokerto': 'Purwokerto',
  'pwt': 'Purwokerto',
  'banyumas': 'Banyumas',
  'bms': 'Banyumas',
  'cilacap': 'Cilacap',
  'clp': 'Cilacap',
  'purbalingga': 'Purbalingga',
  'pbg': 'Purbalingga',
  'banjarnegara': 'Banjarnegara',
  'bjn': 'Banjarnegara',
  'kebumen': 'Kebumen',
  'kbm': 'Kebumen',
  'tegal': 'Tegal',
  'tgl': 'Tegal',
};

/**
 * Normalize city name to standard format
 */
export function normalizeCity(city: string): string {
  if (!city) return 'Banyumas';
  
  const cleaned = city.trim().toLowerCase();
  
  // Check aliases first
  if (CITY_ALIASES[cleaned]) {
    return CITY_ALIASES[cleaned];
  }
  
  // Try to extract city from full address
  // Example: "Jl. Sudirman, Purwokerto, Banyumas" -> extract Purwokerto or Banyumas
  for (const [alias, standard] of Object.entries(CITY_ALIASES)) {
    if (cleaned.includes(alias)) {
      return standard;
    }
  }
  
  // Return as-is if not found (capitalize first letter)
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
}

/**
 * Calculate shipping cost based on supplier and buyer cities
 */
export function calculateShippingCost(
  supplierCity: string,
  buyerCity: string,
  paymentMethod: string = 'QRIS'
): number {
  // COD = Free shipping
  if (paymentMethod === 'COD') {
    return 0;
  }
  
  const supplier = normalizeCity(supplierCity);
  const buyer = normalizeCity(buyerCity);
  
  // Same city
  if (supplier === buyer) {
    return DELIVERY_ZONES.same_city.price;
  }
  
  // Get zones
  const supplierZone = CITY_ZONES[supplier] || 1;
  const buyerZone = CITY_ZONES[buyer] || 1;
  const distance = Math.abs(supplierZone - buyerZone);
  
  // Calculate based on zone distance
  if (distance === 1) {
    return DELIVERY_ZONES.near_city.price;
  }
  
  if (distance >= 2) {
    return DELIVERY_ZONES.far_city.price;
  }
  
  return DELIVERY_ZONES.same_city.price;
}

/**
 * Get shipping zone identifier
 */
export function getShippingZone(
  supplierCity: string,
  buyerCity: string
): string {
  const supplier = normalizeCity(supplierCity);
  const buyer = normalizeCity(buyerCity);
  
  if (supplier === buyer) return 'same_city';
  
  const supplierZone = CITY_ZONES[supplier] || 1;
  const buyerZone = CITY_ZONES[buyer] || 1;
  const distance = Math.abs(supplierZone - buyerZone);
  
  if (distance === 1) return 'near_city';
  if (distance >= 2) return 'far_city';
  
  return 'same_city';
}

/**
 * Get shipping zone details
 */
export function getShippingZoneDetails(zone: string): ShippingZone {
  return DELIVERY_ZONES[zone] || DELIVERY_ZONES.same_city;
}

/**
 * Format shipping cost for display
 */
export function formatShippingCost(cost: number): string {
  if (cost === 0) return 'GRATIS';
  return `Rp ${cost.toLocaleString('id-ID')}`;
}

/**
 * Get estimated delivery time based on zone
 */
export function getDeliveryEstimate(zone: string): string {
  switch (zone) {
    case 'same_city':
      return 'Hari ini - Besok';
    case 'near_city':
      return '1-2 hari';
    case 'far_city':
      return '2-3 hari';
    default:
      return '1-3 hari';
  }
}

/**
 * Calculate total shipping for multiple orders
 */
export function calculateTotalShipping(
  orders: Array<{ supplierCity: string; buyerCity: string }>,
  paymentMethod: string = 'QRIS'
): number {
  return orders.reduce((total, order) => {
    return total + calculateShippingCost(
      order.supplierCity,
      order.buyerCity,
      paymentMethod
    );
  }, 0);
}
