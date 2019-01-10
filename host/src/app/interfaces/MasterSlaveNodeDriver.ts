import {ErrorHandler, Handler} from '../../drivers/I2c/I2cNode.driver';

export default interface MasterSlaveNodeDriver {
  write(dataAddress: number | undefined, data: Uint8Array): Promise<void>;
  read(dataAddress: number | undefined, length: number): Promise<Uint8Array>;
  request(dataAddress: number | undefined, dataToSend: Uint8Array, readLength: number): Promise<Uint8Array>;
  poll(): Promise<Uint8Array>;
  addListener(handler: Handler): number;
  removeListener(handlerIndex: number): void;
  addPollErrorListener(handler: ErrorHandler): number;
  removePollErrorListener(handlerIndex: number): void
}
