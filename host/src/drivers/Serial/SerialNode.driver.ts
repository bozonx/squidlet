import {GetDriverDep} from '../../app/entities/EntityBase';
import NodeDriver, {ReceiveHandler} from '../../app/interfaces/NodeDriver';


export default class SerialNodeDriver implements NodeDriver {
  // async read(): Promise<Uint8Array> {
  //   // TODO: may be string???
  // }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    // TODO: make setup
  }

  async send(dataAddress?: number, data?: Uint8Array): Promise<void> {
    // TODO: use println
  }

  async request(dataAddress?: number, data?: Uint8Array): Promise<Uint8Array> {
    // TODO: write and wait for response
  }

  onReceive(cb: ReceiveHandler): void {

  }

  removeListener(handlerIndex: number): void {

  }

}
