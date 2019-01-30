import * as rpio from 'rpio';

import Digital, {Edge, PinMode, WatchHandler} from '../../../squidlet-core/core/interfaces/dev/Digital';


type GpioHanler = (level: number) => void;

interface Listener {
  pin: number;
  handler: GpioHanler;
}


// TODO: установить первичное значение на output пине
// TODO: проверить getPinMode и что вернет если пин не сконфигурирован
// TODO: отследить что пин был сконфигурирован прежде чем сделан запрос - может сам rpio ругается

rpio.init({
  gpiomem: false,          /* Use /dev/gpiomem */
  //mapping: 'physical',    /* Use the P1-P40 numbering scheme */
});

export default class DigitalDevRpio implements Digital {
  private pinModes: {[index: string]: number} = {};
  private readonly alertListeners: Listener[] = [];


  async setup(pin: number, pinMode: PinMode): Promise<void> {
    const { mode, pullUpDown } = this.convertMode(pinMode);

    // if (mode === rpio.INPUT) {
    //   rpio.open(pin, mode, pullUpDown);
    // }
    // else {
    //   // output
    //   rpio.open(pin, mode);
    // }

    rpio.open(pin, mode, pullUpDown);

    this.pinModes[pin] = mode;

  }

  async getPinMode(pin: number): Promise<PinMode | undefined> {
    if (this.pinModes[pin] === rpio.INPUT) {
      return 'input';

      // TODO: add support of input_pullup and input_pulldown
    }
    else if (this.pinModes[pin] === rpio.OUTPUT) {
      return 'output';
    }

    return;
  }

  async read(pin: number): Promise<boolean> {
    return Boolean(rpio.read(pin));
  }

  async write(pin: number, value: boolean): Promise<void> {
    const numValue = (value) ? rpio.HIGH : rpio.LOW;

    rpio.write(pin, numValue);
  }

  async setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): Promise<number> {
    const handlerWrapper: GpioHanler = () => {
      handler( Boolean(rpio.read(pin)) );
    };
    let convertedEdge = rpio.POLL_BOTH;

    if (edge === 'rising') {
      convertedEdge = rpio.POLL_HIGH;
    }
    else if (edge === 'falling') {
      convertedEdge = rpio.POLL_LOW;
    }

    // TODO: debounce и edge сделать программно
    // TODO: ставится единственный хэндлет - а поидее нужно ставить много

    // register
    this.alertListeners.push({ pin, handler: handlerWrapper });
    // start listen
    rpio.poll(pin, handlerWrapper, convertedEdge);
    // return an index
    return this.alertListeners.length - 1;
  }

  async clearWatch(id: number): Promise<void> {
    if (typeof id === 'undefined') {
      throw new Error(`You have to specify a watch id`);
    }

    const {pin, handler} = this.alertListeners[id];

    // TODO: отключается один единственный хэндлер, а может быть много

    rpio.poll(pin, null);

    //pinInstance.off('interrupt', handler);
  }

  async clearAllWatches(): Promise<void> {
    this.alertListeners.map((item, index: number) => {
      this.clearWatch(index);
    });
  }

  private convertMode(pinMode: PinMode): {mode: number, pullUpDown?: number} {
    switch (pinMode) {
      case ('input'):
        return {
          mode: rpio.INPUT,
          pullUpDown: rpio.PULL_OFF,
        };
      case ('input_pullup'):
        return {
          mode: rpio.INPUT,
          pullUpDown: rpio.PULL_UP,
        };
      case ('input_pulldown'):
        return {
          mode: rpio.INPUT,
          pullUpDown: rpio.PULL_DOWN,
        };
      case ('output'):
        return {
          mode: rpio.OUTPUT,
          pullUpDown: undefined,
        };
      default:
        throw new Error(`Unknown mode "${pinMode}"`);
    }

  }

  // TODO: add close()

}
