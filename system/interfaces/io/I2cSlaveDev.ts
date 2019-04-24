export const Methods = [
  'send',
  'listenIncome',
  'removeListener',
];


export default interface I2cSlaveDev {
  send(bus: number, data: Uint8Array): Promise<void>;
  listenIncome(bus: number, handler: (data: Uint8Array) => void): void;
  removeListener(bus: number, handler: (data: Uint8Array) => void): void;
}
