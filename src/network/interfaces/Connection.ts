export default interface Connection {
  init: () => void;
  send: (address: string, payload: any) => Promise<void>;
  listenIncome: (address: string, handler: (payload: any) => void) => void;
  removeListener: (address: string, handler: (payload: any) => void) => void;
}
