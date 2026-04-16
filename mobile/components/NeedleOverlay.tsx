import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Line, Circle, G } from "react-native-svg";

const AnimatedG = Animated.createAnimatedComponent(G);

const NEEDLE_POSITIONS = [
  { x: 180, y: 160, rotation: -25 },
  { x: 320, y: 150, rotation: 20 },
  { x: 150, y: 220, rotation: -40 },
  { x: 350, y: 200, rotation: 35 },
  { x: 230, y: 130, rotation: -10 },
  { x: 290, y: 140, rotation: 15 },
  { x: 200, y: 280, rotation: -30 },
  { x: 310, y: 270, rotation: 25 },
  { x: 160, y: 300, rotation: -45 },
  { x: 340, y: 290, rotation: 40 },
  { x: 250, y: 200, rotation: 5 },
  { x: 210, y: 350, rotation: -15 },
  { x: 300, y: 340, rotation: 10 },
  { x: 170, y: 250, rotation: -35 },
  { x: 335, y: 240, rotation: 30 },
  { x: 240, y: 170, rotation: -5 },
  { x: 270, y: 320, rotation: 20 },
  { x: 190, y: 190, rotation: -20 },
  { x: 260, y: 250, rotation: 12 },
  { x: 220, y: 310, rotation: -28 },
  { x: 280, y: 190, rotation: 18 },
  { x: 195, y: 340, rotation: -38 },
  { x: 330, y: 320, rotation: 33 },
  { x: 155, y: 270, rotation: -42 },
  { x: 305, y: 160, rotation: 22 },
  { x: 245, y: 380, rotation: -8 },
  { x: 275, y: 130, rotation: 8 },
  { x: 215, y: 230, rotation: -18 },
  { x: 290, y: 300, rotation: 28 },
  { x: 175, y: 180, rotation: -32 },
];

interface NeedleProps {
  x: number;
  y: number;
  rotation: number;
  delay: number;
  isNew: boolean;
}

function Needle({ x, y, rotation, delay, isNew }: NeedleProps) {
  const stabAnim = useRef(new Animated.Value(isNew ? -30 : 0)).current;
  const opacityAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isNew) {
      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.spring(stabAnim, {
            toValue: 0,
            friction: 5,
            tension: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start(() => {
          Animated.sequence([
            Animated.timing(shakeAnim, {
              toValue: 3,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: -2,
              duration: 40,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 1,
              duration: 30,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 0,
              duration: 25,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [isNew]);

  const rad = (rotation * Math.PI) / 180;
  const needleLength = 40;
  const dx = Math.sin(rad) * needleLength;
  const dy = -Math.cos(rad) * needleLength;

  return (
    <G x={x} y={y} rotation={rotation} origin={`${x}, ${y}`}>
      <Line
        x1={0}
        y1={-2}
        x2={0}
        y2={-38}
        stroke="#c0c0c0"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={0.9}
      />

      <Line
        x1={0}
        y1={-2}
        x2={0}
        y2={5}
        stroke="#e0e0e0"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={0.95}
      />

      <Circle
        cx={0}
        cy={-40}
        r={4}
        fill="#ff4444"
        opacity={0.85}
      />
      <Circle
        cx={-1}
        cy={-41}
        r={1.5}
        fill="#ff8888"
        opacity={0.6}
      />
    </G>
  );
}

interface NeedleOverlayProps {
  count: number;
  newNeedleIndex: number;
}

export default function NeedleOverlay({ count, newNeedleIndex }: NeedleOverlayProps) {
  const visibleNeedles = NEEDLE_POSITIONS.slice(0, Math.min(count, NEEDLE_POSITIONS.length));

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg
        width={340}
        height={340}
        viewBox="0 0 512 512"
        style={styles.svg}
      >
        {visibleNeedles.map((pos, index) => (
          <Needle
            key={index}
            x={pos.x}
            y={pos.y}
            rotation={pos.rotation}
            delay={0}
            isNew={index === newNeedleIndex}
          />
        ))}
      </Svg>
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
    zIndex: 3,
  },
  svg: {
    zIndex: 3,
  },
});
