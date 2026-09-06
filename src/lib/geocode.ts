const CITY_COORDS: Record<string, { lat: number; lng: number; region?: string; country: string }> = {
  "los angeles": { lat: 34.0522, lng: -118.2437, region: "CA", country: "USA" },
  "san francisco": { lat: 37.7749, lng: -122.4194, region: "CA", country: "USA" },
  "new york": { lat: 40.7128, lng: -74.006, region: "NY", country: "USA" },
  "seattle": { lat: 47.6062, lng: -122.3321, region: "WA", country: "USA" },
  "austin": { lat: 30.2672, lng: -97.7431, region: "TX", country: "USA" },
  "chicago": { lat: 41.8781, lng: -87.6298, region: "IL", country: "USA" },
  "boston": { lat: 42.3601, lng: -71.0589, region: "MA", country: "USA" },
  "palo alto": { lat: 37.4419, lng: -122.143, region: "CA", country: "USA" },
  "denver": { lat: 39.7392, lng: -104.9903, region: "CO", country: "USA" },
  "london": { lat: 51.5074, lng: -0.1278, country: "UK" },
  "cambridge": { lat: 42.3736, lng: -71.1097, region: "MA", country: "USA" },
  "miami": { lat: 25.7617, lng: -80.1918, region: "FL", country: "USA" },
};

export interface GeocodeResult {
  city: string;
  region: string | null;
  country: string;
  lat: number;
  lng: number;
}

export async function geocodeCity(query: string): Promise<GeocodeResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=place&limit=1`
      );
      const data = await res.json();
      const feature = data.features?.[0];
      if (feature) {
        const [lng, lat] = feature.center;
        const ctx = feature.context ?? [];
        const region = ctx.find((c: { id: string }) => c.id.startsWith("region"))?.short_code?.replace("US-", "") ?? null;
        const country = ctx.find((c: { id: string }) => c.id.startsWith("country"))?.text ?? "Unknown";
        return { city: feature.text, region, country, lat, lng };
      }
    } catch {
      /* fall through */
    }
  }

  const key = query.toLowerCase().split(",")[0].trim();
  const match = CITY_COORDS[key];
  if (match) {
    return {
      city: query.split(",")[0].trim(),
      region: match.region ?? null,
      country: match.country,
      lat: match.lat,
      lng: match.lng,
    };
  }

  return null;
}
