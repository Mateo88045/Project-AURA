import { useEffect, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

interface CountUpTextProps {
  /** Target value to count up to */
  value: number;
  /** Optional suffix appended after the number (e.g. "h", "%") */
  suffix?: string;
  /** Animation duration in ms (default 800) */
  duration?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Animated number that counts up to `value` on mount.
 *
 * Runs on the JS thread via requestAnimationFrame + setState on purpose: the
 * native-driven alternatives both break here — animatedProps.text is a no-op
 * on Text (children are JS-side), and on TextInput Fabric doesn't relayout on
 * UI-thread text changes, so grown digits get clipped ("23" froze at "2").
 * A plain Text re-rendered per frame lays out and baseline-aligns correctly,
 * and a sub-second count-up is far too light to contend the JS thread.
 */
export function CountUpText({ value, suffix = '', duration = 800, style }: CountUpTextProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let raf: number;
    const startMs = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - startMs) / duration);
      const eased = 1 - (1 - t) * (1 - t); // ease-out quad
      setDisplayed(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <Text style={style} accessibilityLabel={String(value) + suffix}>
      {displayed}
      {suffix}
    </Text>
  );
}
