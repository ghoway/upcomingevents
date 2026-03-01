/**
 * Broadcast a WebSocket message to all connected clients.
 * This is a server-side utility used by API routes.
 */
export function broadcast(type: string, data?: any) {
  const broadcastFn = (globalThis as any).__wsBroadcast;
  if (typeof broadcastFn === 'function') {
    broadcastFn(type, data);
  }
}
