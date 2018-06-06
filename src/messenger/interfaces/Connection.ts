import Message from './Message';


export default interface Connection {
  init: () => void;
  send: (address: string, payload: any) => Promise<void>;
  listenIncome: (address: string, handler: (payload: any) => void) => void;
  off: (handler: (payload: any) => void) => void;
}
