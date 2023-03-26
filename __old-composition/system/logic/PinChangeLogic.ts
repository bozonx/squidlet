// TODO: нужен ли он, если есть DigitalInputSemiDuplex ????
// TODO: test it

import {Edge} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/gpioTypes.js';
import IndexedEventEmitter from '../../../../squidlet-lib/src/IndexedEventEmitter';
import {ChangeHandler} from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/DigitalInputIo.js';
import DebounceCall from '../../../../squidlet-lib/src/debounceCall/DebounceCall';
import ThrottleCall from '../../../../squidlet-lib/src/debounceCall/ThrottleCall';


export default class PinChangeLogic {
  private readonly logError: (msg: string) => void;
  private readonly readPin: (pinNum: number) => Promise<boolean>;
  private readonly events = new IndexedEventEmitter<ChangeHandler>();
  private readonly debounceCall: DebounceCall = new DebounceCall();
  private readonly throttleCall: ThrottleCall = new ThrottleCall();


  constructor(
    readPin: (pinNum: number) => Promise<boolean>,
    logError: (msg: string) => void
  ) {
    this.readPin = readPin;
    this.logError = logError;
  }

  destroy() {
    this.debounceCall.destroy();
    this.throttleCall.destroy();
    this.events.destroy();
  }


  onChange(pin: number, handler: ChangeHandler): number {
    return this.events.addListener(pin, handler);
  }

  removeListener(handlerIndex: number): void {
    this.events.removeListener(handlerIndex);
  }

  clearPin(pin: number) {
    this.events.removeAllListeners(pin);
    this.debounceCall.clear(pin);
    this.throttleCall.clear(pin);
  }


  handlePinChange(
    pin: number,
    level: boolean,
    debounce: number = 0,
    edge: Edge = Edge.both
  ) {
    // don't handle edge which is not suitable to edge that has been set up
    if (edge === Edge.rising && !level) {
      return;
    }
    else if (edge === Edge.falling && level) {
      return;
    }

    // if undefined or 0 - call handler immediately
    if (!debounce) {
      return this.events.emit(pin, level);
    }
    // use throttle instead of debounce if rising or falling edge is set
    else if (edge === Edge.rising || edge === Edge.falling) {
      this.throttleCall.invoke(() => {
        this.events.emit(pin, level);
      }, debounce, pin)
        .catch((e) => {
          this.logError(e);
        });

      return;
    }
    // else edge both and debounce is set
    // wait for debounce and read current level and emit an event
    // TODO: handleEndOfDebounce will return a promise
    this.debounceCall.invoke(() => this.handleEndOfDebounce(pin), debounce, pin)
      .catch((e) => {
        this.logError(e);
      });
  }

  private async handleEndOfDebounce(pin: number) {
    let realLevel: boolean;

    try {
      realLevel = await this.readPin(pin);
    }
    catch (e) {
      return this.logError(e);
    }

    this.events.emit(pin, realLevel);
  }

}
