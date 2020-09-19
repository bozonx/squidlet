export default interface DigitalExpanderDriver {
  readState(): Promise<Uint8Array>;

  writeState(state: Uint8Array): Promise<void>;
}
