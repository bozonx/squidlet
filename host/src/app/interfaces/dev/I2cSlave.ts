export default interface I2cSlave {
  send(bus: number, data: Uint8Array): Promise<void>;
  listenIncome(bus: number, handler: (data: Uint8Array) => void): void;
  removeListener(bus: number, handler: (data: Uint8Array) => void): void;
}
