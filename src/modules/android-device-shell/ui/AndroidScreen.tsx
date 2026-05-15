"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAndroidShellStore } from "../store/androidShellStore";
import { AndroidHomeLauncher } from "./AndroidHomeLauncher";
import { AndroidStatusBar } from "./AndroidStatusBar";
import { AndroidNotificationShade } from "./AndroidNotificationShade";
import { AndroidNavigationBar } from "./AndroidNavigationBar";
import { AndroidRecentApps } from "./AndroidRecentApps";
import { AndroidLockOverlay } from "./AndroidLockOverlay";
import { AndroidToastOverlay } from "./AndroidToastOverlay";
import { AndroidDialogOverlay } from "./AndroidDialogOverlay";
import { AndroidVolumeOverlay } from "./AndroidVolumeOverlay";
import { MdmAgentAppWindow } from "./MdmAgentAppWindow";

export function AndroidScreen() {
  const activeApp = useAndroidShellStore((state) => state.activeApp);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <AndroidStatusBar />
      <div className="absolute inset-x-0 bottom-[54px] top-[32px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeApp}
            className="h-full w-full"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.16 }}
          >
            {activeApp === "HOME" ? <AndroidHomeLauncher /> : null}
            {activeApp === "MDM_AGENT" ? <MdmAgentAppWindow /> : null}
            {activeApp === "RECENTS" ? <AndroidRecentApps /> : null}
            {["SETTINGS", "GALLERY", "FILES", "BROWSER"].includes(activeApp) ? <Placeholder title={activeApp.replace("_", " ")} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
      <AndroidNotificationShade />
      <AndroidToastOverlay />
      <AndroidDialogOverlay />
      <AndroidVolumeOverlay />
      <AndroidLockOverlay />
      <AndroidNavigationBar />
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="grid h-full place-items-center bg-slate-100 text-slate-500">
      <div className="text-center">
        <div className="text-xl font-semibold">{title}</div>
        <div className="mt-1 text-sm">Placeholder app</div>
      </div>
    </div>
  );
}
