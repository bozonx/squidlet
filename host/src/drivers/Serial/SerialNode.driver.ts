import {GetDriverDep} from '../../app/entities/EntityBase';
import NodeDriver, {ReceiveHandler} from '../../app/interfaces/NodeDriver';
import DriverBase from '../../app/entities/DriverBase';
import Serial from '../../app/interfaces/dev/Serial';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {addFirstItemUint8Arr} from '../../helpers/helpers';
import {DATA_ADDRESS_LENGTH} from '../../app/dict/constants';


export interface SerialNodeProps {
 uartNum: number;
}


export class SerialNodeDriver extends DriverBase<SerialNodeProps> implements NodeDriver {
  private get serialDev(): Serial {
    return this.depsInstances.serialDev as Serial;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {

    // TODO: make setup baud rate

    this.depsInstances.serialDev = this.env.getDev('Serial');
  }

  async send(dataAddress?: number, data?: Uint8Array): Promise<void> {
    let dataToWrite = data as Uint8Array;

    if (typeof dataAddress !== 'undefined' && typeof data === 'undefined') {
      dataToWrite = new Uint8Array(DATA_ADDRESS_LENGTH);
    }
    else if (typeof dataAddress !== 'undefined' && typeof data !== 'undefined') {
      dataToWrite = addFirstItemUint8Arr(data, dataAddress);
    }
    else if (typeof dataAddress === 'undefined' && typeof data === 'undefined') {
      throw new Error(`SerialNodeDriver.send: you have to specify at least a dataAddress or data param`);
    }

    // if (typeof dataAddress === 'undefined' && typeof data !== 'undefined') dataToWrite = data

    return this.serialDev.print(this.props.uartNum, dataToWrite);
  }

  async request(dataAddress?: number, data?: Uint8Array): Promise<Uint8Array> {
    // TODO: write and wait for response
  }

  onReceive(cb: ReceiveHandler): void {

  }

  removeListener(handlerIndex: number): void {

  }

}


export default class Factory extends DriverFactoryBase<SerialNodeDriver> {
  protected DriverClass = SerialNodeDriver;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return String(props.uartNum);
  }
}
