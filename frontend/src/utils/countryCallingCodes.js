import { Country } from "country-state-city";

const DEFAULT_ISO = "US";

const PRIMARY_FOR_DIAL = {
  1: "US",
  7: "RU",
  39: "IT",
  44: "GB",
  61: "AU",
};

const normalizeDial = (phonecode) =>
  String(phonecode || "").replace(/[^\d]/g, "");

export const CALLING_CODES = Country.getAllCountries()
  .map((country) => ({
    code: country.isoCode,
    name: country.name,
    dial: normalizeDial(country.phonecode),
  }))
  .filter((country) => country.dial)
  .sort((a, b) => a.name.localeCompare(b.name));

export function findCallingCode(iso) {
  return (
    CALLING_CODES.find((country) => country.code === iso) ||
    CALLING_CODES.find((country) => country.code === DEFAULT_ISO)
  );
}

export function parsePhone(value) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("+")) {
    return { iso: DEFAULT_ISO, national: raw.replace(/[^\d]/g, "") };
  }

  const digits = raw.slice(1).replace(/[^\d]/g, "");
  const sorted = [...CALLING_CODES].sort(
    (a, b) => b.dial.length - a.dial.length
  );
  const match = sorted.find((country) => digits.startsWith(country.dial));

  if (match) {
    const iso = PRIMARY_FOR_DIAL[match.dial] || match.code;
    return { iso, national: digits.slice(match.dial.length) };
  }
  return { iso: DEFAULT_ISO, national: digits };
}

export function composePhone(iso, national) {
  const digits = String(national || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  const country = findCallingCode(iso);
  return `+${country.dial}${digits}`;
}
