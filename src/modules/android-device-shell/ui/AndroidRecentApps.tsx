"use client";

import { motion } from "framer-motion";
import { useAndroidShellStore } from "../store/androidShellStore";

export function AndroidRecentApps() {
  const recentApps = useAndroidShellStore((state) => state.recentApps);
  const openApp = useAndroidShellStore((state) => state.openApp);
  const removeRecentApp = useAndroidShellStore((state) => state.removeRecentApp);
  const clearRecentApps = useAndroidShellStore((state) => state.clearRecentApps);

  return (
    <div className="h-full bg-slate-950/95 p-5 pt-10 text-white backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent apps</h2>
        <button type="button" onClick={clearRecentApps} className="rounded-full bg-white/10 px-3 py-1 text-sm">
          Clear all
        </button>
      </div>
      {recentApps.length === 0 ? <div className="grid h-4/5 place-items-center text-slate-400">No recent apps</div> : null}
      <div className="space-y-4">
        {recentApps.map((recent) => (
          <motion.button
            key={recent.id}
            type="button"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 120) removeRecentApp(recent.app);
            }}
            onClick={() => openApp(recent.app)}
            className="block h-36 w-full rounded-2xl border border-white/10 bg-white text-left text-slate-900 shadow-xl"
          >
            <div className="border-b border-slate-100 px-4 py-3 font-semibold">{recent.title}</div>
            <div className="grid h-24 place-items-center text-sm text-slate-500">Tap to resume</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
