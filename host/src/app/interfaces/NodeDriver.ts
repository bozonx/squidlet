import {ErrorHandler} from '../../drivers/I2c/I2cToSlave.driver';

export type NodeHandler = (data: Uint8Array) => void;
export type NodeErrorHandler = (err: Error) => void;


export default interface NodeDriver {
  addListener(handler: NodeHandler): number;
  removeListener(handlerIndex: number): void;
  addPollErrorListener(handler: ErrorHandler): number;
  removePollErrorListener(handlerIndex: number): void;
  poll(): Promise<Uint8Array>;
  getLastData(): Uint8Array;
  write(dataAddress: number | undefined, data: Uint8Array): Promise<void>;
}
