"use client";

import { useAndroidShellStore } from "../store/androidShellStore";
import { AndroidAppIcon } from "./AndroidAppIcon";

export function AndroidHomeLauncher() {
  const openApp = useAndroidShellStore((state) => state.openApp);

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#2563eb_0,#2563eb_12%,transparent_13%),radial-gradient(circle_at_20%_35%,#fde047_0,#fde047_20%,transparent_21%),radial-gradient(circle_at_75%_30%,#ec4899_0,#fb923c_35%,transparent_36%),radial-gradient(circle_at_30%_80%,#ef4444_0,#f97316_30%,transparent_31%),linear-gradient(135deg,#fb923c,#ec4899,#7c3aed)]" />
      <div className="absolute left-1/2 top-[25%] -translate-x-1/2">
        <AndroidAppIcon label="MDM Agent" iconType="MDM" onClick={() => openApp("MDM_AGENT")} />
      </div>
      <div className="absolute bottom-28 left-0 right-0 flex justify-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/45" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/45" />
        <span className="h-2.5 w-2.5 rounded-full bg-white" />
      </div>
      <div className="absolute bottom-7 left-5 right-5 flex items-center justify-between rounded-3xl bg-white/12 px-3 py-3 backdrop-blur-sm">
        <AndroidAppIcon label="Files" iconType="FILES" onClick={() => openApp("FILES")} />
        <AndroidAppIcon label="Gallery" iconType="GALLERY" onClick={() => openApp("GALLERY")} />
        <AndroidAppIcon label="Browser" iconType="BROWSER" onClick={() => openApp("BROWSER")} />
        <AndroidAppIcon label="Settings" iconType="SETTINGS" onClick={() => openApp("SETTINGS")} />
      </div>
    </div>
  );
}

export function DebugWatermark() {
  return (
    <div className="pointer-events-none absolute bottom-16 right-5 flex items-center text-[20px] font-semibold leading-tight text-slate-700/80">
      <span>
        Warning: Debugging
        <br />
        machines must not
        <br />
        be used for trading
      </span>
      <span className="-ml-24 grid h-24 w-24 place-items-center rounded-full border-[7px] border-red-500/55 text-5xl font-bold text-red-500/55">/</span>
    </div>
  );
}
