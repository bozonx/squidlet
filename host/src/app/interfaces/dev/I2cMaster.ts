export default interface I2cMaster {
  writeTo(bus: number, addrHex: number, data: Uint8Array): Promise<void>;
  readFrom(bus: number, addrHex: number, quantity: number): Promise<Uint8Array>;
}

// TODO: setup - set bitrate
