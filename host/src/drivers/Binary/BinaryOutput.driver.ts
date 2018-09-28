const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');
const _omit = require('lodash/omit');
import * as EventEmitter from 'eventemitter3';

import {DigitalOutputDriver, DigitalOutputDriverProps} from '../Digital/DigitalOutput.driver';
import DebounceType from '../Digital/interfaces/DebounceType';
import DriverBase from '../../app/entities/DriverBase';
import {DigitalInputDriver, DigitalInputDriverProps, DigitalInputListenHandler} from '../Digital/DigitalInput.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';


const eventName = 'change';


export interface BinaryOutputDriverProps extends DigitalOutputDriverProps {
}


export class BinaryOutputDriver extends DriverBase<BinaryOutputDriverProps> {
  private get digitalOutput(): DigitalOutputDriver {
    return this.depsInstances.digitalOutput as DigitalOutputDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalOutput = getDriverDep('DigitalOutput.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    //this.digitalInput.addListener(this.listenHandler, this.props.debounce);
  }


  async read(): Promise<boolean> {
    return this.digitalOutput.read();
  }

  // /**
  //  * Listen to rising and faling of impulse (1 and 0 levels)
  //  */
  // addListener(handler: DigitalInputListenHandler) {
  //   this.events.addListener(eventName, handler);
  // }
  //
  // listenOnce(handler: DigitalInputListenHandler) {
  //   this.events.once(eventName, handler);
  // }
  //
  // removeListener(handler: DigitalInputListenHandler) {
  //   this.events.removeListener(eventName, handler);
  // }
  //
  // destroy = () => {
  //   this.digitalInput.removeListener(this.listenHandler);
  // }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }


  private listenHandler = async (level: boolean) => {

  }

}

export default class Factory extends DriverBase<BinaryOutputDriverProps> {
  async getInstance(instanceProps?: BinaryOutputDriverProps): Promise<BinaryOutputDriver> {
    const definition = {
      ...this.definition,
      props: _defaultsDeep(_cloneDeep(instanceProps), this.definition.props),
    };

    return new BinaryOutputDriver(definition, this.env);
  }
}
