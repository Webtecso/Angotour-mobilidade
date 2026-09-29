import { ComfortPreferenceId } from '../types';

export const COMFORT_OPTIONS: {
  id: ComfortPreferenceId;
  label: string;
  icon: keyof typeof import('@expo/vector-icons/Ionicons').default.glyphMap;
}[] = [
  { id: 'silent', label: 'Ambiente silencioso', icon: 'volume-mute-outline' },
  { id: 'no_music', label: 'Sem musica', icon: 'musical-notes-outline' },
  { id: 'luggage_help', label: 'Ajuda com bagagem', icon: 'bag-handle-outline' },
];
