import { randomId } from "./device-factory";
import type { CommandStatus, DeviceProfile, MqttJob } from "./types";

type ExecutionResult = {
  status: CommandStatus;
  payload: Record<string, unknown> | string;
};

function normalizePayload(payload: unknown): Record<string, unknown> {
  if (payload == null) return {};
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : { value: parsed };
    } catch {
      return { value: payload };
    }
  }
  if (Array.isArray(payload)) return { items: payload };
  if (typeof payload === "object") return payload as Record<string, unknown>;
  return { value: payload };
}

function stringField(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function booleanField(payload: Record<string, unknown>, fallback = false) {
  const raw = payload.lock ?? payload.enable ?? payload.value;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") return raw === "true";
  return fallback;
}

export function createMqttResponse(device: DeviceProfile, job: MqttJob, result: ExecutionResult) {
  return {
    correlationId: job.correlationId ?? randomId("corr"),
    job: job.job ?? "unknown_job",
    payload: result.payload,
    status: result.status,
    serialNumber: device.serialNumber,
  };
}

export function executeCommand(device: DeviceProfile, commandType: string, payloadInput: unknown): ExecutionResult {
  const payload = normalizePayload(payloadInput);

  switch (commandType) {
    case "ping":
      return { status: "SUCCESS", payload: { ok: true, message: "pong" } };
    case "install_apk": {
      const downloadUrl = stringField(payload, "downloadUrl", "file", "url");
      if (!downloadUrl) return fail(commandType, "downloadUrl is required");
      return {
        status: "EXECUTED",
        payload: {
          ok: true,
          message: "install queued",
          commandType,
          downloadUrl,
          packageName: stringField(payload, "packageName", "package_name"),
          apkFileId: payload.apkFileId ?? payload.id,
        },
      };
    }
    case "download_file": {
      const downloadUrl = stringField(payload, "downloadUrl", "file", "url");
      if (!downloadUrl) return fail(commandType, "downloadUrl is required");
      return {
        status: "EXECUTED",
        payload: {
          ok: true,
          message: "download queued",
          commandType,
          downloadUrl,
          label: stringField(payload, "label"),
        },
      };
    }
    case "uninstall_apk": {
      const packageName = stringField(payload, "packageName", "package_name", "value");
      if (!packageName) return fail(commandType, "packageName is required");
      return { status: "SUCCESS", payload: { ok: true, message: "uninstall success", commandType, packageName } };
    }
    case "screenshot":
      return {
        status: "SUCCESS",
        payload: {
          ok: true,
          message: "screenshot success",
          commandType,
          localPath: "/data/user/0/com.example/files/screenshot.png",
          url: `/uploads/mock/${device.serialNumber}-screenshot.png`,
        },
      };
    case "open_app": {
      const packageName = stringField(payload, "packageName", "package_name");
      if (!packageName) return fail(commandType, "packageName is required");
      return {
        status: "SUCCESS",
        payload: {
          ok: true,
          message: "App launched",
          packageName,
          activityName: stringField(payload, "activityName", "activity_name") ?? null,
        },
      };
    }
    case "host_mdm":
    case "host_mdm_upload": {
      const host = stringField(payload, "host", "value");
      if (!host) return fail(commandType, "host is required");
      return { status: "SUCCESS", payload: { ok: true, message: `${commandType.replaceAll("_", " ")} updated`, commandType, host } };
    }
    case "upload_logs":
      return {
        status: "SUCCESS",
        payload: { ok: true, message: JSON.stringify([{ url: `/uploads/mock/${device.serialNumber}-logcat.zip` }]), commandType },
      };
    case "running_dex":
      return {
        status: "SUCCESS",
        payload: {
          ok: true,
          message: "running dex success",
          commandType,
          file: stringField(payload, "file", "url"),
          entryClass: stringField(payload, "entryClass"),
        },
      };
    case "restart_app":
      return { status: "SUCCESS", payload: { ok: true, message: "restart triggered", commandType } };
    case "push_preference": {
      const key = stringField(payload, "key");
      if (!key) return fail(commandType, "key is required");
      return { status: "SUCCESS", payload: { ok: true, message: "preference saved", commandType, key } };
    }
    case "delete_preference": {
      const key = stringField(payload, "key");
      if (!key) return fail(commandType, "key is required");
      return { status: "SUCCESS", payload: { ok: true, message: "preference deleted", commandType, key } };
    }
    case "push_notification":
      return { status: "SUCCESS", payload: { ok: true, message: "push notification success", commandType, notificationId: randomId("notif") } };
    case "push_dialog":
      return { status: "SUCCESS", payload: { ok: true, message: "Dialog queued", dialogId: randomId("dialog") } };
    case "automation":
      return {
        status: "SUCCESS",
        payload: { ok: true, message: "Accessibility flow started", flowId: stringField(payload, "flowId") ?? "custom_flow_001" },
      };
    case "reboot":
      return { status: "SUCCESS", payload: { ok: true, message: "reboot triggered", commandType } };
    case "health_printer":
      return { status: "SUCCESS", payload: { ok: true, message: "printer ok", commandType } };
    case "lock_device":
      return { status: "SUCCESS", payload: { ok: true, message: "lock device success", commandType, lock: booleanField(payload, true) } };
    case "app_whitelist":
      return { status: "SUCCESS", payload: { ok: true, message: "set app whitelist success", commandType } };
    case "get_terminal_info":
      return {
        status: "SUCCESS",
        payload: {
          battery_percentage: device.metrics.battery_percentage,
          battery_status: device.metrics.battery_status,
          connection: device.metrics.connection,
          serial_number: device.serialNumber,
          uptime_device: device.metrics.uptime_device,
          firmware: device.metrics.firmware,
          mdm_version: device.metrics.mdm_version,
        },
      };
    case "play_sound": {
      const raw = Number(payload.count ?? payload.value ?? 1);
      const count = Number.isFinite(raw) ? raw : 1;
      if (count < 1 || count > 10) return fail(commandType, "count must be 1..10");
      return { status: "SUCCESS", payload: { ok: true, message: "playing buzzer", commandType, count } };
    }
    case "share_screen":
      return { status: "SUCCESS", payload: { ok: true, message: "share screen started", commandType, sessionId: randomId("screen") } };
    case "stop_screen":
      return { status: "SUCCESS", payload: { ok: true, message: "share screen stopped", commandType } };
    case "play_media":
      return { status: "SUCCESS", payload: { ok: true, message: "play media success", commandType } };
    case "stop_media":
      return { status: "SUCCESS", payload: { ok: true, message: "stop media success", commandType } };
    case "boot_logo": {
      const file = stringField(payload, "file", "url");
      if (!file) return fail(commandType, "file is required");
      return { status: "SUCCESS", payload: { ok: true, message: "boot logo success", commandType, file } };
    }
    default:
      return fail(commandType, "Unsupported command type");
  }
}

function fail(commandType: string, message: string): ExecutionResult {
  return {
    status: "FAILED",
    payload: {
      ok: false,
      message,
      commandType,
    },
  };
}
