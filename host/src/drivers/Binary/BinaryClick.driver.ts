import IndexedEvents from '../../helpers/IndexedEvents';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {WatchHandler} from '../../app/interfaces/dev/Digital';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BinaryInputDriver, BinaryInputDriverProps} from './BinaryInput.driver';


type Handler = () => void;

export interface BinaryClickDriverProps extends BinaryInputDriverProps {
}


export class BinaryClickDriver extends DriverBase<BinaryClickDriverProps> {
  private readonly stateEvents = new IndexedEvents<WatchHandler>();
  private readonly downEvents = new IndexedEvents<Handler>();
  private readonly upEvents = new IndexedEvents<Handler>();
  private keyDown: boolean = false;
  private debounceInProgress: boolean = false;
  private blockTimeInProgress: boolean = false;

  private get binaryInput(): BinaryInputDriver {
    return this.depsInstances.binaryInput as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryInput = await getDriverDep('BinaryInput.driver')
      .getInstance({
        ...this.props,
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

      await this.startUpLogic();
    }
  }

  private async startDownLogic() {
    this.keyDown = true;
    this.stateEvents.emit(true);
    this.downEvents.emit();
  }

  private async startUpLogic() {
    if (this.debounceInProgress) return;

    this.debounceInProgress = true;

    setTimeout(async () => {
      const currentLevel: boolean = await this.binaryInput.read();

      this.debounceInProgress = false;

      // if logical 1 = do nothing

      if (!currentLevel) {
        // logical 0 = finish
        await this.finishLogic();
      }
    }, this.props.debounce);
  }

  private async finishLogic() {
    this.keyDown = false;
    this.stateEvents.emit(false);
    this.upEvents.emit();

    this.blockTimeInProgress = true;

    setTimeout(() => {
      this.blockTimeInProgress = false;
    }, this.props.blockTime || 0);
  }


  protected validateProps = (): string | undefined => {
    // TODO: ???!!!!
    return;
  }

}


export default class Factory extends DriverFactoryBase<BinaryClickDriver> {
  protected instanceAlwaysNew = true;
  protected DriverClass = BinaryClickDriver;
}
