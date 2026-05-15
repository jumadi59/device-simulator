"use client";

export function AndroidDeviceFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative aspect-[9/16] h-full max-h-full max-w-full overflow-hidden rounded-[32px] border border-slate-700 bg-black shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}
