"use client";

import { Folder, Globe, Image, Settings, Smartphone } from "lucide-react";

type Props = {
  label: string;
  iconType: "MDM" | "FILES" | "GALLERY" | "BROWSER" | "SETTINGS";
  onClick: () => void;
};

export function AndroidAppIcon({ label, iconType, onClick }: Props) {
  return (
    <button type="button" onClick={onClick} className="flex w-24 flex-col items-center gap-2 text-white drop-shadow">
      <span className={`grid h-16 w-16 place-items-center rounded-2xl shadow-md ${iconType === "MDM" ? "bg-emerald-400" : "bg-white/90 text-sky-500"}`}>
        {iconType === "MDM" ? (
          <span className="grid h-full w-full place-items-center rounded-2xl bg-[linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] bg-[length:12px_12px]">
            <Smartphone className="h-9 w-9 text-white" />
          </span>
        ) : null}
        {iconType === "FILES" ? <Folder className="h-9 w-9" /> : null}
        {iconType === "GALLERY" ? <Image className="h-9 w-9" /> : null}
        {iconType === "BROWSER" ? <Globe className="h-9 w-9" /> : null}
        {iconType === "SETTINGS" ? <Settings className="h-9 w-9" /> : null}
      </span>
      <span className="text-center text-sm font-medium leading-tight">{label}</span>
    </button>
  );
}
