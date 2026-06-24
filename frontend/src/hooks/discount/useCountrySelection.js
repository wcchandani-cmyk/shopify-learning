import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { Country } from "country-state-city";
import { listShippableCountries } from "../../services/discountService";

const allCountriesList = Country.getAllCountries().map((country) => ({
  code: country.isoCode.toLowerCase(),
  name: country.name,
}));

export function useCountrySelection(selectedCountries, updateField) {
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showOnlySelectedCountries, setShowOnlySelectedCountries] =
    useState(false);
  const [tempSelectedCountries, setTempSelectedCountries] = useState([]);
  const countryModalRef = useRef(null);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");

  const [countryOptions, setCountryOptions] = useState(allCountriesList);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await listShippableCountries();
        if (cancelled) return;
        if (data.includeRestOfWorld) {
          setCountryOptions(allCountriesList);
        } else {
          const codes = new Set(
            (data.countryCodes || []).map((code) => code.toLowerCase())
          );
          setCountryOptions(
            allCountriesList.filter((country) => codes.has(country.code))
          );
        }
      } catch {
        if (!cancelled) setCountryOptions(allCountriesList);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const modal = countryModalRef.current;
    if (!modal) return;
    if (isCountryModalOpen) {
      modal.showOverlay?.();
    } else {
      modal.hideOverlay?.();
    }
  }, [isCountryModalOpen]);

  const openCountryModal = useCallback(() => {
    setTempSelectedCountries([...(selectedCountries || [])]);
    setCountrySearch("");
    setShowOnlySelectedCountries(false);
    setIsCountryModalOpen(true);
  }, [selectedCountries]);

  const closeCountryModal = useCallback(() => {
    setIsCountryModalOpen(false);
  }, []);

  const handleAfterHideCountries = useCallback(() => {
    setIsCountryModalOpen(false);
  }, []);

  const handleSaveCountries = useCallback(() => {
    updateField("selectedCountries", tempSelectedCountries);
    setIsCountryModalOpen(false);
  }, [tempSelectedCountries, updateField]);

  const handleToggleCountry = useCallback((countryCode) => {
    setTempSelectedCountries((prev) =>
      prev.includes(countryCode)
        ? prev.filter((code) => code !== countryCode)
        : [...prev, countryCode]
    );
  }, []);

  const filteredCountries = useMemo(() => {
    return countryOptions.filter((country) => {
      const matchesSearch =
        country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        country.code.toLowerCase().includes(countrySearch.toLowerCase());
      const matchesSelected =
        !showOnlySelectedCountries ||
        tempSelectedCountries.includes(country.code);
      return matchesSearch && matchesSelected;
    });
  }, [countryOptions, countrySearch, showOnlySelectedCountries, tempSelectedCountries]);

  const isAllFilteredCountriesSelected = useMemo(() => {
    if (filteredCountries.length === 0) return false;
    return filteredCountries.every((country) =>
      tempSelectedCountries.includes(country.code)
    );
  }, [filteredCountries, tempSelectedCountries]);

  const handleToggleSelectAllCountries = useCallback(() => {
    const codes = filteredCountries.map((c) => c.code);
    setTempSelectedCountries((prev) =>
      isAllFilteredCountriesSelected
        ? prev.filter((code) => !codes.includes(code))
        : [...new Set([...prev, ...codes])]
    );
  }, [isAllFilteredCountriesSelected, filteredCountries]);

  const autocompleteCountries = useMemo(() => {
    const query = countrySearchQuery.trim().toLowerCase();
    if (!query) return [];
    return countryOptions
      .filter((country) => {
        const matchesSearch =
          country.name.toLowerCase().includes(query) ||
          country.code.toLowerCase().includes(query);
        const notSelected = !(selectedCountries || []).includes(country.code);
        return matchesSearch && notSelected;
      })
      .slice(0, 5);
  }, [countryOptions, countrySearchQuery, selectedCountries]);

  return {
    isCountryModalOpen,
    countrySearch,
    setCountrySearch,
    showOnlySelectedCountries,
    setShowOnlySelectedCountries,
    tempSelectedCountries,
    countryModalRef,
    filteredCountries,
    isAllFilteredCountriesSelected,
    openCountryModal,
    closeCountryModal,
    handleAfterHideCountries,
    handleSaveCountries,
    handleToggleCountry,
    handleToggleSelectAllCountries,
    countrySearchQuery,
    setCountrySearchQuery,
    autocompleteCountries,
  };
}
