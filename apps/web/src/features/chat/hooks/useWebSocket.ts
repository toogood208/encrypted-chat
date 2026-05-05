/**
 * useWebSocket — manages the real-time WebSocket connection for a chat thread.
 *
 * Responsibilities:
 *   - Open wss://whisperbox.koyeb.app/ws?token=<access_token> on mount
 *   - Decrypt and surface incoming message.receive frames for the current partner
 *   - Expose sendFrame() for real-time sending (ChatPage falls back to REST if disconnected)
 *   - Auto-reconnect with exponential backoff (1s → 2s → 4s … capped at 30s)
 *   - Close cleanly on unmount
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { tokenStorage } from "../../../domain/session/tokens";
import { cryptoSession } from "../../../domain/session/cryptoSession";
import { useAuthStore } from "../../auth/state/authStore";
import { decryptMessage } from "../../../infrastructure/webcrypto/messaging";
import type { DecryptedMessage } from "../messagesService";
import type { EncryptedPayload, MessageResponse } from "../../../shared/types/messages";

const WS_BASE = "wss://whisperbox.koyeb.app/ws";
const MAX_BACKOFF_MS = 30_000;

// Frames the server sends us
interface ReceiveFrame {
  type: "message.receive";
  id: string;
  from_user_id: string;
  to_user_id: string;
  payload: EncryptedPayload;
  delivered: boolean;
  created_at: string;
}

// Frame we send to the server
interface SendFrame {
  type: "message.send";
  to: string;
  payload: EncryptedPayload;
}

interface UseWebSocketResult {
  isConnected: boolean;
  /** Send an already-encrypted payload via WebSocket. Returns false if not connected. */
  sendFrame: (to: string, payload: EncryptedPayload) => boolean;
}

export function useWebSocket(
  partnerUserId: string,
  onMessage: (msg: DecryptedMessage) => void,
): UseWebSocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000); // current reconnect delay in ms
  const unmountedRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage; // always call the latest callback

  const connect = useCallback(() => {
    const token = tokenStorage.getAccess();
    if (!token || unmountedRef.current) return;

    const ws = new WebSocket(`${WS_BASE}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmountedRef.current) { ws.close(); return; }
      setIsConnected(true);
      backoffRef.current = 1000; // reset backoff on successful connect
    };

    ws.onmessage = async (event: MessageEvent<string>) => {
      if (unmountedRef.current) return;

      let frame: unknown;
      try {
        frame = JSON.parse(event.data);
      } catch {
        return; // ignore malformed frames
      }

      const f = frame as Record<string, unknown>;
      if (f.type !== "message.receive") return;

      const msg = frame as ReceiveFrame;

      // Only surface messages that belong to this conversation
      const myUserId = useAuthStore.getState().user?.id;
      const isFromPartner = msg.from_user_id === partnerUserId && msg.to_user_id === myUserId;
      const isFromSelf = msg.from_user_id === myUserId && msg.to_user_id === partnerUserId;
      if (!isFromPartner && !isFromSelf) return;

      const privateKey = cryptoSession.getPrivateKey();
      if (!privateKey) return;

      try {
        const isSender = isFromSelf;
        const plaintext = await decryptMessage(msg.payload, privateKey, isSender);
        onMessageRef.current({
          id: msg.id,
          from_user_id: msg.from_user_id,
          to_user_id: msg.to_user_id,
          plaintext,
          created_at: msg.created_at,
          isSender,
        });
      } catch {
        // Decryption failure — silently skip (could be a message not meant for us)
      }
    };

    ws.onclose = () => {
      if (unmountedRef.current) return;
      setIsConnected(false);
      // Reconnect with exponential backoff
      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);
      setTimeout(() => {
        if (!unmountedRef.current) connect();
      }, delay);
    };

    ws.onerror = () => {
      // onclose fires after onerror — reconnect logic lives there
      ws.close();
    };
  }, [partnerUserId]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
      setIsConnected(false);
    };
  }, [connect]);

  const sendFrame = useCallback((to: string, payload: EncryptedPayload): boolean => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    const frame: SendFrame = { type: "message.send", to, payload };
    ws.send(JSON.stringify(frame));
    return true;
  }, []);

  return { isConnected, sendFrame };
}
