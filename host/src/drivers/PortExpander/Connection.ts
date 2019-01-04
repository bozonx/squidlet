import {GetDriverDep} from '../../app/entities/EntityBase';
import {ExpanderDriverProps} from './PortExpander.driver';
import NodeDriver, {NodeHandler} from '../../app/interfaces/NodeDriver';





export default class Connection {
  private _node?: NodeDriver;

  private get node(): NodeDriver {
    return this._node as NodeDriver;
  }


  constructor() {

  }

  async init(props: ExpanderDriverProps, getDriverDep: GetDriverDep) {
    this._node = await getDriverDep('I2cNode.driver')
      .getInstance({
        //...omit(this.props, 'resendStateInterval'),
        ...props,
        pollDataLength: 1,
        pollDataAddress: undefined,
      });
  }

  addListener(handler: NodeHandler): number {
    return this.node.addListener(handler);
  }

  removeListener(handlerIndex: number): void {
    return this.node.removeListener(handlerIndex);
  }

  addPollErrorListener(handler: ErrorHandler): number {
    return this.node.addPollErrorListener(handler);
  }

  removePollErrorListener(handlerIndex: number): void {
    return this.node.removePollErrorListener(handlerIndex);
  }

  async poll(): Promise<Uint8Array> {
    return this.node.poll();
  }

  getLastData(): Uint8Array {
    return this.node.getLastData();
  }

  async write(dataAddress: number | undefined, data: Uint8Array): Promise<void> {
    return this.node.write(dataAddress, data);
  }

}
