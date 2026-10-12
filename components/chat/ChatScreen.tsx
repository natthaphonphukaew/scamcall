"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { COPY } from "@/lib/copy";
import { formatClock, initialOf } from "@/lib/format";
import { MAX_CHAT_CHARS } from "@/lib/chat/constants";
import { PropCard } from "./PropCard";
import type { ChatScreenProps } from "./types";

// หน้าตาแอปแชททั่วไป (ไม่เลียนแบบแอปจริงตัวไหน) — ปุ่มบล็อกอยู่บนหัวแชทตลอด (CLAUDE.md ข้อ 7.3)

const SHOW_REMAINING_BELOW = 10;

function TypingBubble() {
  return (
    <div
      className="flex w-fit gap-1 rounded-2xl rounded-bl-md bg-surface-raised px-4 py-3"
      aria-label={COPY.chatTyping}
    >
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-2 animate-bounce rounded-full bg-muted"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

export function ChatScreen({
  contact,
  status,
  messages,
  typing,
  awaiting,
  remaining,
  errorMessage,
  onSend,
  onBlock,
  onRetry,
}: ChatScreenProps) {
  const [draft, setDraft] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const canSend = status === "active" && !awaiting && draft.trim().length > 0;
  const lastPlayerId = messages.findLast((m) => m.speaker === "player")?.id;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing, errorMessage]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col">
      <header className="flex items-center gap-3 border-b border-white/10 bg-surface/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-scammer/25 text-lg font-bold text-scammer">
          {initialOf(contact)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold">{contact}</h1>
          <p className={`text-xs ${typing ? "text-scammer" : "text-accept"}`} aria-live="polite">
            {typing ? COPY.chatTyping : COPY.chatOnline}
          </p>
        </div>
        <button
          type="button"
          onClick={onBlock}
          className="shrink-0 rounded-full bg-danger px-3 py-2 text-sm font-bold text-white active:scale-95"
        >
          {COPY.chatBlock}
        </button>
      </header>

      <section className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
        <p className="mx-auto mb-2 rounded-full bg-surface-raised px-3 py-1 text-center text-xs text-muted">
          {COPY.chatNotice}
        </p>

        {messages.map((m) =>
          m.speaker === "scammer" ? (
            <div key={m.id} className="max-w-[85%] self-start">
              <div className="rounded-2xl rounded-bl-md bg-surface-raised px-4 py-2">
                {m.text && <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>}
                {m.prop && <PropCard prop={m.prop} />}
              </div>
              <p className="mt-0.5 px-1 text-[10px] text-muted">{formatClock(m.t)}</p>
            </div>
          ) : (
            <div key={m.id} className="max-w-[85%] self-end text-right">
              <p className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-player px-4 py-2 text-left leading-relaxed text-slate-950">
                {m.text}
              </p>
              <p className="mt-0.5 px-1 text-[10px] text-muted">
                {m.id === lastPlayerId && m.read ? `${COPY.chatRead} · ` : ""}
                {formatClock(m.t)}
              </p>
            </div>
          ),
        )}

        {typing && <TypingBubble />}

        {errorMessage && (
          <div className="mx-auto flex items-center gap-2 rounded-card bg-danger/15 px-3 py-2 text-sm text-danger">
            <span>{errorMessage}</span>
            <button type="button" onClick={onRetry} className="rounded-full bg-danger px-3 py-1 text-white">
              {COPY.retry}
            </button>
          </div>
        )}
        <div ref={bottom} />
      </section>

      <footer className="border-t border-white/10 bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <p className="mb-2 text-center text-[11px] text-muted">
          {remaining <= SHOW_REMAINING_BELOW ? COPY.chatRemaining(remaining) : COPY.chatSafeWordHint}
        </p>
        <form onSubmit={submit} className="flex items-end gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_CHAT_CHARS}
            disabled={status !== "active"}
            placeholder={status === "active" ? COPY.chatPlaceholder : COPY.chatWaiting}
            enterKeyHint="send"
            className="min-w-0 flex-1 rounded-full bg-surface-raised px-4 py-3 outline-none ring-player focus:ring-2 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="shrink-0 rounded-full bg-accept px-4 py-3 font-medium text-white transition active:scale-95 disabled:opacity-40"
          >
            {COPY.chatSend}
          </button>
        </form>
      </footer>
    </main>
  );
}
