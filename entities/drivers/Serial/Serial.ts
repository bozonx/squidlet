import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import SerialIo, {SerialParams} from 'system/interfaces/io/SerialIo';
import {omitObj} from 'system/lib/objects';


interface Props extends SerialParams {
  portNum: number;
}


export class Serial extends DriverBase<Props> {
  private get serialIo(): SerialIo {
    return this.getIo('Serial') as any;
  }
  private portNum: number = -1;


  protected willInit = async () => {
    this.portNum = await this.serialIo.newPort(
      this.props.portNum,
      omitObj(this.props, 'portNum')
    );

    await this.serialIo.onError(this.portNum, this.log.error);
    await this.serialIo.onData(this.portNum, this.handleData);

    this.log.debug(`Serial driver: Connected to port number ${this.portNum}`);
  }


  destroy = async () => {
    // TODO: !!!
  }


  onMessage(cb: (portNum: number, data: string | Uint8Array) => void): number {
    // TODO: !!!
  }

  removeMessageListener(handlerIndex: number) {
    // TODO: !!!
  }


  private handleData(data: string | Uint8Array) {

  }

}


export default class Factory extends DriverFactoryBase<Serial> {
  protected DriverClass = Serial;

  // TODO: review
  // protected instanceIdCalc = (props: {[index: string]: any}): string => {
  //   return String(props.uartNum);
  // }
}
