"use client";

import { create } from "zustand";
import type {
  AndroidActiveApp,
  AndroidOverlayState,
  AndroidPermissionState,
  QuickSettingsState,
} from "../domain/androidShellModel";
import type { AndroidNotification } from "../domain/notificationModel";

export type RecentApp = {
  id: string;
  app: AndroidActiveApp;
  title: string;
  openedAt: string;
};

type AndroidShellStore = {
  activeApp: AndroidActiveApp;
  previousApp?: AndroidActiveApp;
  notificationShadeOpen: boolean;
  notificationShadeProgress: number;
  notifications: AndroidNotification[];
  quickSettings: QuickSettingsState;
  permissions: AndroidPermissionState;
  overlays: AndroidOverlayState;
  recentApps: RecentApp[];
  openApp: (app: AndroidActiveApp) => void;
  goHome: () => void;
  goBack: () => void;
  openRecents: () => void;
  openNotificationShade: () => void;
  closeNotificationShade: () => void;
  setNotificationShadeProgress: (value: number) => void;
  addNotification: (notification: Omit<AndroidNotification, "id" | "timestamp" | "read">) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  toggleQuickSetting: (key: keyof QuickSettingsState) => void;
  setPermission: <K extends keyof AndroidPermissionState>(key: K, value: AndroidPermissionState[K]) => void;
  showToast: (message: string, type?: "INFO" | "SUCCESS" | "ERROR") => void;
  clearToast: () => void;
  showDialog: (dialog: NonNullable<AndroidOverlayState["dialog"]>) => void;
  closeDialog: () => void;
  showVolumeOverlay: (count: number) => void;
  hideVolumeOverlay: () => void;
  removeRecentApp: (app: AndroidActiveApp) => void;
  clearRecentApps: () => void;
};

const appTitle: Record<AndroidActiveApp, string> = {
  HOME: "Home",
  MDM_AGENT: "MDM Agent",
  SETTINGS: "Settings",
  GALLERY: "Gallery",
  FILES: "Files",
  BROWSER: "Browser",
  RECENTS: "Recents",
};

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}`;
}

export const useAndroidShellStore = create<AndroidShellStore>((set, get) => ({
  activeApp: "MDM_AGENT",
  notificationShadeOpen: false,
  notificationShadeProgress: 0,
  notifications: [],
  quickSettings: {
    wifi: true,
    bluetooth: true,
    location: true,
    silent: true,
    batterySaver: false,
    mdm: true,
    screenShare: false,
    lock: false,
  },
  permissions: {
    notificationListener: "GRANTED",
    accessibilityService: "DISABLED",
    drawOverOtherApps: "NOT_GRANTED",
  },
  overlays: {},
  recentApps: [],
  openApp: (app) =>
    set((state) => ({
      previousApp: state.activeApp,
      activeApp: app,
      notificationShadeOpen: false,
      notificationShadeProgress: 0,
      recentApps:
        app === "HOME" || app === "RECENTS"
          ? state.recentApps
          : [
              { id: id("recent"), app, title: appTitle[app], openedAt: new Date().toISOString() },
              ...state.recentApps.filter((recent) => recent.app !== app),
            ].slice(0, 6),
    })),
  goHome: () =>
    set((state) => ({
      previousApp: state.activeApp,
      activeApp: "HOME",
      notificationShadeOpen: false,
      notificationShadeProgress: 0,
      overlays: { ...state.overlays, dialog: undefined },
    })),
  goBack: () =>
    set((state) => {
      if (state.notificationShadeOpen) return { notificationShadeOpen: false, notificationShadeProgress: 0 };
      if (state.overlays.dialog) return { overlays: { ...state.overlays, dialog: undefined } };
      if (state.activeApp !== "HOME") return { previousApp: state.activeApp, activeApp: "HOME" };
      return { activeApp: "HOME" };
    }),
  openRecents: () => set((state) => ({ previousApp: state.activeApp, activeApp: "RECENTS", notificationShadeOpen: false })),
  openNotificationShade: () => set({ notificationShadeOpen: true, notificationShadeProgress: 1 }),
  closeNotificationShade: () => set({ notificationShadeOpen: false, notificationShadeProgress: 0 }),
  setNotificationShadeProgress: (value) => set({ notificationShadeProgress: Math.max(0, Math.min(1, value)) }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: id("notif"),
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ].slice(0, 20),
    })),
  dismissNotification: (idValue) => set((state) => ({ notifications: state.notifications.filter((notification) => notification.id !== idValue) })),
  clearNotifications: () => set({ notifications: [] }),
  toggleQuickSetting: (key) =>
    set((state) => ({
      quickSettings: {
        ...state.quickSettings,
        [key]: !state.quickSettings[key],
      },
    })),
  setPermission: (key, value) => set((state) => ({ permissions: { ...state.permissions, [key]: value } })),
  showToast: (message, type = "INFO") => set((state) => ({ overlays: { ...state.overlays, toast: { message, type } } })),
  clearToast: () => set((state) => ({ overlays: { ...state.overlays, toast: undefined } })),
  showDialog: (dialog) => set((state) => ({ overlays: { ...state.overlays, dialog } })),
  closeDialog: () => set((state) => ({ overlays: { ...state.overlays, dialog: undefined } })),
  showVolumeOverlay: (count) => set((state) => ({ overlays: { ...state.overlays, volume: { visible: true, count } } })),
  hideVolumeOverlay: () => set((state) => ({ overlays: { ...state.overlays, volume: undefined } })),
  removeRecentApp: (app) => set((state) => ({ recentApps: state.recentApps.filter((recent) => recent.app !== app) })),
  clearRecentApps: () => set({ recentApps: [] }),
}));
