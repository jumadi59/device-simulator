import { appConfig } from "./config";
import type { DeviceProfile, HealthPayload } from "./types";

const now = Date.now();

export function randomId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}`;
}

export function createMetrics(serialNumber: string): HealthPayload["payload"] {
  return {
    battery_percentage: 76,
    battery_status: "Charging",
    connection: {
      connection_name: "WIFI",
      connection_level: 5,
      latency: 42,
      public_ip: null,
      private_ip: "192.168.1.15",
    },
    ram: {
      native_heap_size: 906563584,
      native_heap_free_size: 305352704,
      used_mem_in_bytes: 601210880,
      used_mem_in_percentage: 66,
    },
    storage: {
      storage_total: 8000000000,
      storage_used: 5063999488,
      storage_free: 2936000512,
      storage_percentage: 63,
    },
    latitude: -6.1784,
    longitude: 106.7893,
    installed_apps: [
      {
        label: "MiniATM",
        package_name: "com.miniatm.app",
        version_code: 21,
        version_name: "1.0.20",
        icon: null,
      },
      {
        label: "EDC Launcher",
        package_name: "com.pax.launcher",
        version_code: 108,
        version_name: "3.8.1",
        icon: null,
      },
    ],
    serial_number: serialNumber,
    uptime_device: 3600000,
    firmware: "A920_V1.2.3",
    mdm_version: "1.0.20",
  };
}

export function createDevice(index = 1): DeviceProfile {
  const suffix = String(index).padStart(3, "0");
  const serialNumber = `PB0W239G20${suffix}`;

  return {
    id: randomId("devsim"),
    serialNumber,
    brand: "PAX",
    model: "A920",
    appVersion: "1.0.20",
    androidId: `a1b2c3d4e5${suffix}`,
    installationId: `inst-${randomId("web").slice(-8)}`,
    fingerprint: "PAX/A920/MDM_AGENT_SIMULATOR",
    requestedGroupId: 12,
    note: "Outlet Jakarta Selatan",
    onboardingToken: "ENR_BWd1EJGukW6D57JxjgfOIFNv8CcpGQaunOJ2TG72sQA",
    state: "idle",
    tokens: {},
    mqtt: {
      host: appConfig.mqttUrl,
      clientId: serialNumber,
      username: appConfig.mqttUsername,
      password: appConfig.mqttPassword,
    },
    locked: false,
    activeApp: "com.miniatm.app",
    notifications: [],
    screenSharing: false,
    mediaPlaying: false,
    mqttConnected: false,
    preferences: {
      terminal_interval: appConfig.defaultPollIntervalSec,
    },
    metrics: createMetrics(serialNumber),
    logs: [
      {
        id: randomId("log"),
        tsIso: new Date(now).toISOString(),
        level: "info",
        message: "Device simulator initialized",
      },
    ],
    commandHistory: [],
  };
}
