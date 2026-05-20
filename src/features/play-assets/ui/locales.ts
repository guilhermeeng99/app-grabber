export interface LocaleOption {
  readonly code: string;
  readonly label: string;
}

/** Curated store fronts — covers the common markets without a 200-row list. */
export const COUNTRIES: readonly LocaleOption[] = [
  { code: "us", label: "United States" },
  { code: "br", label: "Brazil" },
  { code: "gb", label: "United Kingdom" },
  { code: "ca", label: "Canada" },
  { code: "au", label: "Australia" },
  { code: "de", label: "Germany" },
  { code: "fr", label: "France" },
  { code: "es", label: "Spain" },
  { code: "it", label: "Italy" },
  { code: "pt", label: "Portugal" },
  { code: "mx", label: "Mexico" },
  { code: "jp", label: "Japan" },
  { code: "kr", label: "South Korea" },
  { code: "in", label: "India" },
];

/** Listing languages offered in the picker. */
export const LANGUAGES: readonly LocaleOption[] = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "hi", label: "हिन्दी" },
];
