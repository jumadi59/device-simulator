"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAndroidShellStore } from "../store/androidShellStore";
import { AndroidQuickSettings } from "./AndroidQuickSettings";
import { AndroidNotificationList } from "./AndroidNotificationList";

export function AndroidNotificationShade() {
  const open = useAndroidShellStore((state) => state.notificationShadeOpen);
  const openNotificationShade = useAndroidShellStore((state) => state.openNotificationShade);
  const closeNotificationShade = useAndroidShellStore((state) => state.closeNotificationShade);
  const clearNotifications = useAndroidShellStore((state) => state.clearNotifications);

  return (
    <>
      <motion.div
        className="absolute inset-x-0 top-0 z-40 h-8"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 40) openNotificationShade();
        }}
      />
      <motion.div
        className="absolute inset-x-0 top-0 z-50 h-full overflow-hidden rounded-b-[28px] bg-white/92 p-5 pt-10 shadow-2xl backdrop-blur-xl"
        initial={false}
        animate={{ y: open ? 0 : "-102%" }}
        transition={{ type: "spring", damping: 30, stiffness: 270 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y < -120 || info.velocity.y < -600) closeNotificationShade();
          if (info.offset.y > 120) openNotificationShade();
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-4xl font-semibold text-slate-900">1:30</div>
            <div className="mt-1 text-sm text-slate-500">{format(new Date(), "EEEE, MMM d")}</div>
          </div>
          <button type="button" onClick={clearNotifications} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Clear
          </button>
        </div>
        <div className="mt-5">
          <AndroidQuickSettings />
        </div>
        <div className="mt-5 rounded-full bg-slate-200 p-1">
          <div className="h-2 w-2/3 rounded-full bg-[#6200EE]" />
        </div>
        <div className="mt-5 max-h-[52%] overflow-auto pr-1 scrollbar-thin">
          <AndroidNotificationList />
        </div>
      </motion.div>
    </>
  );
}
