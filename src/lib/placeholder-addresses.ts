export const MAP_PLACEHOLDER_TAG = "Map placeholder";
export const ADDRESS_CONFIRMED_TAG = "Address confirmed";

export type PlaceholderAddress = {
  address: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
};

const PLACEHOLDERS: PlaceholderAddress[] = [
  { address: "18 Session Rd, Baguio City, Benguet", city: "Baguio", region: "Benguet", lat: 16.4126, lng: 120.5931 },
  { address: "45 Quezon Ave, Tuguegarao City, Cagayan", city: "Tuguegarao", region: "Cagayan", lat: 17.6132, lng: 121.727 },
  { address: "9 Rizal St, Laoag City, Ilocos Norte", city: "Laoag", region: "Ilocos Norte", lat: 18.1978, lng: 120.5956 },
  { address: "22 M.H. del Pilar, Dagupan City, Pangasinan", city: "Dagupan", region: "Pangasinan", lat: 16.0433, lng: 120.3334 },
  { address: "14 MacArthur Hwy, San Fernando, Pampanga", city: "San Fernando", region: "Pampanga", lat: 15.0333, lng: 120.684 },
  { address: "88 Maharlika Hwy, Cabanatuan City, Nueva Ecija", city: "Cabanatuan", region: "Nueva Ecija", lat: 15.486, lng: 120.973 },
  { address: "31 JP Rizal, Calamba City, Laguna", city: "Calamba", region: "Laguna", lat: 14.2117, lng: 121.1653 },
  { address: "6 SM City, Lucena City, Quezon", city: "Lucena", region: "Quezon", lat: 13.9373, lng: 121.617 },
  { address: "55 P. Burgos, Batangas City, Batangas", city: "Batangas City", region: "Batangas", lat: 13.7565, lng: 121.0583 },
  { address: "12 Legazpi Blvd, Legazpi City, Albay", city: "Legazpi", region: "Albay", lat: 13.1391, lng: 123.7438 },
  { address: "3 Naga Centro, Naga City, Camarines Sur", city: "Naga", region: "Camarines Sur", lat: 13.6218, lng: 123.1948 },
  { address: "19 Commonwealth Ave, Quezon City, Metro Manila", city: "Quezon City", region: "Metro Manila", lat: 14.676, lng: 121.0437 },
  { address: "27 Taft Ave, Pasay City, Metro Manila", city: "Pasay", region: "Metro Manila", lat: 14.5378, lng: 120.9896 },
  { address: "41 Shaw Blvd, Mandaluyong City, Metro Manila", city: "Mandaluyong", region: "Metro Manila", lat: 14.5794, lng: 121.0359 },
  { address: "8 Ninoy Aquino Ave, Parañaque City, Metro Manila", city: "Parañaque", region: "Metro Manila", lat: 14.4793, lng: 121.0198 },
  { address: "16 Governor's Dr, Dasmariñas, Cavite", city: "Dasmariñas", region: "Cavite", lat: 14.3294, lng: 120.9367 },
  { address: "70 Circumferential Rd, Antipolo City, Rizal", city: "Antipolo", region: "Rizal", lat: 14.6255, lng: 121.1242 },
  { address: "4 Bonifacio St, Puerto Princesa, Palawan", city: "Puerto Princesa", region: "Palawan", lat: 9.7392, lng: 118.7353 },
  { address: "21 Magallanes St, Iloilo City, Iloilo", city: "Iloilo City", region: "Iloilo", lat: 10.7202, lng: 122.5621 },
  { address: "33 Lacson St, Bacolod City, Negros Occidental", city: "Bacolod", region: "Negros Occidental", lat: 10.6765, lng: 122.9505 },
  { address: "11 Colon St, Cebu City, Cebu", city: "Cebu City", region: "Cebu", lat: 10.3099, lng: 123.893 },
  { address: "52 A.S. Fortuna, Mandaue City, Cebu", city: "Mandaue", region: "Cebu", lat: 10.3231, lng: 123.9222 },
  { address: "7 Osmeña Blvd, Talisay City, Cebu", city: "Talisay", region: "Cebu", lat: 10.2447, lng: 123.8494 },
  { address: "15 Real St, Tacloban City, Leyte", city: "Tacloban", region: "Leyte", lat: 11.244, lng: 125.003 },
  { address: "29 Burgos Ave, Dumaguete City, Negros Oriental", city: "Dumaguete", region: "Negros Oriental", lat: 9.3068, lng: 123.3054 },
  { address: "6 Rizal Ave, Tagbilaran City, Bohol", city: "Tagbilaran", region: "Bohol", lat: 9.6504, lng: 123.853 },
  { address: "18 Corrales Ave, Cagayan de Oro, Misamis Oriental", city: "Cagayan de Oro", region: "Misamis Oriental", lat: 8.4822, lng: 124.647 },
  { address: "44 J.P. Laurel Ave, Davao City, Davao del Sur", city: "Davao City", region: "Davao del Sur", lat: 7.0731, lng: 125.6128 },
  { address: "9 Quezon Blvd, General Santos City, South Cotabato", city: "General Santos", region: "South Cotabato", lat: 6.1164, lng: 125.1716 },
  { address: "25 Don Rufino Alonzo, Cotabato City, Maguindanao", city: "Cotabato City", region: "Maguindanao", lat: 7.2231, lng: 124.2464 },
  { address: "13 Gusa Rd, Butuan City, Agusan del Norte", city: "Butuan", region: "Agusan del Norte", lat: 8.9475, lng: 125.5406 },
  { address: "38 Mayor Climaco Ave, Zamboanga City, Zamboanga del Sur", city: "Zamboanga City", region: "Zamboanga del Sur", lat: 6.9214, lng: 122.079 },
  { address: "2 Bonifacio St, Dipolog City, Zamboanga del Norte", city: "Dipolog", region: "Zamboanga del Norte", lat: 8.5833, lng: 123.3408 },
  { address: "17 Tomas Oppus St, Maasin City, Southern Leyte", city: "Maasin", region: "Southern Leyte", lat: 10.1336, lng: 124.8447 },
  { address: "50 Roxas Ave, Koronadal City, South Cotabato", city: "Koronadal", region: "South Cotabato", lat: 6.5004, lng: 124.8431 },
  { address: "8 National Hwy, Santiago City, Isabela", city: "Santiago", region: "Isabela", lat: 16.6877, lng: 121.5488 },
];

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pickPlaceholderAddress(seed: string): PlaceholderAddress {
  const hash = hashSeed(seed || "contact");
  const place = PLACEHOLDERS[hash % PLACEHOLDERS.length];
  const latJitter = ((hash % 21) - 10) * 0.0035;
  const lngJitter = ((Math.floor(hash / 21) % 21) - 10) * 0.0035;
  return {
    ...place,
    lat: Number((place.lat + latJitter).toFixed(5)),
    lng: Number((place.lng + lngJitter).toFixed(5)),
  };
}

export function applyPlaceholderLocation<T extends { id?: string; email?: string }>(contact: T): PlaceholderAddress {
  return pickPlaceholderAddress(String(contact.id || contact.email || "contact"));
}

export function hasAddressTag(tags: string[] | undefined, tag: string) {
  const needle = tag.toLowerCase();
  return (tags ?? []).some((item) => item.toLowerCase() === needle);
}

export function isSamePlaceholderAddress(seed: string, address?: string) {
  const placeholder = pickPlaceholderAddress(seed);
  return (address ?? "").trim().toLowerCase() === placeholder.address.toLowerCase();
}

export function shouldUsePlaceholderAddress(input: { kind: string; tags?: string[] }) {
  return input.kind === "contact" && !hasAddressTag(input.tags, ADDRESS_CONFIRMED_TAG);
}
