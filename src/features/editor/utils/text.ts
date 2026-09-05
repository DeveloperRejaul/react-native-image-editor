import { matchFont } from '@shopify/react-native-skia';
import type { SkFont } from '@shopify/react-native-skia';
import { familyById, styleById } from '../constants/fonts';

export const DEFAULT_TEXT_SIZE = 40;

/** Build a Skia font for a family + style at a size (memoise at the call site). */
export function skiaFont(familyId: string, styleId: string, fontSize: number): SkFont {
  const fam = familyById(familyId);
  const st = styleById(styleId);
  return matchFont({
    fontFamily: fam.family,
    fontSize,
    fontWeight: st.weight,
    fontStyle: st.style,
  });
}

/**
 * Half the rendered width of `text` at `fontSize` in the given family/style,
 * used to centre a text overlay and size its selection box. Falls back to an
 * estimate if Skia can't measure (e.g. under tests).
 */
export function measureTextHalfWidth(
  text: string,
  fontSize = DEFAULT_TEXT_SIZE,
  familyId?: string,
  styleId?: string,
): number {
  try {
    const f = skiaFont(familyId ?? '', styleId ?? '', fontSize);
    const width =
      typeof f.getTextWidth === 'function' ? f.getTextWidth(text) : f.measureText(text).width;
    if (Number.isFinite(width) && width > 0) return width / 2;
  } catch {
    // fall through to estimate
  }
  return Math.max(1, (text.length * fontSize * 0.55) / 2);
}
