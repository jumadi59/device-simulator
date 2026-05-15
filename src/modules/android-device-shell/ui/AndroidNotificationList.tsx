"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAndroidShellStore } from "../store/androidShellStore";

export function AndroidNotificationList() {
  const notifications = useAndroidShellStore((state) => state.notifications);
  const dismissNotification = useAndroidShellStore((state) => state.dismissNotification);

  if (notifications.length === 0) {
    return <div className="rounded-2xl bg-white/80 p-5 text-center text-sm text-slate-500">No notifications</div>;
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <motion.div
          key={notification.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 110) dismissNotification(notification.id);
          }}
          className="rounded-2xl bg-white p-3 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500">
                {notification.appName} · {formatDistanceToNow(new Date(notification.timestamp))} ago
              </div>
              <div className="mt-1 font-semibold text-slate-900">{notification.title}</div>
              <div className="mt-1 text-sm leading-snug text-slate-600">{notification.message}</div>
              {notification.actions?.length ? (
                <div className="mt-2 flex gap-2">
                  {notification.actions.map((action) => (
                    <button key={action.id} type="button" className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-[#6200EE]">
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button type="button" onClick={() => dismissNotification(notification.id)} className="text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
