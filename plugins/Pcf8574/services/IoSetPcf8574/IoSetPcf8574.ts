import ServiceBase from 'system/base/ServiceBase';
import IoItem from 'system/interfaces/IoItem';
import {IoSetBase} from 'system/interfaces/IoSet';
import DigitalExpanderInputLogic from 'system/logic/DigitalExpander/DigitalExpanderInputLogic';

import {I2cMasterDriverProps} from '../../../../entities/drivers/I2cMaster/I2cMaster';
import {Pcf8574} from '../../drivers/Pcf8574';
import DigitalExpanderOutputLogic from '../../../../system/logic/DigitalExpander/DigitalExpanderOutputLogic';


type ExpanderIoItemClass = new (
  logic: DigitalExpanderInputLogic,
  logError: (msg: string) => void
) => void;

const ios: {[index: string]: ExpanderIoItemClass} = {
  DigitalInput: DigitalExpanderInputLogic,
  DigitalOutput: DigitalExpanderOutputLogic,
};


export default class IoSetPcf8574 extends ServiceBase<I2cMasterDriverProps> implements IoSetBase {
  private driver!: Pcf8574;
  private readonly usedIo: {[index: string]: any} = {};


  init = async () => {
    this.driver = await this.context.getSubDriver<Pcf8574>('Pcf8574', this.props);
  }

  destroy = async () => {
  }


  getIo<T extends IoItem>(ioName: string): T {
    if (!this.usedIo[ioName]) {
      this.usedIo[ioName] = new ios[ioName](this.driver, this.log.error);
    }

    return this.usedIo[ioName];
  }

  getNames(): string[] {
    return Object.keys(ios);
  }

}
