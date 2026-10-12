"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChatEndedScreen } from "@/components/chat/ChatEndedScreen";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { ConsentForm } from "@/components/consent/ConsentForm";
import { Screen } from "@/components/ui/Screen";
import { useChat } from "@/lib/chat/useChat";
import { readConsent, useConsent, writeConsent } from "@/lib/consent";
import { CHAT_ERROR_MESSAGES } from "@/lib/copy";
import type { ChatIntro, PublicScenario } from "@/lib/types";

const canSaveTranscript = () => readConsent()?.saveTranscript === true;

interface Props {
  scenario: PublicScenario;
  intro: ChatIntro;
}

/** ด่านแชท: ต้องยินยอมก่อน (CLAUDE.md ข้อ 7.3) · "เริ่มแชทใหม่" = mount ใหม่ด้วย key ใหม่ */
export default function ChatPageController(props: Props) {
  const { ready, consent } = useConsent();
  const [run, setRun] = useState(0);

  if (!ready) return null;
  if (!consent) {
    return (
      <Screen className="justify-center">
        <ConsentForm initial={null} onSubmit={writeConsent} />
      </Screen>
    );
  }
  return <ChatRun key={run} {...props} saved={consent.saveTranscript} onRestart={() => setRun((n) => n + 1)} />;
}

function ChatRun({ scenario, intro, saved, onRestart }: Props & { saved: boolean; onRestart: () => void }) {
  const router = useRouter();
  const chat = useChat(scenario.id, intro, canSaveTranscript);

  if (chat.status === "ended" && chat.result) {
    const sessionId = chat.result.sessionId;
    return (
      <ChatEndedScreen
        contact={intro.contact}
        result={chat.result}
        saved={saved}
        onOpenXRay={() => router.push(`/xray/${sessionId}`)}
        onRestart={onRestart}
        onBackToCampus={() => router.push("/campus")}
      />
    );
  }

  return (
    <ChatScreen
      contact={intro.contact}
      status={chat.status}
      messages={chat.messages}
      typing={chat.typing}
      awaiting={chat.awaiting}
      remaining={chat.remaining}
      errorMessage={chat.error ? CHAT_ERROR_MESSAGES[chat.error] : null}
      onSend={chat.send}
      onBlock={chat.block}
      onRetry={chat.retry}
    />
  );
}
