export default interface I2cMasterDev {
  writeTo(bus: string, addrHex: number, data: Uint8Array): Promise<void>;
  // TODO: можно ли чтобы data была undefined?
  //writeTo(bus: string, addrHex: number, data?: Uint8Array): Promise<void>;

  readFrom(bus: string, addrHex: number, quantity: number): Promise<Uint8Array>;
}
