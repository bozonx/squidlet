import Message from './Message';


export default interface Connection {
  init: () => void;
  publish: (payload: any) => Promise<void>;
  subscribe: (handler: (payload: any) => void) => void;
  unsubscribe: (handler: (payload: any) => void) => void;
}
