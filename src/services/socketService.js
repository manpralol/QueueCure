import { io } from 'socket.io-client';
import { BASE_URL } from '../config/api';

console.log('[SocketService] Connecting to Socket.io server at:', BASE_URL);
const socket = io(BASE_URL);

socket.on('connect', () => {
  console.log('[SocketService] Connected to server with ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[SocketService] Disconnected from server. Reason:', reason);
});

export default socket;
