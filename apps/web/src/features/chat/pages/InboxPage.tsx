import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConversations } from "../conversationsService";
import { useAuthStore } from "../../auth/state/authStore";
import { NewChatModal } from "../components/NewChatModal";
import type { ConversationSummary } from "../../../shared/types/messages";
import styles from "./InboxPage.module.css";

export function InboxPage() {
  const user = useAuthStore((s) => s.user);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getConversations(controller.signal)
      .then(setConversations)
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load conversations.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <span className={styles.brand}>
          <span className={styles.brandDot} />
          WhisperBox
        </span>
        <div className={styles.userInfo}>
          <button className={styles.newChatBtn} onClick={() => setShowNewChat(true)}>
            <PencilIcon />
            New chat
          </button>
          {user && <span className={styles.displayName}>{user.display_name}</span>}
        </div>
      </header>

      <main className={styles.content}>
        <h1 className={styles.heading}>Inbox</h1>

        {loading && (
          <div className={styles.center}>
            <span className={styles.spinner} aria-label="Loading" />
            <span>Loading conversations…</span>
          </div>
        )}

        {!loading && error && (
          <div className={styles.center}>
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className={styles.center}>
            <span>No conversations yet.</span>
            <span>Search for a user to start chatting.</span>
          </div>
        )}

        {!loading && !error && conversations.length > 0 && (
          <ul className={styles.list} role="list">
            {conversations.map((conv) => (
              <li key={conv.user_id}>
                <Link to={`/app/chat/${conv.user_id}`} className={styles.item}>
                  <div className={styles.avatar} aria-hidden="true">
                    {conv.display_name.slice(0, 2)}
                  </div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemName}>{conv.display_name}</div>
                    <div className={styles.itemUsername}>@{conv.username}</div>
                  </div>
                  {conv.last_message_at && (
                    <time
                      className={styles.itemTime}
                      dateTime={conv.last_message_at}
                      title={new Date(conv.last_message_at).toLocaleString()}
                    >
                      {formatRelativeTime(conv.last_message_at)}
                    </time>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M11.5 1.5a1.414 1.414 0 0 1 2 2L5 12H3v-2L11.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Format an ISO timestamp as a short relative string, e.g. "3m ago", "2h ago", "Mon". */
function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
