import type { AndroidActiveApp } from "./androidShellModel";

export type AndroidLauncherApp = {
  id: string;
  label: string;
  app: AndroidActiveApp;
  iconType: "MDM" | "FILES" | "GALLERY" | "BROWSER" | "SETTINGS";
};
