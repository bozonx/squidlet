import Message from './Message';


export default interface Connection {
  init: () => void;
  publish: (message: Message) => Promise<void>;
  subscribe: (handler: (message: Message) => void) => void;
  unsubscribe: (handler: (message: Message) => void) => void;
}
