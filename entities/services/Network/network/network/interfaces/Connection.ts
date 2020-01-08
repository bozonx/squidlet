export default interface Connection {
  init: () => void;
  send: (address: string, payload: any) => Promise<void>;
  listenIncome: (address: string, handler: (error: Error | null, payload: any) => void) => void;
  removeListener: (address: string, handler: (error: Error | null, payload: any) => void) => void;
}
