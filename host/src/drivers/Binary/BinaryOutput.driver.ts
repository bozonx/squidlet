import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {DigitalPinOutputDriver} from '../DigitalPin/DigitalPinOutput.driver';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BlockMode, InitialLevel} from './interfaces/Types';
import DigitalBaseProps from '../DigitalPin/interfaces/DigitalBaseProps';
import IndexedEvents from '../../helpers/IndexedEvents';
import {omit} from '../../helpers/lodashLike';
import {convertToLevel, invertIfNeed} from '../../helpers/helpers';


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
    this.depsInstances.digitalOutput = await getDriverDep('DigitalPinOutput.driver')
      .getInstance({
        ...omit(this.props, 'blockTime', 'blockMode', 'invert', 'initial'),
        initialLevel: this.resolveInitialLevel(),
      });
  }


  isBlocked(): boolean {
    return this.blockTimeInProgress;
  }

  async read(): Promise<boolean> {
    return invertIfNeed(await this.digitalOutput.read(), this.props.invert);
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

        // TODO: нужно ли возвращать промис ???

        // wait while delayed value is set
        return new Promise<void>((resolve, reject) => {
          let listenIndex: number;
          const listenHandler = (err?: Error): void => {
            this.delayedResultEvents.removeListener(listenIndex);

            if (err) {
              return reject(err);
            }

            resolve();
          };

          listenIndex = this.delayedResultEvents.addListener(listenHandler);
        });
      }
    }

    // normal write
    return this.doWrite(level);
  }


  private async doWrite(level: boolean): Promise<void> {
    this.blockTimeInProgress = true;

    try {
      await this.digitalOutput.write(invertIfNeed(level, this.props.invert));
    }
    catch (err) {
      this.blockTimeInProgress = false;
      const errorMsg = `BinaryOutputDriver: Can't write "${level}",
        props: "${JSON.stringify(this.props)}". ${String(err)}`;

      this.delayedResultEvents.emit(new Error(errorMsg));

      throw new Error(errorMsg);
    }

    if (!this.props.blockTime) {
      this.blockTimeInProgress = false;

      return;
    }

    // starting block time

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.blockTimeFinished();
        resolve();
      }, this.props.blockTime as number);
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
        .then(() => this.delayedResultEvents.emit())
        .catch((err) => this.delayedResultEvents.emit(err));
    }
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
