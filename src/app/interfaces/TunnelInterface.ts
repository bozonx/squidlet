import MessageInterface from './MessageInterface';


export default interface Tunnel {
  send: (message: MessageInterface) => Promise<void>;
  listen: (handler: (message: MessageInterface) => void) => void;
}
