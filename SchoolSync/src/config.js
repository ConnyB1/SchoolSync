export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
export const WS_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
export const SOCKET_OPTIONS = {
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
};

export const API_URL = 'http://localhost:3000/api';