import {invertIfNeed} from '../DigitalPin/digitalHelpers';

const _omit = require('lodash/omit');
import * as EventEmitter from 'eventemitter3';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
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
          const listenHandler: (err: Error) => void = (err: Error) => {
            this.events.removeListener(delayedResultEventName, listenHandler);
            if (err) {
              return reject(err);
            }

            resolve();
          };

          this.events.addListener(delayedResultEventName, listenHandler);
        });
      }
    }

    // normal write
    await this.doWrite(level);
  }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }


  private async doWrite(level: boolean) {
    this.blockTimeInProgress = true;

    try {
      await this.digitalOutput.write(invertIfNeed(level, this.props.invert));
    }
    catch (err) {
      this.blockTimeInProgress = false;

      throw new Error(`BinaryOutputDriver: Can't write "${level}",
        props: "${JSON.stringify(this.props)}". ${err.toString()}`);
    }

    // starting block time

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.blockTimeFinished();
        resolve();
      }, this.props.blockTime);
    });
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
      this.write(invertIfNeed(lastDeferredValue, this.props.invert))
        .then(() => this.events.emit(delayedResultEventName))
        .catch((err) => this.events.emit(delayedResultEventName, err));
    }
  }

  private resolveInitial(): boolean {
    if (this.props.invert) {
      // Inverted. initial 0 | low = true. Else false.
      return !this.props.initial || this.props.initial === 'low';
    }

    // not inverted - initial 1 | high = true. Else false
    // if initial === high it's logical 1, otherwise 0;
    return this.props.initial === 1 || this.props.initial === 'high';
  }

}


export default class Factory extends DriverFactoryBase<BinaryOutputDriver> {
  protected DriverClass = BinaryOutputDriver;
}
