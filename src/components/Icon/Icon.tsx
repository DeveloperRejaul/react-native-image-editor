import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { colors } from '../../theme';

export type IconName =
  | 'back'
  | 'close'
  | 'undo'
  | 'redo'
  | 'save'
  | 'download'
  | 'share'
  | 'reset'
  | 'layers'
  | 'eye'
  | 'eyeOff'
  | 'lock'
  | 'unlock'
  | 'drag'
  | 'size'
  | 'frame'
  | 'text'
  | 'sticker'
  | 'filter'
  | 'draw'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'edit'
  | 'image';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Feather-style line icons drawn with react-native-svg (24x24 grid). */
export function Icon({ name, size = 22, color = colors.text, strokeWidth = 2 }: IconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderPaths(name, common, color)}
    </Svg>
  );
}

function renderPaths(
  name: IconName,
  c: Record<string, unknown>,
  color: string,
) {
  switch (name) {
    case 'back':
      return (
        <>
          <Line x1="19" y1="12" x2="5" y2="12" {...c} />
          <Polyline points="12 19 5 12 12 5" {...c} />
        </>
      );
    case 'close':
      return (
        <>
          <Line x1="18" y1="6" x2="6" y2="18" {...c} />
          <Line x1="6" y1="6" x2="18" y2="18" {...c} />
        </>
      );
    case 'download':
      return (
        <>
          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...c} />
          <Polyline points="7 10 12 15 17 10" {...c} />
          <Line x1="12" y1="15" x2="12" y2="3" {...c} />
        </>
      );
    case 'share':
      return (
        <>
          <Circle cx="18" cy="5" r="3" {...c} />
          <Circle cx="6" cy="12" r="3" {...c} />
          <Circle cx="18" cy="19" r="3" {...c} />
          <Line x1="8.6" y1="13.5" x2="15.4" y2="17.5" {...c} />
          <Line x1="15.4" y1="6.5" x2="8.6" y2="10.5" {...c} />
        </>
      );
    case 'undo':
      return (
        <>
          <Polyline points="9 14 4 9 9 4" {...c} />
          <Path d="M20 20v-7a4 4 0 0 0-4-4H4" {...c} />
        </>
      );
    case 'redo':
      return (
        <>
          <Polyline points="15 14 20 9 15 4" {...c} />
          <Path d="M4 20v-7a4 4 0 0 1 4-4h12" {...c} />
        </>
      );
    case 'save':
      return (
        <>
          <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" {...c} />
          <Polyline points="17 21 17 13 7 13 7 21" {...c} />
          <Polyline points="7 3 7 8 15 8" {...c} />
        </>
      );
    case 'reset':
      return (
        <>
          <Polyline points="1 4 1 10 7 10" {...c} />
          <Path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" {...c} />
        </>
      );
    case 'layers':
      return (
        <>
          <Path d="M12 2 2 7l10 5 10-5-10-5z" {...c} />
          <Polyline points="2 17 12 22 22 17" {...c} />
          <Polyline points="2 12 12 17 22 12" {...c} />
        </>
      );
    case 'eye':
      return (
        <>
          <Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" {...c} />
          <Circle cx="12" cy="12" r="3" {...c} />
        </>
      );
    case 'eyeOff':
      return (
        <>
          <Path
            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
            {...c}
          />
          <Line x1="1" y1="1" x2="23" y2="23" {...c} />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x="3" y="11" width="18" height="11" rx="2" {...c} />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" {...c} />
        </>
      );
    case 'unlock':
      return (
        <>
          <Rect x="3" y="11" width="18" height="11" rx="2" {...c} />
          <Path d="M7 11V7a5 5 0 0 1 9.9-1" {...c} />
        </>
      );
    case 'drag':
      return (
        <>
          <Circle cx="9" cy="6" r="1" fill={color} stroke={color} />
          <Circle cx="9" cy="12" r="1" fill={color} stroke={color} />
          <Circle cx="9" cy="18" r="1" fill={color} stroke={color} />
          <Circle cx="15" cy="6" r="1" fill={color} stroke={color} />
          <Circle cx="15" cy="12" r="1" fill={color} stroke={color} />
          <Circle cx="15" cy="18" r="1" fill={color} stroke={color} />
        </>
      );
    case 'size':
      return (
        <>
          <Rect x="3" y="3" width="18" height="18" rx="2" {...c} />
          <Polyline points="9 3 9 9 3 9" {...c} />
          <Polyline points="15 21 15 15 21 15" {...c} />
        </>
      );
    case 'frame':
      return (
        <>
          <Rect x="3" y="3" width="18" height="18" rx="1" {...c} />
          <Rect x="7" y="7" width="10" height="10" rx="1" {...c} />
        </>
      );
    case 'text':
      return (
        <>
          <Polyline points="4 7 4 4 20 4 20 7" {...c} />
          <Line x1="9" y1="20" x2="15" y2="20" {...c} />
          <Line x1="12" y1="4" x2="12" y2="20" {...c} />
        </>
      );
    case 'sticker':
      return (
        <Path
          d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.8 6.1 20.8l1.2-6.6L2.5 9l6.6-.9L12 2z"
          {...c}
        />
      );
    case 'filter':
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...c} />
          <Path d="M12 3a9 9 0 0 1 0 18z" fill={color} stroke={color} />
        </>
      );
    case 'draw':
      return (
        <>
          <Path d="M12 19l7-7 3 3-7 7-3-3z" {...c} />
          <Path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" {...c} />
          <Line x1="2" y1="2" x2="9.5" y2="9.5" {...c} />
          <Circle cx="11" cy="11" r="2" {...c} />
        </>
      );
    case 'plus':
      return (
        <>
          <Line x1="12" y1="5" x2="12" y2="19" {...c} />
          <Line x1="5" y1="12" x2="19" y2="12" {...c} />
        </>
      );
    case 'minus':
      return <Line x1="5" y1="12" x2="19" y2="12" {...c} />;
    case 'trash':
      return (
        <>
          <Polyline points="3 6 5 6 21 6" {...c} />
          <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...c} />
        </>
      );
    case 'edit':
      return (
        <>
          <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" {...c} />
          <Path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" {...c} />
        </>
      );
    case 'image':
      return (
        <>
          <Rect x="3" y="3" width="18" height="18" rx="2" {...c} />
          <Circle cx="8.5" cy="8.5" r="1.5" {...c} />
          <Polyline points="21 15 16 10 5 21" {...c} />
        </>
      );
    default:
      return null;
  }
}
