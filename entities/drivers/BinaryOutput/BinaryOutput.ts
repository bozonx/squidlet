import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import IndexedEvents from 'system/lib/IndexedEvents';
import {omitObj} from 'system/lib/objects';
import {resolveLevel, invertIfNeed, resolveEdge} from 'system/lib/helpers';
import {BlockMode, InitialLevel, JsonTypes} from 'system/interfaces/Types';
import DigitalBaseProps from 'system/lib/base/digital/interfaces/DigitalBaseProps';
import SourceDriverFactoryBase from 'system/lib/base/digital/SourceDriverFactoryBase';
import {generateSubDriverId, makeDigitalSourceDriverName} from 'system/lib/base/digital/digitalHelpers';
import DigitalIo, {Edge} from 'system/interfaces/io/DigitalIo';


type DelayedResultHandler = (err?: Error) => void;

// TODO: review props in manifest
export interface BinaryOutputProps extends DigitalBaseProps {
  blockTime?: number;
  // TODO: review
  // if "refuse" - it doesn't write while block time is in progress. It is on default.
  // If "defer" it waits for block time finished and write last value which was tried to set
  blockMode: BlockMode;
  // when sends 1 actually sends 0 and otherwise
  invert: boolean;
  initial: InitialLevel;
}


export class BinaryOutput extends DriverBase<BinaryOutputProps> {
  private readonly delayedResultEvents = new IndexedEvents<DelayedResultHandler>();
  // TODO: use timeout
  private blockTimeInProgress: boolean = false;
  // TODO: reivew
  private lastDeferredValue?: boolean;

  private get source(): DigitalIo {
    return this.depsInstances.source;
  }


  init = async () => {

    // TODO: what about inverted????

    // make rest of props to pass them to the sub driver
    const subDriverProps: {[index: string]: JsonTypes} = {
      ...omitObj(
        this.props,
        // TODO: review props
        'blockTime',
        'blockMode',
        'initial',
        'invert',
        'edge',
        'debounce',
        'pullup',
        'pulldown',
        'pin',
        'source'
      ),
      //initialLevel: this.resolveInitialLevel(),
    };

    this.depsInstances.source = this.context.getSubDriver(
      makeDigitalSourceDriverName(this.props.source),
      subDriverProps
    );
  }

  // setup pin after all the drivers has been initialized
  driversDidInit = async () => {
    // TODO: print unique id of sub driver
    this.log.debug(`BinaryOutput: Setup pin ${this.props.pin} of ${this.props.source}`);

    const initialValue: boolean = this.resolveInitialLevel();

    // TODO: перезапускать setup время от времени если не удалось инициализировать пин
    // setup pin as an input with resistor if specified
    // wait for pin has initialized but don't break initialization on error
    try {
      await this.source.setupOutput(this.props.pin, initialValue);
    }
    catch (err) {
      this.log.error(
        `BinaryOutput: Can't setup pin. ` +
        `"${JSON.stringify(this.props)}": ${err.toString()}`
      );
    }
  }


  // TODO: добавить прослойку событий чтобы слушать изменения пинов.
  //  Выяснить будут ли подниматься события в IO если пин output

  isBlocked(): boolean {
    // TODO: use timeout
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

}


export default class Factory extends DriverFactoryBase<BinaryOutput, BinaryOutputProps> {
  protected SubDriverClass = BinaryOutput;
  protected instanceId = (props: BinaryOutputProps): string => {
    const driver: SourceDriverFactoryBase = this.context.getDriver(makeDigitalSourceDriverName(props.source)) as any;

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId(props));
  }
}
