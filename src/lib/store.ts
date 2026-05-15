"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { appConfig, DEFAULT_MQTT_URL } from "./config";
import { createDevice, randomId } from "./device-factory";
import type { CommandStatus, DeviceLog, DeviceProfile, DeviceConnectionState, LogLevel, SimulatedCommand } from "./types";

type DevicePatch = Partial<Omit<DeviceProfile, "id" | "logs" | "commandHistory">>;

type SimulatorState = {
  devices: DeviceProfile[];
  activeDeviceId: string;
  mockMode: boolean;
  pollIntervalSec: number;
  healthIntervalSec: number;
  addDevice: () => void;
  removeDevice: (id: string) => void;
  setActiveDevice: (id: string) => void;
  setMockMode: (enabled: boolean) => void;
  updateDevice: (id: string, patch: DevicePatch) => void;
  setDeviceState: (id: string, state: DeviceConnectionState) => void;
  addLog: (id: string, level: LogLevel, message: string, detail?: unknown) => void;
  recordCommand: (id: string, command: Omit<SimulatedCommand, "createdAtIso" | "updatedAtIso">) => void;
  updateCommand: (id: string, commandId: string, patch: Partial<Pick<SimulatedCommand, "status" | "response" | "payload">>) => void;
  mutateMetrics: (id: string) => void;
};

const initialDevice = createDevice(1);

function isStaleDefaultMqttHost(host?: string) {
  if (!host) return true;
  return host === DEFAULT_MQTT_URL || /^wss?:\/\/localhost(?::\d+)?(?:\/.*)?$/i.test(host) || /^mqtts?:\/\/localhost(?::\d+)?(?:\/.*)?$/i.test(host);
}

function normalizePersistedDevice(device: DeviceProfile): DeviceProfile {
  const shouldUseEnvMqtt = isStaleDefaultMqttHost(device.mqtt?.host);
  return {
    ...device,
    mqtt: {
      ...device.mqtt,
      host: shouldUseEnvMqtt ? appConfig.mqttUrl : device.mqtt?.host,
      clientId: device.mqtt?.clientId || device.serialNumber,
      username: device.mqtt?.username || appConfig.mqttUsername || "",
      password: device.mqtt?.password || appConfig.mqttPassword || "",
    },
    notifications: device.notifications ?? [],
    screenSharing: device.screenSharing ?? false,
    mediaPlaying: device.mediaPlaying ?? false,
    mqttConnected: false,
  };
}

export const useSimulatorStore = create<SimulatorState>()(
  persist(
    (set, get) => ({
      devices: [initialDevice],
      activeDeviceId: initialDevice.id,
      mockMode: appConfig.mockMode,
      pollIntervalSec: appConfig.defaultPollIntervalSec,
      healthIntervalSec: appConfig.defaultHealthIntervalSec,
      addDevice: () =>
        set((state) => {
          const device = createDevice(state.devices.length + 1);
          return {
            devices: [...state.devices, device],
            activeDeviceId: device.id,
          };
        }),
      removeDevice: (id) =>
        set((state) => {
          if (state.devices.length === 1) return state;
          const devices = state.devices.filter((device) => device.id !== id);
          return {
            devices,
            activeDeviceId: state.activeDeviceId === id ? devices[0].id : state.activeDeviceId,
          };
        }),
      setActiveDevice: (id) => set({ activeDeviceId: id }),
      setMockMode: (enabled) => set({ mockMode: enabled }),
      updateDevice: (id, patch) =>
        set((state) => ({
          devices: state.devices.map((device) => (device.id === id ? { ...device, ...patch } : device)),
        })),
      setDeviceState: (id, stateValue) => get().updateDevice(id, { state: stateValue }),
      addLog: (id, level, message, detail) =>
        set((state) => ({
          devices: state.devices.map((device) => {
            if (device.id !== id) return device;
            const log: DeviceLog = {
              id: randomId("log"),
              tsIso: new Date().toISOString(),
              level,
              message,
              detail,
            };
            return { ...device, logs: [log, ...device.logs].slice(0, 120) };
          }),
        })),
      recordCommand: (id, command) =>
        set((state) => ({
          devices: state.devices.map((device) => {
            if (device.id !== id) return device;
            const nowIso = new Date().toISOString();
            return {
              ...device,
              commandHistory: [
                {
                  ...command,
                  createdAtIso: nowIso,
                  updatedAtIso: nowIso,
                },
                ...device.commandHistory,
              ].slice(0, 80),
            };
          }),
        })),
      updateCommand: (id, commandId, patch) =>
        set((state) => ({
          devices: state.devices.map((device) => {
            if (device.id !== id) return device;
            return {
              ...device,
              commandHistory: device.commandHistory.map((command) =>
                command.id === commandId
                  ? {
                      ...command,
                      ...patch,
                      status: (patch.status as CommandStatus | undefined) ?? command.status,
                      updatedAtIso: new Date().toISOString(),
                    }
                  : command,
              ),
            };
          }),
        })),
      mutateMetrics: (id) =>
        set((state) => ({
          devices: state.devices.map((device) => {
            if (device.id !== id) return device;
            const battery = Math.max(5, Math.min(100, device.metrics.battery_percentage + (Math.random() > 0.55 ? 1 : -1)));
            const latency = Math.max(12, Math.round(device.metrics.connection.latency + Math.random() * 18 - 8));
            const usedMem = Math.max(20, Math.min(90, device.metrics.ram.used_mem_in_percentage + Math.round(Math.random() * 6 - 3)));
            return {
              ...device,
              metrics: {
                ...device.metrics,
                battery_percentage: battery,
                connection: {
                  ...device.metrics.connection,
                  latency,
                  connection_level: Math.max(1, Math.min(5, device.metrics.connection.connection_level + (Math.random() > 0.8 ? -1 : 0))),
                },
                ram: {
                  ...device.metrics.ram,
                  used_mem_in_percentage: usedMem,
                  used_mem_in_bytes: Math.round((device.metrics.ram.native_heap_size * usedMem) / 100),
                },
                uptime_device: device.metrics.uptime_device + 60000,
              },
            };
          }),
        })),
    }),
    {
      name: "mdm-agent-simulator",
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<SimulatorState> | undefined;
        const devices = persistedState?.devices?.length ? persistedState.devices.map(normalizePersistedDevice) : current.devices;
        return {
          ...current,
          ...persistedState,
          devices,
          activeDeviceId: devices.some((device) => device.id === persistedState?.activeDeviceId) ? persistedState!.activeDeviceId! : devices[0].id,
          mockMode: persistedState?.mockMode ?? appConfig.mockMode,
          pollIntervalSec: persistedState?.pollIntervalSec ?? appConfig.defaultPollIntervalSec,
          healthIntervalSec: persistedState?.healthIntervalSec ?? appConfig.defaultHealthIntervalSec,
        };
      },
      partialize: (state) => ({
        devices: state.devices,
        activeDeviceId: state.activeDeviceId,
        mockMode: state.mockMode,
        pollIntervalSec: state.pollIntervalSec,
        healthIntervalSec: state.healthIntervalSec,
      }),
    },
  ),
);
