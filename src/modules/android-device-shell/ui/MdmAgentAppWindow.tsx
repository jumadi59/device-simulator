"use client";

import { Eye, Settings } from "lucide-react";
import { useState } from "react";
import { useSelectedDeviceViewModel } from "../services/deviceShellMapper";
import { MdmAgentEnrollmentScreen } from "./MdmAgentEnrollmentScreen";
import { MdmAgentMonitoringScreen } from "./MdmAgentMonitoringScreen";
import { MdmAgentSettingsScreen } from "./MdmAgentSettingsScreen";
import { DebugWatermark } from "./AndroidHomeLauncher";

type MdmTab = "MONITORING" | "SETTINGS";

export function MdmAgentAppWindow() {
  const [tab, setTab] = useState<MdmTab>("MONITORING");
  const device = useSelectedDeviceViewModel();
  const showEnrollment = !device.mdmConnected && tab === "MONITORING";

  return (
    <div className="relative h-full bg-white">
      <div className="flex h-[86px] items-center bg-[#6200EE] px-5 text-[27px] font-semibold text-white shadow-sm">MDM Agent</div>
      <div className="absolute inset-x-0 bottom-[76px] top-[86px] overflow-hidden bg-white">
        {showEnrollment ? <MdmAgentEnrollmentScreen /> : tab === "MONITORING" ? <MdmAgentMonitoringScreen /> : <MdmAgentSettingsScreen />}
      </div>

      <div className="absolute bottom-0 left-0 right-0 grid h-[76px] grid-cols-2 border-t border-slate-100 bg-white/95">
        <button
          type="button"
          onClick={() => setTab("MONITORING")}
          className={`flex flex-col items-center justify-center gap-1 text-base ${tab === "MONITORING" ? "text-[#6200EE]" : "text-[#777]"}`}
        >
          <Eye className="h-6 w-6" />
          Monitoring
        </button>
        <button
          type="button"
          onClick={() => setTab("SETTINGS")}
          className={`flex flex-col items-center justify-center gap-1 text-base ${tab === "SETTINGS" ? "text-[#6200EE]" : "text-[#777]"}`}
        >
          <Settings className="h-6 w-6" />
          Settings
        </button>
      </div>
    </div>
  );
}
