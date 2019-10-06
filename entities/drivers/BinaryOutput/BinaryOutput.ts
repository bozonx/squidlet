import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import IndexedEvents from 'system/lib/IndexedEvents';
import {omitObj} from 'system/lib/objects';
import {resolveLevel, invertIfNeed} from 'system/lib/helpers';
import {BlockMode, InitialLevel} from 'system/interfaces/Types';

import DigitalBaseProps from '../DigitalPinOutput/interfaces/DigitalBaseProps';
import {DigitalPinOutput} from '../DigitalPinOutput/DigitalPinOutput';


type DelayedResultHandler = (err?: Error) => void;

export interface BinaryOutputProps extends DigitalBaseProps {
  blockTime?: number;
  // if "refuse" - it doesn't write while block time is in progress. It is on default.
  // If "defer" it waits for block time finished and write last value which was tried to set
  blockMode: BlockMode;
  // when sends 1 actually sends 0 and otherwise
  invert: boolean;
  initial: InitialLevel;
}


export class BinaryOutput extends DriverBase<BinaryOutputProps> {
  private readonly delayedResultEvents = new IndexedEvents<DelayedResultHandler>();
  private blockTimeInProgress: boolean = false;
  private lastDeferredValue?: boolean;

  private get digitalOutput(): DigitalPinOutput {
    return this.depsInstances.digitalOutput;
  }


  protected init = async () => {
    this.depsInstances.digitalOutput = await this.context.getSubDriver(
      'DigitalPinOutput',
      {
        ...omitObj(this.props, 'blockTime', 'blockMode', 'invert', 'initial'),
        initialLevel: this.resolveInitialLevel(),
      }
    );
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

  onIncomeChange(cb: (newLevel: boolean) => void): number {
    // TODO: !!!
    // TODO: !!! если пропала связь то сделать дополнительный запрос текущего состояния
    return 0;
  }

  removeIncomeChangeListener(handlerIndex: number) {
    // TODO: !!!
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
    const resolvedLevel: boolean = resolveLevel(this.props.initial);

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


export default class Factory extends DriverFactoryBase<BinaryOutput> {
  protected instanceAlwaysNew = true;
  protected DriverClass = BinaryOutput;
}
