export default interface I2cMaster {
  writeTo(bus: string, addrHex: number, data: Uint8Array): Promise<void>;
  readFrom(bus: string, addrHex: number, quantity: number): Promise<Uint8Array>;
}
