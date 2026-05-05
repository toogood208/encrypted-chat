import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserSearch } from "../hooks/useUserSearch";
import type { UserPublicInfo } from "../../../shared/types/messages";
import styles from "./NewChatModal.module.css";

interface Props {
  onClose: () => void;
}

export function NewChatModal({ onClose }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const { results, loading, error } = useUserSearch(query);

  // Focus the search input when the modal opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSelect(user: UserPublicInfo) {
    onClose();
    navigate(`/app/chat/${user.id}`);
  }

  const showEmpty = !loading && !error && query.trim().length > 0 && results.length === 0;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="New chat"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>New chat</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={styles.searchWrap}>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="search"
            placeholder="Search by name or username…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className={styles.body}>
          {loading && (
            <div className={styles.center}>
              <span className={styles.spinner} aria-label="Searching" />
              <span>Searching…</span>
            </div>
          )}

          {!loading && error && (
            <div className={styles.center}>{error}</div>
          )}

          {showEmpty && (
            <div className={styles.center}>No users found for "{query.trim()}"</div>
          )}

          {!loading && results.length > 0 && (
            <ul className={styles.list} role="list">
              {results.map((user) => (
                <li key={user.id}>
                  <button className={styles.resultBtn} onClick={() => handleSelect(user)}>
                    <div className={styles.avatar} aria-hidden="true">
                      {user.display_name.slice(0, 2)}
                    </div>
                    <div>
                      <div className={styles.resultName}>{user.display_name}</div>
                      <div className={styles.resultUsername}>@{user.username}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 2l12 12M14 2L2 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
