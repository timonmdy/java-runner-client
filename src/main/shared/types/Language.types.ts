export interface LanguageDefinition {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2 country code for the flag image (e.g. 'gb', 'de') */
  countryCode?: string;
  strings: Record<string, string>;
}
