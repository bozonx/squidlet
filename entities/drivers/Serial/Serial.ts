import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import SerialIo, {SerialParams} from 'system/interfaces/io/SerialIo';
import {omitObj} from 'system/lib/objects';
import IndexedEvents from 'system/lib/IndexedEvents';


export type MessageHandler = (data: string | Uint8Array) => void;
interface Props extends SerialParams {
  portNum: number;
}


export class Serial extends DriverBase<Props> {
  private readonly messageEvents = new IndexedEvents<MessageHandler>();
  private get serialIo(): SerialIo {
    return this.context.getIo('Serial') as any;
  }
  private portNum: number = -1;


  protected init = async () => {
    this.portNum = await this.serialIo.newPort(
      this.props.portNum,
      omitObj(this.props, 'portNum')
    );

    await this.serialIo.onError(this.portNum, this.log.error);
    await this.serialIo.onData(this.portNum, this.handleData);

    this.log.debug(`Serial driver: Connected to port number ${this.portNum}`);
  }


  destroy = async () => {
    this.messageEvents.destroy();
    await this.serialIo.destroyPort(this.portNum);
  }


  onMessage(cb: MessageHandler): number {
    return this.messageEvents.addListener(cb);
  }

  async write(data: Uint8Array) {
    await this.serialIo.write(this.portNum, data);
  }

  async print(data: string) {
    return await this.serialIo.print(this.portNum, data);
  }

  async println(data: string) {
    return await this.serialIo.print(this.portNum, data);
  }

  removeMessageListener(handlerIndex: number) {
    this.messageEvents.removeListener(handlerIndex);
  }


  private handleData(data: string | Uint8Array) {
    this.messageEvents.emit(data);
  }

}


export default class Factory extends DriverFactoryBase<Serial> {
  protected SubDriverClass = Serial;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return String(props.portNum);
  }
}
