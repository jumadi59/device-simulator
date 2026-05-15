import { useSimulatorStore } from "@/lib/store";
import type { DeviceProfile } from "@/lib/types";

export type AndroidDeviceViewModel = {
  id?: string;
  serialNumber: string;
  batteryPercentage: number;
  connectionName: string;
  connectionLevel: number;
  mdmConnected: boolean;
  mqttConnected: boolean;
  locked: boolean;
  screenSharing: boolean;
  mediaPlaying: boolean;
  totalStorageLabel: string;
  freeStorageLabel: string;
  usedStorageLabel: string;
  totalRamLabel: string;
  freeRamLabel: string;
  usedRamLabel: string;
  activeTimeLabel: string;
  locationLabel: string;
  appVersion: string;
};

export function getSelectedDevice() {
  const state = useSimulatorStore.getState();
  return state.devices.find((device) => device.id === state.activeDeviceId) ?? state.devices[0];
}

export function useSelectedDeviceViewModel() {
  const devices = useSimulatorStore((state) => state.devices);
  const activeDeviceId = useSimulatorStore((state) => state.activeDeviceId);
  const device = devices.find((item) => item.id === activeDeviceId) ?? devices[0];
  return toAndroidDeviceViewModel(device);
}

export function toAndroidDeviceViewModel(device?: DeviceProfile): AndroidDeviceViewModel {
  if (!device) {
    return {
      serialNumber: "P551700121398",
      batteryPercentage: 20,
      connectionName: "WIFI",
      connectionLevel: 5,
      mdmConnected: false,
      mqttConnected: false,
      locked: false,
      screenSharing: false,
      mediaPlaying: false,
      totalStorageLabel: "14.90GB",
      freeStorageLabel: "9.01GB",
      usedStorageLabel: "5.88GB",
      totalRamLabel: "1.87GB",
      freeRamLabel: "1.14GB",
      usedRamLabel: "745.05MB",
      activeTimeLabel: "00:01:53",
      locationLabel: "-6.179429,106.788367",
      appVersion: "1.0",
    };
  }

  return {
    id: device.id,
    serialNumber: device.serialNumber,
    batteryPercentage: device.metrics.battery_percentage,
    connectionName: device.metrics.connection.connection_name,
    connectionLevel: device.metrics.connection.connection_level,
    mdmConnected: Boolean(device.tokens.accessToken),
    mqttConnected: Boolean(device.mqttConnected),
    locked: Boolean(device.locked),
    screenSharing: Boolean(device.screenSharing),
    mediaPlaying: Boolean(device.mediaPlaying),
    totalStorageLabel: formatBytes(device.metrics.storage.storage_total),
    freeStorageLabel: formatBytes(device.metrics.storage.storage_free),
    usedStorageLabel: formatBytes(device.metrics.storage.storage_used),
    totalRamLabel: formatBytes(device.metrics.ram.native_heap_size),
    freeRamLabel: formatBytes(device.metrics.ram.native_heap_free_size),
    usedRamLabel: formatBytes(device.metrics.ram.used_mem_in_bytes),
    activeTimeLabel: formatUptime(device.metrics.uptime_device),
    locationLabel: `${device.metrics.latitude.toFixed(6)},${device.metrics.longitude.toFixed(6)}`,
    appVersion: device.appVersion,
  };
}

export function formatBytes(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}GB`;
  return `${(value / 1_000_000).toFixed(2)}MB`;
}

export function formatUptime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
