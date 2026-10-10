"use client";

import { useRouter } from "next/navigation";
import { ConsentForm } from "@/components/consent/ConsentForm";
import { useConsent, writeConsent } from "@/lib/consent";

export default function StartPanel() {
  const router = useRouter();
  const { ready, consent } = useConsent();
  if (!ready) return null;

  return (
    <ConsentForm
      initial={consent}
      onSubmit={(c) => {
        writeConsent(c);
        router.push("/levels");
      }}
    />
  );
}
