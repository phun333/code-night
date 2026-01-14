'use client';

import { useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/lib/utils';

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const subscribe = useCallback(
    (event: string, callback: (data: any) => void) => {
      if (socket) {
        socket.on(event, callback);
        return () => {
          socket.off(event, callback);
        };
      }
      return () => {};
    },
    [socket],
  );

  return { socket, isConnected, subscribe };
}
