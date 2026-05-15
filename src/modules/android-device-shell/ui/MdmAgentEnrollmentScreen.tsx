"use client";

import { useAndroidShellStore } from "../store/androidShellStore";

export function MdmAgentEnrollmentScreen() {
  const showToast = useAndroidShellStore((state) => state.showToast);
  const showDialog = useAndroidShellStore((state) => state.showDialog);

  return (
    <div className="h-full bg-white px-6 pt-10">
      <h2 className="text-[30px] font-semibold text-[#777]">Enrollment Device</h2>
      <p className="mt-8 text-[21px] leading-tight text-[#777]">Pilih mode enrollment yang sesuai perangkat.</p>
      <div className="mt-8 space-y-7">
        <button
          type="button"
          onClick={() =>
            showDialog({
              title: "Input Pairing Code",
              message: "Pairing code input is mocked in this web simulator.",
              buttonText: "OK",
              cancelable: true,
            })
          }
          className="w-full rounded-md bg-[#6200EE] px-4 py-4 text-lg font-semibold uppercase tracking-[0.18em] text-white shadow"
        >
          Input Pairing Code Manual
        </button>
        <button
          type="button"
          onClick={() => showToast("QR scanner is not available in web simulator", "INFO")}
          className="w-full rounded-md bg-[#6200EE] px-4 py-4 text-lg font-semibold uppercase tracking-[0.18em] text-white shadow"
        >
          Scan QR
        </button>
      </div>
    </div>
  );
}
