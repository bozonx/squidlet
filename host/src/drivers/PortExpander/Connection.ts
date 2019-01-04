
import {ErrorHandler, I2cNodeDriver} from '../I2c/I2cNode.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ExpanderDriverProps} from './PortExpander.driver';


export type Handler = (data: Uint8Array) => void;


export default class Connection {
  private get i2cNode(): I2cNodeDriver {
    return this.depsInstances.i2cNode as I2cNodeDriver;
  }


  constructor() {

  }

  async init(props: ExpanderDriverProps, getDriverDep: GetDriverDep) {
    this.depsInstances.i2cNode = await getDriverDep('I2cNode.driver')
      .getInstance({
        //...omit(this.props, 'resendStateInterval'),
        ...this.props,
        pollDataLength: 1,
        pollDataAddress: undefined,
      });
  }

  addListener(handler: Handler): number {
    // TODO: add
  }

  removeListener(handlerIndex: number): void {
    // TODO: add
  }

  addPollErrorListener(handler: ErrorHandler): number {
    // TODO: add
  }

  removePollErrorListener(handlerIndex: number): void {
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
