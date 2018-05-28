import MessageInterface from './MessageInterface';


export default interface Tunnel {
  send: (message: MessageInterface) => Promise<void>
  listen: (handler: () => void) => Promise<void>
}
