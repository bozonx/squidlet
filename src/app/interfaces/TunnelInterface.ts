import MessageInterface from './MessageInterface';


export default interface Tunnel {
  publish: (message: MessageInterface) => Promise<void>;
  subscribe: (handler: (message: MessageInterface) => void) => void;
  unsubscribe: (handler: (message: MessageInterface) => void) => void;
}
