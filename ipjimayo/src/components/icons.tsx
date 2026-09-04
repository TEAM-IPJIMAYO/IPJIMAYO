import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '@/constants/colors';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Ported from iconMenu(), app.html line 8492. */
export function IconMenu({ size = 29, color = colors.text, strokeWidth = 2.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}>
      <Path d="M4 6h16M4 12h16M4 18h16" strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Ported from iconX(), app.html line 8493. */
export function IconX({ size = 29, color = colors.text, strokeWidth = 2.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}>
      <Path d="M6 6l12 12M18 6L6 18" strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Ported from iconHome(), app.html line 8494. */
export function IconHome({ size = 29, color = colors.text, strokeWidth = 2.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}>
      <Path d="M3 11.5L12 4l9 7.5" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10.5V20h12v-9.5" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M10 20v-5h4v5" strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

/** Ported from iconGear(), app.html line 8495. */
export function IconGear({ size = 29, color = colors.text, strokeWidth = 2.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}>
      <Path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" strokeWidth={strokeWidth} />
      <Path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92V20.5a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-.92 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1H3.5a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 .92-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92V3.5a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 .92 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.5.68.92 1h.18a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1 .92Z"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Ported from iconHelp(), app.html line 8496. */
export function IconHelp({ size = 29, color = colors.text, strokeWidth = 2.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}>
      <Circle cx="12" cy="12" r="9" strokeWidth={strokeWidth} />
      <Path d="M9.7 9a2.4 2.4 0 0 1 4.6 1.1c0 1.7-2.3 1.9-2.3 3.4" strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M12 17h.01" strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Ported from iconCheck(), app.html line 8497. */
export function IconCheck({ size = 29, color = colors.text, strokeWidth = 2.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}>
      <Path d="M5 12.5l4.3 4.3L19.5 6.5" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
