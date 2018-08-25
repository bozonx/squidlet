export default interface I2cSlaveDev {
  send(data: Uint8Array): Promise<void>;
  listenIncome(handler: (data: Uint8Array) => void): void;
  removeListener(handler: (data: Uint8Array) => void): void;
}
