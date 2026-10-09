import type { ReactNode } from "react";

/** โครงเต็มจอแบบมือถือ + เว้น safe-area (รอยบาก/แถบ home ของ iPhone) */
export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={`mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] ${className}`}
    >
      {children}
    </main>
  );
}
