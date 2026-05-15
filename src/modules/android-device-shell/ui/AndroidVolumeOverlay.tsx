"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { useEffect } from "react";
import { useAndroidShellStore } from "../store/androidShellStore";

export function AndroidVolumeOverlay() {
  const volume = useAndroidShellStore((state) => state.overlays.volume);
  const hideVolumeOverlay = useAndroidShellStore((state) => state.hideVolumeOverlay);

  useEffect(() => {
    if (!volume?.visible) return;
    const timeout = window.setTimeout(hideVolumeOverlay, 1800);
    return () => window.clearTimeout(timeout);
  }, [hideVolumeOverlay, volume?.visible]);

  return (
    <AnimatePresence>
      {volume?.visible ? (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute right-4 top-20 z-[66] rounded-2xl bg-white/95 p-4 text-slate-900 shadow-2xl"
        >
          <motion.div
            animate={{ scale: [1, 1.14, 1] }}
            transition={{ repeat: Math.max(1, volume.count) - 1, duration: 0.35 }}
            className="grid h-12 w-12 place-items-center rounded-full bg-violet-100 text-[#6200EE]"
          >
            <Volume2 className="h-7 w-7" />
          </motion.div>
          <div className="mt-2 text-center text-xs font-semibold">x{volume.count}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
