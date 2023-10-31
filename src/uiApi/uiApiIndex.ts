import {UiApiMain} from './main.js'

/**
 * this is api which is used in frontend to connect to backend api
 */

const DEFAULT_HOST = 'localhost'
const DEFAULT_PORT = 42181
const WsClass: new (url: string, protocol: string) => WebSocket = WebSocket
// @ts-ignore
const wsHost = window.SQUIDLET_API_HOST || DEFAULT_HOST
// @ts-ignore
const wsPort = window.SQUIDLET_API_PORT || DEFAULT_PORT

// @ts-ignore
window.squidletUiApi =
  new UiApiMain(wsHost, wsPort, WsClass)
