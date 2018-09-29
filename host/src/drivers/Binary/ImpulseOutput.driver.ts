import {convertToLevel} from '../../helpers/helpers';

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


export interface ImpulseOutputDriverProps extends DigitalOutputDriverProps {
  blockTime: number;
}


export class ImpulseOutputDriver extends DriverBase<ImpulseOutputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();
  private blockTimeInProgress: boolean = false;

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

  impulse() {
    // skip while switch at dead time
    if (this.blockTimeInProgress) return this.status.getLocal().default;

    this.blockTimeInProgress = true;
    setTimeout(() => this.blockTimeInProgress = false, this.props.blockTime);

    await this.setStatus(level);

    return level;
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

export default class Factory extends DriverBase<ImpulseOutputDriverProps> {
  async getInstance(instanceProps?: ImpulseOutputDriverProps): Promise<ImpulseOutputDriver> {
    const definition = {
      ...this.definition,
      props: _defaultsDeep(_cloneDeep(instanceProps), this.definition.props),
    };

    return new ImpulseOutputDriver(definition, this.env);
  }
}
