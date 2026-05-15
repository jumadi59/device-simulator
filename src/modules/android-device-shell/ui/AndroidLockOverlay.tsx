"use client";

import { Lock } from "lucide-react";
import { useSimulatorStore } from "@/lib/store";
import { useSelectedDeviceViewModel } from "../services/deviceShellMapper";

export function AndroidLockOverlay() {
  const device = useSelectedDeviceViewModel();
  const updateDevice = useSimulatorStore((state) => state.updateDevice);

  if (!device.locked) return null;

  return (
    <div className="absolute inset-0 z-[70] grid place-items-center bg-black/82 px-8 text-center text-white">
      <div>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/10">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold">Device Locked</h2>
        <p className="mt-2 text-sm text-slate-300">This terminal is locked by MDM</p>
        {device.id ? (
          <button
            type="button"
            onClick={() => updateDevice(device.id!, { locked: false })}
            className="mt-6 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950"
          >
            Unlock for testing
          </button>
        ) : null}
      </div>
    </div>
  );
}
