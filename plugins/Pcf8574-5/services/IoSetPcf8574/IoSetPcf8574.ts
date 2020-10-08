import ServiceBase from 'system/base/ServiceBase';
import IoItem from 'system/interfaces/IoItem';
import {IoSetBase} from 'system/interfaces/IoSet';
import DigitalInputSemiDuplex from 'system/logic/digitalExpander/DigitalInputSemiDuplex';
import DigitalOutput from 'system/logic/digitalExpander/DigitalOutput';
import {omitObj} from 'system/lib/objects';

import {I2cMasterDriverProps} from '../../../../entities/drivers/I2cMaster/I2cMaster';
import {Pcf8574} from '../../drivers/Pcf8574/Pcf8574';
import {ImpulseInput} from '../../../../entities/drivers/ImpulseInput/ImpulseInput';


interface Props extends I2cMasterDriverProps {
  writeBufferMs: number;
  pollIntervalMs: number;
  // TODO: use int props ???
  interrupt?: {[index: string]: any};
}


export default class IoSetPcf8574 extends ServiceBase<Props> implements IoSetBase {
  private driver!: Pcf8574;
  private intDriver?: ImpulseInput;
  private readonly usedIo: {[index: string]: any} = {};


  init = async () => {
    this.driver = await this.context.getSubDriver<Pcf8574>(
      'Pcf8574',
      omitObj(this.props, 'writeBufferMs')
    );

    if (this.props.interrupt) {
      this.intDriver = await this.context.getSubDriver<ImpulseInput>(
        'ImpulseInput',
        this.props.interrupt
      );
    }
  }

  destroy = async () => {
  }


  getIo<T extends IoItem>(ioName: string): T {
    if (!this.usedIo[ioName]) {
      if (ioName === 'DigitalOutput') {
        this.usedIo[ioName] = new DigitalOutput(this.context, {
          driver: this.driver,
          writeBufferMs: this.props.writeBufferMs,
          queueJobTimeoutSec: this.config.config.queueJobTimeoutSec,
        });
      }
      else if (ioName === 'DigitalInput') {
        this.usedIo[ioName] = new DigitalInputSemiDuplex(this.context, {
          driver: this.driver,
          intDriver: this.intDriver,
          useLocalDebounce: true,
          waitResultTimeoutSec: this.config.config.responseTimoutSec,
          pollIntervalMs: this.props.pollIntervalMs,
        });
      }
      else {
        throw new Error(`IO "${ioName}" isn't supported on IoSetPcf8574 service`);
      }
    }

    return this.usedIo[ioName];
  }

  getNames(): string[] {
    return ['DigitalOutput', 'DigitalInput'];
  }

}
