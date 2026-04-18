import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL || "https://campuscart-436h.onrender.com";

export function createSocket() {
  const token = localStorage.getItem("token");

  return io(BASE_URL, {
    transports: ["websocket"],
    auth: { token },
    autoConnect: true,
  });
}

