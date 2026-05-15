import { useSimulatorStore } from "@/lib/store";
import { useAndroidShellStore } from "../store/androidShellStore";
import { addAndroidNotification } from "./notificationService";

type SideEffectStatus = "EXECUTED" | "SUCCESS" | "FAILED";

function payloadObject(payload: unknown): Record<string, unknown> {
  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) return payload as Record<string, unknown>;
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : { value: parsed };
    } catch {
      return { value: payload };
    }
  }
  return {};
}

function stringValue(payload: Record<string, unknown>, key: string, fallback = "") {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function handleAndroidSideEffect(params: {
  deviceId: string;
  commandType: string;
  payload: unknown;
  status: SideEffectStatus;
}): void {
  const shell = useAndroidShellStore.getState();
  const simulator = useSimulatorStore.getState();
  const payload = payloadObject(params.payload);
  const type = params.commandType;

  if (params.status === "FAILED") {
    addAndroidNotification({
      title: `${type} failed`,
      message: stringValue(payload, "message", "Command execution failed"),
      type: "ERROR",
    });
    shell.showToast(`${type} failed`, "ERROR");
    return;
  }

  const updateDevice = (patch: Parameters<typeof simulator.updateDevice>[1]) => simulator.updateDevice(params.deviceId, patch);

  switch (type) {
    case "push_notification": {
      const title = stringValue(payload, "message", stringValue(payload, "title", "MDM Notification"));
      const message = stringValue(payload, "content", title);
      addAndroidNotification({
        title,
        message,
        type: "MDM",
      });
      shell.showToast(title, "INFO");
      break;
    }
    case "push_dialog":
      shell.showDialog({
        title: stringValue(payload, "title", "MDM Agent"),
        message: stringValue(payload, "message", "Dialog queued"),
        banner: stringValue(payload, "banner", undefined as unknown as string),
        buttonText: stringValue(payload, "buttonText", "OK"),
        cancelable: typeof payload.cancelable === "boolean" ? payload.cancelable : true,
      });
      break;
    case "lock_device": {
      const lock = typeof payload.lock === "boolean" ? payload.lock : String(payload.value ?? payload.lock) === "true";
      updateDevice({ locked: lock });
      addAndroidNotification({
        title: lock ? "Device locked by MDM" : "Device unlocked by MDM",
        message: lock ? "This terminal is locked by MDM" : "Terminal access restored",
        type: "SYSTEM",
      });
      break;
    }
    case "play_sound": {
      const count = Number(payload.count ?? payload.value ?? 1);
      shell.showVolumeOverlay(Number.isFinite(count) ? count : 1);
      shell.showToast("Playing buzzer", "INFO");
      break;
    }
    case "share_screen":
      updateDevice({ screenSharing: true });
      addAndroidNotification({ title: "Screen sharing active", message: "MDM remote screen session started", type: "SYSTEM" });
      break;
    case "stop_screen":
      updateDevice({ screenSharing: false });
      addAndroidNotification({ title: "Screen sharing stopped", message: "MDM remote screen session ended", type: "SYSTEM" });
      break;
    case "play_media":
      updateDevice({ mediaPlaying: true });
      addAndroidNotification({ title: "Media playback started", message: "Media content is playing on terminal", type: "INFO" });
      break;
    case "stop_media":
      updateDevice({ mediaPlaying: false });
      addAndroidNotification({ title: "Media playback stopped", message: "Media playback has stopped", type: "INFO" });
      break;
    case "reboot":
      shell.showToast("Rebooting device...", "INFO");
      shell.goHome();
      window.setTimeout(() => {
        addAndroidNotification({ title: "Device reboot completed", message: "MDM Agent is running again", type: "SYSTEM" });
      }, 1200);
      break;
    case "install_apk":
      addAndroidNotification({ title: "App install queued", message: stringValue(payload, "packageName", "APK installation queued"), type: "MDM" });
      break;
    case "uninstall_apk":
      addAndroidNotification({ title: "App uninstalled", message: stringValue(payload, "packageName", "Package removed"), type: "MDM" });
      break;
    case "screenshot":
      addAndroidNotification({ title: "Screenshot captured", message: "Screenshot is ready for upload", type: "MDM" });
      break;
    case "upload_logs":
      addAndroidNotification({ title: "Logs uploaded", message: "Agent logs uploaded successfully", type: "MDM" });
      break;
    default:
      if (params.status === "SUCCESS") shell.showToast(`${type} success`, "SUCCESS");
  }
}
