import { Dimensions, PixelRatio } from 'react-native';
import { BASE_WIDTH } from '@/constants/colors';

/**
 * The source HTML is a fixed 430px-wide "phone" mock (`--phone-w: 430px`,
 * see app.html line 31). On real devices we scale every dimension by the
 * ratio between the actual window width and 430, clamped so very large
 * tablets don't blow proportions out. This preserves the HTML's spacing /
 * radius / font-size ratios (per task rule #10/#11) instead of re-deriving
 * a "responsive" layout from scratch.
 */
function getWindowWidth() {
  return Dimensions.get('window').width;
}

const MAX_SCALE = 1.0; // never scale UP past the 430px reference on tablets
const MIN_SCALE = 0.78; // guard rail for very small/old phones

export function scaleRatio(): number {
  const width = getWindowWidth();
  const ratio = width / BASE_WIDTH;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, ratio));
}

/** Scale a px value from the 430px reference design to the current device. */
export function s(px: number): number {
  return Math.round(px * scaleRatio());
}

/** Scale + round to nearest pixel grid for crisper borders/hairlines. */
export function sp(px: number): number {
  return PixelRatio.roundToNearestPixel(px * scaleRatio());
}

export function windowWidth(): number {
  return getWindowWidth();
}
