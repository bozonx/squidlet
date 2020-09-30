import ServiceBase from 'system/base/ServiceBase';
import IoItem from 'system/interfaces/IoItem';
import {IoSetBase} from 'system/interfaces/IoSet';
import DigitalInput, {DigitalExpanderInputProps} from 'system/logic/digitalExpander/DigitalInput';
import DigitalOutput, {DigitalExpanderOutputProps} from 'system/logic/digitalExpander/DigitalOutput';

import {I2cMasterDriverProps} from '../../../../entities/drivers/I2cMaster/I2cMaster';
import {Pcf8574} from '../../drivers/Pcf8574/Pcf8574';


interface Props extends I2cMasterDriverProps,
  DigitalExpanderInputProps,
  DigitalExpanderOutputProps {}

type ExpanderIoItemClass = new (
  driver: any,
  //driver: DigitalExpanderOutputDriver | DigitalExpanderInputDriver,
  logError: (msg: Error | string) => void,
  //props: DigitalExpanderOutputProps | DigitalExpanderInputProps
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
    this.driver = await this.context.getSubDriver<Pcf8574>('Pcf8574', {
      ...this.props,
      waitResultTimeoutSec: this.config.config.responseTimoutSec
    });
  }

  destroy = async () => {
  }


  getIo<T extends IoItem>(ioName: string): T {
    if (!this.usedIo[ioName]) {
      this.usedIo[ioName] = new ios[ioName](this.driver, this.log.error, this.props);
    }

    return this.usedIo[ioName];
  }

  getNames(): string[] {
    return Object.keys(ios);
  }

}
