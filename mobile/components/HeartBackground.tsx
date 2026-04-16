import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, {
  Path,
  Defs,
  RadialGradient,
  Stop,
  Circle,
  G,
  Rect,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface HeartBackgroundProps {
  pulse: boolean;
  darkenLevel: number;
}

export default function HeartBackground({ pulse, darkenLevel }: HeartBackgroundProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0.06)).current;

  const darkness = Math.min(darkenLevel / 30, 0.85);

  const heartR = Math.max(0.30 - darkness * 0.35, 0.02);
  const heartG = Math.max(0.18 - darkness * 0.18, 0.01);
  const heartB = Math.max(0.30 - darkness * 0.15, 0.08);

  const strokeOpacity = Math.max(0.9 - darkness * 0.6, 0.15);
  const innerGlowOpacity = Math.max(0.15 - darkness * 0.14, 0.01);
  const glowRingBase = Math.max(0.06 - darkness * 0.04, 0.01);

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.04,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: glowRingBase * 2,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: glowRingBase * 0.5,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    breathe.start();
    glowAnim.start();
    return () => {
      breathe.stop();
      glowAnim.stop();
    };
  }, []);

  useEffect(() => {
    if (pulse) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.88,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1.0,
          friction: 3,
          tension: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [pulse]);

  const HEART_PATH =
    "M256 448 C 256 448 44 296 44 172 C 44 94 110 44 178 44 C 220 44 250 70 256 96 C 262 70 292 44 334 44 C 402 44 468 94 468 172 C 468 296 256 448 256 448 Z";

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glowRing3, { opacity: glowPulse }]} />
      <Animated.View
        style={[
          styles.glowRing2,
          { opacity: Animated.multiply(glowPulse, 1.5) },
        ]}
      />
      <Animated.View
        style={[
          styles.glowRing1,
          { opacity: Animated.multiply(glowPulse, 2) },
        ]}
      />

      <AnimatedSvg
        width={340}
        height={340}
        viewBox="0 0 512 512"
        style={[styles.heart, { transform: [{ scale }] }]}
      >
        <Defs>
          <RadialGradient id="heartFill" cx="50%" cy="35%" r="65%">
            <Stop offset="0%" stopColor={`rgba(${Math.round(168 * (1 - darkness))}, ${Math.round(85 * (1 - darkness))}, ${Math.round(247 * (1 - darkness * 0.5))}, ${0.30 - darkness * 0.15})`} />
            <Stop offset="40%" stopColor={`rgba(${Math.round(124 * (1 - darkness))}, ${Math.round(58 * (1 - darkness))}, ${Math.round(237 * (1 - darkness * 0.6))}, ${0.18 - darkness * 0.10})`} />
            <Stop offset="75%" stopColor={`rgba(${Math.round(76 * (1 - darkness))}, ${Math.round(29 * (1 - darkness))}, ${Math.round(149 * (1 - darkness * 0.4))}, ${0.08})`} />
            <Stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.02" />
          </RadialGradient>
          <RadialGradient id="innerGlow" cx="50%" cy="30%" r="40%">
            <Stop offset="0%" stopColor="#c084fc" stopOpacity={innerGlowOpacity} />
            <Stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </RadialGradient>
          <SvgLinearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#a78bfa" stopOpacity={strokeOpacity} />
            <Stop offset="50%" stopColor="#7c4dff" stopOpacity={strokeOpacity * 0.8} />
            <Stop offset="100%" stopColor="#6d28d9" stopOpacity={strokeOpacity * 0.6} />
          </SvgLinearGradient>
        </Defs>

        <Path
          d={HEART_PATH}
          fill="url(#heartFill)"
          stroke="url(#strokeGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Path d={HEART_PATH} fill="url(#innerGlow)" />

        <Path
          d={HEART_PATH}
          fill={`rgba(0, 0, 0, ${darkness * 0.7})`}
        />

        <Path
          d="M256 438 C 256 438 54 290 54 172 C 54 100 116 54 178 54 C 218 54 246 76 256 100 C 266 76 294 54 334 54 C 396 54 458 100 458 172 C 458 290 256 438 256 438 Z"
          fill="none"
          stroke="#c084fc"
          strokeWidth="0.5"
          strokeDasharray="12 8"
          opacity={Math.max(0.25 - darkness * 0.2, 0.03)}
        />

        <G opacity={Math.max(0.2 - darkness * 0.18, 0.02)}>
          <Path
            d="M135 135 Q 110 95 170 108"
            fill="none"
            stroke="#e9d5ff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M130 150 Q 115 125 155 132"
            fill="none"
            stroke="#e9d5ff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </G>

        <G opacity={Math.max(0.1 - darkness * 0.09, 0.01)}>
          <Circle cx="200" cy="200" r="2" fill="#c084fc" />
          <Circle cx="320" cy="180" r="1.5" fill="#a78bfa" />
          <Circle cx="250" cy="300" r="1" fill="#e9d5ff" />
          <Circle cx="180" cy="250" r="1.5" fill="#c084fc" />
          <Circle cx="340" cy="260" r="1" fill="#a78bfa" />
        </G>
      </AnimatedSvg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  heart: {
    zIndex: 2,
  },
  glowRing3: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "#4c1d95",
    zIndex: 0,
  },
  glowRing2: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "#6d28d9",
    zIndex: 0,
  },
  glowRing1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#7c3aed",
    zIndex: 1,
  },
});
