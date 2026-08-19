export type CountryDial = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
};

export const countries: CountryDial[] = [
  { iso: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { iso: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { iso: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { iso: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { iso: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { iso: "HK", name: "Hong Kong", dial: "+852", flag: "🇭🇰" },
  { iso: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { iso: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷" },
  { iso: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { iso: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { iso: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { iso: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { iso: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { iso: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { iso: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { iso: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { iso: "TW", name: "Taiwan", dial: "+886", flag: "🇹🇼" },
  { iso: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { iso: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { iso: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { iso: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { iso: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { iso: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { iso: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿" },
];

export const defaultCountry = countries[0];

export function findCountry(iso: string) {
  return countries.find((country) => country.iso === iso) ?? defaultCountry;
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function formatInternationalPhone(iso: string, nationalNumber: string) {
  const country = findCountry(iso);
  const digits = normalizePhone(nationalNumber).replace(/^0+/, "");
  return `${country.dial}${digits}`;
}
