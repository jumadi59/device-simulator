import axios, { type AxiosInstance } from "axios";
import { addMinutes, addDays } from "date-fns";
import { appConfig } from "./config";
import { randomId } from "./device-factory";
import type { AgentCommand, DeviceProfile, EnrollmentData, HealthPayload } from "./types";

type EnrollmentStatusResponse = {
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "EXPIRED" | "FAILED";
  data: EnrollmentData | null;
  reason: string | null;
  enrollmentId: string;
  expiresAt?: string;
  pollIntervalSec?: number;
};

type PollCommandsResponse = {
  data?: AgentCommand[];
  commands?: AgentCommand[];
};

function createClient(baseURL: string, token?: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 8000,
    headers: token ? { "X-Device-Token": token } : undefined,
  });
}

function mockEnrollment(device: DeviceProfile): EnrollmentData {
  const accessTokenExpiresAt = addMinutes(new Date(), 60).toISOString();
  const refreshTokenExpiresAt = addDays(new Date(), 30).toISOString();
  return {
    deviceId: device.tokens.deviceId || `dev_${device.serialNumber.toLowerCase()}`,
    accessToken: `mock_access_${device.serialNumber}_${Date.now()}`,
    refreshToken: `mock_refresh_${device.serialNumber}_${Date.now()}`,
    mqttConfig: {
      host: appConfig.mqttUrl,
      clientId: device.serialNumber,
      username: appConfig.mqttUsername || device.serialNumber,
      password: appConfig.mqttPassword || "mock-password",
    },
    policy: {
      pollIntervalSec: appConfig.defaultPollIntervalSec,
      terminalIntervalSec: 900,
    },
    configHost: appConfig.mdmHost,
    expiresAtIso: accessTokenExpiresAt,
    expiredIsoRefreshToken: refreshTokenExpiresAt,
    serialNumber: device.serialNumber,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
}

export async function bootstrapEnrollment(device: DeviceProfile, mockMode: boolean) {
  if (mockMode) {
    return {
      enrollmentId: randomId("enr"),
      pairingCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      expiresAt: addMinutes(new Date(), 30).toISOString(),
      pollIntervalSec: 5,
    };
  }

  const client = createClient(appConfig.mdmHost);
  const { data } = await client.post("/api/agent/enrollment/bootstrap", {
    serialNumber: device.serialNumber,
    brand: device.brand,
    model: device.model,
    appVersion: device.appVersion,
    androidId: device.androidId,
    installationId: device.installationId,
    fingerprint: device.fingerprint,
    requestedGroupId: device.requestedGroupId,
    note: device.note,
  });
  return data as {
    enrollmentId: string;
    pairingCode: string;
    expiresAt: string;
    pollIntervalSec: number;
  };
}

export async function pollEnrollmentStatus(device: DeviceProfile, mockMode: boolean): Promise<EnrollmentStatusResponse> {
  if (!device.enrollmentId) throw new Error("enrollmentId is required");

  if (mockMode) {
    return {
      status: "APPROVED",
      data: mockEnrollment(device),
      reason: null,
      enrollmentId: device.enrollmentId,
      expiresAt: device.expiresAt,
      pollIntervalSec: 5,
    };
  }

  const client = createClient(appConfig.mdmHost);
  const { data } = await client.get(`/api/agent/enrollment/${device.enrollmentId}/status`);
  return data as EnrollmentStatusResponse;
}

export async function enrollWithToken(device: DeviceProfile, mockMode: boolean): Promise<EnrollmentData> {
  if (mockMode) return mockEnrollment(device);

  const client = createClient(appConfig.mdmHost);
  const { data } = await client.post("/api/agent/enroll", {
    serialNumber: device.serialNumber,
    onboardingToken: device.onboardingToken,
  });
  return data as EnrollmentData;
}

export async function refreshToken(device: DeviceProfile, mockMode: boolean): Promise<EnrollmentData> {
  const token = device.tokens.refreshToken;
  if (!token) throw new Error("refresh token is empty");

  if (mockMode) return mockEnrollment(device);

  const client = createClient(appConfig.mdmHost);
  const { data } = await client.post("/api/agent/refresh-token", {
    serialNumber: device.serialNumber,
    token,
  });
  return data as EnrollmentData;
}

export async function sendHealth(device: DeviceProfile, mockMode: boolean) {
  const payload: HealthPayload = {
    payload: {
      ...device.metrics,
      serial_number: device.serialNumber,
    },
    tsIso: new Date().toISOString(),
  };

  if (mockMode) {
    return {
      status: "success",
      code: 200,
      message: "mock health accepted",
      timestamp: Date.now(),
    };
  }

  const client = createClient(appConfig.mdmHost, device.tokens.accessToken);
  const { data } = await client.post("/api/agent/health", payload);
  return data;
}

export async function uploadAgentFile(device: DeviceProfile, file: File, mockMode: boolean) {
  if (mockMode) {
    return {
      id: Date.now(),
      ownerType: "device",
      ownerId: device.tokens.deviceId ?? device.id,
      originalName: file.name,
      storedPath: `/uploads/mock/${file.name}`,
      url: `${appConfig.uploadHost}/uploads/mock/${file.name}`,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      checksumSha256: "mock",
      ext: file.name.split(".").pop() ?? "",
      status: "READY",
      uploadedByDeviceSn: device.serialNumber,
      createdAtIso: new Date().toISOString(),
      metaJson: null,
    };
  }

  const form = new FormData();
  form.append("file", file);
  const client = createClient(appConfig.mdmHost, device.tokens.accessToken);
  const { data } = await client.post("/api/agent/files", form);
  return data;
}

export async function pollCommands(device: DeviceProfile, mockMode: boolean): Promise<AgentCommand[]> {
  if (mockMode) {
    const shouldGenerate = Math.random() > 0.72;
    if (!shouldGenerate) return [];
    const samples: AgentCommand[] = [
      { id: randomId("cmd"), type: "ping", payload: {}, isBot: false },
      { id: randomId("cmd"), type: "open_app", payload: { packageName: "com.miniatm.app" }, isBot: false },
      { id: randomId("cmd"), type: "get_terminal_info", payload: { isBot: true }, isBot: true },
      { id: randomId("cmd"), type: "play_sound", payload: { count: 2 }, isBot: false },
    ];
    return [samples[Math.floor(Math.random() * samples.length)]];
  }

  const client = createClient(appConfig.mdmHost, device.tokens.accessToken);
  const { data } = await client.get<PollCommandsResponse>("/api/agent/commands/poll?limit=10");
  return data.data ?? data.commands ?? [];
}

export async function markCommandStarted(device: DeviceProfile, commandId: string, mockMode: boolean) {
  if (mockMode) return { data: { commandId } };
  const client = createClient(appConfig.mdmHost, device.tokens.accessToken);
  const { data } = await client.post(`/api/agent/commands/${commandId}/started`, {
    startedAtIso: new Date().toISOString(),
  });
  return data;
}

export async function updateCommandProgress(
  device: DeviceProfile,
  commandId: string,
  status: string,
  response: unknown,
  mockMode: boolean,
) {
  if (mockMode) return { data: { commandId } };
  const client = createClient(appConfig.mdmHost, device.tokens.accessToken);
  const { data } = await client.post(`/api/agent/commands/${commandId}/update`, {
    status,
    executedAtIso: new Date().toISOString(),
    response,
  });
  return data;
}

export async function submitCommandResult(
  device: DeviceProfile,
  commandId: string,
  status: string,
  response: unknown,
  mockMode: boolean,
) {
  if (mockMode) return { data: { commandId } };
  const client = createClient(appConfig.mdmHost, device.tokens.accessToken);
  const { data } = await client.post(`/api/agent/commands/${commandId}/result`, {
    status,
    executedAtIso: new Date().toISOString(),
    response,
  });
  return data;
}
