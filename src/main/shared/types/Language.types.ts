export interface LanguageDefinition {
  id: string;
  name: string;
  version: number;
  author: string;
  strings: Record<string, string>;
}

export interface LocalLanguageState {
  activeLanguageId: string;
  activeLanguage: LanguageDefinition;
}
