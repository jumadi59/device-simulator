export type AndroidNotificationType = "INFO" | "WARNING" | "ERROR" | "MDM" | "SYSTEM";

export type AndroidNotification = {
  id: string;
  appName: string;
  title: string;
  message: string;
  timestamp: string;
  icon?: string;
  type: AndroidNotificationType;
  actions?: Array<{
    id: string;
    label: string;
    action: string;
  }>;
  read: boolean;
};
