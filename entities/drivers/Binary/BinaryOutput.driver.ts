import DriverFactoryBase from 'host/baseDrivers/DriverFactoryBase';
import DriverBase from 'host/baseDrivers/DriverBase';
import {GetDriverDep} from 'host/entities/EntityBase';
import IndexedEvents from 'host/helpers/IndexedEvents';
import {omit} from 'host/helpers/lodashLike';
import {convertToLevel, invertIfNeed} from 'host/helpers/helpers';

import DigitalBaseProps from '../DigitalPin/interfaces/DigitalBaseProps';
import {DigitalPinOutputDriver} from '../DigitalPin/DigitalPinOutput.driver';
import {BlockMode, InitialLevel} from './interfaces/Types';


type DelayedResultHandler = (err?: Error) => void;

export interface BinaryOutputDriverProps extends DigitalBaseProps {
  blockTime?: number;
  // if "refuse" - it doesn't write while block time is in progress. It is on default.
  // If "defer" it waits for block time finished and write last value which was tried to set
  blockMode: BlockMode;
  // when sends 1 actually sends 0 and otherwise
  invert: boolean;
  initial: InitialLevel;
}


export class BinaryOutputDriver extends DriverBase<BinaryOutputDriverProps> {
  private readonly delayedResultEvents = new IndexedEvents<DelayedResultHandler>();
  private blockTimeInProgress: boolean = false;
  private lastDeferredValue?: boolean;

  private get digitalOutput(): DigitalPinOutputDriver {
    return this.depsInstances.digitalOutput as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.digitalOutput = await getDriverDep('DigitalPinOutput')
      .getInstance({
        ...omit(this.props, 'blockTime', 'blockMode', 'invert', 'initial'),
        initialLevel: this.resolveInitialLevel(),
      });
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  async read(): Promise<boolean> {
    const realValue: boolean = await this.digitalOutput.read();

    return invertIfNeed(realValue, this.props.invert);
  }

  async write(level: boolean): Promise<void> {
    if (this.blockTimeInProgress) {
      // try to write while another write is in progress
      if (this.props.blockMode === 'refuse') {
        // don't write while block time is in progress
        return;
      }
      else {
        // defer mode:
        // store level which is delayed
        this.lastDeferredValue = level;

        // TODO: review

        // wait while delayed value is set
        return this.waitDeferredValueWritten();
      }

      return;
    }

    // normal write only if there isn't blocking
    return this.doWrite(level);
  }


  private async doWrite(level: boolean): Promise<void> {
    const resolvedValue: boolean = invertIfNeed(level, this.props.invert);

    // use blocking if there is set blockTime prop
    if (this.props.blockTime) this.blockTimeInProgress = true;

    try {
      await this.digitalOutput.write(resolvedValue);
    }
    catch (err) {
      this.blockTimeInProgress = false;
      // TODO: review
      // TODO: что делать с отложенным значением? - наверное очистить

      const errorMsg = `BinaryOutputDriver: Can't write "${level}",
        props: "${JSON.stringify(this.props)}". ${String(err)}`;

      this.delayedResultEvents.emit(new Error(errorMsg));

      throw new Error(errorMsg);
    }

    // if blockTime prop isn't set - don't do blocking.
    if (!this.props.blockTime) return;

    // starting blocking
    setTimeout(this.blockTimeFinished, this.props.blockTime);
  }

  private blockTimeFinished = () => {
    this.blockTimeInProgress = false;

    // setting last delayed value
    if (this.props.blockMode === 'defer' && typeof this.lastDeferredValue !== 'undefined') {
      const resolvedValue: boolean = invertIfNeed(this.lastDeferredValue, this.props.invert);
      // clear deferred value
      this.lastDeferredValue = undefined;
      // write deferred value
      // don't wait in normal way
      this.write(resolvedValue)
        .then(() => {
          this.blockTimeInProgress = false;
          this.delayedResultEvents.emit();
        })
        .catch((err) => {
          this.blockTimeInProgress = false;
          this.delayedResultEvents.emit(err);
      });
    }
  }

  /**
   * Wait for deferred value has been written.
   */
  private waitDeferredValueWritten(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let listenIndex: number;
      const listenHandler = (err?: Error): void => {
        this.delayedResultEvents.removeListener(listenIndex);

        if (err) return reject(err);

        resolve();
      };

      listenIndex = this.delayedResultEvents.addListener(listenHandler);
    });
  }

  private resolveInitialLevel(): boolean {
    const resolvedLevel: boolean = convertToLevel(this.props.initial);

    // inverting the initial level
    if (this.props.invert) {
      return !resolvedLevel;
    }

    // not inverted
    return resolvedLevel;
  }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }

}


export default class Factory extends DriverFactoryBase<BinaryOutputDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = BinaryOutputDriver;
}
