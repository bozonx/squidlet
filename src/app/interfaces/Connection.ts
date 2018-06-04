import Message from './Message';


export default interface Connection {
  init: () => void;
  send: (payload: any) => Promise<void>;
  listenIncome: (handler: (payload: any) => void) => void;
  off: (handler: (payload: any) => void) => void;
}
