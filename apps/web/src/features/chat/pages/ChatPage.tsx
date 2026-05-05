import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadMessages, sendMessage } from "../messagesService";
import { getConversations } from "../conversationsService";
import { useWebSocket } from "../hooks/useWebSocket";
import { tokenStorage } from "../../../domain/session/tokens";
import { cryptoSession } from "../../../domain/session/cryptoSession";
import { useAuthStore } from "../../auth/state/authStore";
import type { DecryptedMessage } from "../messagesService";
import styles from "./ChatPage.module.css";

export function ChatPage() {
  const { userId: partnerUserId = "" } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [partnerName, setPartnerName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Called by useWebSocket when a real-time message arrives
  const handleIncoming = useCallback((msg: DecryptedMessage) => {
    setMessages((prev) => {
      // Deduplicate by id
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const { isConnected } = useWebSocket(partnerUserId, handleIncoming);

  // Load history and partner name on mount
  useEffect(() => {
    if (!partnerUserId) return;
    const controller = new AbortController();

    Promise.all([
      loadMessages(partnerUserId, {}, controller.signal),
      getConversations(controller.signal),
    ])
      .then(([msgs, convs]) => {
        setMessages(msgs);
        const conv = convs.find((c) => c.user_id === partnerUserId);
        setPartnerName(conv?.display_name ?? conv?.username ?? "");
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        if (err instanceof Error && err.message.includes("Crypto session not ready")) {
          tokenStorage.clear();
          cryptoSession.clear();
          useAuthStore.getState().clearAuth();
          navigate("/login", { replace: true });
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load messages.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [partnerUserId]);

  // Scroll to bottom whenever message list grows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setSendError(null);

    try {
      const msg = await sendMessage(partnerUserId, text);
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
      setDraft("");
      inputRef.current?.focus();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Crypto session not ready")) {
        tokenStorage.clear();
        cryptoSession.clear();
        useAuthStore.getState().clearAuth();
        navigate("/login", { replace: true });
        return;
      }
      setSendError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <header className={styles.topbar}>
        <button
          className={styles.backBtn}
          onClick={() => navigate("/app/inbox")}
          aria-label="Back to inbox"
        >
          <BackIcon />
        </button>
        <div className={styles.partnerInfo}>
          <span className={styles.partnerName}>
            {partnerName || partnerUserId.slice(0, 8) + "…"}
          </span>
          <span
            className={`${styles.statusDot} ${isConnected ? styles.statusOnline : styles.statusOffline}`}
            aria-label={isConnected ? "Connected" : "Reconnecting…"}
          />
        </div>
      </header>

      {/* Message thread */}
      <main className={styles.thread}>
        {loading && (
          <div className={styles.center}>
            <span className={styles.spinner} aria-label="Loading messages" />
            <span>Loading messages…</span>
          </div>
        )}

        {!loading && error && (
          <div className={styles.center}>
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className={styles.center}>
            <span>No messages yet. Say hello!</span>
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <ul className={styles.messageList} role="list" aria-label="Messages">
            {messages.map((msg) => (
              <li
                key={msg.id}
                className={`${styles.bubble} ${msg.isSender ? styles.bubbleSent : styles.bubbleReceived}`}
              >
                <span className={styles.bubbleText}>{msg.plaintext}</span>
                <time
                  className={styles.bubbleTime}
                  dateTime={msg.created_at}
                  title={new Date(msg.created_at).toLocaleString()}
                >
                  {formatTime(msg.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </main>

      {/* Compose bar */}
      <footer className={styles.compose}>
        {sendError && <p className={styles.sendError}>{sendError}</p>}
        <div className={styles.composeRow}>
          <textarea
            ref={inputRef}
            className={styles.composeInput}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            aria-label="Message input"
            disabled={sending}
          />
          <button
            className={styles.sendBtn}
            onClick={() => void handleSend()}
            disabled={!draft.trim() || sending}
            aria-label="Send message"
          >
            {sending ? <SpinnerIcon /> : <SendIcon />}
          </button>
        </div>
      </footer>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" }) +
        " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className={styles.spinnerIcon}>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
