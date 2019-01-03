
import {Handler} from '../I2c/I2cNode.driver';



export default class Connection {
  constructor() {

  }

  addListener(handler: Handler): number {
    // TODO: add
  }

  removeListener(handlerIndex: number): void {
    // TODO: add
  }

  async poll(): Promise<Uint8Array> {
    // TODO: add
  }

  getLastData(): Uint8Array {
    // TODO: add
  }

  async write(dataAddress: number | undefined, data: Uint8Array): Promise<void> {
    // TODO: add
  }

}
