import {invertIfNeed} from '../DigitalPin/digitalHelpers';

const _omit = require('lodash/omit');
import * as EventEmitter from 'eventemitter3';

import DriverFactoryBase, {InstanceType} from '../../app/entities/DriverFactoryBase';
import {DigitalPinOutputDriver} from '../DigitalPin/DigitalPinOutput.driver';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BlockMode, InitialLevel} from './interfaces/Types';
import DigitalBaseProps from '../DigitalPin/interfaces/DigitalBaseProps';


export interface BinaryOutputDriverProps extends DigitalBaseProps {
  blockTime: number;
  // if "refuse" - it doesn't write while block time. It is on default.
  // If "defer" it waits for block time finished and write last last value which was tried to set
  blockMode: BlockMode;
  // for input: when receives 1 actually returned 0 and otherwise
  // for output: when sends 1 actually sends 0 and otherwise
  invert: boolean;
  initial: InitialLevel;
}

const delayedResultEventName = 'delayedResult';


export class BinaryOutputDriver extends DriverBase<BinaryOutputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();
  private blockTimeInProgress: boolean = false;
  private lastDeferredValue?: boolean;

  private get digitalOutput(): DigitalPinOutputDriver {
    return this.depsInstances.digitalOutput as DigitalPinOutputDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {

    console.log(555555555, this.props);

    this.depsInstances.digitalOutput = await getDriverDep('DigitalPinOutput.driver')
      .getInstance({
        ..._omit(this.props, 'blockTime', 'blockMode', 'invert', 'initial'),
        initialLevel: this.resolveInitial(),
      });
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  async read(): Promise<boolean> {
    return invertIfNeed(await this.digitalOutput.read(), this.props.invert);
  }


  // TODO: что будет при последующих запросаз ???

  async write(level: boolean) {
    if (this.blockTimeInProgress) {
      if (this.props.blockMode === 'refuse') {
        // don't write while block time
        return;
      }
      else {
        // store that level which delayed
        this.lastDeferredValue = level;

        // wait while delayed value is set
        return new Promise<void>((resolve, reject) => {
          this.events.addListener(delayedResultEventName, (err) => {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        });
      }
    }

    // normal write

    this.blockTimeInProgress = true;

    try {
      await this.digitalOutput.write(level);
    }
    catch (err) {
      this.blockTimeInProgress = false;

      throw(new Error(`BinaryOutputDriver: Can't write "${level}",
        props: "${JSON.stringify(this.props)}". ${err.toString()}`));
    }

    // starting block time

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.blockTimeFinished();
        resolve();
      }, this.props.blockTime);
    });
  }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }


  private blockTimeFinished = () => {
    this.blockTimeInProgress = false;

    // setting last delayed value
    if (this.props.blockMode === 'defer' && typeof this.lastDeferredValue !== 'undefined') {
      const lastDeferredValue = this.lastDeferredValue;
      // clear deferred value
      this.lastDeferredValue = undefined;
      // write deferred value

      // don't wait in normal way
      this.write(lastDeferredValue)
        .then(() => this.events.emit(delayedResultEventName))
        .catch((err) => this.events.emit(delayedResultEventName, err));
    }
  }

  private resolveInitial(): boolean {
    // TODO: !!!!
    if (this.props.invert) {

      // TODO: зачем undefined ????

      // if initial === 'high' it'll be logical 0 if undefines of low - 1
      return typeof this.props.initial === 'undefined' || this.props.initial === 'low';
    }
    else {
      // if initial === high it's logical 1, otherwise 0;
      return this.props.initial === 'high';
    }
  }

}


export default class Factory extends DriverFactoryBase<BinaryOutputDriver> {
  protected DriverClass = BinaryOutputDriver;
  protected instanceType: InstanceType = 'alwaysNew';
}
