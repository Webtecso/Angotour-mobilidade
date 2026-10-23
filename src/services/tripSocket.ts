import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constants/env';

export interface DriverPosition {
  latitude: number;
  longitude: number;
}

/**
 * Liga o passageiro a sala da viagem (trip:<id>) no servidor e reencaminha as
 * mudancas de estado e a posicao do motorista. Devolve a funcao que desliga tudo.
 * onConnected corre em cada (re)ligacao - serve para pedir o estado atual e nao
 * perder eventos emitidos enquanto a app estava sem rede.
 */
export function connectTripSocket(
  remoteTripId: string,
  onStatus: (status: string) => void,
  onConnected?: () => void,
  onDriverLocation?: (position: DriverPosition) => void
): () => void {
  const socket: Socket = io(API_BASE_URL, { transports: ['websocket'], reconnection: true });

  socket.on('connect', () => {
    socket.emit('join_trip', remoteTripId);
    onConnected?.();
  });

  socket.on('trip_status_update', (payload: { tripId: string; status: string }) => {
    if (payload.tripId === remoteTripId) onStatus(payload.status);
  });

  socket.on('driver_location_update', (payload: { tripId: string; latitude: number; longitude: number }) => {
    if (payload.tripId !== remoteTripId) return;
    if (typeof payload.latitude !== 'number' || typeof payload.longitude !== 'number') return;
    onDriverLocation?.({ latitude: payload.latitude, longitude: payload.longitude });
  });

  return () => {
    socket.emit('leave_trip', remoteTripId);
    socket.disconnect();
  };
}
