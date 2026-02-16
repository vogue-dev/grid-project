import { useEffect, useRef } from "react";
import type { CellUpdateMessage } from "../types";

type RealtimeSyncHandlers = {
  onMessage: (message: CellUpdateMessage) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onError: () => void;
};

export const useRealtimeSync = ({
  onMessage,
  onConnected,
  onDisconnected,
  onError
}: RealtimeSyncHandlers) => {
  const handlersRef = useRef<RealtimeSyncHandlers>({
    onMessage,
    onConnected,
    onDisconnected,
    onError
  });

  useEffect(() => {
    handlersRef.current = {
      onMessage,
      onConnected,
      onDisconnected,
      onError
    };
  }, [onMessage, onConnected, onDisconnected, onError]);

  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_BASE ?? window.location.origin.replace(/^http/, "ws");
    const socket = new WebSocket(`${wsBase}/ws`);

    socket.onopen = () => handlersRef.current.onConnected();
    socket.onclose = () => handlersRef.current.onDisconnected();
    socket.onerror = () => handlersRef.current.onError();
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as CellUpdateMessage;
        handlersRef.current.onMessage(message);
      } catch {
        handlersRef.current.onError();
      }
    };

    return () => socket.close();
  }, []);
};
