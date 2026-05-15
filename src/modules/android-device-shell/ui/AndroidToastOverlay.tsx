"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useAndroidShellStore } from "../store/androidShellStore";

export function AndroidToastOverlay() {
  const toast = useAndroidShellStore((state) => state.overlays.toast);
  const clearToast = useAndroidShellStore((state) => state.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(clearToast, 2600);
    return () => window.clearTimeout(timeout);
  }, [clearToast, toast]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="absolute bottom-20 left-1/2 z-[65] max-w-[86%] -translate-x-1/2 rounded-full bg-amber-50 px-4 py-2 text-sm accent-gray-950 shadow-lg"
        >
          {toast.message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
