import { Platform } from 'react-native';

type Weight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

/** A selectable font family — resolved to a real platform font name. */
export interface TextFamily {
  id: string;
  label: string;
  family: string;
}

/** A selectable weight + slant combination. */
export interface TextStyleOpt {
  id: string;
  label: string;
  weight: Weight;
  style: 'normal' | 'italic';
}

const pick = (ios: string, android: string) =>
  Platform.select({ ios, default: android }) as string;

export const TEXT_FAMILIES: TextFamily[] = [
  { id: 'sans', label: 'Sans', family: pick('Helvetica Neue', 'sans-serif') },
  { id: 'rounded', label: 'Rounded', family: pick('Avenir Next', 'sans-serif-medium') },
  { id: 'condensed', label: 'Condensed', family: pick('AvenirNextCondensed-Medium', 'sans-serif-condensed') },
  { id: 'serif', label: 'Serif', family: pick('Georgia', 'serif') },
  { id: 'slab', label: 'Slab', family: pick('American Typewriter', 'serif-monospace') },
  { id: 'mono', label: 'Mono', family: pick('Menlo', 'monospace') },
  { id: 'marker', label: 'Marker', family: pick('Marker Felt', 'casual') },
  { id: 'elegant', label: 'Elegant', family: pick('Didot', 'serif') },
];

export const TEXT_STYLES: TextStyleOpt[] = [
  { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
  { id: 'medium', label: 'Medium', weight: '500', style: 'normal' },
  { id: 'semibold', label: 'Semibold', weight: '600', style: 'normal' },
  { id: 'bold', label: 'Bold', weight: '700', style: 'normal' },
  { id: 'black', label: 'Black', weight: '900', style: 'normal' },
  { id: 'italic', label: 'Italic', weight: '400', style: 'italic' },
  { id: 'bolditalic', label: 'Bold Italic', weight: '700', style: 'italic' },
];

export const DEFAULT_FAMILY_ID = 'sans';
export const DEFAULT_STYLE_ID = 'bold';

export function familyById(id: string | undefined): TextFamily {
  return TEXT_FAMILIES.find(f => f.id === id) ?? TEXT_FAMILIES[0];
}
export function styleById(id: string | undefined): TextStyleOpt {
  return TEXT_STYLES.find(s => s.id === id) ?? TEXT_STYLES[3];
}
