# Task: Implement Android Device Shell for MDM Agent Simulator

## Context

Project ini adalah **MDM Agent Simulator berbasis Next.js** yang digunakan untuk mensimulasikan perangkat Android/EDC yang terhubung ke backend MDM melalui REST API Agent dan MQTT Job.

Saat ini simulator sudah/akan memiliki fitur:

- Multi-device simulator
- REST API Agent
- MQTT Job Handler
- Enrollment
- Health telemetry
- Command polling
- Command execution
- Mock mode
- Log console

Tugas ini adalah menambahkan **Android Device Shell** agar simulator terlihat dan berperilaku seperti perangkat Android/EDC.

Referensi visual yang harus ditiru:

- Home launcher Android dengan wallpaper colorful
- Status bar atas
- Icon aplikasi `MDM Agent`
- Aplikasi MDM Agent dengan toolbar ungu
- Halaman Monitoring
- Halaman Settings permission
- Halaman Enrollment Device
- Bottom navigation Android klasik: Back, Home, Recent
- Notification shade yang bisa di-swipe dari atas

---

## Goal

Implementasikan UI layer baru bernama:

```txt
Android Device Shell
```

Layer ini harus membungkus simulator MDM Agent agar terlihat seperti device Android virtual yang berjalan di browser.

Aplikasi harus mendukung:

1. Android device frame.
2. Status bar atas.
3. Home launcher.
4. App icon `MDM Agent`.
5. App window `MDM Agent`.
6. Notification shade yang bisa di-swipe dari atas.
7. Quick settings.
8. Notification list.
9. Bottom navigation Android.
10. Recent apps simulation.
11. Lock device overlay.
12. Dialog/toast overlay untuk MQTT job.
13. Integrasi dengan simulator store existing.
14. Integrasi dengan MQTT job executor existing.

---

## Tech Stack

Gunakan stack berikut:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand
- Framer Motion
- lucide-react
- shadcn/ui jika sudah tersedia di project

Semua component yang menggunakan state, hook, gesture, atau event handler harus menggunakan:

```tsx
"use client";
```

---

## Folder Structure

Tambahkan module baru:

```txt
src/
  modules/
    android-device-shell/
      domain/
        androidShellModel.ts
        notificationModel.ts
        launcherModel.ts

      store/
        androidShellStore.ts

      services/
        notificationService.ts
        androidCommandBridge.ts

      ui/
        AndroidDeviceFrame.tsx
        AndroidScreen.tsx
        AndroidStatusBar.tsx
        AndroidNotificationShade.tsx
        AndroidQuickSettings.tsx
        AndroidNotificationList.tsx
        AndroidHomeLauncher.tsx
        AndroidAppIcon.tsx
        AndroidNavigationBar.tsx
        AndroidRecentApps.tsx
        AndroidLockOverlay.tsx
        AndroidVolumeOverlay.tsx
        AndroidToastOverlay.tsx
        AndroidDialogOverlay.tsx
        MdmAgentAppWindow.tsx
        MdmAgentMonitoringScreen.tsx
        MdmAgentSettingsScreen.tsx
        MdmAgentEnrollmentScreen.tsx
```

Jangan menghapus module simulator existing. Tambahkan module ini sebagai layer UI baru.

---

## Main Integration

Buat komponen utama:

```tsx
<AndroidDeviceFrame>
  <AndroidScreen />
</AndroidDeviceFrame>
```

Integrasikan ke halaman utama simulator, misalnya:

```tsx
// src/app/page.tsx
import { AndroidDeviceFrame } from "@/modules/android-device-shell/ui/AndroidDeviceFrame";
import { AndroidScreen } from "@/modules/android-device-shell/ui/AndroidScreen";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <AndroidDeviceFrame>
        <AndroidScreen />
      </AndroidDeviceFrame>
    </main>
  );
}
```

---

## Android Device Frame

File:

```txt
src/modules/android-device-shell/ui/AndroidDeviceFrame.tsx
```

Requirement:

- Rasio portrait 9:16.
- Ukuran responsif.
- Maksimal tinggi mengikuti viewport.
- Border rounded.
- Shadow halus.
- Background hitam di luar layar.
- Layar tidak boleh overflow keluar dari frame.
- Cocok untuk preview device Android/EDC.

Contoh style:

```tsx
<div className="relative aspect-[9/16] h-[90vh] max-h-[960px] min-h-[640px] overflow-hidden rounded-[32px] border border-slate-700 bg-black shadow-2xl">
  {children}
</div>
```

---

## Android Shell Models

File:

```txt
src/modules/android-device-shell/domain/androidShellModel.ts
```

Buat type:

```ts
export type AndroidActiveApp =
  | "HOME"
  | "MDM_AGENT"
  | "SETTINGS"
  | "GALLERY"
  | "FILES"
  | "RECENTS";

export type QuickSettingsState = {
  wifi: boolean;
  bluetooth: boolean;
  location: boolean;
  silent: boolean;
  batterySaver: boolean;
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
```

---

## Notification Model

File:

```txt
src/modules/android-device-shell/domain/notificationModel.ts
```

Buat type:

```ts
export type AndroidNotificationType =
  | "INFO"
  | "WARNING"
  | "ERROR"
  | "MDM"
  | "SYSTEM";

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
```

---

## Launcher Model

File:

```txt
src/modules/android-device-shell/domain/launcherModel.ts
```

Buat type:

```ts
import type { AndroidActiveApp } from "./androidShellModel";

export type AndroidLauncherApp = {
  id: string;
  label: string;
  app: AndroidActiveApp;
  iconType: "MDM" | "FILES" | "GALLERY" | "BROWSER" | "SETTINGS";
};
```

---

## Android Shell Store

File:

```txt
src/modules/android-device-shell/store/androidShellStore.ts
```

Gunakan Zustand.

Store harus memiliki state:

```ts
import { create } from "zustand";
import type {
  AndroidActiveApp,
  AndroidOverlayState,
  AndroidPermissionState,
  QuickSettingsState,
} from "../domain/androidShellModel";
import type { AndroidNotification } from "../domain/notificationModel";

type RecentApp = {
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

  addNotification: (
    notification: Omit<AndroidNotification, "id" | "timestamp" | "read">
  ) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  toggleQuickSetting: (key: keyof QuickSettingsState) => void;

  setPermission: <K extends keyof AndroidPermissionState>(
    key: K,
    value: AndroidPermissionState[K]
  ) => void;

  showToast: (
    message: string,
    type?: "INFO" | "SUCCESS" | "ERROR"
  ) => void;
  clearToast: () => void;

  showDialog: (dialog: NonNullable<AndroidOverlayState["dialog"]>) => void;
  closeDialog: () => void;

  showVolumeOverlay: (count: number) => void;
  hideVolumeOverlay: () => void;

  removeRecentApp: (app: AndroidActiveApp) => void;
  clearRecentApps: () => void;
};
```

Behavior:

- `openApp(app)`:
  - set `activeApp`
  - tambahkan ke `recentApps`
  - tutup notification shade

- `goHome()`:
  - set `activeApp = "HOME"`
  - tutup notification shade dan overlay dialog

- `goBack()`:
  - jika notification shade terbuka, tutup shade
  - jika dialog terbuka, tutup dialog
  - jika active app bukan HOME, kembali ke HOME
  - jika sudah HOME, tetap HOME

- `openRecents()`:
  - set `activeApp = "RECENTS"`

---

## Android Screen

File:

```txt
src/modules/android-device-shell/ui/AndroidScreen.tsx
```

Komponen ini menjadi root layar Android.

Struktur:

```tsx
<div className="relative h-full w-full overflow-hidden bg-black">
  <AndroidStatusBar />
  <div className="absolute inset-x-0 top-[28px] bottom-[48px] overflow-hidden">
    {/* active app content */}
  </div>
  <AndroidNotificationShade />
  <AndroidToastOverlay />
  <AndroidDialogOverlay />
  <AndroidVolumeOverlay />
  <AndroidLockOverlay />
  <AndroidNavigationBar />
</div>
```

Render content berdasarkan `activeApp`:

- `HOME` => `AndroidHomeLauncher`
- `MDM_AGENT` => `MdmAgentAppWindow`
- `RECENTS` => `AndroidRecentApps`
- lainnya dummy placeholder

---

## Android Status Bar

File:

```txt
src/modules/android-device-shell/ui/AndroidStatusBar.tsx
```

Requirement:

- Fixed di bagian atas layar.
- Tinggi 28px sampai 36px.
- Menampilkan:
  - jam
  - notification indicator
  - MDM indicator
  - silent icon
  - bluetooth icon
  - wifi icon
  - battery icon
- Warna background:
  - purple saat app MDM Agent aktif
  - transparent/dark saat home
  - dark saat recent

Ambil data dari simulator store:

- battery percentage
- connection name
- device online/offline
- mqtt connected
- screenSharing
- mediaPlaying

Minimal fallback jika simulator store belum ada.

---

## Notification Shade

File:

```txt
src/modules/android-device-shell/ui/AndroidNotificationShade.tsx
```

Gunakan Framer Motion.

Requirement:

- Bisa di-drag dari atas ke bawah.
- Bisa ditutup dengan drag ke atas.
- Overlay berada di atas semua screen.
- Ketika terbuka:
  - tampilkan jam besar
  - tanggal
  - quick settings
  - brightness slider dummy
  - notification list
- Jika tidak ada notification, tampilkan `No notifications`.

Behavior drag:

- Jika drag height > 120px, buka penuh.
- Jika drag height < 120px, tutup.
- Saat shade tertutup, tetap sediakan gesture area tipis di status bar.

---

## Quick Settings

File:

```txt
src/modules/android-device-shell/ui/AndroidQuickSettings.tsx
```

Tampilkan toggle pill/card:

- WiFi
- Bluetooth
- Location
- MDM
- Silent
- Screen Share
- Battery Saver
- Lock

Setiap toggle harus update state lokal jika relevan.

Untuk Lock, update state device simulator jika tersedia.

---

## Notification List

File:

```txt
src/modules/android-device-shell/ui/AndroidNotificationList.tsx
```

Requirement:

- Tampilkan list notification card.
- Card berisi:
  - appName
  - title
  - message
  - timestamp
  - action button jika ada
- Bisa dismiss notification.
- Gunakan Framer Motion untuk swipe dismiss kanan/kiri.

---

## Home Launcher

File:

```txt
src/modules/android-device-shell/ui/AndroidHomeLauncher.tsx
```

Requirement:

- Wallpaper colorful abstract seperti Android.
- Bisa menggunakan CSS gradient, bukan gambar external.
- Tampilkan icon app `MDM Agent` di area tengah.
- Tampilkan dock bawah:
  - Files
  - Gallery
  - Browser
  - Settings
- Tampilkan page indicator dots.
- Klik icon `MDM Agent` membuka app `MDM_AGENT`.

Wallpaper style:

```tsx
<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#2563eb_0,#2563eb_12%,transparent_13%),radial-gradient(circle_at_20%_35%,#fde047_0,#fde047_20%,transparent_21%),radial-gradient(circle_at_75%_30%,#ec4899_0,#fb923c_35%,transparent_36%),radial-gradient(circle_at_30%_80%,#ef4444_0,#f97316_30%,transparent_31%),linear-gradient(135deg,#fb923c,#ec4899,#7c3aed)]" />
```

---

## Android App Icon

File:

```txt
src/modules/android-device-shell/ui/AndroidAppIcon.tsx
```

Props:

```ts
type Props = {
  label: string;
  iconType: "MDM" | "FILES" | "GALLERY" | "BROWSER" | "SETTINGS";
  onClick: () => void;
};
```

MDM icon:

- Rounded square.
- Green background.
- Grid pattern.
- Android robot simple icon.
- Label `MDM Agent`.

---

## MDM Agent App Window

File:

```txt
src/modules/android-device-shell/ui/MdmAgentAppWindow.tsx
```

Requirement:

- App full screen dalam area Android screen.
- Top app bar warna purple `#6200EE`.
- Title: `MDM Agent`.
- Bottom tab app:
  - Monitoring
  - Settings
- Jika device belum enrolled, tampilkan Enrollment screen.
- Jika sudah enrolled, tampilkan Monitoring screen.
- Settings tetap bisa diakses dari bottom tab.

State lokal:

```ts
type MdmTab = "MONITORING" | "SETTINGS";
```

---

## MDM Agent Monitoring Screen

File:

```txt
src/modules/android-device-shell/ui/MdmAgentMonitoringScreen.tsx
```

Tampilkan data seperti ini:

```txt
Serial Number       P551700121398
Total Storage       14.90GB
Free Storage        9.01GB
Used Storage        5.88GB
Total RAM           1.87GB
Free RAM            1.14GB
Used RAM            745.05MB
Battery             20.0%
Connection          WIFI
Signal              5
Active Time         00:01:53
MDM                 Connected
Location            -6.179429,106.788367
```

Footer:

```txt
Version App 1.0
```

Requirement UI:

- Background putih.
- Text abu-abu.
- Row dua kolom.
- Divider horizontal antar row.
- Font cukup besar seperti screenshot.
- Gunakan data dari selected device simulator.
- Jika data tidak tersedia, gunakan dummy fallback.

---

## MDM Agent Settings Screen

File:

```txt
src/modules/android-device-shell/ui/MdmAgentSettingsScreen.tsx
```

Tampilkan permission card:

### Notification Listener

Text:

```txt
Notification Listener
Digunakan untuk membaca notifikasi yang masuk dan automation.
Enabled
GRANTED
```

### Accessibility Service

Text:

```txt
Accessibility Service
Dibutuhkan untuk otomasi tindakan layar secara aman.
Disabled
OPEN SETTINGS
```

### Draw Over Other Apps

Text:

```txt
Draw Over Other Apps
Untuk menampilkan overlay ketika menjalankan tugas tertentu.
Not Granted
GRANT
```

Requirement UI:

- Background putih.
- Card putih dengan border/shadow.
- Icon kiri.
- Text tengah.
- Button kanan.
- Status hijau jika enabled/granted.
- Status merah jika disabled/not granted.
- Button purple.

---

## MDM Agent Enrollment Screen

File:

```txt
src/modules/android-device-shell/ui/MdmAgentEnrollmentScreen.tsx
```

Tampilkan:

```txt
Enrollment Device

Pilih mode enrollment yang sesuai perangkat.

[ INPUT PAIRING CODE MANUAL ]

[ SCAN QR ]
```

Requirement:

- Background putih.
- Title besar dan bold.
- Subtitle abu-abu.
- Button full width.
- Button warna purple.
- Text uppercase.
- Letter spacing besar.
- Saat klik input pairing code manual:
  - tampilkan dialog input pairing code
  - untuk tahap awal boleh mock
- Saat klik scan QR:
  - tampilkan toast `QR scanner is not available in web simulator`

---

## Android Navigation Bar

File:

```txt
src/modules/android-device-shell/ui/AndroidNavigationBar.tsx
```

Requirement:

- Fixed bawah layar.
- Tinggi 48px sampai 56px.
- Background hitam.
- Icon putih.
- Tombol:
  - Back triangle
  - Home circle
  - Recent square

Behavior:

- Back:
  - panggil `goBack()`
- Home:
  - panggil `goHome()`
- Recent:
  - panggil `openRecents()`

---

## Recent Apps

File:

```txt
src/modules/android-device-shell/ui/AndroidRecentApps.tsx
```

Requirement:

- Background dark blur.
- Tampilkan card recent apps.
- Minimal MDM Agent.
- Klik card membuka app.
- Swipe card untuk close.
- Button `Clear all`.
- Jika kosong, tampilkan `No recent apps`.

---

## Lock Overlay

File:

```txt
src/modules/android-device-shell/ui/AndroidLockOverlay.tsx
```

Requirement:

- Jika selected device `locked = true`, tampilkan overlay full screen.
- Overlay di atas semua app.
- Background hitam semi-transparent.
- Tampilkan lock icon.
- Text:

```txt
Device Locked
This terminal is locked by MDM
```

- Jangan izinkan click ke app/home di bawahnya.
- Jika mock/dev mode, boleh tampilkan tombol `Unlock for testing`.

---

## Toast Overlay

File:

```txt
src/modules/android-device-shell/ui/AndroidToastOverlay.tsx
```

Requirement:

- Tampilkan toast kecil di atas/bawah layar.
- Auto hide setelah 2–3 detik.
- Dipakai oleh:
  - push_notification
  - QR unavailable
  - command result
  - MQTT connected/disconnected

---

## Dialog Overlay

File:

```txt
src/modules/android-device-shell/ui/AndroidDialogOverlay.tsx
```

Requirement:

- Tampilkan Android-like dialog.
- Props/state dari `overlays.dialog`.
- Button default `OK`.
- Jika `cancelable = true`, klik backdrop menutup dialog.
- Jika ada `banner`, tampilkan image/banner di atas.

---

## Volume Overlay

File:

```txt
src/modules/android-device-shell/ui/AndroidVolumeOverlay.tsx
```

Requirement:

- Muncul saat job `play_sound`.
- Tampilkan icon volume/buzzer.
- Animasi pulse sesuai `count`.
- Auto hide.

---

## Android Command Bridge

File:

```txt
src/modules/android-device-shell/services/androidCommandBridge.ts
```

Bridge ini dipanggil dari MQTT job executor dan REST command executor.

Implementasikan fungsi:

```ts
export function handleAndroidSideEffect(params: {
  deviceId: string;
  commandType: string;
  payload: unknown;
  status: "EXECUTED" | "SUCCESS" | "FAILED";
}): void;
```

Mapping behavior:

### push_notification

- Tambahkan notification ke notification shade.
- Tampilkan toast.
- Jika `payload.inApp = true`, tampilkan notification card atau dialog ringan.

### push_dialog

- Tampilkan dialog dengan title, message, banner, buttonText, cancelable.

### lock_device

- Update selected device `locked`.
- Tambahkan notification `Device locked by MDM`.

### play_sound

- Tampilkan volume overlay.

### share_screen

- Update device `screenSharing = true`.
- Tambahkan notification `Screen sharing active`.

### stop_screen

- Update device `screenSharing = false`.
- Tambahkan notification `Screen sharing stopped`.

### play_media

- Update device `mediaPlaying = true`.
- Tambahkan notification `Media playback started`.

### stop_media

- Update device `mediaPlaying = false`.
- Tambahkan notification `Media playback stopped`.

### reboot

- Tampilkan toast `Rebooting device...`.
- Kembali ke home.
- Tambahkan notification `Device reboot completed` setelah simulasi selesai.

### install_apk

- Tambahkan notification `App install queued`.

### uninstall_apk

- Tambahkan notification `App uninstalled`.

### screenshot

- Tambahkan notification `Screenshot captured`.

### upload_logs

- Tambahkan notification `Logs uploaded`.

### error / FAILED

- Tambahkan notification type `ERROR`.

---

## Integration With Existing Simulator Store

Jika existing simulator store ada di:

```txt
src/modules/mdm-agent-simulator/store/simulatorStore.ts
```

Gunakan store tersebut untuk:

- selected device
- battery
- connection
- serial number
- storage
- RAM
- location
- installed apps
- locked
- screenSharing
- mediaPlaying
- accessToken
- mqtt connected

Jika nama field berbeda, buat mapper/helper agar Android Shell tidak bergantung langsung pada detail internal store.

Tambahkan helper:

```txt
src/modules/android-device-shell/services/deviceShellMapper.ts
```

Helper ini menghasilkan view model:

```ts
export type AndroidDeviceViewModel = {
  serialNumber: string;
  batteryPercentage: number;
  connectionName: string;
  connectionLevel: number;
  mdmConnected: boolean;
  mqttConnected: boolean;
  locked: boolean;
  screenSharing: boolean;
  mediaPlaying: boolean;
  totalStorageLabel: string;
  freeStorageLabel: string;
  usedStorageLabel: string;
  totalRamLabel: string;
  freeRamLabel: string;
  usedRamLabel: string;
  activeTimeLabel: string;
  locationLabel: string;
  appVersion: string;
};
```

---

## Integration With MQTT Job Executor

Cari file MQTT job executor existing, kemungkinan:

```txt
src/modules/mdm-agent-simulator/services/mqttJobExecutor.ts
```

Setelah job selesai dieksekusi, panggil:

```ts
handleAndroidSideEffect({
  deviceId,
  commandType: job,
  payload,
  status,
});
```

Pastikan side effect Android tidak mengubah response MQTT utama, hanya mengubah UI simulator.

---

## Styling Requirements

Ikuti visual berikut:

### General

- Device frame hitam.
- Layar portrait.
- UI tidak keluar dari frame.
- Font clean dan modern.
- Gunakan Tailwind CSS.

### Home Launcher

- Wallpaper colorful abstract.
- App icon rounded.
- Label putih dengan shadow.
- Dock bawah translucent.
- Page indicator dots.

### MDM App

- Toolbar purple `#6200EE`.
- Background putih.
- Text abu-abu.
- Divider tipis.
- Bottom tab app putih.
- Active tab purple.

### Android Navigation Bar

- Background hitam.
- Icon putih.
- Back triangle.
- Home circle.
- Recent square.

### Notification Shade

- Background putih/translucent.
- Quick settings rounded.
- Notification card rounded.
- Blur/backdrop jika memungkinkan.

---

## Gesture Requirements

Gunakan Framer Motion untuk:

1. Notification shade drag down/up.
2. Notification card swipe dismiss.
3. Recent app card swipe close.
4. App open animation.
5. Overlay fade/scale animation.

---

## Acceptance Criteria

Implementasi dianggap selesai jika:

1. Halaman utama menampilkan device frame Android.
2. Ada status bar atas.
3. Ada home launcher dengan icon `MDM Agent`.
4. Klik icon membuka app `MDM Agent`.
5. App `MDM Agent` memiliki toolbar ungu.
6. Monitoring screen tampil seperti screenshot.
7. Settings screen tampil seperti screenshot.
8. Enrollment screen tampil jika device belum enrolled.
9. Bottom navigation Android berfungsi.
10. Back button menutup overlay atau kembali ke home.
11. Home button kembali ke launcher.
12. Recent button membuka recent apps.
13. Notification shade bisa di-swipe dari atas.
14. Quick settings muncul di notification shade.
15. Notification list bisa menampilkan notifikasi.
16. Notification bisa di-dismiss.
17. `push_notification` dari MQTT menambah notification dan toast.
18. `push_dialog` dari MQTT menampilkan dialog.
19. `lock_device` dari MQTT menampilkan lock overlay.
20. `share_screen` menampilkan indikator screen sharing.
21. `play_media` menampilkan status media playing.
22. `play_sound` menampilkan volume overlay.
23. Device monitoring mengambil data dari simulator store.
24. TypeScript strict tanpa error.
25. UI responsive dan tidak overflow keluar dari device frame.

---

## Implementation Order

Kerjakan bertahap:

1. Tambahkan model Android shell.
2. Tambahkan Zustand store Android shell.
3. Buat `AndroidDeviceFrame`.
4. Buat `AndroidScreen`.
5. Buat `AndroidStatusBar`.
6. Buat `AndroidHomeLauncher`.
7. Buat `AndroidAppIcon`.
8. Buat `MdmAgentAppWindow`.
9. Buat Monitoring, Settings, Enrollment screen.
10. Buat `AndroidNavigationBar`.
11. Buat `AndroidNotificationShade`.
12. Buat `AndroidQuickSettings`.
13. Buat `AndroidNotificationList`.
14. Buat Recent Apps.
15. Buat Lock, Toast, Dialog, Volume overlay.
16. Buat `androidCommandBridge`.
17. Integrasikan bridge ke MQTT job executor.
18. Jalankan TypeScript check.
19. Rapikan UI dan perbaiki overflow.

---

## Important Rules

- Jangan menghapus module MDM Agent Simulator existing.
- Jangan mengganti REST API/MQTT logic existing kecuali untuk menambahkan bridge side effect UI.
- Jangan membuat dependency ke backend untuk Android Shell; shell harus tetap bisa berjalan di mock mode.
- Jangan gunakan external image URL untuk wallpaper. Gunakan CSS gradient.
- Jangan hardcode selected device jika simulator store sudah tersedia.
- Jika simulator store belum siap, buat fallback dummy view model.
- Pastikan semua file TypeScript compile.
- Pastikan semua komponen client-side diberi `"use client"`.

---

## Expected Output

Berikan implementasi kode lengkap untuk:

1. Android shell models.
2. Android shell Zustand store.
3. Android device frame.
4. Android screen root.
5. Status bar.
6. Home launcher.
7. App icon.
8. MDM Agent app window.
9. Monitoring screen.
10. Settings screen.
11. Enrollment screen.
12. Bottom navigation bar.
13. Notification shade.
14. Quick settings.
15. Notification list.
16. Recent apps.
17. Lock overlay.
18. Toast overlay.
19. Dialog overlay.
20. Volume overlay.
21. Android command bridge.
22. Integration example ke `page.tsx`.
23. Integration example ke `mqttJobExecutor.ts`.

Kode harus clean, modular, strongly typed, dan production-ready.
