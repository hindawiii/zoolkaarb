// Mock Sudanese services directory — used as fallback when Overpass API fails
export type Category = "pharmacy" | "hospital" | "restaurant" | "service";

export interface Place {
  id: string;
  name: string;
  nameAr: string;
  category: Category;
  city: string;
  lat: number;
  lon: number;
  open247?: boolean;
  phone?: string;
}

export const SUDAN_MOCK_PLACES: Place[] = [
  // Khartoum
  { id: "k1", name: "Al-Faisal Pharmacy", nameAr: "صيدلية الفيصل", category: "pharmacy", city: "Khartoum", lat: 15.5007, lon: 32.5599, open247: true, phone: "+249912345678" },
  { id: "k2", name: "Khartoum Pharmacy", nameAr: "صيدلية الخرطوم", category: "pharmacy", city: "Khartoum", lat: 15.5917, lon: 32.5320 },
  { id: "k3", name: "Royal Care Hospital", nameAr: "مستشفى رويال كير", category: "hospital", city: "Khartoum", lat: 15.5800, lon: 32.5300, open247: true },
  { id: "k4", name: "Fedail Hospital", nameAr: "مستشفى فضيل", category: "hospital", city: "Khartoum", lat: 15.5750, lon: 32.5450 },
  { id: "k5", name: "Solitaire Restaurant", nameAr: "مطعم سوليتير", category: "restaurant", city: "Khartoum", lat: 15.5934, lon: 32.5570 },
  { id: "k6", name: "Assaha Sudanese Village", nameAr: "الساحة السودانية", category: "restaurant", city: "Khartoum", lat: 15.5680, lon: 32.5420 },
  { id: "k7", name: "Zain Service Center", nameAr: "مركز خدمات زين", category: "service", city: "Khartoum", lat: 15.5830, lon: 32.5360 },
  { id: "k8", name: "Bank of Khartoum ATM", nameAr: "صراف بنك الخرطوم", category: "service", city: "Khartoum", lat: 15.5520, lon: 32.5340 },

  // Port Sudan
  { id: "p1", name: "Red Sea Pharmacy", nameAr: "صيدلية البحر الأحمر", category: "pharmacy", city: "Port Sudan", lat: 19.6158, lon: 37.2164, open247: true },
  { id: "p2", name: "Port Sudan Teaching Hospital", nameAr: "مستشفى بورتسودان التعليمي", category: "hospital", city: "Port Sudan", lat: 19.6200, lon: 37.2200, open247: true },
  { id: "p3", name: "Corniche Restaurant", nameAr: "مطعم الكورنيش", category: "restaurant", city: "Port Sudan", lat: 19.6170, lon: 37.2230 },
  { id: "p4", name: "MTN Service Point", nameAr: "نقطة خدمة MTN", category: "service", city: "Port Sudan", lat: 19.6140, lon: 37.2180 },

  // Madani (Wad Madani)
  { id: "m1", name: "Al-Gezira Pharmacy", nameAr: "صيدلية الجزيرة", category: "pharmacy", city: "Madani", lat: 14.4017, lon: 33.5199, open247: true },
  { id: "m2", name: "Wad Madani Hospital", nameAr: "مستشفى ود مدني", category: "hospital", city: "Madani", lat: 14.4050, lon: 33.5180, open247: true },
  { id: "m3", name: "Al-Nile Restaurant", nameAr: "مطعم النيل", category: "restaurant", city: "Madani", lat: 14.4000, lon: 33.5220 },
  { id: "m4", name: "Sudani Service Center", nameAr: "مركز خدمات سوداني", category: "service", city: "Madani", lat: 14.4030, lon: 33.5170 },
];

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

const OVERPASS_TAG: Record<Category, string> = {
  pharmacy: 'amenity=pharmacy',
  hospital: 'amenity=hospital',
  restaurant: 'amenity=restaurant',
  service: 'shop=mobile_phone',
};

export async function fetchOverpassNearby(
  loc: { lat: number; lon: number },
  category: Category,
  radiusMeters = 5000,
): Promise<Place[]> {
  const tag = OVERPASS_TAG[category];
  const query = `[out:json][timeout:10];node[${tag}](around:${radiusMeters},${loc.lat},${loc.lon});out 30;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = await res.json();
  return (data.elements ?? []).map((el: { id: number; lat: number; lon: number; tags?: Record<string, string> }) => ({
    id: `osm-${el.id}`,
    name: el.tags?.name || el.tags?.["name:en"] || "Unnamed",
    nameAr: el.tags?.["name:ar"] || el.tags?.name || "بدون اسم",
    category,
    city: el.tags?.["addr:city"] || "",
    lat: el.lat,
    lon: el.lon,
    phone: el.tags?.phone,
  }));
}

export function nearestFromMock(loc: { lat: number; lon: number }, category: Category): Place[] {
  return SUDAN_MOCK_PLACES.filter((p) => p.category === category)
    .map((p) => ({ ...p, _d: haversineKm(loc, p) }))
    .sort((a, b) => a._d - b._d)
    .slice(0, 20);
}
