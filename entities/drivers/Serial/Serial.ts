import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import SerialIo from 'system/interfaces/io/SerialIo';
import IndexedEvents from 'system/lib/IndexedEvents';
import {SerialMessageHandler} from 'system/interfaces/io/SerialIo';


interface Props {
  portNum: number | string;
}


export class Serial extends DriverBase<Props> {
  private readonly messageEvents = new IndexedEvents<SerialMessageHandler>();
  private get serialIo(): SerialIo {
    return this.depsInstances.serialIo;
  }


  init = async () => {
    this.depsInstances.serialIo = this.context.getIo('Serial');

    await this.serialIo.onError(this.props.portNum, this.handleError);
    await this.serialIo.onData(this.props.portNum, this.handleData);

    this.log.debug(`Serial driver: Connected to port ${this.props.portNum}`);
  }


  destroy = async () => {
    this.messageEvents.destroy();
    await this.serialIo.destroyPort(this.props.portNum);
  }


  onMessage(cb: SerialMessageHandler): number {
    return this.messageEvents.addListener(cb);
  }

  async write(data: Uint8Array) {
    await this.serialIo.write(this.props.portNum, data);
  }

  async print(data: string) {
    return await this.serialIo.print(this.props.portNum, data);
  }

  async println(data: string) {
    return await this.serialIo.print(this.props.portNum, data);
  }

  /**
   * Remove message listener
   */
  removeListener(handlerIndex: number) {
    this.messageEvents.removeListener(handlerIndex);
  }


  private handleData = (data: string | Uint8Array) => {
    this.messageEvents.emit(data);
  }

  private handleError = (err: string) => {
    this.log.error(err);
  }

}


export default class Factory extends DriverFactoryBase<Serial, Props> {
  protected SubDriverClass = Serial;
  protected instanceId = (props: Props): string => String(props.portNum);
}
