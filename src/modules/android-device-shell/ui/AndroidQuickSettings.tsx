"use client";

import { BatteryCharging, Bluetooth, Cast, Lock, MapPin, Moon, ShieldCheck, Wifi } from "lucide-react";
import { useSimulatorStore } from "@/lib/store";
import { useAndroidShellStore } from "../store/androidShellStore";
import type { QuickSettingsState } from "../domain/androidShellModel";

const settings: Array<{ key: keyof QuickSettingsState; label: string; icon: React.ReactNode }> = [
  { key: "wifi", label: "WiFi", icon: <Wifi className="h-4 w-4" /> },
  { key: "bluetooth", label: "Bluetooth", icon: <Bluetooth className="h-4 w-4" /> },
  { key: "location", label: "Location", icon: <MapPin className="h-4 w-4" /> },
  { key: "mdm", label: "MDM", icon: <ShieldCheck className="h-4 w-4" /> },
  { key: "silent", label: "Silent", icon: <Moon className="h-4 w-4" /> },
  { key: "screenShare", label: "Share", icon: <Cast className="h-4 w-4" /> },
  { key: "batterySaver", label: "Saver", icon: <BatteryCharging className="h-4 w-4" /> },
  { key: "lock", label: "Lock", icon: <Lock className="h-4 w-4" /> },
];

export function AndroidQuickSettings() {
  const quickSettings = useAndroidShellStore((state) => state.quickSettings);
  const toggleQuickSetting = useAndroidShellStore((state) => state.toggleQuickSetting);
  const activeDeviceId = useSimulatorStore((state) => state.activeDeviceId);
  const updateDevice = useSimulatorStore((state) => state.updateDevice);

  return (
    <div className="grid grid-cols-2 gap-2">
      {settings.map((setting) => {
        const active = quickSettings[setting.key];
        return (
          <button
            key={setting.key}
            type="button"
            onClick={() => {
              toggleQuickSetting(setting.key);
              if (setting.key === "lock") updateDevice(activeDeviceId, { locked: !active });
            }}
            className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold ${
              active ? "bg-[#6200EE] text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {setting.icon}
            {setting.label}
          </button>
        );
      })}
    </div>
  );
}
