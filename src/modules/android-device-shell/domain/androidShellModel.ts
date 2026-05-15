export type AndroidActiveApp = "HOME" | "MDM_AGENT" | "SETTINGS" | "GALLERY" | "FILES" | "BROWSER" | "RECENTS";

export type QuickSettingsState = {
  wifi: boolean;
  bluetooth: boolean;
  location: boolean;
  silent: boolean;
  batterySaver: boolean;
  mdm: boolean;
  screenShare: boolean;
  lock: boolean;
};

export type AndroidPermissionState = {
  notificationListener: "GRANTED" | "NOT_GRANTED";
  accessibilityService: "ENABLED" | "DISABLED";
  drawOverOtherApps: "GRANTED" | "NOT_GRANTED";
};

export type AndroidOverlayState = {
  toast?: {
    message: string;
    type: "INFO" | "SUCCESS" | "ERROR";
  };
  dialog?: {
    title: string;
    message: string;
    banner?: string;
    buttonText?: string;
    cancelable: boolean;
  };
  volume?: {
    visible: boolean;
    count: number;
  };
};
