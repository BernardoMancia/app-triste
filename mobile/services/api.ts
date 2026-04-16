const API_BASE = "http://82.112.245.99:2345/api";

export async function registerTap(deviceId: string) {
  const res = await fetch(`${API_BASE}/tap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId }),
  });
  return res.json();
}

export async function getTodayCount(deviceId: string) {
  const res = await fetch(`${API_BASE}/today/${deviceId}`);
  return res.json();
}

export async function getMonthlySummary(
  deviceId: string,
  year?: number,
  month?: number
) {
  const res = await fetch(`${API_BASE}/monthly-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId, year, month }),
  });
  return res.json();
}

export async function registerPushToken(
  deviceId: string,
  expoToken: string
) {
  const res = await fetch(`${API_BASE}/register-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId, expo_token: expoToken }),
  });
  return res.json();
}
