"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAndroidShellStore } from "../store/androidShellStore";

export function AndroidDialogOverlay() {
  const dialog = useAndroidShellStore((state) => state.overlays.dialog);
  const closeDialog = useAndroidShellStore((state) => state.closeDialog);

  return (
    <AnimatePresence>
      {dialog ? (
        <motion.div
          className="absolute inset-0 z-[64] grid place-items-center bg-black/45 px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (dialog.cancelable) closeDialog();
          }}
        >
          <motion.div
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.96 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full rounded-2xl bg-white p-5 text-slate-900 shadow-2xl"
          >
            {dialog.banner ? <img src={dialog.banner} alt="" className="mb-4 max-h-32 w-full rounded-xl object-cover" /> : null}
            <h2 className="text-lg font-semibold">{dialog.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{dialog.message}</p>
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={closeDialog} className="rounded-full px-4 py-2 text-sm font-semibold text-[#6200EE]">
                {dialog.buttonText ?? "OK"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
