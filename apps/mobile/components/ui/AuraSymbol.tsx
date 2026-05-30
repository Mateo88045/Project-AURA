import type { ReactElement } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  Rect,
  G,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '../../lib/theme';

// ---------------------------------------------------------------------------
// AuraSymbol — Chronos's original icon set.
//
// This is not SF Symbols. Every icon is a hand-drawn SVG built to match the
// app's atmospheric design language: 1.75pt stroke weight, round caps, soft
// organic curves, and an asymmetric sparkle as the signature glyph.
//
// The prop API intentionally mirrors the previous SF Symbol implementation so
// that every consumer of `<AuraSymbol name="sparkles" />` keeps working — but
// the rendered glyph is now drawn by hand.
// ---------------------------------------------------------------------------

type Weight = 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';

interface AuraSymbolProps {
  name: string;
  size?: number;
  weight?: Weight;
  color?: string;
  style?: ViewStyle;
}

// Map the requested weight to a stroke width on the 24×24 canvas.
// The scaler is applied during <Svg width/height>, so these values live in
// design-canvas units — consistent across all sizes.
function weightToStroke(weight: Weight): number {
  switch (weight) {
    case 'ultraLight':
    case 'thin':
    case 'light':
      return 1.35;
    case 'regular':
      return 1.55;
    case 'semibold':
      return 2;
    case 'bold':
    case 'heavy':
    case 'black':
      return 2.25;
    case 'medium':
    default:
      return 1.75;
  }
}

// ---------------------------------------------------------------------------
// Individual icon renderers. Each receives { stroke, color } and returns the
// SVG children (Path / Circle / Rect / etc.) to mount inside the root <Svg>.
// ---------------------------------------------------------------------------

interface RenderArgs {
  stroke: number;
  color: string;
  /** Background color used for "cutout" effects (e.g. clock badge on calendar). */
  background: string;
}

type Renderer = (args: RenderArgs) => ReactElement;

const ICONS: Record<string, Renderer> = {
  // --- Chevrons ----------------------------------------------------------
  'chevron.left': ({ stroke, color }) => (
    <Path
      d="M14.5 5.5 L8 12 L14.5 18.5"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'chevron.right': ({ stroke, color }) => (
    <Path
      d="M9.5 5.5 L16 12 L9.5 18.5"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'chevron.down': ({ stroke, color }) => (
    <Path
      d="M5.5 9.5 L12 16 L18.5 9.5"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),

  // --- Arrows ------------------------------------------------------------
  'arrow.up': ({ stroke, color }) => (
    <Path
      d="M12 20 V4 M5.5 10.5 L12 4 L18.5 10.5"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'arrow.up.right': ({ stroke, color }) => (
    <G>
      <Path
        d="M7 17 L17 7"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M9 7 L17 7 L17 15"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),
  'arrow.right': ({ stroke, color }) => (
    <Path
      d="M4 12 H20 M13.5 5.5 L20 12 L13.5 18.5"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  'arrow.left': ({ stroke, color }) => (
    <Path
      d="M20 12 H4 M10.5 5.5 L4 12 L10.5 18.5"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  // Sign out — arrow stepping out of a soft-rounded frame.
  'arrow.right.square.fill': ({ stroke, color }) => (
    <G>
      <Path
        d="M9 4 H6 C4.8954 4 4 4.8954 4 6 V18 C4 19.1046 4.8954 20 6 20 H9"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M10 12 H20 M15.5 7.5 L20 12 L15.5 16.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // --- Action glyphs -----------------------------------------------------
  plus: ({ stroke, color }) => (
    <Path
      d="M12 4.5 V19.5 M4.5 12 H19.5"
      stroke={color}
      strokeWidth={Math.max(stroke, 2)}
      strokeLinecap="round"
      fill="none"
    />
  ),
  'plus.circle.fill': ({ color, background }) => (
    <G>
      <Circle cx="12" cy="12" r="10" fill={color} />
      <Path
        d="M12 7.5 V16.5 M7.5 12 H16.5"
        stroke={background}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  ),
  checkmark: ({ stroke, color }) => (
    <Path
      d="M5 12.5 L10 17.5 L19 7"
      stroke={color}
      strokeWidth={Math.max(stroke, 2.25)}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  xmark: ({ stroke, color }) => (
    <Path
      d="M6 6 L18 18 M18 6 L6 18"
      stroke={color}
      strokeWidth={Math.max(stroke, 2)}
      strokeLinecap="round"
      fill="none"
    />
  ),
  ellipsis: ({ color }) => (
    <G>
      <Circle cx="5" cy="12" r="1.7" fill={color} />
      <Circle cx="12" cy="12" r="1.7" fill={color} />
      <Circle cx="19" cy="12" r="1.7" fill={color} />
    </G>
  ),

  // --- Calendars ---------------------------------------------------------
  // TODAY tab — calendar with an internal timeline column. Two rows: the
  // current row is a filled glow dot (alive), the next row is hollow (ghost).
  'calendar.day.timeline.left': ({ stroke, color }) => (
    <G>
      <Rect
        x="3"
        y="6"
        width="18"
        height="15"
        rx="2.5"
        stroke={color}
        strokeWidth={stroke}
        fill="none"
      />
      <Path
        d="M3 10.5 H21"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <Path
        d="M7.5 3.5 V6.5 M16.5 3.5 V6.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* Timeline column */}
      <Circle cx="7" cy="14.5" r="1.25" fill={color} />
      <Circle
        cx="7"
        cy="18"
        r="1.1"
        stroke={color}
        strokeWidth={stroke * 0.9}
        fill="none"
      />
      <Path
        d="M10 14.5 H17 M10 18 H14"
        stroke={color}
        strokeWidth={stroke * 0.9}
        strokeLinecap="round"
      />
    </G>
  ),
  // WEEK tab — calendar with a 2-row dot grid.
  calendar: ({ stroke, color }) => (
    <G>
      <Rect
        x="3"
        y="6"
        width="18"
        height="15"
        rx="2.5"
        stroke={color}
        strokeWidth={stroke}
        fill="none"
      />
      <Path
        d="M3 10.5 H21"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <Path
        d="M7.5 3.5 V6.5 M16.5 3.5 V6.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {[6, 9.5, 13, 16.5].map((x) => (
        <Circle key={`r1-${x}`} cx={x} cy="14.5" r="0.9" fill={color} />
      ))}
      {[6, 9.5, 13, 16.5].map((x) => (
        <Circle key={`r2-${x}`} cx={x} cy="18" r="0.9" fill={color} />
      ))}
      <Circle cx="18" cy="14.5" r="0.9" fill={color} />
    </G>
  ),
  // Calendar with a clock badge — used for "Plan my week".
  'calendar.badge.clock': ({ stroke, color, background }) => (
    <G>
      <Rect
        x="2.5"
        y="5"
        width="14"
        height="13"
        rx="2.25"
        stroke={color}
        strokeWidth={stroke}
        fill="none"
      />
      <Path
        d="M2.5 9 H16.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <Path
        d="M6 3 V5.5 M13 3 V5.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* Clock badge */}
      <Circle
        cx="17.25"
        cy="17.25"
        r="4.75"
        fill={background}
      />
      <Circle
        cx="17.25"
        cy="17.25"
        r="3.75"
        stroke={color}
        strokeWidth={stroke}
        fill="none"
      />
      <Path
        d="M17.25 15.25 V17.25 L18.75 18.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // --- Chronos signature: orbital ring ----------------------------------------
  // Clean Saturn-style: a filled sphere with a flat ring that clearly wraps
  // around its equator. The back half of the ring is dimmed, the front half
  // is bright, and the sphere sits between them for unmistakable depth.
  sparkles: ({ stroke, color, background }) => (
    <G>
      {/* Back half of ring (behind sphere) — top arc of ellipse */}
      <Path
        d="M1.5 12 A10.5 3.5 0 0 1 22.5 12"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        opacity={0.3}
      />
      {/* Sphere */}
      <Circle cx="12" cy="12" r="5" fill={color} />
      {/* Front half of ring (in front of sphere) — bottom arc of ellipse */}
      <Path
        d="M1.5 12 A10.5 3.5 0 0 0 22.5 12"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  ),

  // --- Gear → slider-trio (more distinctive than a cog, works on glass) -
  gearshape: ({ stroke, color }) => (
    <G>
      <Path
        d="M4 7 H20"
        stroke={color}
        strokeWidth={stroke * 0.9}
        strokeLinecap="round"
      />
      <Circle cx="9" cy="7" r="2.25" fill={color} />
      <Path
        d="M4 12 H20"
        stroke={color}
        strokeWidth={stroke * 0.9}
        strokeLinecap="round"
      />
      <Circle cx="15" cy="12" r="2.25" fill={color} />
      <Path
        d="M4 17 H20"
        stroke={color}
        strokeWidth={stroke * 0.9}
        strokeLinecap="round"
      />
      <Circle cx="10" cy="17" r="2.25" fill={color} />
    </G>
  ),

  // --- Waveform: tapered vertical bars -----------------------------------
  waveform: ({ stroke, color }) => (
    <G>
      <Line
        x1="3"
        y1="10.5"
        x2="3"
        y2="13.5"
        stroke={color}
        strokeWidth={Math.max(stroke, 2)}
        strokeLinecap="round"
      />
      <Line
        x1="7.5"
        y1="8"
        x2="7.5"
        y2="16"
        stroke={color}
        strokeWidth={Math.max(stroke, 2)}
        strokeLinecap="round"
      />
      <Line
        x1="12"
        y1="4.5"
        x2="12"
        y2="19.5"
        stroke={color}
        strokeWidth={Math.max(stroke, 2)}
        strokeLinecap="round"
      />
      <Line
        x1="16.5"
        y1="8"
        x2="16.5"
        y2="16"
        stroke={color}
        strokeWidth={Math.max(stroke, 2)}
        strokeLinecap="round"
      />
      <Line
        x1="21"
        y1="10.5"
        x2="21"
        y2="13.5"
        stroke={color}
        strokeWidth={Math.max(stroke, 2)}
        strokeLinecap="round"
      />
    </G>
  ),

  // --- Brain: organic silhouette with a soft center fold ----------------
  brain: ({ stroke, color }) => (
    <G>
      <Path
        d="M12 4.5 C9.8 4.5 8 5.5 7.5 7.2 C5.6 7.2 4 8.8 4 11 C4 12.1 4.4 13 5.2 13.6 C5.1 14 5 14.5 5 15 C5 17.2 6.8 19 9 19 C9.8 19 10.6 18.8 11.2 18.4 C11.5 19 11.7 19 12 19"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M12 4.5 C14.2 4.5 16 5.5 16.5 7.2 C18.4 7.2 20 8.8 20 11 C20 12.1 19.6 13 18.8 13.6 C18.9 14 19 14.5 19 15 C19 17.2 17.2 19 15 19 C14.2 19 13.4 18.8 12.8 18.4 C12.5 19 12.3 19 12 19"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M12 4.5 V19"
        stroke={color}
        strokeWidth={stroke * 0.75}
        strokeLinecap="round"
        strokeOpacity={0.55}
      />
    </G>
  ),

  // --- Clock -------------------------------------------------------------
  'clock.fill': ({ stroke, color }) => (
    <G>
      <Circle
        cx="12"
        cy="12"
        r="8.75"
        stroke={color}
        strokeWidth={stroke}
        fill="none"
      />
      <Path
        d="M12 7 V12 L15.5 14"
        stroke={color}
        strokeWidth={Math.max(stroke, 1.9)}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  ),

  // --- Shield ------------------------------------------------------------
  'shield.fill': ({ stroke, color }) => (
    <Path
      d="M12 3 L19.5 6 V11.5 C19.5 16.5 16.2 19.8 12 21 C7.8 19.8 4.5 16.5 4.5 11.5 V6 Z"
      stroke={color}
      strokeWidth={stroke}
      strokeLinejoin="round"
      strokeLinecap="round"
      fill="none"
    />
  ),

  // --- Sun with wavy rays -----------------------------------------------
  'sun.max.fill': ({ stroke, color }) => (
    <G>
      <Circle
        cx="12"
        cy="12"
        r="4"
        stroke={color}
        strokeWidth={stroke}
        fill="none"
      />
      <Path
        d="M12 2 V4.5 M12 19.5 V22 M2 12 H4.5 M19.5 12 H22 M4.93 4.93 L6.7 6.7 M17.3 17.3 L19.07 19.07 M4.93 19.07 L6.7 17.3 M17.3 6.7 L19.07 4.93"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </G>
  ),

  // --- Moon, slightly tilted --------------------------------------------
  'moon.fill': ({ stroke, color }) => (
    <Path
      d="M20.5 14.6 A8.5 8.5 0 1 1 9.4 3.5 A6.7 6.7 0 0 0 20.5 14.6 Z"
      stroke={color}
      strokeWidth={stroke}
      strokeLinejoin="round"
      fill="none"
    />
  ),

  // --- Half-filled circle (auto / system theme toggle) ------------------
  'circle.lefthalf.filled': ({ stroke, color }) => (
    <G>
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth={stroke}
        fill="none"
      />
      <Path
        d="M12 3 A9 9 0 0 0 12 21 Z"
        fill={color}
      />
    </G>
  ),

  // --- Bell --------------------------------------------------------------
  'bell.fill': ({ stroke, color }) => (
    <G>
      <Path
        d="M6 16 V11 C6 7.7 8.7 5 12 5 C15.3 5 18 7.7 18 11 V16 L19.5 18 H4.5 L6 16 Z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M10 20.5 C10.5 21.3 13.5 21.3 14 20.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  ),

  // --- Book (closed) -----------------------------------------------------
  'book.closed.fill': ({ stroke, color }) => (
    <G>
      <Path
        d="M5.5 4 H17 C18.1 4 19 4.9 19 6 V18 C19 19.1 18.1 20 17 20 H5.5 C5.2 20 5 19.8 5 19.5 V4.5 C5 4.2 5.2 4 5.5 4 Z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M8 4 V20"
        stroke={color}
        strokeWidth={stroke * 0.8}
        strokeOpacity={0.55}
      />
      <Path
        d="M11 9 H16"
        stroke={color}
        strokeWidth={stroke * 0.85}
        strokeLinecap="round"
      />
    </G>
  ),

  // --- Bolt --------------------------------------------------------------
  'bolt.fill': ({ stroke, color }) => (
    <Path
      d="M13.5 2.5 L5 13.5 H11 L9.5 21.5 L19 10.5 H13 L13.5 2.5 Z"
      stroke={color}
      strokeWidth={stroke}
      strokeLinejoin="round"
      strokeLinecap="round"
      fill="none"
    />
  ),

  // --- Lock --------------------------------------------------------------
  'lock.fill': ({ stroke, color }) => (
    <G>
      <Rect
        x="4"
        y="10.5"
        width="16"
        height="10.5"
        rx="2.25"
        stroke={color}
        strokeWidth={stroke}
        fill="none"
      />
      <Path
        d="M7.5 10.5 V7.5 C7.5 5 9.5 3 12 3 C14.5 3 16.5 5 16.5 7.5 V10.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx="12" cy="14.8" r="1.15" fill={color} />
      <Path
        d="M12 15.9 V17.8"
        stroke={color}
        strokeWidth={Math.max(stroke, 1.6)}
        strokeLinecap="round"
      />
    </G>
  ),

  // --- Camera ------------------------------------------------------------
  'camera.fill': ({ stroke, color }) => (
    <G>
      <Path
        d="M8.5 5.5 L9.5 3.5 H14.5 L15.5 5.5 H19 C20.1 5.5 21 6.4 21 7.5 V17 C21 18.1 20.1 19 19 19 H5 C3.9 19 3 18.1 3 17 V7.5 C3 6.4 3.9 5.5 5 5.5 H8.5 Z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <Circle
        cx="12"
        cy="12.25"
        r="3.75"
        stroke={color}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle cx="17.5" cy="8.5" r="0.8" fill={color} />
    </G>
  ),

  // --- Mic ---------------------------------------------------------------
  'mic.fill': ({ stroke, color }) => (
    <G>
      <Rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        stroke={color}
        strokeWidth={stroke}
        fill="none"
      />
      <Path
        d="M5.5 11 C5.5 14.6 8.4 17.5 12 17.5 C15.6 17.5 18.5 14.6 18.5 11"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M12 17.5 V21 M8.5 21 H15.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </G>
  ),

  // --- Chat bubble with dots --------------------------------------------
  'bubble.left.and.bubble.right': ({ stroke, color }) => (
    <G>
      <Path
        d="M5 5 H19 C20.1 5 21 5.9 21 7 V13.5 C21 14.6 20.1 15.5 19 15.5 H11.5 L6.5 19.5 V15.5 H5 C3.9 15.5 3 14.6 3 13.5 V7 C3 5.9 3.9 5 5 5 Z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx="8.5" cy="10.25" r="1" fill={color} />
      <Circle cx="12" cy="10.25" r="1" fill={color} />
      <Circle cx="15.5" cy="10.25" r="1" fill={color} />
    </G>
  ),

  // --- Platform marks: Google Classroom + Canvas ------------------------
  'g.circle.fill': ({ color, background }) => (
    <G>
      <Circle cx="12" cy="12" r="10" fill={color} />
      <SvgText
        x="12"
        y="16.5"
        fontSize="13"
        fontWeight="700"
        textAnchor="middle"
        fill={background}
      >
        G
      </SvgText>
    </G>
  ),
  'c.circle.fill': ({ color, background }) => (
    <G>
      <Circle cx="12" cy="12" r="10" fill={color} />
      <SvgText
        x="12"
        y="16.5"
        fontSize="13"
        fontWeight="700"
        textAnchor="middle"
        fill={background}
      >
        C
      </SvgText>
    </G>
  ),

  // --- Aliases for legacy names still referenced in the fallback map ----
  circle: ({ stroke, color }) => (
    <Circle
      cx="12"
      cy="12"
      r="8.5"
      stroke={color}
      strokeWidth={stroke}
      fill="none"
    />
  ),
  'circle.fill': ({ color }) => <Circle cx="12" cy="12" r="8.5" fill={color} />,
};

// ---------------------------------------------------------------------------
// Unknown-name fallback: render a small filled dot so layout stays stable
// while the missing name is obvious at a glance.
// ---------------------------------------------------------------------------
function renderFallback({ color }: RenderArgs): ReactElement {
  return <Circle cx="12" cy="12" r="2" fill={color} />;
}

export function AuraSymbol({
  name,
  size = 22,
  weight = 'medium',
  color,
  style,
}: AuraSymbolProps) {
  const { colors } = useTheme();
  const render = ICONS[name] ?? renderFallback;
  const stroke = weightToStroke(weight);
  const resolvedColor = color ?? colors.text.primary;
  const background = colors.background.primary;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {render({ stroke, color: resolvedColor, background })}
      </Svg>
    </View>
  );
}
