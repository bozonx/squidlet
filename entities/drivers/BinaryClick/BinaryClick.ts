import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DigitalIo, {ChangeHandler} from 'system/interfaces/io/DigitalIo';
import DriverBase from 'system/base/DriverBase';
import {omitObj} from 'system/lib/objects';
import DigitalPinInputProps from 'system/lib/base/digital/interfaces/DigitalPinInputProps';
import SourceDriverFactoryBase from 'system/lib/base/digital/SourceDriverFactoryBase';
import {generateSubDriverId, makeDigitalSourceDriverName} from 'system/lib/base/digital/digitalHelpers';
import {isDigitalInputInverted} from 'system/lib/helpers';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';


type Handler = () => void;

enum BinaryClickEvents {
  up,
  down,
  change,
}

// TODO: add props to manifest
export interface BinaryClickProps extends DigitalPinInputProps {
  releaseTimeoutMs: number;
  // TODO: review
  // auto invert if pullup resistor is set. Default is true
  invertOnPullup: boolean;
  // when receives 1 actually returned 0 and otherwise
  invert: boolean;
}


export class BinaryClick extends DriverBase<BinaryClickProps> {
  private readonly events = new IndexedEventEmitter();
  // should invert value which is received from IO
  private _isInverted: boolean = false;
  private keyDown: boolean = false;
  //private debounceInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;
  private releaseTimeout: any;
  //private secondDebounceTimeout: any;
  private blockTimeTimeout: any;

  private get source(): DigitalIo {
    return this.depsInstances.source;
  }


  init = async () => {
    this._isInverted = isDigitalInputInverted(
      this.props.invert,
      this.props.invertOnPullup,
      this.props.pullup
    );

    this.depsInstances.binaryInput = await this.context.getSubDriver(
      'BinaryInput',
      {
        ...omitObj(this.props, 'releaseTimeoutMs'),
        blockTime: 0,
      }
    );

    await this.binaryInput.addListener(this.handleInputChange);
  }


  isDown(): boolean {
    return this.keyDown;
  }

  isBlocked(): boolean {
    // TODO: use block timeout
    return this.blocked;
  }

  addChangeListener(handler: ChangeHandler): number {
    return this.events.addListener(BinaryClickEvents.change, handler);
  }

  addDownListener(handler: Handler): number {
    return this.events.addListener(BinaryClickEvents.down, handler);
  }

  addUpListener(handler: Handler): number {
    return this.events.addListener(BinaryClickEvents.up, handler);
  }

  removeListener(handlerIndex: number): void {
    this.events.removeListener(handlerIndex);
  }


  private handleInputChange = async (level: boolean) => {
    if (this.blockTimeInProgress) return;

    if (level) {
      if (this.keyDown) return;

      await this.startDownLogic();
    }
    else {
      if (!this.keyDown) return;

      //await this.startUpLogic();

      // logical 0 = finish
      await this.finishLogic();
    }
  }

  private async startDownLogic() {
    clearTimeout(this.releaseTimeout);
    this.keyDown = true;
    this.stateEvents.emit(true);
    this.downEvents.emit();

    // release if timeout is reached
    this.releaseTimeout = setTimeout(() => {
      this.releaseTimeout = undefined;
      //clearTimeout(this.secondDebounceTimeout);
      clearTimeout(this.blockTimeTimeout);
      //this.debounceInProgress = false;
      this.blockTimeInProgress = false;
    }, this.props.releaseTimeoutMs);
  }

  // private async startUpLogic() {
  //   if (this.debounceInProgress) return;
  //
  //   this.debounceInProgress = true;
  //
  //   // TODO: does it need second debounce???
  //   // start second debounce timeout
  //   this.secondDebounceTimeout = setTimeout(async () => {
  //     this.secondDebounceTimeout = undefined;
  //
  //     const currentLevel: boolean = await this.binaryInput.read();
  //
  //     this.debounceInProgress = false;
  //
  //     // if logical 1 = do nothing
  //
  //     if (!currentLevel) {
  //       // logical 0 = finish
  //       await this.finishLogic();
  //     }
  //   }, this.props.debounce);
  // }

  private async finishLogic() {
    this.keyDown = false;
    this.blockTimeInProgress = true;

    this.stateEvents.emit(false);
    this.upEvents.emit();

    this.blockTimeTimeout = setTimeout(() => {
      this.blockTimeInProgress = false;
      this.blockTimeTimeout = undefined;

      clearTimeout(this.releaseTimeout);
    }, this.props.blockTime || 0);
  }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }

}


export default class Factory extends DriverFactoryBase<BinaryClick, BinaryClickProps> {
  protected SubDriverClass = BinaryClick;
  protected instanceId = (props: BinaryClickProps): string => {
    const driver: SourceDriverFactoryBase = this.context.getDriver(makeDigitalSourceDriverName(props.source)) as any;

    return generateSubDriverId(props.source, props.pin, driver.generateUniqId(props));
  }
}
