const PROTOCOL = 'squidlet-app-api'


export class UiApiMain {
  socket: WebSocket

  constructor(
    wsHost: string,
    wsPort: string,
    WsClass: new (url: string, protocol: string) => WebSocket,
    isSecure: boolean = false
  ) {
    const url = `${(isSecure) ? 'wss' : 'ws'}://${wsHost}:${wsPort}`
    this.socket = new WsClass(url, PROTOCOL)

    this.socket.onmessage = this.handleWebsocketMessage
    this.socket.onclose = this.handleWebsocketClose
  }


  handleWebsocketMessage = (message: MessageEvent) => {
    try {
      var command = JSON.parse(message.data);
    }
    catch(e) { /* do nothing */ }
  }

  handleWebsocketClose = () => {
    console.warn(`WS connection closed`)
  }

}
