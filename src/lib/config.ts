import { z } from "zod";

const boolString = z
  .string()
  .optional()
  .transform((value) => value === "true");

const numberString = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    });

const envSchema = z.object({
  mdmHost: z.string().url().default("http://localhost:8080"),
  uploadHost: z.string().url().default("http://localhost:8080"),
  mqttUrl: z.string().default("ws://localhost:8083/mqtt"),
  mqttUsername: z.string().optional().default(""),
  mqttPassword: z.string().optional().default(""),
  mockMode: boolString.default(true),
  defaultPollIntervalSec: numberString(10),
  defaultHealthIntervalSec: numberString(60),
});

export const appConfig = envSchema.parse({
  mdmHost: process.env.NEXT_PUBLIC_MDM_HOST,
  uploadHost: process.env.NEXT_PUBLIC_UPLOAD_HOST,
  mqttUrl: process.env.NEXT_PUBLIC_MQTT_URL,
  mqttUsername: process.env.NEXT_PUBLIC_MQTT_USERNAME,
  mqttPassword: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
  mockMode: process.env.NEXT_PUBLIC_MOCK_MODE,
  defaultPollIntervalSec: process.env.NEXT_PUBLIC_DEFAULT_POLL_INTERVAL_SEC,
  defaultHealthIntervalSec: process.env.NEXT_PUBLIC_DEFAULT_HEALTH_INTERVAL_SEC,
});

export function isNetworkError(error: unknown) {
  return error instanceof Error && ["Network Error", "Failed to fetch"].some((text) => error.message.includes(text));
}
