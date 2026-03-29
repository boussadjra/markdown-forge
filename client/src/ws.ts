type WsMessage =
  | { type: 'file-changed'; path: string }
  | { type: 'tree-changed' }
  | { type: 'reload' };

type WsHandler = (msg: WsMessage) => void;

export function createWsClient(handlers: WsHandler[]): WebSocket {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${location.host}`);

  ws.addEventListener('message', (event) => {
    try {
      const msg: WsMessage = JSON.parse(event.data as string);
      for (const handler of handlers) {
        handler(msg);
      }
    } catch {
      // ignore malformed messages
    }
  });

  ws.addEventListener('close', () => {
    // Reconnect after 2 seconds
    setTimeout(() => createWsClient(handlers), 2000);
  });

  return ws;
}
