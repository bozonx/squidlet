/*
 * Remake of https://www.npmjs.com/package/pcf8574 module.
 * Handling a PCF8574/PCF8574A IC.
 */

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {I2cNodeDriver, Handler, I2cNodeDriverBaseProps} from '../I2c/I2cNode.driver';
import {byteToBinArr, updateBitInByte} from '../../helpers/helpers';
import {PinMode} from '../../app/interfaces/dev/Digital';
import {omit} from '../../helpers/lodashLike';
import PortExpanderBase from './PortExpanderBase';




export class PCF8574Driver extends PortExpanderBase {
  // TODO: сделать прослойку выполняющую запрос

  private get i2cNode(): I2cNodeDriver {
    return this.depsInstances.i2cNode as I2cNodeDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cNode = await getDriverDep('I2cNode.driver')
      .getInstance({
        //...omit(this.props, 'resendStateInterval'),
        ...this.props,
        pollDataLength: 1,
        pollDataAddress: undefined,
      });
  }

  protected didInit = async () => {
    this.i2cNode.addPollErrorListener((err: Error) => {
      this.env.log.error(String(err));
    });
  }

  protected appDidInit = async () => {

    // TODO: remove timeout

    setTimeout(async () => {
      // init IC state after app is inited if it isn't inited at this moment
      if (!this.wasIcInited) await this.initIc();
    }, 1000);
  }


  protected validateProps = (props: ExpanderDriverProps): string | undefined => {

    // if(address < 0 || address > 255){
    //   throw new Error('Address out of range');
    // }

    return;
  }

}


export default class Factory extends DriverFactoryBase<PCF8574Driver> {

  // TODO: review - может быть и wifi и ble

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    const bus: string = (props.bus) ? String(props.bus) : 'default';

    return `${bus}-${props.address}`;
  }
  protected DriverClass = PCF8574Driver;
}
