import ServiceBase from 'system/base/ServiceBase';
import IoItem from 'system/interfaces/IoItem';
import {IoSetBase} from 'system/interfaces/IoSet';
import DigitalInput from 'system/logic/digitalExpander/DigitalInput';
import DigitalOutput from 'system/logic/digitalExpander/DigitalOutput';
import {omitObj} from 'system/lib/objects';

import {I2cMasterDriverProps} from '../../../../entities/drivers/I2cMaster/I2cMaster';
import {Pcf8574} from '../../drivers/Pcf8574/Pcf8574';


interface Props extends I2cMasterDriverProps {
  writeBufferMs: number;
}

type ExpanderIoItemClass = new (
  driver: any,
  logError: (msg: Error | string) => void,
  props: any
) => void;

const ios: {[index: string]: ExpanderIoItemClass} = {
  DigitalInput,
  DigitalOutput,
};


export default class IoSetPcf8574 extends ServiceBase<Props> implements IoSetBase {
  private driver!: Pcf8574;
  private readonly usedIo: {[index: string]: any} = {};


  init = async () => {
    this.driver = await this.context.getSubDriver<Pcf8574>(
      'Pcf8574',
      omitObj(this.props, 'writeBufferMs')
    );
  }

  destroy = async () => {
  }


  getIo<T extends IoItem>(ioName: string): T {
    if (!this.usedIo[ioName]) {
      this.usedIo[ioName] = new ios[ioName](this.driver, this.log.error, {
        writeBufferMs: this.props.writeBufferMs,
        useLocalDebounce: true,
        waitResultTimeoutSec: this.config.config.responseTimoutSec,
        queueJobTimeoutSec: this.config.config.queueJobTimeoutSec,
      });
    }

    return this.usedIo[ioName];
  }

  getNames(): string[] {
    return Object.keys(ios);
  }

}
