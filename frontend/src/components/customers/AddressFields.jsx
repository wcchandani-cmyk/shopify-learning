import { useMemo } from "react";
import { Country, State } from "country-state-city";
import { getInputEventValue } from "../../utils/fieldEvent";
import SearchableSelect from "../shared/SearchableSelect";
import PhoneField from "./PhoneField";

export default function AddressFields({ value, onChange }) {
  const countryOptions = useMemo(
    () =>
      Country.getAllCountries().map((c) => ({
        value: c.isoCode,
        label: c.name,
      })),
    []
  );

  const stateOptions = useMemo(
    () =>
      value.countryCode
        ? State.getStatesOfCountry(value.countryCode).map((s) => ({
            value: s.isoCode,
            label: s.name,
          }))
        : [],
    [value.countryCode]
  );

  const setField = (field) => (event) =>
    onChange({ [field]: getInputEventValue(event) });

  // Switching country invalidates the previously selected state.
  const handleCountryChange = (newCode) =>
    onChange({ countryCode: newCode, provinceCode: "" });

  return (
    <s-stack gap="base">
      <SearchableSelect
        label="Country/region"
        value={value.countryCode}
        onChange={handleCountryChange}
        options={countryOptions}
        placeholder="Search country…"
      />

      <s-text-field
        label="Company"
        value={value.company}
        onInput={setField("company")}
      />

      <s-text-field
        label="Address"
        value={value.address1}
        onInput={setField("address1")}
      />

      <s-text-field
        label="Apartment, suite, etc"
        value={value.address2}
        onInput={setField("address2")}
      />

      <s-grid gap="base" gridTemplateColumns="1fr 1fr 1fr">
        <s-text-field
          label="City"
          value={value.city}
          onInput={setField("city")}
        />
        {stateOptions.length > 0 ? (
          <SearchableSelect
            label="State"
            value={value.provinceCode}
            onChange={(val) => onChange({ provinceCode: val })}
            options={stateOptions}
            placeholder="Search state…"
          />
        ) : (
          <s-text-field
            label="State/Province"
            value={value.provinceCode}
            onInput={setField("provinceCode")}
          />
        )}
        <s-text-field
          label="ZIP code"
          value={value.zip}
          onInput={setField("zip")}
        />
      </s-grid>

      <PhoneField
        label="Phone"
        value={value.phone}
        onChange={(phone) => onChange({ phone })}
      />
    </s-stack>
  );
}
