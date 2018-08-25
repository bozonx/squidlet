export default interface I2cMasterDev {
  writeTo(addrHex: number, data: Uint8Array): Promise<void>;
  readFrom(addrHex: number, quantity: number): Promise<Uint8Array>;
}
