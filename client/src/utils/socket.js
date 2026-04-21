import { io } from "socket.io-client";

// Strip /api suffix if present — Socket.IO connects to the base server URL
const RAW_URL = import.meta.env.VITE_API_URL || "https://campuscart-436h.onrender.com";
const BASE_URL = RAW_URL.replace(/\/api\/?$/, "");

let socketInstance = null;

export function getSocket() {
  const token = localStorage.getItem("token");

  // Reuse if connected AND token is the same
  if (socketInstance?.connected && socketInstance._authToken === token) {
    return socketInstance;
  }

  // Destroy stale connection before creating a new one
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(BASE_URL, {
    transports: ["websocket", "polling"],
    auth: { token },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    forceNew: true,
  });

  // Store token reference to detect stale connections
  socketInstance._authToken = token;

  socketInstance.on("connect", () => {
    console.log("[Socket] Connected:", socketInstance.id);
  });

  socketInstance.on("connect_error", (err) => {
    console.error("[Socket] Connection error:", err.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.warn("[Socket] Disconnected:", reason);
  });

  return socketInstance;
}

export function destroySocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}