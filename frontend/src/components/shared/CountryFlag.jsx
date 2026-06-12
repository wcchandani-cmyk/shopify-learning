import { Country } from "country-state-city";

export const flagUrl = (iso) => `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;

export function Flag({ iso }) {
  return (
    <img
      src={flagUrl(iso)}
      alt={iso}
      loading="lazy"
      width="20"
      height="15"
      className="country-flag"
    />
  );
}

export function PillFlag({ iso }) {
  return (
    <img
      src={flagUrl(iso)}
      alt={iso}
      loading="lazy"
      width="16"
      height="12"
      className="pill-country-flag"
    />
  );
}

// Full country list — { code, name, phonecode } — sourced from country-state-city.
export const COUNTRIES = Country.getAllCountries().map((c) => ({
  code: c.isoCode,
  name: c.name,
  phonecode: c.phonecode,
}));

// Returns the display name for an ISO code (e.g. "US" → "United States").
export function getCountryName(isoCode) {
  const country = Country.getCountryByCode(isoCode?.toUpperCase());
  return country ? country.name : isoCode;
}
