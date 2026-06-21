import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'https://laborify-backend.onrender.com';

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    _socket.on('connect', () => {
      const userId = localStorage.getItem('userId');
      if (userId) _socket!.emit('join', userId);
    });
  }
  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}
