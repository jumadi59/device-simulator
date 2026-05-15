"use client";

import { Eye, Mail, Wrench } from "lucide-react";
import { useAndroidShellStore } from "../store/androidShellStore";

export function MdmAgentSettingsScreen() {
  const permissions = useAndroidShellStore((state) => state.permissions);
  const setPermission = useAndroidShellStore((state) => state.setPermission);
  const cards = [
    {
      icon: <Mail className="h-9 w-9 text-slate-300" />,
      title: "Notification Listener",
      body: "Digunakan untuk membaca notifikasi yang masuk dan automation.",
      action: permissions.notificationListener === "GRANTED" ? "GRANTED" : "GRANT",
      status: permissions.notificationListener === "GRANTED" ? "Enabled" : "Not Granted",
      tone: permissions.notificationListener === "GRANTED" ? "text-teal-600" : "text-red-600",
      onClick: () => setPermission("notificationListener", "GRANTED"),
    },
    {
      icon: <Wrench className="h-9 w-9 text-slate-400" />,
      title: "Accessibility Service",
      body: "Dibutuhkan untuk otomasi tindakan layar secara aman.",
      action: "OPEN SETTINGS",
      status: permissions.accessibilityService === "ENABLED" ? "Enabled" : "Disabled",
      tone: permissions.accessibilityService === "ENABLED" ? "text-teal-600" : "text-red-600",
      onClick: () => setPermission("accessibilityService", "ENABLED"),
    },
    {
      icon: <Eye className="h-9 w-9 text-slate-400" />,
      title: "Draw Over Other Apps",
      body: "Untuk menampilkan overlay ketika menjalankan tugas tertentu.",
      action: "GRANT",
      status: permissions.drawOverOtherApps === "GRANTED" ? "Granted" : "Not Granted",
      tone: permissions.drawOverOtherApps === "GRANTED" ? "text-teal-600" : "text-red-600",
      onClick: () => setPermission("drawOverOtherApps", "GRANTED"),
    },
  ];

  return (
    <div className="h-full space-y-7 overflow-hidden px-5 pb-7 pt-7">
      {cards.map((card) => (
        <div key={card.title} className="grid grid-cols-[50px_1fr] gap-3 rounded-md border border-slate-100 bg-white p-4 shadow-sm">
          <div className="pt-2">{card.icon}</div>
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[20px] font-semibold leading-tight text-[#6d6d6d]">{card.title}</h3>
              <button
                type="button"
                onClick={card.onClick}
                className="shrink-0 rounded-md border border-slate-200 px-4 py-2 text-base font-semibold tracking-[0.12em] text-[#6200EE]"
              >
                {card.action}
              </button>
            </div>
            <p className="mt-2 text-[17px] leading-tight text-[#777]">{card.body}</p>
            <div className={`mt-3 text-[18px] font-semibold ${card.tone}`}>{card.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
