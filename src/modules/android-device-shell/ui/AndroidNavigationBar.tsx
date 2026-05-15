"use client";

import { useAndroidShellStore } from "../store/androidShellStore";

export function AndroidNavigationBar() {
  const goBack = useAndroidShellStore((state) => state.goBack);
  const goHome = useAndroidShellStore((state) => state.goHome);
  const openRecents = useAndroidShellStore((state) => state.openRecents);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 grid h-[48px] grid-cols-3 items-center bg-black px-12 text-white">
      <button type="button" onClick={goBack} className="mx-auto h-0 w-0 border-y-[10px] border-r-[16px] border-y-transparent border-r-white" title="Back" />
      <button type="button" onClick={goHome} className="mx-auto h-5 w-5 rounded-full bg-white" title="Home" />
      <button type="button" onClick={openRecents} className="mx-auto h-5 w-5 rounded bg-white" title="Recent apps" />
    </div>
  );
}
