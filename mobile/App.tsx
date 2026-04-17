import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

import HeartBackground from "./components/HeartBackground";
import Counter from "./components/Counter";
import FloatingParticle from "./components/FloatingParticle";
import TapFeedback from "./components/TapFeedback";
import NeedleOverlay from "./components/NeedleOverlay";
import { getTodayCount, registerPushToken, registerTap } from "./services/api";

const { width, height } = Dimensions.get("window");
const DEVICE_ID_KEY = "@app_triste_device_id";
const COUNT_CACHE_KEY = "@app_triste_count_cache";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getTodayDateString(): string {
  const now = new Date();
  const offset = -3 * 60;
  const brt = new Date(now.getTime() + (now.getTimezoneOffset() + offset) * 60000);
  return `${brt.getFullYear()}-${String(brt.getMonth() + 1).padStart(2, "0")}-${String(brt.getDate()).padStart(2, "0")}`;
}

async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

async function getCachedCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(COUNT_CACHE_KEY);
    if (!raw) return 0;
    const cache = JSON.parse(raw);
    if (cache.date === getTodayDateString()) {
      return cache.count || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

async function setCachedCount(count: number): Promise<void> {
  await AsyncStorage.setItem(
    COUNT_CACHE_KEY,
    JSON.stringify({ date: getTodayDateString(), count })
  );
}

async function registerForPushNotifications(deviceId: string) {
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7c4dff",
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await registerPushToken(deviceId, tokenData.data);
  } catch (err) {
    console.warn("Falha ao registrar push token:", err);
  }
}

interface TapEffect {
  id: number;
  x: number;
  y: number;
}

export default function App() {
  const [count, setCount] = useState(0);
  const [pulseHeart, setPulseHeart] = useState(false);
  const [bounceTrigger, setBounceTrigger] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [tapEffects, setTapEffects] = useState<TapEffect[]>([]);
  const [newNeedleIndex, setNewNeedleIndex] = useState(-1);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const loadingPulse = useRef(new Animated.Value(0.3)).current;
  const tapCountRef = useRef(0);
  const tapIdRef = useRef(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingPulse, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(loadingPulse, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    (async () => {
      const id = await getDeviceId();
      setDeviceId(id);

      const cached = await getCachedCount();
      setCount(cached);
      tapCountRef.current = cached;
      setNewNeedleIndex(-1);

      try {
        const data = await getTodayCount(id);
        const serverCount = data.count_today || 0;
        setCount(serverCount);
        tapCountRef.current = serverCount;
        await setCachedCount(serverCount);
      } catch (err) {
        console.warn("Falha ao sincronizar contagem:", err);
      }

      await registerForPushNotifications(id);
      setIsLoading(false);

      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    })();
  }, []);

  const handleTap = useCallback(
    async (e: GestureResponderEvent) => {
      if (!deviceId) return;

      const { locationX, locationY } = e.nativeEvent;

      tapCountRef.current += 1;
      const currentCount = tapCountRef.current;
      setCount(currentCount);
      setPulseHeart((p) => !p);
      setBounceTrigger((b) => !b);
      setNewNeedleIndex(currentCount - 1);

      setCachedCount(currentCount);

      const newId = ++tapIdRef.current;
      setTapEffects((prev) => [
        ...prev.slice(-4),
        { id: newId, x: locationX, y: locationY },
      ]);

      setTimeout(() => {
        setTapEffects((prev) => prev.filter((t) => t.id !== newId));
      }, 800);

      try {
        const data = await registerTap(deviceId);
        tapCountRef.current = data.count_today;
        setCount(data.count_today);
        await setCachedCount(data.count_today);
      } catch (err) {
        console.warn("Falha ao registrar tap:", err);
        Vibration.vibrate([0, 30, 50, 30]);
      }
    },
    [deviceId]
  );

  const particles = [
    { id: 0, delay: 0, startX: -80, size: 3, color: "#a78bfa" },
    { id: 1, delay: 600, startX: -40, size: 5, color: "#c084fc" },
    { id: 2, delay: 1200, startX: 10, size: 3, color: "#7c3aed" },
    { id: 3, delay: 1800, startX: 50, size: 4, color: "#a78bfa" },
    { id: 4, delay: 2400, startX: 90, size: 3, color: "#e9d5ff" },
    { id: 5, delay: 3000, startX: -60, size: 4, color: "#c084fc" },
    { id: 6, delay: 3600, startX: 30, size: 2, color: "#7c3aed" },
    { id: 7, delay: 4200, startX: -20, size: 5, color: "#a78bfa" },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <LinearGradient
          colors={["#0a0a0f", "#0d0b1a", "#0a0a0f"]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.Text style={[styles.loadingText, { opacity: loadingPulse }]}>
          💙
        </Animated.Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.container} onPress={handleTap}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[
          "#05050a",
          "#0a0816",
          "#0e0b1e",
          "#0d0a1a",
          "#080612",
          "#05050a",
        ]}
        locations={[0, 0.15, 0.35, 0.55, 0.8, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeIn }]}>
        {particles.map((p) => (
          <FloatingParticle
            key={p.id}
            delay={p.delay}
            startX={p.startX}
            size={p.size}
            color={p.color}
          />
        ))}

        <HeartBackground pulse={pulseHeart} darkenLevel={count} />

        <NeedleOverlay count={count} newNeedleIndex={newNeedleIndex} />

        {tapEffects.map((t) => (
          <TapFeedback key={t.id} x={t.x} y={t.y} id={t.id} />
        ))}

        <View style={styles.counterWrapper}>
          <Counter count={count} triggerBounce={bounceTrigger} />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLineLeft} />
          <Text style={styles.footerText}>toque quando estiver triste</Text>
          <View style={styles.footerLineRight} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05050a",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#05050a",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 48,
  },
  counterWrapper: {
    position: "absolute",
    top: height * 0.1,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  footer: {
    position: "absolute",
    bottom: 55,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    zIndex: 20,
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.2)",
    fontWeight: "300",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginHorizontal: 12,
  },
  footerLineLeft: {
    flex: 1,
    height: 1,
    maxWidth: 60,
    backgroundColor: "rgba(124, 77, 255, 0.15)",
  },
  footerLineRight: {
    flex: 1,
    height: 1,
    maxWidth: 60,
    backgroundColor: "rgba(124, 77, 255, 0.15)",
  },
});
