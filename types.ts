
export type Orientation = 'horizontal' | 'vertical';
export type TemporalScale = 'proportional' | 'compressed';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO format or Year string
  endDate?: string;   // Optional for ranges
  mediaUrl?: string;  // Image or YouTube URL
  color: string;
}

export interface TimelineConfig {
  orientation: Orientation;
  scale: TemporalScale;
  language: 'ca' | 'es' | 'en';
  theme: 'modern' | 'classic' | 'retro';
  showMedia: boolean;
  scrollMode: boolean;
  darkMode: boolean; // NEW: Dark mode support
  // Advanced Settings
  font: 'sans' | 'serif' | 'mono' | 'handwriting';
  barHeight: number;
  textModeRange: 'full' | 'compact' | 'hidden';
  textModePoint: 'full' | 'compact' | 'hidden';
}

export interface TranslationStrings {
  title: string;
  addEvent: string;
  editEvent: string;
  exportPng: string;
  exportExcel: string;
  importExcel: string;
  orientation: string;
  scale: string;
  language: string;
  proportional: string;
  compressed: string;
  horizontal: string;
  vertical: string;
  save: string;
  cancel: string;
  delete: string;
  eventTitle: string;
  eventDesc: string;
  startDate: string;
  endDate: string;
  mediaUrl: string;
  color: string;
  noEvents: string;
  helpText: string;
  printRes: string;
  screenRes: string;
  scrollMode: string;
  darkMode: string;
  unsavedChanges: string;
  // Advanced Settings
  advSettings: string;
  typography: string;
  barHeight: string;
  textCards: string;
  textCardsRange: string;
  textCardsPoint: string;
  textModeFull: string;
  textModeCompact: string;
  textModeHidden: string;
  fontSans: string;
  fontSerif: string;
  fontMono: string;
  fontHand: string;
  showHide: string;
}

export const LANGUAGES = ['ca', 'es', 'en'] as const;
export type Language = typeof LANGUAGES[number];
