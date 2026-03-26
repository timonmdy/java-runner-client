export interface UpdatableDefinition {
  id: string;
  label: string;
  description: string;
}

export const UPDATE_ITEMS: UpdatableDefinition[] = [
  { id: 'app', label: 'Application', description: 'Java Runner Client core application' },
  { id: 'theme', label: 'Theme', description: 'Currently active visual theme' },
  { id: 'language', label: 'Language', description: 'Currently active language pack' },
];
