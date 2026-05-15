import { useAndroidShellStore } from "../store/androidShellStore";
import type { AndroidNotificationType } from "../domain/notificationModel";

export function addAndroidNotification(params: {
  appName?: string;
  title: string;
  message: string;
  type?: AndroidNotificationType;
}) {
  useAndroidShellStore.getState().addNotification({
    appName: params.appName ?? "MDM Agent",
    title: params.title,
    message: params.message,
    type: params.type ?? "MDM",
  });
}
