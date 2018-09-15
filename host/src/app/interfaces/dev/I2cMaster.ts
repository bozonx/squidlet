export default interface I2cMaster {
  writeTo(addrHex: number, data: Uint8Array): Promise<void>;
  readFrom(addrHex: number, quantity: number): Promise<Uint8Array>;
}
