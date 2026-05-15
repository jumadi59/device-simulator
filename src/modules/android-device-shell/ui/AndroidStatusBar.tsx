"use client";

import { BatteryCharging, Bell, Bluetooth, Cast, VolumeX, Wifi } from "lucide-react";
import { useAndroidShellStore } from "../store/androidShellStore";
import { useSelectedDeviceViewModel } from "../services/deviceShellMapper";

export function AndroidStatusBar() {
  const activeApp = useAndroidShellStore((state) => state.activeApp);
  const notifications = useAndroidShellStore((state) => state.notifications);
  const quickSettings = useAndroidShellStore((state) => state.quickSettings);
  const openNotificationShade = useAndroidShellStore((state) => state.openNotificationShade);
  const device = useSelectedDeviceViewModel();
  const purple = activeApp === "MDM_AGENT";
  const dark = activeApp === "HOME" || activeApp === "RECENTS";

  return (
    <button
      type="button"
      onClick={openNotificationShade}
      className={`absolute inset-x-0 top-0 z-30 flex h-8 items-center justify-between px-3 text-white ${
        purple ? "bg-[#6200EE]" : dark ? "bg-black/25" : "bg-slate-900"
      }`}
      title="Open notification shade"
    >
      <div className="flex items-center gap-2 text-[15px] font-semibold leading-none">
        <span>1:30 PM</span>
        {notifications.length > 0 ? <Bell className="h-4 w-4 fill-white" /> : null}
        <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-white text-[9px] font-bold">M</span>
        {device.screenSharing ? <Cast className="h-4 w-4" /> : null}
      </div>
      <div className="flex items-center gap-2">
        {quickSettings.silent ? <VolumeX className="h-4 w-4" /> : null}
        {quickSettings.bluetooth ? <Bluetooth className="h-4 w-4" /> : null}
        <Wifi className={`h-5 w-5 ${quickSettings.wifi ? "fill-white" : "opacity-40"}`} />
        <BatteryCharging className="h-5 w-5" />
        <span className="text-[11px]">{Math.round(device.batteryPercentage)}%</span>
      </div>
    </button>
  );
}
