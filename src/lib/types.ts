export type CommandStatus = "ACKED" | "EXECUTED" | "SUCCESS" | "FAILED" | "CANCELLED" | "TIMEOUT";

export type DeviceConnectionState = "idle" | "bootstrapping" | "pending" | "enrolled" | "online" | "offline" | "error";

export type LogLevel = "info" | "success" | "warn" | "error" | "mqtt" | "rest";

export type DeviceLog = {
  id: string;
  tsIso: string;
  level: LogLevel;
  message: string;
  detail?: unknown;
};

export type AgentTokens = {
  deviceId?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
};

export type MqttConfig = {
  host?: string;
  clientId?: string;
  username?: string;
  password?: string;
};

export type EnrollmentData = AgentTokens & {
  mqttConfig?: MqttConfig;
  policy?: {
    pollIntervalSec?: number;
    terminalIntervalSec?: number;
  };
  configHost?: string;
  serialNumber?: string;
  expiresAtIso?: string;
  expiredIsoRefreshToken?: string;
};

export type DeviceProfile = {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  appVersion: string;
  androidId: string;
  installationId: string;
  fingerprint: string;
  requestedGroupId?: number;
  note?: string;
  onboardingToken: string;
  state: DeviceConnectionState;
  enrollmentId?: string;
  pairingCode?: string;
  expiresAt?: string;
  tokens: AgentTokens;
  mqtt: MqttConfig;
  locked: boolean;
  activeApp?: string;
  notifications: DeviceNotification[];
  screenSharing: boolean;
  mediaPlaying: boolean;
  mqttConnected: boolean;
  preferences: Record<string, unknown>;
  metrics: HealthPayload["payload"];
  lastHealthAt?: string;
  lastPollAt?: string;
  lastMqttAt?: string;
  logs: DeviceLog[];
  commandHistory: SimulatedCommand[];
};

export type DeviceNotification = {
  id: string;
  title: string;
  message: string;
  content?: string;
  createdAtIso: string;
  source: "mqtt" | "rest" | "manual";
};

export type HealthPayload = {
  payload: {
    battery_percentage: number;
    battery_status: string;
    connection: {
      connection_name: string;
      connection_level: number;
      latency: number;
      public_ip: string | null;
      private_ip: string;
    };
    ram: {
      native_heap_size: number;
      native_heap_free_size: number;
      used_mem_in_bytes: number;
      used_mem_in_percentage: number;
    };
    storage: {
      storage_total: number;
      storage_used: number;
      storage_free: number;
      storage_percentage: number;
    };
    latitude: number;
    longitude: number;
    installed_apps: InstalledApp[];
    serial_number: string;
    uptime_device: number;
    firmware: string;
    mdm_version: string;
  };
  tsIso: string;
};

export type InstalledApp = {
  label: string;
  package_name: string;
  version_code: number;
  version_name: string;
  icon: string | null;
};

export type AgentCommand = {
  id?: string;
  commandId?: string;
  type?: string;
  job?: string;
  payload?: unknown;
  createdAtIso?: string;
  metadata?: Record<string, unknown>;
  isBot?: boolean;
};

export type MqttJob = {
  job?: string | null;
  correlationId?: string | null;
  payload?: unknown;
};

export type CommandSource = "rest" | "mqtt" | "manual";

export type SimulatedCommand = {
  id: string;
  source: CommandSource;
  job: string;
  status: CommandStatus;
  payload: unknown;
  response?: unknown;
  createdAtIso: string;
  updatedAtIso: string;
  correlationId?: string;
};
