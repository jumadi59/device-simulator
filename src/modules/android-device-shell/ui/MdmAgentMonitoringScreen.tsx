"use client";

import { useSelectedDeviceViewModel } from "../services/deviceShellMapper";

export function MdmAgentMonitoringScreen() {
  const device = useSelectedDeviceViewModel();
  const rows = [
    ["Serial Number", device.serialNumber],
    ["Total Storage", device.totalStorageLabel],
    ["Free Storage", device.freeStorageLabel],
    ["Used Storage", device.usedStorageLabel],
    ["Total RAM", device.totalRamLabel],
    ["Free RAM", device.freeRamLabel],
    ["Used RAM", device.usedRamLabel],
    ["Battery", `${device.batteryPercentage.toFixed(1)}%`],
    ["Connection", device.connectionName],
    ["Signal", String(device.connectionLevel)],
    ["Active Time", device.activeTimeLabel],
    ["MDM", device.mdmConnected ? "Connected" : "Disconnected"],
    ["Location", device.locationLabel],
  ];

  return (
    <div className="h-full overflow-hidden px-5 pb-8 pt-4">
      <div className="divide-y divide-slate-300">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[1fr_1.45fr] items-center py-2.5 text-[20px] leading-tight text-[#777]">
            <span>{label}</span>
            <span className="truncate">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center text-base text-[#777]">Version App {device.appVersion}</div>
    </div>
  );
}
