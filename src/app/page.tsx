"use client";

import {
  Activity,
  Bell,
  Cable,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  FileUp,
  HardDrive,
  MonitorSmartphone,
  Plus,
  Power,
  RefreshCw,
  Router,
  Send,
  Server,
  TerminalSquare,
  Trash2,
  Wifi,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { appConfig } from "@/lib/config";
import { useSimulatorStore } from "@/lib/store";
import { useDeviceRuntime } from "@/hooks/use-device-runtime";
import type { DeviceProfile, LogLevel } from "@/lib/types";
import { AndroidDeviceFrame } from "@/modules/android-device-shell/ui/AndroidDeviceFrame";
import { AndroidScreen } from "@/modules/android-device-shell/ui/AndroidScreen";

const commandSamples: Record<string, unknown> = {
  ping: {},
  install_apk: {
    downloadUrl: "https://cdn.example.com/app-release.apk",
    label: "MiniATM",
    packageName: "com.miniatm.app",
    versionName: "1.0.21",
    versionCode: 22,
  },
  download_file: { file: "https://cdn.example.com/manual.pdf", label: "Manual PDF" },
  uninstall_apk: { packageName: "com.lonelycatgames.Xplore" },
  screenshot: {},
  open_app: { packageName: "com.miniatm.app", activityName: "com.miniatm.app.MainActivity" },
  get_terminal_info: { isBot: true },
  play_sound: { count: 2 },
  lock_device: { lock: true },
  push_notification: {
    message: "Update tersedia",
    content: "Silakan restart aplikasi setelah transaksi selesai.",
    inApp: true,
    isSound: true,
  },
  reboot: {},
  health_printer: {},
  share_screen: {},
  push_dialog: {
    "title": "Perhatian",
    "message": "Terminal akan restart dalam 5 menit.",
    "banner": "https://cdn.example.com/warning.png",
    "cancelable": true,
    "timeoutMs": 30000,
    "buttonText": "Mengerti"
  }
};

const logTone: Record<LogLevel, string> = {
  info: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warn: "bg-amber-100 text-amber-800",
  error: "bg-rose-100 text-rose-700",
  mqtt: "bg-cyan-100 text-cyan-700",
  rest: "bg-indigo-100 text-indigo-700",
};

function relativeDate(value?: string) {
  if (!value) return "never";
  return `${formatDistanceToNow(new Date(value))} ago`;
}

function parsePayload(text: string) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return { value: text };
  }
}

export default function Home() {
  const devices = useSimulatorStore((state) => state.devices);
  const activeDeviceId = useSimulatorStore((state) => state.activeDeviceId);
  const setActiveDevice = useSimulatorStore((state) => state.setActiveDevice);
  const addDevice = useSimulatorStore((state) => state.addDevice);
  const removeDevice = useSimulatorStore((state) => state.removeDevice);
  const mockMode = useSimulatorStore((state) => state.mockMode);
  const setMockMode = useSimulatorStore((state) => state.setMockMode);
  const updateDevice = useSimulatorStore((state) => state.updateDevice);
  const { device, actions } = useDeviceRuntime(activeDeviceId);
  const [selectedCommand, setSelectedCommand] = useState("ping");
  const [payloadText, setPayloadText] = useState(JSON.stringify(commandSamples.ping, null, 2));
  const [activityTab, setActivityTab] = useState<"history" | "logs">("history");

  const activeDevice = device ?? devices[0];

  function updateCommand(command: string) {
    setSelectedCommand(command);
    setPayloadText(JSON.stringify(commandSamples[command] ?? {}, null, 2));
  }

  return (
    <main className="h-screen overflow-hidden p-3 md:p-4">
      <section className="mx-auto grid h-full max-w-[1600px] grid-rows-[auto_minmax(0,1fr)] gap-3">
        <header className="flex min-h-0 items-center justify-between rounded-md border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <MonitorSmartphone className="h-4 w-4" />
              MDM Agent Simulator
            </div>
            <h1 className="mt-0.5 text-lg font-semibold text-slate-950 md:text-xl">REST, MQTT, and Android shell simulator lab</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMockMode(!mockMode)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium ${
                mockMode ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <DatabaseZap className="h-4 w-4" />
              Mock {mockMode ? "on" : "off"}
            </button>
            <button
              type="button"
              onClick={addDevice}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Device
            </button>
          </div>
        </header>

        <div className="grid min-h-0 gap-3 xl:grid-cols-[280px_minmax(360px,1fr)_430px]">
          <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <section className="min-h-0 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Devices</h2>
                <span className="text-xs text-slate-500">{devices.length} active</span>
              </div>
              <div className="max-h-[32vh] space-y-2 overflow-auto pr-1 scrollbar-thin">
                {devices.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setActiveDevice(item.id)}
                    className={`w-full rounded-md border p-2.5 text-left transition ${
                      item.id === activeDeviceId ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold">{item.serialNumber}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${item.id === activeDeviceId ? "bg-white/15" : "bg-slate-100"}`}>
                        {item.state}
                      </span>
                    </div>
                    <div className={`mt-1 text-xs ${item.id === activeDeviceId ? "text-slate-300" : "text-slate-500"}`}>
                      {item.brand} {item.model} · {relativeDate(item.lastHealthAt)}
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => removeDevice(activeDeviceId)}
                disabled={devices.length === 1}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                Remove selected
              </button>
            </section>

            {activeDevice ? <EndpointPanel device={activeDevice} updateDevice={updateDevice} /> : null}
            {activeDevice ? <MiniStatusPanel device={activeDevice} /> : null}
          </aside>

          {activeDevice ? (
            <>
              <DeviceShell />

              <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden">
                <ControlPanel
                  device={activeDevice}
                  actions={actions}
                  updateDevice={updateDevice}
                  selectedCommand={selectedCommand}
                  payloadText={payloadText}
                  setPayloadText={setPayloadText}
                  updateCommand={updateCommand}
                />
                <ActivityPanel device={activeDevice} activityTab={activityTab} setActivityTab={setActivityTab} />
              </aside>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function EndpointPanel({
  device,
  updateDevice,
}: {
  device: DeviceProfile;
  updateDevice: (id: string, patch: Partial<Omit<DeviceProfile, "id" | "logs" | "commandHistory">>) => void;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Connection</h2>
        <button
          type="button"
          onClick={() =>
            updateDevice(device.id, {
              mqtt: {
                ...device.mqtt,
                host: appConfig.mqttUrl,
                clientId: device.mqtt.clientId || device.serialNumber,
                username: appConfig.mqttUsername,
                password: appConfig.mqttPassword,
              },
            })
          }
          className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
          title="Apply MQTT URL, username, and password from env"
        >
          Apply env
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <InfoRow icon={<Server className="h-4 w-4" />} label="MDM" value={appConfig.mdmHost} />
        <InfoRow icon={<FileUp className="h-4 w-4" />} label="Upload" value={appConfig.uploadHost} />
        <InfoRow icon={<Router className="h-4 w-4" />} label="MQTT" value={device.mqtt.host || appConfig.mqttUrl} />
        <InfoRow icon={<DatabaseZap className="h-4 w-4" />} label="MQTT auth" value={`${device.mqtt.username || appConfig.mqttUsername ? "username set" : "username empty"} / ${device.mqtt.password || appConfig.mqttPassword ? "password set" : "password empty"}`} />
        <InfoRow icon={<Cable className="h-4 w-4" />} label="Topics" value={`terminal, mdm/${device.serialNumber}`} />
      </div>
    </section>
  );
}

function MiniStatusPanel({ device }: { device: DeviceProfile }) {
  const storage = device.metrics.storage.storage_percentage;
  const memory = device.metrics.ram.used_mem_in_percentage;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-slate-900">Live Status</h2>
      <div className="grid grid-cols-2 gap-2">
        <StatusTile icon={<Activity className="h-4 w-4" />} label="Battery" value={`${Math.round(device.metrics.battery_percentage)}%`} />
        <StatusTile icon={<Wifi className="h-4 w-4" />} label="Signal" value={`${device.metrics.connection.connection_level}/5`} />
        <StatusTile icon={<HardDrive className="h-4 w-4" />} label="Storage" value={`${storage}%`} />
        <StatusTile icon={<DatabaseZap className="h-4 w-4" />} label="Memory" value={`${memory}%`} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <span className={`rounded-md px-2 py-1 text-center font-semibold ${device.tokens.accessToken ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          REST {device.tokens.accessToken ? "ready" : "idle"}
        </span>
        <span className={`rounded-md px-2 py-1 text-center font-semibold ${device.mqttConnected ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-500"}`}>
          MQTT {device.mqttConnected ? "online" : "offline"}
        </span>
      </div>
    </section>
  );
}

function StatusTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
      <div className="flex items-center gap-1.5 text-[11px] uppercase text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function DeviceShell() {
  return (
    <section className="flex min-h-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-950/90 p-3 shadow-sm">
      <AndroidDeviceFrame className="h-full max-h-[calc(100vh-112px)]">
        <AndroidScreen />
      </AndroidDeviceFrame>
    </section>
  );
}

function ControlPanel({
  device,
  actions,
  updateDevice,
  selectedCommand,
  payloadText,
  setPayloadText,
  updateCommand,
}: {
  device: DeviceProfile;
  actions: ReturnType<typeof useDeviceRuntime>["actions"];
  updateDevice: (id: string, patch: Partial<Omit<DeviceProfile, "id" | "logs" | "commandHistory">>) => void;
  selectedCommand: string;
  payloadText: string;
  setPayloadText: (value: string) => void;
  updateCommand: (command: string) => void;
}) {
  const canUseToken = Boolean(device.tokens.accessToken);
  const tokenShort = device.tokens.accessToken ? `${device.tokens.accessToken.slice(0, 18)}...` : "not issued";
  return (
    <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Agent Controls</h2>
          <p className="mt-1 text-xs text-slate-500">Token: {tokenShort}</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <IconButton label="Bootstrap" icon={<Power className="h-4 w-4" />} onClick={actions.bootstrap} />
          <IconButton label="Poll status" icon={<Clock3 className="h-4 w-4" />} onClick={actions.pollEnrollment} />
          <IconButton label="Enroll" icon={<CheckCircle2 className="h-4 w-4" />} onClick={actions.enroll} />
          <IconButton label="Refresh" icon={<RefreshCw className="h-4 w-4" />} onClick={actions.refresh} disabled={!device.tokens.refreshToken} />
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <label className="text-xs font-medium text-slate-600">
          Serial Number
          <input
            className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs"
            value={device.serialNumber}
            onChange={(event) =>
              updateDevice(device.id, {
                serialNumber: event.target.value.toUpperCase(),
                metrics: { ...device.metrics, serial_number: event.target.value.toUpperCase() },
              })
            }
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Onboarding Token
          <input
            className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs"
            value={device.onboardingToken}
            onChange={(event) => updateDevice(device.id, { onboardingToken: event.target.value })}
          />
        </label>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <IconButton label="Send health" icon={<Activity className="h-4 w-4" />} onClick={actions.health} disabled={!canUseToken} />
        <IconButton label="Poll REST" icon={<Server className="h-4 w-4" />} onClick={actions.pollCommandsNow} disabled={!canUseToken} />
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700">
          <FileUp className="h-4 w-4" />
          Upload
          <input
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void actions.upload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <TerminalSquare className="h-4 w-4" />
            Command
          </div>
          <select
            className="max-w-[190px] rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
            value={selectedCommand}
            onChange={(event) => updateCommand(event.target.value)}
          >
            {Object.keys(commandSamples).map((command) => (
              <option key={command} value={command}>
                {command}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="h-28 w-full resize-none rounded-md border border-slate-200 bg-white p-2.5 font-mono text-xs leading-5 text-slate-800"
          value={payloadText}
          onChange={(event) => setPayloadText(event.target.value)}
        />
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <IconButton
            label="Run as REST"
            icon={<Send className="h-4 w-4" />}
            onClick={() => actions.runManualCommand(selectedCommand, parsePayload(payloadText))}
            disabled={!canUseToken}
          />
          <IconButton label="Run as MQTT" icon={<Bell className="h-4 w-4" />} onClick={() => actions.runManualMqttJob(selectedCommand, parsePayload(payloadText))} />
        </div>
      </div>
    </section>
  );
}

function CommandHistory({ device }: { device: DeviceProfile }) {
  return (
    <div className="h-full overflow-auto scrollbar-thin">
        <table className="w-full min-w-[360px] text-left text-xs">
          <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-3">Source</th>
              <th className="py-2 pr-3">Job</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {device.commandHistory.map((command) => (
              <tr key={`${command.id}-${command.updatedAtIso}`}>
                <td className="py-2 pr-3 text-slate-600">{command.source}</td>
                <td className="py-2 pr-3 font-mono text-slate-900">{command.job}</td>
                <td className="py-2 pr-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{command.status}</span>
                </td>
                <td className="py-2 pr-3 text-slate-500">{relativeDate(command.updatedAtIso)}</td>
              </tr>
            ))}
            {device.commandHistory.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                  No commands yet
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
    </div>
  );
}

function LogPanel({ device }: { device: DeviceProfile }) {
  return (
      <div className="h-full space-y-2 overflow-auto pr-1 scrollbar-thin">
        {device.logs.map((log) => (
          <div key={log.id} className="rounded-md border border-slate-100 p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${logTone[log.level]}`}>{log.level}</span>
              <span className="text-xs text-slate-500">{relativeDate(log.tsIso)}</span>
            </div>
            <div className="mt-2 text-sm text-slate-800">{log.message}</div>
            {log.detail ? <pre className="mt-2 max-h-28 overflow-auto rounded bg-slate-950 p-2 text-xs text-slate-100">{JSON.stringify(log.detail, null, 2)}</pre> : null}
          </div>
        ))}
      </div>
  );
}

function ActivityPanel({
  device,
  activityTab,
  setActivityTab,
}: {
  device: DeviceProfile;
  activityTab: "history" | "logs";
  setActivityTab: (tab: "history" | "logs") => void;
}) {
  return (
    <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
        <div className="grid grid-cols-2 rounded-md bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActivityTab("history")}
            className={`rounded px-3 py-1.5 ${activityTab === "history" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
          >
            History
          </button>
          <button
            type="button"
            onClick={() => setActivityTab("logs")}
            className={`rounded px-3 py-1.5 ${activityTab === "logs" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
          >
            Logs
          </button>
        </div>
      </div>
      <div className="min-h-0 overflow-hidden">{activityTab === "history" ? <CommandHistory device={device} /> : <LogPanel device={device} />}</div>
    </section>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-500">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase text-slate-500">{label}</div>
        <div className="break-all font-mono text-xs text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
