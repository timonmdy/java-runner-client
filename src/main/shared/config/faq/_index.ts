import { FAQ_DE } from './FAQ.de';
import { FAQ_EN } from './FAQ.en';

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqTopic {
  id: string;
  label: string;
  items: FaqItem[];
}

export function getFAQ(languageId: string) {
  switch (languageId) {
    case 'en':
      return FAQ_EN;
    case 'de':
      return FAQ_DE;
    default:
      return FAQ_EN;
  }
}
