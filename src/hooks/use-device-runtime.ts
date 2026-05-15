"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  bootstrapEnrollment,
  enrollWithToken,
  markCommandStarted,
  pollCommands,
  pollEnrollmentStatus,
  refreshToken,
  sendHealth,
  submitCommandResult,
  updateCommandProgress,
  uploadAgentFile,
} from "@/lib/api";
import { appConfig, isNetworkError } from "@/lib/config";
import { randomId } from "@/lib/device-factory";
import { createMqttResponse, executeCommand } from "@/lib/executor";
import { connectMqttRuntime } from "@/lib/mqtt-client";
import { useSimulatorStore } from "@/lib/store";
import type { AgentCommand, CommandSource, DeviceProfile, MqttJob } from "@/lib/types";

function applyEnrollment(device: DeviceProfile, data: Awaited<ReturnType<typeof enrollWithToken>>) {
  return {
    state: "enrolled" as const,
    tokens: {
      ...device.tokens,
      deviceId: data.deviceId ?? device.tokens.deviceId,
      accessToken: data.accessToken ?? device.tokens.accessToken,
      refreshToken: data.refreshToken ?? device.tokens.refreshToken,
      accessTokenExpiresAt: data.accessTokenExpiresAt ?? data.expiresAtIso,
      refreshTokenExpiresAt: data.refreshTokenExpiresAt ?? data.expiredIsoRefreshToken,
    },
    mqtt: {
      ...device.mqtt,
      host: data.mqttConfig?.host?.startsWith("ssl://") ? appConfig.mqttUrl : data.mqttConfig?.host ?? device.mqtt.host,
      clientId: data.mqttConfig?.clientId ?? device.serialNumber,
      username: data.mqttConfig?.username ?? device.mqtt.username,
      password: data.mqttConfig?.password ?? device.mqtt.password,
    },
  };
}

function commandIdentity(command: AgentCommand) {
  return command.id ?? command.commandId ?? randomId("cmd");
}

function commandType(command: AgentCommand) {
  return command.type ?? command.job ?? "unknown_job";
}

export function useDeviceRuntime(deviceId: string) {
  const devices = useSimulatorStore((state) => state.devices);
  const mockMode = useSimulatorStore((state) => state.mockMode);
  const pollIntervalSec = useSimulatorStore((state) => state.pollIntervalSec);
  const healthIntervalSec = useSimulatorStore((state) => state.healthIntervalSec);
  const updateDevice = useSimulatorStore((state) => state.updateDevice);
  const setDeviceState = useSimulatorStore((state) => state.setDeviceState);
  const addLog = useSimulatorStore((state) => state.addLog);
  const recordCommand = useSimulatorStore((state) => state.recordCommand);
  const updateCommand = useSimulatorStore((state) => state.updateCommand);
  const mutateMetrics = useSimulatorStore((state) => state.mutateMetrics);
  const mqttRef = useRef<ReturnType<typeof connectMqttRuntime> | null>(null);

  const device = useMemo(() => devices.find((item) => item.id === deviceId), [devices, deviceId]);

  const runRestCommand = useCallback(
    async (target: DeviceProfile, command: AgentCommand, source: CommandSource = "rest") => {
      const id = commandIdentity(command);
      const type = commandType(command);
      recordCommand(target.id, {
        id,
        source,
        job: type,
        status: "ACKED",
        payload: command.payload ?? {},
        correlationId: id,
      });
      addLog(target.id, "rest", `Command ${type} started`, { id, payload: command.payload });

      await markCommandStarted(target, id, mockMode);
      const result = executeCommand(target, type, command.payload ?? {});
      await updateCommandProgress(target, id, result.status, result.payload, mockMode);
      updateCommand(target.id, id, { status: result.status, response: result.payload });

      const finalStatus = result.status === "EXECUTED" ? "SUCCESS" : result.status;
      const finalPayload =
        result.status === "EXECUTED"
          ? { ...(typeof result.payload === "object" ? result.payload : { message: result.payload }), ok: true, completed: true }
          : result.payload;

      await new Promise((resolve) => window.setTimeout(resolve, result.status === "EXECUTED" ? 1000 : 350));
      await submitCommandResult(target, id, finalStatus, finalPayload, mockMode);
      updateCommand(target.id, id, { status: finalStatus, response: finalPayload });
      addLog(target.id, finalStatus === "FAILED" ? "error" : "success", `Command ${type} ${finalStatus.toLowerCase()}`, finalPayload);
    },
    [addLog, mockMode, recordCommand, updateCommand],
  );

  const runMqttJob = useCallback(
    async (target: DeviceProfile, job: MqttJob, publish?: (payload: unknown) => void) => {
      const commandId = job.correlationId ?? randomId("corr");
      const type = job.job ?? "unknown_job";
      recordCommand(target.id, {
        id: commandId,
        source: "mqtt",
        job: type,
        status: "ACKED",
        payload: job.payload ?? {},
        correlationId: commandId,
      });
      const ack = {
        correlationId: commandId,
        job: type,
        payload: null,
        status: "ACKED",
        serialNumber: target.serialNumber,
      };
      publish?.(ack);
      addLog(target.id, "mqtt", `MQTT ACKED ${type}`, ack);

      await new Promise((resolve) => window.setTimeout(resolve, 550));
      const result = executeCommand(target, type, job.payload ?? {});
      const response = createMqttResponse(target, { ...job, correlationId: commandId, job: type }, result);
      publish?.(response);
      updateCommand(target.id, commandId, { status: result.status, response: result.payload });
      updateDevice(target.id, { lastMqttAt: new Date().toISOString() });
      addLog(target.id, result.status === "FAILED" ? "error" : "success", `MQTT ${type} ${result.status.toLowerCase()}`, response);
    },
    [addLog, recordCommand, updateCommand, updateDevice],
  );

  useEffect(() => {
    if (!device || mockMode || device.state === "idle" || !device.mqtt.host) return;

    mqttRef.current?.disconnect();
    mqttRef.current = connectMqttRuntime(
      device,
      (job) => {
        const latest = useSimulatorStore.getState().devices.find((item) => item.id === device.id);
        if (!latest) return;
        void runMqttJob(latest, job, mqttRef.current?.publishResponse);
      },
      (level, message, detail) => addLog(device.id, level, message, detail),
    );
    setDeviceState(device.id, "online");

    return () => {
      mqttRef.current?.disconnect();
      mqttRef.current = null;
    };
  }, [addLog, device?.id, device?.mqtt.host, device?.serialNumber, device?.state, mockMode, runMqttJob, setDeviceState]);

  useEffect(() => {
    if (!device || !device.tokens.accessToken) return;
    const interval = window.setInterval(() => {
      const latest = useSimulatorStore.getState().devices.find((item) => item.id === device.id);
      if (!latest) return;
      void pollCommands(latest, mockMode)
        .then((commands) => {
          updateDevice(latest.id, { lastPollAt: new Date().toISOString() });
          commands.forEach((command) => void runRestCommand(latest, command, "rest"));
          if (commands.length > 0) addLog(latest.id, "rest", `Polled ${commands.length} REST command(s)`);
        })
        .catch((error) => addLog(latest.id, "error", "REST command poll failed", error instanceof Error ? error.message : error));
    }, Math.max(2, pollIntervalSec) * 1000);
    return () => window.clearInterval(interval);
  }, [addLog, device?.id, device?.tokens.accessToken, mockMode, pollIntervalSec, runRestCommand, updateDevice]);

  useEffect(() => {
    if (!device || !device.tokens.accessToken) return;
    const interval = window.setInterval(() => {
      const latest = useSimulatorStore.getState().devices.find((item) => item.id === device.id);
      if (!latest) return;
      mutateMetrics(latest.id);
      void sendHealth(latest, mockMode)
        .then(() => {
          updateDevice(latest.id, { lastHealthAt: new Date().toISOString() });
          addLog(latest.id, "rest", "Health snapshot sent");
        })
        .catch((error) => addLog(latest.id, "error", "Health send failed", error instanceof Error ? error.message : error));
    }, Math.max(5, healthIntervalSec) * 1000);
    return () => window.clearInterval(interval);
  }, [addLog, device?.id, device?.tokens.accessToken, healthIntervalSec, mockMode, mutateMetrics, updateDevice]);

  const actions = useMemo(
    () => ({
      bootstrap: async () => {
        if (!device) return;
        setDeviceState(device.id, "bootstrapping");
        try {
          const result = await bootstrapEnrollment(device, mockMode);
          updateDevice(device.id, {
            state: "pending",
            enrollmentId: result.enrollmentId,
            pairingCode: result.pairingCode,
            expiresAt: result.expiresAt,
          });
          addLog(device.id, "rest", "Bootstrap enrollment created", result);
        } catch (error) {
          const fallback = mockMode || isNetworkError(error);
          setDeviceState(device.id, fallback ? "pending" : "error");
          addLog(device.id, fallback ? "warn" : "error", "Bootstrap enrollment failed", error instanceof Error ? error.message : error);
        }
      },
      pollEnrollment: async () => {
        if (!device) return;
        try {
          const result = await pollEnrollmentStatus(device, mockMode);
          addLog(device.id, "rest", `Enrollment status ${result.status}`, result);
          if (result.status === "APPROVED" && result.data) {
            updateDevice(device.id, applyEnrollment(device, result.data));
          } else {
            setDeviceState(device.id, result.status === "PENDING_APPROVAL" ? "pending" : "error");
          }
        } catch (error) {
          addLog(device.id, "error", "Enrollment status poll failed", error instanceof Error ? error.message : error);
        }
      },
      enroll: async () => {
        if (!device) return;
        try {
          const result = await enrollWithToken(device, mockMode);
          updateDevice(device.id, applyEnrollment(device, result));
          addLog(device.id, "success", "Device enrolled with onboarding token", result);
        } catch (error) {
          setDeviceState(device.id, "error");
          addLog(device.id, "error", "Token enrollment failed", error instanceof Error ? error.message : error);
        }
      },
      refresh: async () => {
        if (!device) return;
        try {
          const result = await refreshToken(device, mockMode);
          updateDevice(device.id, applyEnrollment(device, result));
          addLog(device.id, "success", "Access token refreshed", result);
        } catch (error) {
          addLog(device.id, "error", "Refresh token failed", error instanceof Error ? error.message : error);
        }
      },
      health: async () => {
        if (!device) return;
        mutateMetrics(device.id);
        try {
          const result = await sendHealth(device, mockMode);
          updateDevice(device.id, { lastHealthAt: new Date().toISOString() });
          addLog(device.id, "rest", "Health snapshot sent", result);
        } catch (error) {
          addLog(device.id, "error", "Health send failed", error instanceof Error ? error.message : error);
        }
      },
      upload: async (file: File) => {
        if (!device) return;
        try {
          const result = await uploadAgentFile(device, file, mockMode);
          addLog(device.id, "rest", `Uploaded ${file.name}`, result);
        } catch (error) {
          addLog(device.id, "error", "File upload failed", error instanceof Error ? error.message : error);
        }
      },
      pollCommandsNow: async () => {
        if (!device) return;
        try {
          const commands = await pollCommands(device, mockMode);
          updateDevice(device.id, { lastPollAt: new Date().toISOString() });
          addLog(device.id, "rest", `Polled ${commands.length} REST command(s)`);
          commands.forEach((command) => void runRestCommand(device, command, "rest"));
        } catch (error) {
          addLog(device.id, "error", "REST command poll failed", error instanceof Error ? error.message : error);
        }
      },
      runManualCommand: async (type: string, payload: unknown) => {
        if (!device) return;
        await runRestCommand(device, { id: randomId("manual"), type, payload }, "manual");
      },
      runManualMqttJob: async (type: string, payload: unknown) => {
        if (!device) return;
        const job = { job: type, correlationId: randomId("mqtt"), payload };
        await runMqttJob(device, job, mockMode ? undefined : mqttRef.current?.publishResponse);
      },
    }),
    [
      addLog,
      device,
      mockMode,
      mutateMetrics,
      runMqttJob,
      runRestCommand,
      setDeviceState,
      updateDevice,
    ],
  );

  return { device, actions };
}
