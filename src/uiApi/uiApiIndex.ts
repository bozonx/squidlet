// TODO: this is api which is used in frontend to connect to backend api

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 42181
const PROTOCOL = 'squidlet-api'
// @ts-ignore
const WsClass: WebSocket = window['MozWebSocket'] ? MozWebSocket : WebSocket

// @ts-ignore
window.squidletUiApi = new UiApiMain(window.SQUIDLET_API_HOST || DEFAULT_HOST, window.SQUIDLET_API_PORT || DEFAULT_PORT, WsClass)


class UiApiMain {
  socket: WebSocket

  constructor(wsHost: string, wsPort: string, WsClass: new (url: string, protocol: string) => WebSocket) {
    const url = `ws://${wsHost}:${wsPort}`
    this.socket = new WsClass(url, PROTOCOL)

    this.socket.onmessage = this.handleWebsocketMessage();
    this.socket.onclose = this.handleWebsocketClose();
  }


  handleWebsocketMessage = (message) => {
    try {
      var command = JSON.parse(message.data);
    }
    catch(e) { /* do nothing */ }
  }

  handleWebsocketClose = () => {
    console.warn(`WS connection closed`)
  }

}
