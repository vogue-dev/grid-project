import type { Server } from "node:http";
import type { PoolClient } from "pg";
import { WebSocketServer } from "ws";
import { pool } from "./db.js";

export const attachRealtime = (server: Server) => {
  const wss = new WebSocketServer({ server, path: "/ws" });

  const broadcast = (payload: string) => {
    for (const socket of wss.clients) {
      if (socket.readyState === 1) {
        socket.send(payload);
      }
    }
  };

  const setupPgListener = async () => {
    let listener: PoolClient | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const scheduleReconnect = () => {
      if (reconnectTimer) {
        return;
      }
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void connectListener();
      }, 1000);
    };

    const connectListener = async () => {
      try {
        listener = await pool.connect();
        await listener.query("LISTEN row_updates");

        listener.on("notification", (msg) => {
          if (msg.channel === "row_updates" && msg.payload) {
            broadcast(msg.payload);
          }
        });

        listener.on("error", () => {
          try {
            listener?.release();
          } catch {
            // ignore release errors on broken connection
          }
          listener = null;
          scheduleReconnect();
        });

        listener.on("end", () => {
          listener = null;
          scheduleReconnect();
        });
      } catch {
        if (listener) {
          try {
            listener.release();
          } catch {
            // ignore release errors
          }
          listener = null;
        }
        scheduleReconnect();
      }
    };

    await connectListener();
  };

  return { setupPgListener };
};
