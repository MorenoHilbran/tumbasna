export async function geocodeLocation(locationRaw: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const lowerLoc = locationRaw.toLowerCase();

    // Ensure search is focused on Indonesia to prevent picking up international locations with similar names
    const query = `${locationRaw}, Indonesia`;
    
    // Attempt using OpenStreetMap Nominatim API
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`, {
      headers: {
        'User-Agent': 'TumbasnaApp/1.0'
      }
    });
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      // List of address types that should trigger randomization
      const broadTypes = ['city', 'town', 'village', 'municipality', 'county', 'state_district', 'state', 'region', 'administrative', 'suburb'];
      const isBroad = broadTypes.includes(result.addresstype) || broadTypes.includes(result.type);

      if (isBroad) {
        // Gunakan titik tengah (center) kota/provinsi, lalu kita acak JATUHNYA dalam radius KECIL (contoh: +/- 3 hingga 5 KM) 
        // Bounding box OSM tidak dipakai karena sering kali memanjang ke laut lepas (seperti di Banten atau Jakarta).
        const offsetLat = (Math.random() - 0.5) * 0.05; // ~5km
        const offsetLng = (Math.random() - 0.5) * 0.05; // ~5km
        
        const randomLat = lat + offsetLat;
        const randomLng = lng + offsetLng;
        
        console.log(`[GEO] Broad location "${locationRaw}" found. Randomization centered safely inland.`);
        return { lat: randomLat, lng: randomLng };
      }

      console.log(`[GEO] Specific location found for "${locationRaw}":`, result.display_name);
      return { lat, lng };
    }
    
    // Fallback: simple mapping if OSM fails (mostly for broad regions)
    if (lowerLoc.includes('brebes')) return { lat: -6.8706, lng: 109.0431 };
    if (lowerLoc.includes('purwokerto')) return { lat: -7.4214, lng: 109.2479 };
    if (lowerLoc.includes('demak')) return { lat: -6.8948, lng: 110.6386 };
    if (lowerLoc.includes('malang')) return { lat: -7.9797, lng: 112.6304 };
    
    return null;
  } catch (error) {
    console.error("Geocoding Error:", error);
    return null;
  }
}
