import IndexedEvents from 'system/helpers/IndexedEvents';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import {WatchHandler} from 'system/interfaces/io/DigitalDev';
import DriverBase from 'system/baseDrivers/DriverBase';
import {GetDriverDep} from 'system/entities/EntityBase';

import {BinaryInput, BinaryInputProps} from '../BinaryInput/BinaryInput';
import {omit} from '../../../system/helpers/lodashLike';


type Handler = () => void;

export interface BinaryClickProps extends BinaryInputProps {
  releaseTimeoutMs: number;
}


export class BinaryClick extends DriverBase<BinaryClickProps> {
  private readonly stateEvents = new IndexedEvents<WatchHandler>();
  private readonly downEvents = new IndexedEvents<Handler>();
  private readonly upEvents = new IndexedEvents<Handler>();
  private keyDown: boolean = false;
  //private debounceInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;
  private releaseTimeout: any;
  //private secondDebounceTimeout: any;
  private blockTimeTimeout: any;

  private get binaryInput(): BinaryInput {
    return this.depsInstances.binaryInput as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryInput = await getDriverDep('BinaryInput')
      .getInstance({
        ...omit(this.props, 'releaseTimeoutMs'),
        blockTime: 0,
      });
  }

  protected didInit = async () => {
    await this.binaryInput.addListener(this.handleInputChange);
  }


  isDown(): boolean {
    return this.keyDown;
  }

  addStateListener(handler: WatchHandler): number {
    return this.stateEvents.addListener(handler);
  }

  removeStateListener(handlerIndex: number): void {
    this.stateEvents.removeListener(handlerIndex);
  }

  addDownListener(handler: Handler): number {
    return this.downEvents.addListener(handler);
  }

  removeDownListener(handlerIndex: number): void {
    this.downEvents.removeListener(handlerIndex);
  }

  addUpListener(handler: Handler): number {
    return this.upEvents.addListener(handler);
  }

  removeUpListener(handlerIndex: number): void {
    this.upEvents.removeListener(handlerIndex);
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


export default class Factory extends DriverFactoryBase<BinaryClick> {
  protected instanceAlwaysNew = true;
  protected DriverClass = BinaryClick;
}
