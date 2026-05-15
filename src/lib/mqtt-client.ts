"use client";

import mqtt, { type MqttClient } from "mqtt";
import type { DeviceProfile, MqttJob } from "./types";

type MqttRuntime = {
  client: MqttClient;
  publishResponse: (payload: unknown) => void;
  disconnect: () => void;
};

export function connectMqttRuntime(
  device: DeviceProfile,
  onJob: (job: MqttJob, topic: string) => void,
  onLog: (level: "mqtt" | "error" | "success", message: string, detail?: unknown) => void,
): MqttRuntime {
  const url = device.mqtt.host || "";
  const client = mqtt.connect(url, {
    clientId: device.mqtt.clientId || device.serialNumber,
    username: device.mqtt.username || undefined,
    password: device.mqtt.password || undefined,
    keepalive: 30,
    reconnectPeriod: 2500,
    clean: true,
  });

  const topics = ["terminal", `mdm/${device.serialNumber}`];

  client.on("connect", () => {
    onLog("success", `MQTT connected to ${url}`);
    client.subscribe(topics, { qos: 1 }, (error) => {
      if (error) onLog("error", "MQTT subscribe failed", error.message);
      else onLog("mqtt", `Subscribed ${topics.join(", ")}`);
    });
  });

  client.on("reconnect", () => onLog("mqtt", "MQTT reconnecting"));
  client.on("close", () => onLog("mqtt", "MQTT connection closed"));
  client.on("error", (error) => onLog("error", "MQTT error", error.message));
  client.on("message", (topic, buffer) => {
    try {
      const parsed = JSON.parse(buffer.toString()) as MqttJob;
      onLog("mqtt", `MQTT job received from ${topic}`, parsed);
      onJob(parsed, topic);
    } catch (error) {
      onLog("error", `Invalid MQTT payload from ${topic}`, error instanceof Error ? error.message : error);
    }
  });

  return {
    client,
    publishResponse: (payload) => {
      client.publish("terminal/info", JSON.stringify(payload), { qos: 1 }, (error) => {
        if (error) onLog("error", "MQTT publish terminal/info failed", error.message);
        else onLog("mqtt", "Published terminal/info", payload);
      });
    },
    disconnect: () => client.end(true),
  };
}
