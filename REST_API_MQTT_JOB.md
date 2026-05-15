# Dokumentasi REST API dan MQTT Job MDM Agent

Dokumen ini dibuat dari kontrak client di:

- `EnrollmentApiService.kt`
- `AgentApiService.kt`
- `UploadFileService.kt`
- `DeviceController.kt`

Gunakan placeholder berikut pada contoh:

- `<MDM_HOST>`: host utama MDM, contoh `https://mdm.example.com`
- `<UPLOAD_HOST>`: host upload file, contoh `https://upload.example.com`
- `<DEVICE_TOKEN>`: device access token dari proses enrollment
- `<SN>`: serial number terminal dalam huruf besar
- `<UUID>`: correlation id unik untuk tracking command

## REST API

### 1. Bootstrap Enrollment

Membuat sesi enrollment untuk device tanpa kamera atau device yang perlu approval dashboard.

```http
POST <MDM_HOST>/api/agent/enrollment/bootstrap
Content-Type: application/json
```

Request:

```json
{
  "serialNumber": "PB0W239G20178",
  "brand": "PAX",
  "model": "A920",
  "appVersion": "1.0.20",
  "androidId": "a1b2c3d4e5f6",
  "installationId": "inst-9f5b0f3d",
  "fingerprint": "PAX/A920/...",
  "requestedGroupId": 12,
  "note": "Outlet Jakarta Selatan"
}
```

Response 200:

```json
{
  "enrollmentId": "enr_001",
  "pairingCode": "7KQ9A2",
  "expiresAt": "2026-05-15T10:30:00Z",
  "pollIntervalSec": 5
}
```

### 2. Poll Enrollment Status

Device polling sampai status `APPROVED`, `REJECTED`, `EXPIRED`, atau `FAILED`.

```http
GET <MDM_HOST>/api/agent/enrollment/{enrollmentId}/status
```

Response pending:

```json
{
  "status": "PENDING_APPROVAL",
  "data": null,
  "reason": null,
  "enrollmentId": "enr_001",
  "expiresAt": "2026-05-15T10:30:00Z",
  "pollIntervalSec": 5
}
```

Response approved:

```json
{
  "status": "APPROVED",
  "data": {
    "deviceId": "dev_123",
    "accessToken": "device-access-token",
    "refreshToken": "device-refresh-token",
    "mqttConfig": {
      "host": "ssl://mqtt.example.com:8883",
      "clientId": "PB0W239G20178"
    },
    "policy": {
      "pollIntervalSec": 60
    },
    "configHost": "https://mdm.example.com",
    "expiresAtIso": "2026-05-15T11:00:00Z",
    "expiredIsoRefreshToken": "2026-06-14T10:00:00Z",
    "serialNumber": "PB0W239G20178",
    "accessTokenExpiresAt": "2026-05-15T11:00:00Z",
    "refreshTokenExpiresAt": "2026-06-14T10:00:00Z"
  },
  "reason": null,
  "enrollmentId": "enr_001",
  "expiresAt": "2026-05-15T10:30:00Z",
  "pollIntervalSec": 5
}
```

### 3. Enroll Dengan Onboarding Token

Dipakai untuk QR/token enrollment.

```http
POST <MDM_HOST>/api/agent/enroll
Content-Type: application/json
```

Request:

```json
{
  "serialNumber": "PB0W239G20178",
  "onboardingToken": "ENR_BWd1EJGukW6D57JxjgfOIFNv8CcpGQaunOJ2TG72sQA"
}
```

Response 200/201:

```json
{
  "deviceId": "dev_123",
  "accessToken": "device-access-token",
  "refreshToken": "device-refresh-token",
  "mqttConfig": {
    "host": "ssl://mqtt.example.com:8883",
    "username": "PB0W239G20178",
    "password": "mqtt-password"
  },
  "policy": {
    "terminalIntervalSec": 900
  },
  "configHost": "https://mdm.example.com",
  "expiresAtIso": "2026-05-15T11:00:00Z",
  "expiredIsoRefreshToken": "2026-06-14T10:00:00Z",
  "serialNumber": "PB0W239G20178",
  "accessTokenExpiresAt": "2026-05-15T11:00:00Z",
  "refreshTokenExpiresAt": "2026-06-14T10:00:00Z"
}
```

### 4. Refresh Token

```http
POST <MDM_HOST>/api/agent/refresh-token
Content-Type: application/json
```

Request:

```json
{
  "serialNumber": "PB0W239G20178",
  "token": "device-refresh-token"
}
```

Response 200:

```json
{
  "deviceId": "dev_123",
  "accessToken": "new-device-access-token",
  "refreshToken": "new-device-refresh-token",
  "expiredIsoRefreshToken": "2026-06-14T10:00:00Z",
  "expiresAtIso": "2026-05-15T11:00:00Z"
}
```

### 5. Agent Health

Mengirim snapshot kondisi terminal.

```http
POST <MDM_HOST>/api/agent/health
Content-Type: application/json
X-Device-Token: <DEVICE_TOKEN>
```

Request:

```json
{
  "payload": {
    "battery_percentage": 76.0,
    "battery_status": "Charging",
    "connection": {
      "connection_name": "WIFI",
      "connection_level": 5,
      "latency": 42,
      "public_ip": null,
      "private_ip": "192.168.1.15"
    },
    "ram": {
      "native_heap_size": 906563584,
      "native_heap_free_size": 305352704,
      "used_mem_in_bytes": 601210880,
      "used_mem_in_percentage": 66
    },
    "storage": {
      "storage_total": 8000000000,
      "storage_used": 5063999488,
      "storage_free": 2936000512,
      "storage_percentage": 63
    },
    "latitude": -6.1784,
    "longitude": 106.7893,
    "installed_apps": [
      {
        "label": "MiniATM",
        "package_name": "com.miniatm.app",
        "version_code": 21,
        "version_name": "1.0.20",
        "icon": null
      }
    ],
    "serial_number": "PB0W239G20178",
    "uptime_device": 3600000,
    "firmware": "A920_V1.2.3",
    "mdm_version": "1.0.20"
  },
  "tsIso": "2026-05-15T10:00:00.000Z"
}
```

Response 200:

```json
{
  "status": "success",
  "code": 200,
  "message": "health accepted",
  "timestamp": 1778839200000
}
```

### 6. Upload File Agent

Digunakan oleh command seperti `screenshot` untuk upload file ke API agent.

```http
POST <MDM_HOST>/api/agent/files
Content-Type: multipart/form-data
X-Device-Token: <DEVICE_TOKEN>
```

Multipart:

| Field | Type | Keterangan |
| --- | --- | --- |
| `file` | file | File yang di-upload |

Response 200:

```json
{
  "id": 991,
  "ownerType": "device",
  "ownerId": "dev_123",
  "originalName": "screen.png",
  "storedPath": "/uploads/2026/05/screen.png",
  "url": "https://upload.example.com/uploads/2026/05/screen.png",
  "contentType": "image/png",
  "sizeBytes": 245120,
  "checksumSha256": "f2a1...",
  "ext": "png",
  "status": "READY",
  "uploadedByDeviceSn": "PB0W239G20178",
  "createdAtIso": "2026-05-15T10:00:00Z",
  "metaJson": null
}
```

### 7. Upload File Legacy

Interface `UploadFileService` memakai header package dan serial number.

```http
POST <UPLOAD_HOST>/mdm/uploads
Content-Type: multipart/form-data
x-package-app: com.example.mdm
Serial-Number: PB0W239G20178
```

Multipart:

| Method client | Field | Keterangan |
| --- | --- | --- |
| `uploadImage` | `image` | Screenshot/image |
| `uploadLog` | `file` | Log archive/file |

Response 200 sama dengan `UploadFileResponse` pada endpoint `/api/agent/files`.

### 8. Poll Commands

Agent mengambil command dari REST polling.

```http
GET <MDM_HOST>/api/agent/commands/poll?limit=10
X-Device-Token: <DEVICE_TOKEN>
```

Response 200:

```json
{
  "status": "success",
  "code": 200,
  "message": "ok",
  "timestamp": 1778839200000,
  "data": [
    {
      "id": "cmd_001",
      "type": "open_app",
      "payload": {
        "packageName": "com.miniatm.app"
      },
      "createdAtIso": "2026-05-15T10:00:00Z",
      "metadata": {
        "source": "dashboard"
      },
      "isBot": false
    }
  ]
}
```

Catatan: response juga didukung dalam field `commands`; client akan membaca `data` lebih dulu, lalu `commands`.

### 9. Mark Command Started

```http
POST <MDM_HOST>/api/agent/commands/{commandId}/started
Content-Type: application/json
X-Device-Token: <DEVICE_TOKEN>
```

Request:

```json
{
  "startedAtIso": "2026-05-15T10:00:01.000Z"
}
```

Response 200:

```json
{
  "status": "success",
  "code": 200,
  "message": "command marked started",
  "timestamp": 1778839201000,
  "data": {
    "commandId": "cmd_001"
  }
}
```

### 10. Mark Command Update

Dipakai untuk update progress/status intermediate.

```http
POST <MDM_HOST>/api/agent/commands/{commandId}/update
Content-Type: application/json
X-Device-Token: <DEVICE_TOKEN>
```

Request:

```json
{
  "status": "EXECUTED",
  "executedAtIso": "2026-05-15T10:00:02.000Z",
  "response": {
    "ok": true,
    "message": "download queued",
    "commandType": "download_file",
    "downloadUrl": "https://example.com/file.pdf",
    "label": "Manual PDF"
  }
}
```

Response 200:

```json
{
  "status": "success",
  "code": 200,
  "message": "command updated",
  "timestamp": 1778839202000,
  "data": {
    "commandId": "cmd_001"
  }
}
```

### 11. Submit Command Result

Dipakai untuk hasil final command.

```http
POST <MDM_HOST>/api/agent/commands/{commandId}/result
Content-Type: application/json
X-Device-Token: <DEVICE_TOKEN>
```

Request:

```json
{
  "status": "SUCCESS",
  "executedAtIso": "2026-05-15T10:00:05.000Z",
  "response": {
    "ok": true,
    "message": "App launched",
    "packageName": "com.miniatm.app",
    "activityName": null
  }
}
```

Response 200:

```json
{
  "status": "success",
  "code": 200,
  "message": "command result accepted",
  "timestamp": 1778839205000,
  "data": {
    "commandId": "cmd_001"
  }
}
```

Status command yang dipakai client:

```text
ACKED, EXECUTED, SUCCESS, FAILED, CANCELLED, TIMEOUT
```

## MQTT Job

### Topic

Agent subscribe ke:

```text
terminal
mdm/<SN>
```

Agent publish response/event ke:

```text
terminal/info
```

Format umum request:

```json
{
  "job": "<job_name>",
  "correlationId": "<UUID>",
  "payload": {}
}
```

Parsing payload:

- Jika `payload` string, client menerima string tersebut.
- Jika `payload` object/array, client mengubahnya ke JSON string lalu diproses sebagai object.
- Jika `payload` null, client memakai `{}`.

Format umum response MQTT:

```json
{
  "correlationId": "<UUID dari request>",
  "job": "<job_name>",
  "payload": {
    "ok": true,
    "message": "success"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

### Daftar Job dan Sample

#### ping

Request:

```json
{
  "job": "ping",
  "correlationId": "cmd-ping-001",
  "payload": {}
}
```

Response:

```json
{
  "correlationId": "cmd-ping-001",
  "job": "ping",
  "payload": {
    "ok": true,
    "message": "pong"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### install_apk

Request:

```json
{
  "job": "install_apk",
  "correlationId": "cmd-install-001",
  "payload": {
    "downloadUrl": "https://cdn.example.com/app-release.apk",
    "label": "MiniATM",
    "packageName": "com.miniatm.app",
    "apkFileId": 1001,
    "versionName": "1.0.21",
    "versionCode": 22
  }
}
```

Response awal:

```json
{
  "correlationId": "cmd-install-001",
  "job": "install_apk",
  "payload": {
    "ok": true,
    "message": "install queued",
    "commandType": "install_apk",
    "downloadUrl": "https://cdn.example.com/app-release.apk",
    "packageName": "com.miniatm.app"
  },
  "status": "EXECUTED",
  "serialNumber": "PB0W239G20178"
}
```

Alias payload yang juga didukung: `file` atau `url` untuk URL file, `id` untuk `apkFileId`.

#### download_file

Request:

```json
{
  "job": "download_file",
  "correlationId": "cmd-download-001",
  "payload": {
    "file": "https://cdn.example.com/manual.pdf",
    "label": "Manual PDF"
  }
}
```

Response awal:

```json
{
  "correlationId": "cmd-download-001",
  "job": "download_file",
  "payload": {
    "ok": true,
    "message": "download queued",
    "commandType": "download_file",
    "downloadUrl": "https://cdn.example.com/manual.pdf",
    "label": "Manual PDF"
  },
  "status": "EXECUTED",
  "serialNumber": "PB0W239G20178"
}
```

#### uninstall_apk

Request object:

```json
{
  "job": "uninstall_apk",
  "correlationId": "cmd-uninstall-001",
  "payload": {
    "packageName": "com.lonelycatgames.Xplore"
  }
}
```

Request string juga didukung:

```json
{
  "job": "uninstall_apk",
  "correlationId": "cmd-uninstall-001",
  "payload": "com.lonelycatgames.Xplore"
}
```

Response:

```json
{
  "correlationId": "cmd-uninstall-001",
  "job": "uninstall_apk",
  "payload": {
    "ok": true,
    "message": "uninstall success",
    "commandType": "uninstall_apk",
    "packageName": "com.lonelycatgames.Xplore"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### screenshot

Request:

```json
{
  "job": "screenshot",
  "correlationId": "cmd-screen-001",
  "payload": {}
}
```

Response:

```json
{
  "correlationId": "cmd-screen-001",
  "job": "screenshot",
  "payload": {
    "ok": true,
    "message": "screenshot success",
    "commandType": "screenshot",
    "localPath": "/data/user/0/com.example/files/screenshot.png",
    "url": "https://upload.example.com/uploads/2026/05/screenshot.png"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### open_app

Request:

```json
{
  "job": "open_app",
  "correlationId": "cmd-open-001",
  "payload": {
    "packageName": "com.miniatm.app",
    "activityName": "com.miniatm.app.MainActivity"
  }
}
```

Response:

```json
{
  "correlationId": "cmd-open-001",
  "job": "open_app",
  "payload": {
    "ok": true,
    "message": "App launched",
    "packageName": "com.miniatm.app",
    "activityName": "com.miniatm.app.MainActivity"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

Alias payload yang juga didukung: `package_name`, `activity_name`.

#### host_mdm

Request:

```json
{
  "job": "host_mdm",
  "correlationId": "cmd-host-001",
  "payload": {
    "host": "https://mdm-new.example.com/"
  }
}
```

Response:

```json
{
  "correlationId": "cmd-host-001",
  "job": "host_mdm",
  "payload": {
    "ok": true,
    "message": "mdm host updated",
    "commandType": "host_mdm",
    "host": "https://mdm-new.example.com/"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### host_mdm_upload

Request:

```json
{
  "job": "host_mdm_upload",
  "correlationId": "cmd-upload-host-001",
  "payload": {
    "host": "https://upload-new.example.com/"
  }
}
```

Response:

```json
{
  "correlationId": "cmd-upload-host-001",
  "job": "host_mdm_upload",
  "payload": {
    "ok": true,
    "message": "upload host updated",
    "commandType": "host_mdm_upload",
    "host": "https://upload-new.example.com/"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### upload_logs

Request:

```json
{
  "job": "upload_logs",
  "correlationId": "cmd-logs-001",
  "payload": {}
}
```

Response:

```json
{
  "correlationId": "cmd-logs-001",
  "job": "upload_logs",
  "payload": {
    "ok": true,
    "message": "[{\"url\":\"https://upload.example.com/logs/logcat.zip\"}]",
    "commandType": "upload_logs"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### running_dex

Request dex:

```json
{
  "job": "running_dex",
  "correlationId": "cmd-dex-001",
  "payload": {
    "file": "https://cdn.example.com/module.dex",
    "entryClass": "com.example.Entry"
  }
}
```

Request job file:

```json
{
  "job": "running_dex",
  "correlationId": "cmd-dex-002",
  "payload": {
    "file": "https://cdn.example.com/task.job"
  }
}
```

Response:

```json
{
  "correlationId": "cmd-dex-001",
  "job": "running_dex",
  "payload": {
    "ok": true,
    "message": "running dex success",
    "commandType": "running_dex",
    "file": "https://cdn.example.com/module.dex",
    "entryClass": "com.example.Entry"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### restart_app

Request:

```json
{
  "job": "restart_app",
  "correlationId": "cmd-restart-001",
  "payload": {}
}
```

Response:

```json
{
  "correlationId": "cmd-restart-001",
  "job": "restart_app",
  "payload": {
    "ok": true,
    "message": "restart triggered",
    "commandType": "restart_app"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### push_preference

Request:

```json
{
  "job": "push_preference",
  "correlationId": "cmd-pref-001",
  "payload": {
    "key": "terminal_interval",
    "value": 900
  }
}
```

Response:

```json
{
  "correlationId": "cmd-pref-001",
  "job": "push_preference",
  "payload": {
    "ok": true,
    "message": "preference saved",
    "commandType": "push_preference",
    "key": "terminal_interval"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

`value` mendukung string, boolean, integer, dan float.

#### delete_preference

Request:

```json
{
  "job": "delete_preference",
  "correlationId": "cmd-pref-delete-001",
  "payload": {
    "key": "terminal_interval"
  }
}
```

Response:

```json
{
  "correlationId": "cmd-pref-delete-001",
  "job": "delete_preference",
  "payload": {
    "ok": true,
    "message": "preference deleted",
    "commandType": "delete_preference",
    "key": "terminal_interval"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### push_notification

Request:

```json
{
  "job": "push_notification",
  "correlationId": "cmd-notif-001",
  "payload": {
    "icon": null,
    "message": "Update tersedia",
    "content": "Silakan restart aplikasi setelah transaksi selesai.",
    "banner": "https://cdn.example.com/banner.png",
    "data": "{\"screen\":\"update\"}",
    "action": "OPEN_APP",
    "inApp": true,
    "isSound": true,
    "isVibrate": true,
    "actions": [
      {
        "id": "open_update",
        "title": "Buka",
        "type": "OPEN_URL",
        "target": "https://example.com/update",
        "icon": null,
        "payload": null
      }
    ]
  }
}
```

Response:

```json
{
  "correlationId": "cmd-notif-001",
  "job": "push_notification",
  "payload": {
    "ok": true,
    "message": "push notification success",
    "commandType": "push_notification",
    "notificationId": "cmd-notif-001"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### push_dialog

Request:

```json
{
  "job": "push_dialog",
  "correlationId": "cmd-dialog-001",
  "payload": {
    "title": "Perhatian",
    "message": "Terminal akan restart dalam 5 menit.",
    "banner": "https://cdn.example.com/warning.png",
    "cancelable": true,
    "timeoutMs": 30000,
    "buttonText": "Mengerti"
  }
}
```

Response:

```json
{
  "correlationId": "cmd-dialog-001",
  "job": "push_dialog",
  "payload": {
    "ok": true,
    "message": "Dialog queued",
    "dialogId": "cmd-dialog-001"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### automation

Request preset:

```json
{
  "job": "automation",
  "correlationId": "cmd-flow-001",
  "payload": {
    "flowId": "talenta_clock_in"
  }
}
```

Request flow custom:

```json
{
  "job": "automation",
  "correlationId": "cmd-flow-002",
  "payload": {
    "flow": {
      "flowId": "custom_flow_001",
      "steps": []
    }
  }
}
```

Response:

```json
{
  "correlationId": "cmd-flow-001",
  "job": "automation",
  "payload": {
    "ok": true,
    "message": "Accessibility flow started",
    "flowId": "talenta_clock_in_v2"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### reboot

Request:

```json
{
  "job": "reboot",
  "correlationId": "cmd-reboot-001",
  "payload": {}
}
```

Response sebelum reboot:

```json
{
  "correlationId": "cmd-reboot-001",
  "job": "reboot",
  "payload": {
    "ok": true,
    "message": "reboot triggered",
    "commandType": "reboot"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

Setelah service hidup kembali, agent juga bisa publish:

```json
{
  "correlationId": "cmd-reboot-001",
  "job": "reboot",
  "payload": "",
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### health_printer

Request:

```json
{
  "job": "health_printer",
  "correlationId": "cmd-printer-001",
  "payload": {}
}
```

Response:

```json
{
  "correlationId": "cmd-printer-001",
  "job": "health_printer",
  "payload": {
    "ok": true,
    "message": "printer ok",
    "commandType": "health_printer"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### lock_device

Request:

```json
{
  "job": "lock_device",
  "correlationId": "cmd-lock-001",
  "payload": {
    "lock": true
  }
}
```

Request string juga didukung:

```json
{
  "job": "lock_device",
  "correlationId": "cmd-lock-001",
  "payload": "true"
}
```

Response:

```json
{
  "correlationId": "cmd-lock-001",
  "job": "lock_device",
  "payload": {
    "ok": true,
    "message": "lock device success",
    "commandType": "lock_device",
    "lock": true
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### app_whitelist

Request:

```json
{
  "job": "app_whitelist",
  "correlationId": "cmd-whitelist-001",
  "payload": {
    "package_name": "com.miniatm.app",
    "enable": true
  }
}
```

Response:

```json
{
  "correlationId": "cmd-whitelist-001",
  "job": "app_whitelist",
  "payload": {
    "ok": true,
    "message": "set app whitelist success",
    "commandType": "app_whitelist"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### get_terminal_info

Request via MQTT:

```json
{
  "job": "get_terminal_info",
  "correlationId": "cmd-info-001",
  "payload": {
    "isBot": true
  }
}
```

Response via MQTT jika `isBot=true`:

```json
{
  "correlationId": "cmd-info-001",
  "job": "get_terminal_info",
  "payload": {
    "battery_percentage": 76.0,
    "battery_status": "Charging",
    "connection": {
      "connection_name": "WIFI",
      "connection_level": 5,
      "latency": 42,
      "public_ip": null,
      "private_ip": "192.168.1.15"
    },
    "serial_number": "PB0W239G20178",
    "uptime_device": 3600000,
    "firmware": "A920_V1.2.3",
    "mdm_version": "1.0.20"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

Jika `isBot` tidak `true`, agent men-trigger sync info worker dan result-nya dikirim lewat mekanisme REST/result atau worker info.

#### play_sound

Request:

```json
{
  "job": "play_sound",
  "correlationId": "cmd-sound-001",
  "payload": {
    "count": 2
  }
}
```

Request string juga didukung:

```json
{
  "job": "play_sound",
  "correlationId": "cmd-sound-001",
  "payload": "2"
}
```

Response:

```json
{
  "correlationId": "cmd-sound-001",
  "job": "play_sound",
  "payload": {
    "ok": true,
    "message": "playing buzzer",
    "commandType": "play_sound",
    "count": 2
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### share_screen

Request:

```json
{
  "job": "share_screen",
  "correlationId": "cmd-share-001",
  "payload": {}
}
```

Response:

```json
{
  "correlationId": "cmd-share-001",
  "job": "share_screen",
  "payload": {
    "ok": true,
    "message": "share screen started",
    "commandType": "share_screen",
    "sessionId": "cmd-share-001"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### stop_screen

Request:

```json
{
  "job": "stop_screen",
  "correlationId": "cmd-stop-screen-001",
  "payload": {}
}
```

Response:

```json
{
  "correlationId": "cmd-stop-screen-001",
  "job": "stop_screen",
  "payload": {
    "ok": true,
    "message": "share screen stopped",
    "commandType": "stop_screen"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### play_media

Request:

```json
{
  "job": "play_media",
  "correlationId": "cmd-media-001",
  "payload": {
    "display": "SECOND",
    "media": [
      {
        "file": "https://cdn.example.com/promo.mp4",
        "slideDuration": "10",
        "runningText": "Promo hari ini",
        "scale": "FIT"
      }
    ]
  }
}
```

Response:

```json
{
  "correlationId": "cmd-media-001",
  "job": "play_media",
  "payload": {
    "ok": true,
    "message": "play media success",
    "commandType": "play_media"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### stop_media

Request:

```json
{
  "job": "stop_media",
  "correlationId": "cmd-stop-media-001",
  "payload": {}
}
```

Response:

```json
{
  "correlationId": "cmd-stop-media-001",
  "job": "stop_media",
  "payload": {
    "ok": true,
    "message": "stop media success",
    "commandType": "stop_media"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

#### boot_logo

Request:

```json
{
  "job": "boot_logo",
  "correlationId": "cmd-boot-logo-001",
  "payload": {
    "file": "https://cdn.example.com/boot-logo.png",
    "slideDuration": null,
    "runningText": null,
    "scale": "FIT"
  }
}
```

Response:

```json
{
  "correlationId": "cmd-boot-logo-001",
  "job": "boot_logo",
  "payload": {
    "ok": true,
    "message": "boot logo success",
    "commandType": "boot_logo",
    "file": "https://cdn.example.com/boot-logo.png"
  },
  "status": "SUCCESS",
  "serialNumber": "PB0W239G20178"
}
```

### Response Error

Contoh jika payload tidak valid:

```json
{
  "correlationId": "cmd-open-001",
  "job": "open_app",
  "payload": {
    "ok": false,
    "message": "packageName is required",
    "commandType": "open_app"
  },
  "status": "FAILED",
  "serialNumber": "PB0W239G20178"
}
```

Contoh jika job tidak dikenal:

```json
{
  "correlationId": "cmd-unknown-001",
  "job": "unknown_job",
  "payload": {
    "ok": false,
    "reason": "Unsupported command type",
    "commandType": "unknown_job",
    "commandId": "cmd-unknown-001"
  },
  "status": "FAILED",
  "serialNumber": "PB0W239G20178"
}
```

## Catatan Implementasi

- MQTT request harus membawa `job` dan `correlationId`.
- Response memakai `correlationId` yang sama dengan request agar dashboard bisa melakukan matching.
- Untuk REST command, field command id bisa bernama `id` atau `commandId`; client mendukung keduanya.
- Untuk upload screenshot lewat `AgentApiService`, field multipart yang dipakai adalah `file`.
- Untuk upload legacy `UploadFileService.uploadImage`, field multipart yang dipakai adalah `image`.
- Untuk upload legacy `UploadFileService.uploadLog`, field multipart yang dipakai adalah `file`.
- `install_apk` dan `download_file` mengembalikan status awal `EXECUTED` karena proses download/install dijalankan async lewat worker.
- Host Retrofit baru akan aktif setelah job `host_mdm` atau `host_mdm_upload` berhasil diproses.
